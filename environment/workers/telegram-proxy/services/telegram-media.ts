"use strict";

import "adaptive-extender/core";
import { TelegramClient, FileLocation } from "@mtcute/web";

const { min, trunc } = Math;

//#region Download session
class DownloadSession implements UnderlyingSource<Uint8Array<ArrayBufferLike>> {
	#deferred = Promise.withResolvers<void>();
	#reader: ReadableStreamDefaultReader<Uint8Array>;
	#skip: number;
	#limit: number;
	#skipped: number = 0;
	#forwarded: number = 0;
	#cancelled: boolean = false;

	constructor(reader: ReadableStreamDefaultReader<Uint8Array>, skip: number, limit: number) {
		this.#reader = reader;
		this.#skip = skip;
		this.#limit = limit;
	}

	get completion(): Promise<void> { return this.#deferred.promise; }

	#finish(controller: ReadableStreamDefaultController<Uint8Array>): void {
		controller.close();
		this.#deferred.resolve();
	}

	async pull(controller: ReadableStreamDefaultController<Uint8Array>): Promise<void> {
		if (this.#cancelled) return;
		const skip = this.#skip;
		const limit = this.#limit;
		try {
			while (true) {
				const { done, value } = await this.#reader.read();
				if (this.#cancelled) return;
				if (done) return this.#finish(controller);

				let chunk = value;

				const skipped = this.#skipped;
				if (skipped < skip) {
					const toSkip = min(skip - skipped, chunk.length);
					this.#skipped = skipped + toSkip;
					chunk = chunk.subarray(toSkip);
					if (chunk.length === 0) continue;
				}

				if (limit !== Number.POSITIVE_INFINITY) {
					const remaining = limit - this.#forwarded;
					if (remaining <= 0) return this.#finish(controller);
					if (chunk.length > remaining) chunk = chunk.subarray(0, remaining);
				}

				controller.enqueue(chunk);
				this.#forwarded += chunk.length;
				if (limit !== Number.POSITIVE_INFINITY && this.#forwarded >= limit) this.#finish(controller);
				return;
			}
		} catch (reason) {
			if (!this.#cancelled) controller.error(reason);
			this.#deferred.resolve();
		}
	}

	async cancel(cause?: unknown): Promise<void> {
		this.#cancelled = true;
		try { await this.#reader.cancel(cause); }
		catch (reason) { console.error(`Reader cancellation failed:\n${Error.from(reason)}`); }
		this.#deferred.resolve();
	}
}
//#endregion

//#region Telegram media
export interface MediaRange {
	begin: number;
	end: number;
	total: number;
}

export interface TelegramMediaDownloadResult {
	stream: ReadableStream<Uint8Array>;
	completion: Promise<void>;
}

export class TelegramMedia {
	#mimeType: string;
	#fileSize: number;
	#fileName: string;
	#client: TelegramClient;
	#media: FileLocation;

	constructor(mimeType: string, fileSize: number, fileName: string, client: TelegramClient, media: FileLocation) {
		this.#mimeType = mimeType;
		this.#fileSize = fileSize;
		this.#fileName = fileName;
		this.#client = client;
		this.#media = media;
	}

	get mimeType(): string {
		return this.#mimeType;
	}

	get fileSize(): number {
		return this.#fileSize;
	}

	get fileName(): string {
		return this.#fileName;
	}

	#alignment(): number {
		const fileSize = this.#fileSize;
		if (fileSize !== Number.POSITIVE_INFINITY && fileSize >= 1_048_576) return 131_072;
		return 4_096;
	}

	download(offset: number = 0, limit: number = Number.POSITIVE_INFINITY): TelegramMediaDownloadResult {
		const alignment = this.#alignment();
		const alignedOffset = trunc(offset / alignment) * alignment;
		const upstream = this.#client.downloadAsStream(this.#media, { offset: alignedOffset });
		const session = new DownloadSession(upstream.getReader(), offset - alignedOffset, limit);
		return { stream: new ReadableStream<Uint8Array>(session), completion: session.completion };
	}
}
//#endregion
