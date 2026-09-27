"use strict";

import "adaptive-extender/core";
import { Enum, Field, Model } from "adaptive-extender/core";

//#region Appearance
export enum Theme {
	blackwall = "blackwall",
	material = "material",
}

export interface AppearanceScheme {
	theme: Theme;
}

export class Appearance extends Model {
	@Field(Enum.Of(Theme), { name: "theme" })
	theme: Theme;

	constructor();
	constructor(theme: Theme);
	constructor(theme?: Theme) {
		if (theme === undefined) {
			super();
			return;
		}

		super();
		this.theme = theme;
	}

	next(): void {
		const themes = Object.values(Theme);
		this.theme = themes[(themes.indexOf(this.theme) + 1) % themes.length];
	}
}
//#endregion
