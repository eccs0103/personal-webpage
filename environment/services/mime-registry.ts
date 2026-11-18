"use strict";

import "adaptive-extender/core";

//#region Mime registry
export class MimeRegistry {
	static #extensions: ReadonlyMap<string, string> = new Map([
		["audio/mpeg", "mp3"],
		["audio/ogg", "ogg"],
		["audio/mp4", "m4a"],
		["audio/aac", "aac"],
		["audio/flac", "flac"],
		["audio/wav", "wav"],
		["video/mp4", "mp4"],
		["video/webm", "webm"],
		["video/quicktime", "mov"],
		["video/x-matroska", "mkv"],
		["image/jpeg", "jpg"],
		["image/png", "png"],
		["image/gif", "gif"],
		["image/webp", "webp"],
		["application/pdf", "pdf"],
		["application/zip", "zip"],
		["text/plain", "txt"],
		["text/x-ini", "ini"],
		["application/msword", "doc"],
		["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
		["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx"],
		["application/vnd.openxmlformats-officedocument.presentationml.presentation", "pptx"],
	]);

	static extensionFor(mimeType: string): string {
		const known = MimeRegistry.#extensions.get(mimeType);
		if (known !== undefined) return known;
		const extension = mimeType.split("/").at(-1);
		if (extension === undefined) throw new SyntaxError(`Malformed MIME type '${mimeType}'`);
		console.warn(`Unknown MIME type '${mimeType}' successfully resolved. Verify consistency before proceeding.`);
		return extension;
	}
}
//#endregion
