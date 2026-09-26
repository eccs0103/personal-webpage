"use strict";

import "adaptive-extender/core";
import { type TelegramMedia, type MediaRange } from "./telegram-media.js";

//#region Response factory
export class ResponseFactory {
	static #CORS: Record<string, string> = {
		["Access-Control-Allow-Origin"]: "*",
		["Access-Control-Allow-Methods"]: "GET, HEAD, OPTIONS",
		["Access-Control-Allow-Headers"]: "*",
		["Access-Control-Expose-Headers"]: "Content-Disposition, Content-Length, Content-Range, Accept-Ranges",
	};

	#corsHeaders(): Headers {
		return new Headers(ResponseFactory.#CORS);
	}

	#contentDisposition(fileName: string): string {
		const fallback = fileName.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"");
		const extended = encodeURIComponent(fileName);
		return `inline; filename="${fallback}"; filename*=UTF-8''${extended}`;
	}

	#mediaHeaders(media: TelegramMedia): Headers {
		const headers = this.#corsHeaders();
		headers.set("Content-Type", media.mimeType);
		headers.set("Accept-Ranges", "bytes");
		headers.set("X-Content-Type-Options", "nosniff");
		headers.set("Cache-Control", "public, max-age=2592000, immutable");
		const { fileName, fileSize } = media;
		if (fileSize !== Number.POSITIVE_INFINITY) headers.set("Content-Length", String(fileSize));
		if (!String.isEmpty(fileName)) headers.set("Content-Disposition", this.#contentDisposition(fileName));
		return headers;
	}

	preflight(): Response {
		return new Response(null, { status: 204, headers: this.#corsHeaders() });
	}

	ok(media: TelegramMedia, body: BodyInit | null): Response {
		return new Response(body, { status: 200, headers: this.#mediaHeaders(media) });
	}

	partial(media: TelegramMedia, range: MediaRange, body: BodyInit | null): Response {
		const { begin: start, end, total } = range;
		const headers = this.#mediaHeaders(media);
		if (end !== Number.POSITIVE_INFINITY) {
			let size = "*";
			if (total !== Number.POSITIVE_INFINITY) size = String(total);
			headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
			headers.set("Content-Length", String(end - start + 1));
			return new Response(body, { status: 206, headers });
		}
		if (total !== Number.POSITIVE_INFINITY) headers.set("Content-Length", String(total - start));
		return new Response(body, { status: 200, headers });
	}

	rangeNotSatisfiable(media: TelegramMedia): Response {
		const headers = this.#corsHeaders();
		const fileSize = media.fileSize;
		if (fileSize !== Number.POSITIVE_INFINITY) headers.set("Content-Range", `bytes */${fileSize}`);
		return new Response("Range Not Satisfiable", { status: 416, headers });
	}

	error(status: number, message: string): Response {
		return new Response(message, { status, headers: this.#corsHeaders() });
	}
}
//#endregion
