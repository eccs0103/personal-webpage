"use strict";

import "adaptive-extender/core";
import { Field, Model, Nullable, URI } from "adaptive-extender/core";

//#region Platform
export interface PlatformScheme {
	name: string;
	icon: string;
	webpage: string | null;
	note: string | null;
	status: string | null;
}

export class Platform extends Model {
	@Field(String, { name: "name" })
	name: string;

	@Field(String, { name: "icon" })
	icon: string;

	@Field(Nullable.Of(URI), { name: "webpage" })
	webpage: URI | null;

	@Field(Nullable.Of(String), { name: "note" })
	note: string | null;

	@Field(Nullable.Of(String), { name: "status" })
	status: string | null;
}
//#endregion
//#region Configuration
export interface ConfigurationScheme {
	platforms: PlatformScheme[];
	intro: string;
	outro: string;
	url_proxy: string;
}

export class Configuration extends Model {
	@Field(Array.Of(Platform), { name: "platforms" })
	platforms: Platform[];

	@Field(String, { name: "intro" })
	intro: string;

	@Field(String, { name: "outro" })
	outro: string;

	@Field(URI, { name: "url_proxy" })
	urlProxy: URI;
}
//#endregion
