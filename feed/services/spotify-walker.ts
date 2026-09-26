"use strict";

import "adaptive-extender/node";
import { ActivitySource } from "./activity-source.js";
import { ActivityWalker, AuthorizationExpiredError } from "./activity-walker.js";
import { SpotifySaveEvent, SpotifySavesCollection, SpotifyToken, SpotifyTokenError, type SpotifyTrack } from "../models/spotify-event.js";
import { Activity, SpotifyLikeActivity } from "../models/activity.js";

//#region Spotify save source
class SpotifySaveSource extends ActivitySource<SpotifySaveEvent, unknown> {
	#token: SpotifyToken;

	constructor(platform: string, token: SpotifyToken) {
		super(platform);
		this.#token = token;
	}

	async *#fetchPaginated(page: number, count: number): AsyncIterable<unknown> {
		const token = this.#token;
		const url = new URL("https://api.spotify.com/v1/me/tracks");
		url.searchParams.set("limit", String(count));
		url.searchParams.set("offset", String((page - 1) * count));
		const headers: Record<string, string> = {
			["Authorization"]: `Bearer ${token.accessToken}`
		};
		const response = await fetch(url, { headers });
		if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
		const data = await response.json();
		const collection = SpotifySavesCollection.import(data, "spotify_saves_collection");
		yield* collection.items;
	}

	async *fetch(): AsyncIterable<unknown> {
		const chunk = 50;
		let page = 1;
		while (true) {
			let count = 0;
			for await (const item of this.#fetchPaginated(page, chunk)) {
				count++;
				yield item;
			}
			if (count < chunk) return;
			page++;
		}
	}

	parse(source: unknown, name: string): SpotifySaveEvent {
		return SpotifySaveEvent.import(source, name);
	}

	stamp(event: SpotifySaveEvent): Date {
		return event.addedAt;
	}

	static #resolveCover(track: SpotifyTrack): string | null {
		const image = track.album.images.at(0);
		if (image === undefined) return null;
		return image.url;
	}

	*map(event: SpotifySaveEvent): Iterable<Activity> {
		const { track } = event;
		const platform = this.platform;
		const timestamp = event.addedAt;
		const title = track.name;
		const artists = track.artists.map(artist => artist.name);
		const cover = SpotifySaveSource.#resolveCover(track);
		const url = track.externalUrls.spotify;
		yield new SpotifyLikeActivity(platform, timestamp, title, artists, cover, url);
	}
}
//#endregion

//#region Spotify walker
export class SpotifyWalker extends ActivityWalker {
	#idClient: string;
	#clientSecret: string;
	#refreshToken: string;

	constructor(idClient: string, clientSecret: string, refreshToken: string) {
		super("Spotify");
		this.#idClient = idClient;
		this.#clientSecret = clientSecret;
		this.#refreshToken = refreshToken;
	}

	static async #isInvalidGrant(data: unknown): Promise<boolean> {
		try {
			const error = SpotifyTokenError.import(data, "spotify_token_error");
			return error.error === "invalid_grant";
		} catch {
			return false;
		}
	}

	async #authenticate(): Promise<SpotifyToken> {
		const url = new URL("https://accounts.spotify.com/api/token");
		const method = "POST";
		const auth = Buffer.from(`${this.#idClient}:${this.#clientSecret}`).toString("base64");
		const headers: Record<string, string> = {
			["Authorization"]: `Basic ${auth}`,
			["Content-Type"]: "application/x-www-form-urlencoded"
		};
		const query: Record<string, string> = {
			["grant_type"]: "refresh_token",
			["refresh_token"]: this.#refreshToken
		};
		const body = new URLSearchParams(query);
		const response = await fetch(url, { method, headers, body });
		const data = await response.json();
		if (!response.ok) {
			if (await SpotifyWalker.#isInvalidGrant(data)) throw new AuthorizationExpiredError(this.name, "the refresh token was rejected (invalid_grant); re-authorization is required");
			throw new Error(`${response.status}: ${response.statusText}`);
		}
		return SpotifyToken.import(data, "spotify_token");
	}

	async *sources(): AsyncIterable<ActivitySource<unknown, unknown>> {
		const token = await this.#authenticate();
		yield new SpotifySaveSource(this.name, token);
	}
}
//#endregion
