"use strict";

import "adaptive-extender/node";
import { TelegramClient, MemoryStorage, Photo, Video, Audio, Voice, RawDocument, Message } from "@mtcute/node";
import { MimeRegistry } from "../../environment/services/mime-registry.js";
import { ActivitySource } from "./activity-source.js";
import { ActivityWalker } from "./activity-walker.js";
import { Activity, TelegramMediaPostActivity, TelegramTextPostActivity } from "../models/activity.js";

//#region Telegram post source
class TelegramPostSource extends ActivitySource<Message, Message> {
	#idChannel: number;
	#apiId: number;
	#apiHash: string;
	#session: string;

	constructor(platform: string, idChannel: number, apiId: number, apiHash: string, session: string) {
		super(platform);
		this.#idChannel = idChannel;
		this.#apiId = apiId;
		this.#apiHash = apiHash;
		this.#session = session;
	}

	async *fetch(): AsyncIterable<Message> {
		const apiId = this.#apiId;
		const apiHash = this.#apiHash;
		const storage = new MemoryStorage();
		const telegram = new TelegramClient({ apiId, apiHash, storage });
		await telegram.importSession(this.#session);
		await telegram.connect();
		await telegram.sendOnline(false);
		try {
			yield* telegram.iterHistory(this.#idChannel);
		} finally {
			await telegram.disconnect();
		}
	}

	parse(source: Message, name: string): Message {
		void name;
		return source;
	}

	stamp(event: Message): Date {
		return event.date;
	}

	*map(event: Message): Iterable<Activity> {
		const platform = this.platform;
		const idChannel = this.#idChannel;
		const { id: idMessage, text, media } = event;
		if (!event.isChannelPost) return;
		if (media === null) {
			yield new TelegramTextPostActivity(platform, event.date, idChannel, idMessage, text);
			return;
		}
		if (media instanceof Photo) {
			const fileName = `${idMessage}.jpg`;
			const description = text.insteadWhitespace(null);
			yield new TelegramMediaPostActivity(platform, event.date, idChannel, idMessage, fileName, "photo", description);
			return;
		}
		if (media instanceof Audio) {
			const extension = MimeRegistry.extensionFor(media.mimeType);
			const fileName = media.fileName ?? `${idMessage}.${extension}`;
			const description = text.insteadWhitespace(null);
			yield new TelegramMediaPostActivity(platform, event.date, idChannel, idMessage, fileName, "audio", description);
			return;
		}
		if (media instanceof Voice) {
			const extension = MimeRegistry.extensionFor(media.mimeType);
			const fileName = media.fileName ?? `${idMessage}.${extension}`;
			const description = text.insteadWhitespace(null);
			yield new TelegramMediaPostActivity(platform, event.date, idChannel, idMessage, fileName, "audio", description);
			return;
		}
		if (media instanceof Video) {
			const extension = MimeRegistry.extensionFor(media.mimeType);
			const fileName = media.fileName ?? `${idMessage}.${extension}`;
			const mediaType = media.isAnimation || media.isLegacyGif ? "animation" : "video";
			const description = text.insteadWhitespace(null);
			yield new TelegramMediaPostActivity(platform, event.date, idChannel, idMessage, fileName, mediaType, description);
			return;
		}
		if (media instanceof RawDocument) {
			const extension = MimeRegistry.extensionFor(media.mimeType);
			const fileName = media.fileName ?? `${idMessage}.${extension}`;
			const description = text.insteadWhitespace(null);
			yield new TelegramMediaPostActivity(platform, event.date, idChannel, idMessage, fileName, "document", description);
			return;
		}
	}
}
//#endregion

//#region Telegram walker
export class TelegramWalker extends ActivityWalker {
	#idChannel: number;
	#apiId: number;
	#apiHash: string;
	#session: string;

	constructor(idChannel: number, apiId: number, apiHash: string, session: string) {
		super("Telegram");
		this.#idChannel = idChannel;
		this.#apiId = apiId;
		this.#apiHash = apiHash;
		this.#session = session;
	}

	async *sources(): AsyncIterable<ActivitySource<unknown, unknown>> {
		yield new TelegramPostSource(this.name, this.#idChannel, this.#apiId, this.#apiHash, this.#session);
	}
}
//#endregion
