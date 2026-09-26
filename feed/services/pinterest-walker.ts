"use strict";

import "adaptive-extender/node";
import { ActivitySource } from "./activity-source.js";
import { ActivityWalker } from "./activity-walker.js";
import { PinterestBoard, PinterestPin, PinterestResponse, PinterestToken, type PinterestImage, type PinterestImagesCollection } from "../models/pinterest-event.js";
import { Activity, PinterestImagePinActivity, PinterestVideoPinActivity } from "../models/activity.js";

//#region Pinterest pin source
class PinterestPinSource extends ActivitySource<PinterestPin, unknown> {
	#token: PinterestToken;
	#idBoard: string;
	#boardName: string;

	constructor(platform: string, token: PinterestToken, idBoard: string, boardName: string) {
		super(platform);
		this.#token = token;
		this.#idBoard = idBoard;
		this.#boardName = boardName;
	}

	async *#fetchPaginated(endpoint: string, count: number): AsyncIterable<unknown> {
		let bookmark: string | null = null;
		do {
			const url = new URL(`https://api.pinterest.com/v5${endpoint}`);
			url.searchParams.set("page_size", String(count));
			if (bookmark !== null) url.searchParams.set("bookmark", bookmark);
			const headers: Record<string, string> = {
				["Authorization"]: `Bearer ${this.#token.accessToken}`,
				["Content-Type"]: "application/json"
			};
			const response = await fetch(url, { headers });
			if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
			const data = PinterestResponse.import(await response.json(), "pinterest_response");
			if (data.code !== undefined && data.message !== undefined) throw new Error(`${data.code}: ${data.message}`);
			bookmark = data.bookmark;
			yield* data.items;
		} while (bookmark);
	}

	async *fetch(): AsyncIterable<unknown> {
		yield* this.#fetchPaginated(`/boards/${this.#idBoard}/pins`, 50);
	}

	parse(source: unknown, name: string): PinterestPin {
		return PinterestPin.import(source, name);
	}

	stamp(event: PinterestPin): Date {
		return event.createdAt;
	}

	*map(event: PinterestPin): Iterable<Activity> {
		const platform = this.platform;
		const timestamp = event.createdAt;
		const { title, description, media } = event;
		if (media === null) return;
		const { images, mediaType } = media;
		const image = images.original ?? images.preview ?? images.feed ?? images.thumbnail;
		if (image === undefined) return;
		const { url: content, width, height } = image;
		const url = event.link ?? `https://www.pinterest.com/pin/${event.id}/`;
		switch (mediaType) {
		case undefined:
		case "image": yield new PinterestImagePinActivity(platform, timestamp, content, width, height, title, description, this.#boardName, url); break;
		case "video": yield new PinterestVideoPinActivity(platform, timestamp, content, width, height, title, description, this.#boardName, url); break;
		default: throw new Error(`Invalid '${mediaType}' mediaType for PinterestMediaContainer`);
		}
	}
}
//#endregion

//#region Pinterest walker
export class PinterestWalker extends ActivityWalker {
	#idClient: string;
	#clientSecret: string;
	#refreshToken: string;

	constructor(idClient: string, clientSecret: string, refreshToken: string) {
		super("Pinterest");
		this.#idClient = idClient;
		this.#clientSecret = clientSecret;
		this.#refreshToken = refreshToken;
	}

	async #authenticate(): Promise<PinterestToken> {
		const url = new URL("https://api.pinterest.com/v5/oauth/token");
		const method = "POST";
		const auth = Buffer.from(`${this.#idClient}:${this.#clientSecret}`).toString("base64");
		const headers: Record<string, string> = {
			["Authorization"]: `Basic ${auth}`,
			["Content-Type"]: "application/x-www-form-urlencoded"
		};
		const body = new URLSearchParams({
			grant_type: "refresh_token",
			refresh_token: this.#refreshToken
		});
		const response = await fetch(url, { method, headers, body });
		if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
		return PinterestToken.import(await response.json(), "pinterest_token");
	}

	async *#fetchPaginated(token: PinterestToken, endpoint: string, count: number): AsyncIterable<unknown> {
		let bookmark: string | null = null;
		do {
			const url = new URL(`https://api.pinterest.com/v5${endpoint}`);
			url.searchParams.set("page_size", String(count));
			if (bookmark !== null) url.searchParams.set("bookmark", bookmark);
			const headers: Record<string, string> = {
				["Authorization"]: `Bearer ${token.accessToken}`,
				["Content-Type"]: "application/json"
			};
			const response = await fetch(url, { headers });
			if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
			const data = PinterestResponse.import(await response.json(), "pinterest_response");
			if (data.code !== undefined && data.message !== undefined) throw new Error(`${data.code}: ${data.message}`);
			bookmark = data.bookmark;
			yield* data.items;
		} while (bookmark);
	}

	async *#fetchBoards(token: PinterestToken): AsyncIterable<PinterestBoard> {
		let index = 0;
		for await (const item of this.#fetchPaginated(token, "/boards", 50)) {
			try {
				yield PinterestBoard.import(item, `board[${index++}]`);
			} catch (reason) {
				console.error(reason);
			}
		}
	}

	async *sources(): AsyncIterable<ActivitySource<unknown, unknown>> {
		const token = await this.#authenticate();
		const platform = this.name;
		for await (const board of this.#fetchBoards(token)) {
			const { privacy } = board;
			switch (privacy) {
			case "PUBLIC": break;
			case "PROTECTED":
			case "SECRET": continue;
			default: throw new Error(`Invalid '${privacy}' privacy for PinterestBoard`);
			}
			yield new PinterestPinSource(platform, token, board.id, board.name);
		}
	}
}
//#endregion
