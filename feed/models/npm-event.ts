"use strict";

import "adaptive-extender/core";
import { Field, Model, Nullable, URI } from "adaptive-extender/core";

//#region Npm search links
export interface NpmSearchLinksScheme {
	npm: string;
}

export class NpmSearchLinks extends Model {
	@Field(URI, { name: "npm" })
	npm: URI;
}
//#endregion

//#region Npm search package
export interface NpmSearchPackageScheme {
	name: string;
	description: string | null;
	links: NpmSearchLinksScheme;
}

export class NpmSearchPackage extends Model {
	@Field(String, { name: "name" })
	name: string;

	@Field(Nullable.Of(String), { name: "description" })
	description: string | null;

	@Field(NpmSearchLinks, { name: "links" })
	links: NpmSearchLinks;
}
//#endregion

//#region Npm search object
export interface NpmSearchObjectScheme {
	package: NpmSearchPackageScheme;
}

export class NpmSearchObject extends Model {
	@Field(NpmSearchPackage, { name: "package" })
	package: NpmSearchPackage;
}
//#endregion

//#region Npm search result
export interface NpmSearchResultScheme {
	objects: NpmSearchObjectScheme[];
	total: number;
}

export class NpmSearchResult extends Model {
	@Field(Array.Of(NpmSearchObject), { name: "objects" })
	objects: NpmSearchObject[];

	@Field(Number, { name: "total" })
	total: number;
}
//#endregion

//#region Npm packument version
export interface NpmPackumentVersionScheme {
	version: string;
	description: string | null;
}

export class NpmPackumentVersion extends Model {
	@Field(String, { name: "version" })
	version: string;

	@Field(Nullable.Of(String), { name: "description" })
	description: string | null;
}
//#endregion

//#region Npm packument
export interface NpmPackumentScheme {
	name: string;
	description: string | null;
	time: Record<string, string>;
	versions: Record<string, NpmPackumentVersionScheme>;
}

export class NpmPackument extends Model {
	@Field(String, { name: "name" })
	name: string;

	@Field(Nullable.Of(String), { name: "description" })
	description: string | null;

	@Field(Map.AsRecord(String), { name: "time" })
	time: Map<string, string>;

	@Field(Map.AsRecord(NpmPackumentVersion), { name: "versions" })
	versions: Map<string, NpmPackumentVersion>;
}
//#endregion
