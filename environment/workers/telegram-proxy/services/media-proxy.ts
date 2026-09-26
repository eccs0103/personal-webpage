"use strict";

import "adaptive-extender/core";
import { TelegramChannel } from "./telegram-channel.js";
import { type MediaRange, type TelegramMedia } from "./telegram-media.js";
import { type ResponseFactory } from "./response-factory.js";

//#region Media proxy
export class MediaProxy {
	static #PATH_PATTERN: RegExp = /^\/(\d{1,15})$/;
	#channel: TelegramChannel;
	#factory: ResponseFactory;

	constructor(channel: TelegramChannel, factory: ResponseFactory) {
		this.#channel = channel;
		this.#factory = factory;
	}

	static #parseRange(header: string, total: number): MediaRange {
		const match = /^bytes=(\d+)-(\d*)$/.exec(header);
		if (match === null) throw new SyntaxError("Unparseable range header");
		let [, begin, end] = match.map(part => Number.parseInt(part, 10));
		if (begin >= total) throw new RangeError("Begin exceeds total size");
		if (Number.isNaN(end)) return { begin, end: total - 1, total };
		if (end < begin) throw new RangeError("End precedes begin");
		end = end.clamp(0, total - 1);
		return { begin, end, total };
	}

	async #awaitAndDisconnect(completion: Promise<void>): Promise<void> {
		try { await completion; }
		catch (reason) { console.error(`Download stream interrupted:\n${Error.from(reason)}`); }
		try { await this.#channel.disconnect(); }
		catch (reason) { console.error(`Channel disconnect failed:\n${Error.from(reason)}`); }
	}

	#scheduleDisconnect(context: ExecutionContext, completion: Promise<void> = Promise.resolve()): void {
		context.waitUntil(this.#awaitAndDisconnect(completion));
	}

	async #fetchMedia(idMessage: number, context: ExecutionContext): Promise<TelegramMedia> {
		try {
			return await this.#channel.fetchMedia(idMessage);
		} catch (reason) {
			this.#scheduleDisconnect(context);
			throw reason;
		}
	}

	#handleFull(media: TelegramMedia, method: string, context: ExecutionContext): Response {
		const factory = this.#factory;
		if (method === "HEAD") {
			this.#scheduleDisconnect(context);
			return factory.ok(media, null);
		}
		const result = media.download();
		this.#scheduleDisconnect(context, result.completion);
		return factory.ok(media, result.stream);
	}

	#handleRange(headerRange: string, media: TelegramMedia, method: string, context: ExecutionContext): Response {
		const factory = this.#factory;
		try {
			const range = MediaProxy.#parseRange(headerRange, media.fileSize);
			const { begin, end } = range;
			const limit = end - begin + 1;
			if (method === "HEAD") {
				this.#scheduleDisconnect(context);
				return factory.partial(media, range, null);
			}
			const result = media.download(begin, limit);
			this.#scheduleDisconnect(context, result.completion);
			return factory.partial(media, range, result.stream);
		} catch (error) {
			this.#scheduleDisconnect(context);
			if (error instanceof RangeError) return factory.rangeNotSatisfiable(media);
			if (error instanceof SyntaxError) return factory.error(400, "Malformed Range header");
			throw error;
		}
	}

	async handle(request: Request, context: ExecutionContext): Promise<Response> {
		const factory = this.#factory;
		const { method, url, headers } = request;
		const { pathname } = new URL(url);

		if (method === "OPTIONS") return factory.preflight();
		if (method !== "GET" && method !== "HEAD") return factory.error(405, "Method Not Allowed");
		const match = MediaProxy.#PATH_PATTERN.exec(pathname);
		if (match === null) return factory.error(404, "Not Found");

		const idMessage = Number.parseInt(match[1], 10);
		const media = await this.#fetchMedia(idMessage, context);
		const headerRange = headers.get("range");
		if (headerRange !== null) return this.#handleRange(headerRange, media, method, context);
		return this.#handleFull(media, method, context);
	}
}
//#endregion
