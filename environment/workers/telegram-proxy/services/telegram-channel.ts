"use strict";

import "adaptive-extender/core";
import { TelegramClient, MemoryStorage, FileLocation, RawDocument, WebCryptoProvider } from "@mtcute/web";
import wasmInput from "@mtcute/wasm/mtcute-simd.wasm";
import { MimeRegistry } from "../../../services/mime-registry.js";
import { TelegramMedia } from "./telegram-media.js";

//#region Telegram channel
export class TelegramChannel {
	static #lock: boolean = true;
	#client: TelegramClient;
	#idChannel: number;

	constructor(client: TelegramClient, idChannel: number) {
		if (TelegramChannel.#lock) throw new TypeError("Illegal constructor");
		this.#client = client;
		this.#idChannel = idChannel;
	}

	static async connect(idChannel: number, apiId: number, apiHash: string, session: string): Promise<TelegramChannel> {
		const storage = new MemoryStorage();
		const disableUpdates = true;
		const crypto = new WebCryptoProvider({ wasmInput });
		const client = new TelegramClient({ apiId, apiHash, storage, disableUpdates, crypto });
		await client.importSession(session);
		await client.connect();
		TelegramChannel.#lock = false;
		const channel = new TelegramChannel(client, idChannel);
		TelegramChannel.#lock = true;
		return channel;
	}

	#documentFileName(media: RawDocument, idMessage: number): string {
		if (media.fileName !== null) return media.fileName;
		const extension = MimeRegistry.extensionFor(media.mimeType);
		return `${idMessage}.${extension}`;
	}

	async fetchMedia(idMessage: number): Promise<TelegramMedia> {
		const client = this.#client;
		const messages = await client.getMessages(this.#idChannel, [idMessage]);
		const message = messages[0];
		if (message === null) throw new ReferenceError("Message not found");
		const { media } = message;
		if (media === null) throw new ReferenceError("Message has no media");
		if (!(media instanceof FileLocation)) throw new TypeError("Message media is not downloadable");
		const size = media.fileSize ?? Number.POSITIVE_INFINITY;
		if (!(media instanceof RawDocument)) return new TelegramMedia("image/jpeg", size, `${idMessage}.jpg`, client, media);
		const fileName = this.#documentFileName(media, idMessage);
		return new TelegramMedia(media.mimeType, size, fileName, client, media);
	}

	async disconnect(): Promise<void> {
		await this.#client.disconnect();
	}
}
//#endregion
