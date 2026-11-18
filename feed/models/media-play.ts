"use strict";

import "adaptive-extender/core";
import { Field, Model } from "adaptive-extender/core";

//#region Media play
export class MediaPlay extends Model {
	@Field(String, { name: "media_type" })
	mediaType: string;

	constructor();
	constructor(mediaType: string);
	constructor(mediaType?: string) {
		if (mediaType === undefined) {
			super();
			return;
		}

		super();
		this.mediaType = mediaType;
	}
}
//#endregion
