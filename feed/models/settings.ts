"use strict";

import "adaptive-extender/core";
import { Field, Model } from "adaptive-extender/core";

//#region Old settings
/**
 * @deprecated
 */
export interface OldSettingsScheme {
	preferences: string[];
}

/**
 * @deprecated
 */
export class OldSettings extends Model {
	@Field(Array.Of(String), { name: "preferences" })
	platforms: string[] = [];
}
//#endregion
//#region Settings
export interface SettingsScheme {
	preferences: Record<string, boolean>;
}

export class Settings extends Model {
	@Field(Map.AsRecord(Boolean), { name: "preferences" })
	preferences: Map<string, boolean> = new Map();

	constructor();
	constructor(preferences: Map<string, boolean>);
	constructor(preferences?: Map<string, boolean>) {
		if (preferences === undefined) {
			super();
			return;
		}

		super();
		this.preferences = preferences;
	}
}
//#endregion
