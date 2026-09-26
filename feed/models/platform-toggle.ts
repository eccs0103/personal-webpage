"use strict";

import "adaptive-extender/core";
import { Field, Model } from "adaptive-extender/core";

//#region Platform toggle
export class PlatformToggle extends Model {
	/** Display name of the platform whose visibility was toggled (e.g. "GitHub", "Spotify"). */
	@Field(String, { name: "platform_name" })
	namePlatform: string;

	/** true when the platform was enabled; false when hidden. */
	@Field(Boolean, { name: "enabled" })
	enabled: boolean;

	constructor();
	constructor(namePlatform: string, enabled: boolean);
	constructor(namePlatform?: string, enabled?: boolean) {
		if (namePlatform === undefined || enabled === undefined) {
			super();
			return;
		}

		super();
		this.namePlatform = namePlatform;
		this.enabled = enabled;
	}
}
//#endregion
