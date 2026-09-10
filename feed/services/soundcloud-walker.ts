"use strict";

import "adaptive-extender/node";
import { Nullable } from "adaptive-extender/node";
import { ActivitySource } from "./activity-source.js";
import { ActivityWalker, AuthorizationExpiredError } from "./activity-walker.js";
import { SoundCloudTokenStore } from "./soundcloud-token-store.js";
import { SoundCloudPage, SoundCloudToken, SoundCloudTokenError, SoundCloudTrack, SoundCloudUser } from "../models/soundcloud-event.js";
import { Activity, SoundCloudLikeActivity, SoundCloudUploadActivity } from "../models/activity.js";

const meta = import.meta;

//#region SoundCloud page source
class SoundCloudPageSource<TEvent> extends ActivitySource<TEvent, unknown> {
	#token: SoundCloudToken;
	#url: Readonly<URL>;

	constructor(platform: string, token: SoundCloudToken, url: Readonly<URL>) {
		super(platform);
		if (new.target === SoundCloudPageSource) throw new TypeError("Unable to create an instance of an abstract class");
		this.#token = token;
		this.#url = url;
	}

	async *#fetchPaginated(url: Readonly<URL>, count: number): AsyncIterable<unknown> {
		let next: URL | null = new URL(url);
		next.searchParams.set("linked_partitioning", "true");
		next.searchParams.set("limit", String(count));
		const headers: Record<string, string> = {
			["Authorization"]: `${this.#token.tokenType} ${this.#token.accessToken}`
		};
		while (next !== null) {
			const response = await fetch(next, { headers });
			if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
			const page = SoundCloudPage.import(await response.json(), "soundcloud_page");
			yield* page.collection;
			next = Nullable.map(page.nextHref, href => new URL(href));
		}
	}

	async *fetch(): AsyncIterable<unknown> {
		yield* this.#fetchPaginated(this.#url, 50);
	}
}
//#endregion

//#region SoundCloud track source
class SoundCloudTrackSource extends SoundCloudPageSource<SoundCloudTrack> {
	constructor(platform: string, token: SoundCloudToken, url: Readonly<URL>) {
		super(platform, token, url);
		if (new.target === SoundCloudTrackSource) throw new TypeError("Unable to create an instance of an abstract class");
	}

	parse(source: unknown, name: string): SoundCloudTrack {
		return SoundCloudTrack.import(source, name);
	}

	stamp(event: SoundCloudTrack): Date {
		return event.createdAt;
	}
}
//#endregion

//#region SoundCloud upload source
class SoundCloudUploadSource extends SoundCloudTrackSource {
	constructor(platform: string, token: SoundCloudToken, id: number) {
		super(platform, token, new URL(`https://api.soundcloud.com/users/${id}/tracks`));
	}

	*map(event: SoundCloudTrack): Iterable<Activity> {
		const { title, permalinkUrl: url, artworkUrl: artwork, createdAt: timestamp, user: { username: publisher, avatarUrl: avatar } } = event;
		yield new SoundCloudUploadActivity(this.platform, timestamp, title, publisher, artwork, avatar, url);
	}
}
//#endregion

//#region SoundCloud like source
class SoundCloudLikeSource extends SoundCloudTrackSource {
	constructor(platform: string, token: SoundCloudToken, id: number) {
		super(platform, token, new URL(`https://api.soundcloud.com/users/${id}/likes/tracks`));
	}

	// ponytail: stamped by the track's upload date, not the like date — api-v2's track_likes endpoint carries
	// the real like timestamp but rejects this app's OAuth token (403 under Bearer, OAuth, and client_id auth).
	// Revisit if SoundCloud grants api-v2 access; until then this can only skip stale items, not sort by like time.
	get sorted(): boolean { return false; }

	*map(event: SoundCloudTrack): Iterable<Activity> {
		const { title, permalinkUrl: url, artworkUrl: artwork, createdAt: timestamp, user: { username: publisher, avatarUrl: avatar } } = event;
		yield new SoundCloudLikeActivity(this.platform, timestamp, title, publisher, artwork, avatar, url);
	}
}
//#endregion

//#region SoundCloud walker
export class SoundCloudWalker extends ActivityWalker {
	#clientId: string;
	#clientSecret: string;
	#username: string;
	#store: SoundCloudTokenStore;

	constructor(clientId: string, clientSecret: string, key: string, token: string, username: string) {
		super("SoundCloud");
		this.#clientId = clientId;
		this.#clientSecret = clientSecret;
		this.#store = new SoundCloudTokenStore(new URL("../../resources/data/soundcloud-token.json", meta.url), key, token);
		this.#username = username;
	}

	static async #isInvalidGrant(data: unknown): Promise<boolean> {
		try {
			const error = SoundCloudTokenError.import(data, "soundcloud_token_error");
			return error.error === "invalid_grant";
		} catch {
			return false;
		}
	}

	async #authenticate(refreshToken: string): Promise<SoundCloudToken> {
		const url = new URL("https://secure.soundcloud.com/oauth/token");
		const method = "POST";
		const headers: Record<string, string> = {
			["Content-Type"]: "application/x-www-form-urlencoded",
			["Accept"]: "application/json; charset=utf-8"
		};
		const query: Record<string, string> = {
			["grant_type"]: "refresh_token",
			["client_id"]: this.#clientId,
			["client_secret"]: this.#clientSecret,
			["refresh_token"]: refreshToken
		};
		const body = new URLSearchParams(query);
		const response = await fetch(url, { method, headers, body });
		const data = await response.json();
		if (!response.ok) {
			if (await SoundCloudWalker.#isInvalidGrant(data)) throw new AuthorizationExpiredError(this.name, "the refresh token was rejected (invalid_grant); re-authorization is required");
			throw new Error(`${response.status}: ${response.statusText}`);
		}
		return SoundCloudToken.import(data, "soundcloud_token");
	}

	async #resolveUserId(token: SoundCloudToken): Promise<number> {
		const url = new URL("https://api.soundcloud.com/resolve");
		url.searchParams.set("url", `https://soundcloud.com/${this.#username}`);
		const headers: Record<string, string> = {
			["Authorization"]: `${token.tokenType} ${token.accessToken}`
		};
		const response = await fetch(url, { headers });
		if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
		const user = SoundCloudUser.import(await response.json(), "soundcloud_user");
		return user.id;
	}

	async *sources(): AsyncIterable<ActivitySource<unknown, unknown>> {
		const store = this.#store;
		const refreshToken = await store.read();
		const token = await this.#authenticate(refreshToken);
		if (token.refreshToken !== undefined && token.refreshToken !== refreshToken) await store.write(token.refreshToken);
		const id = await this.#resolveUserId(token);
		const platform = this.name;
		yield new SoundCloudUploadSource(platform, token, id);
		yield new SoundCloudLikeSource(platform, token, id);
	}
}
//#endregion
