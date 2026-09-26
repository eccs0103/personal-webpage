"use strict";

import "adaptive-extender/core";
import { Any, Field, Model, Nullable, Optional } from "adaptive-extender/core";

//#region Pinterest token
export interface PinterestTokenScheme {
	access_token: string;
	scope: string;
}

export class PinterestToken extends Model {
	@Field(String, { name: "access_token" })
	accessToken: string;

	@Field(String, { name: "scope" })
	scope: string;
}
//#endregion

//#region Pinterest image
export interface PinterestImageScheme {
	url: string;
	width: number;
	height: number;
}

export class PinterestImage extends Model {
	@Field(String, { name: "url" })
	url: string;

	@Field(Number, { name: "width" })
	width: number;

	@Field(Number, { name: "height" })
	height: number;
}
//#endregion

//#region Pinterest images collection
export interface PinterestImagesCollectionScheme {
	"150x150"?: PinterestImageScheme;
	"400x300"?: PinterestImageScheme;
	"600x"?: PinterestImageScheme;
	"1200x"?: PinterestImageScheme;
}

export class PinterestImagesCollection extends Model {
	@Field(Optional.Of(PinterestImage), { name: "150x150" })
	thumbnail: PinterestImage | undefined;

	@Field(Optional.Of(PinterestImage), { name: "400x300" })
	feed: PinterestImage | undefined;

	@Field(Optional.Of(PinterestImage), { name: "600x" })
	preview: PinterestImage | undefined;

	@Field(Optional.Of(PinterestImage), { name: "1200x" })
	original: PinterestImage | undefined;
}
//#endregion

//#region Pinterest media container
export interface PinterestMediaContainerScheme {
	media_type?: string;
	images: PinterestImagesCollectionScheme;
}

export class PinterestMediaContainer extends Model {
	@Field(Optional.Of(String), { name: "media_type" })
	mediaType: string | undefined;

	@Field(PinterestImagesCollection, { name: "images" })
	images: PinterestImagesCollection;
}
//#endregion

//#region Pinterest owner
interface PinterestOwnerScheme {
	username: string;
}
//#endregion

//#region Pinterest board
export interface PinterestBoardScheme {
	id: string;
	name: string;
	description: string | null;
	// owner: PinterestOwnerScheme;
	privacy: string;
}

export class PinterestBoard extends Model {
	@Field(String, { name: "id" })
	id: string;

	@Field(String, { name: "name" })
	name: string;

	@Field(Nullable.Of(String), { name: "description" })
	description: string | null;

	@Field(String, { name: "privacy" })
	privacy: string;
}
//#endregion

//#region Pinterest pin
export interface PinterestPinScheme {
	id: string;
	created_at: string;
	link: string | null;
	title: string | null;
	description: string | null;
	alt_text: string | null;
	board_id: string;
	media: PinterestMediaContainerScheme | null;
}

export class PinterestPin extends Model {
	@Field(String, { name: "id" })
	id: string;

	@Field(Date, { name: "created_at" })
	createdAt: Date;

	@Field(Nullable.Of(String), { name: "link" })
	link: string | null;

	@Field(Nullable.Of(String), { name: "title" })
	title: string | null;

	@Field(Nullable.Of(String), { name: "description" })
	description: string | null;

	@Field(Nullable.Of(String), { name: "alt_text" })
	altText: string | null;

	@Field(String, { name: "board_id" })
	idBoard: string;

	@Field(Nullable.Of(PinterestMediaContainer), { name: "media" })
	media: PinterestMediaContainer | null;
}
//#endregion

//#region Pinterest response
export interface PinterestResponseScheme<T = any> {
	items: T[];
	bookmark: string | null;
	code?: number;
	message?: string;
}

export class PinterestResponse extends Model {
	@Field(Array.Of(Any), { name: "items" })
	items: any[];

	@Field(Nullable.Of(String), { name: "bookmark" })
	bookmark: string | null;

	@Field(Optional.Of(Number), { name: "code" })
	code: number | undefined;

	@Field(Optional.Of(String), { name: "message" })
	message: string | undefined;
}
//#endregion
