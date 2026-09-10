"use strict";

import "adaptive-extender/core";
import { Any, Field, Model, Nullable, Optional } from "adaptive-extender/core";

//#region SoundCloud token
export interface SoundCloudTokenScheme {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token?: string;
}

export class SoundCloudToken extends Model {
	@Field(String, { name: "access_token" })
	accessToken: string;

	@Field(String, { name: "token_type" })
	tokenType: string;

	@Field(Number, { name: "expires_in" })
	expiresIn: number;

	@Field(Optional.Of(String), { name: "refresh_token" })
	refreshToken: string | undefined;
}
//#endregion

//#region SoundCloud authorization
export interface SoundCloudAuthorizationScheme {
	access_token: string;
	refresh_token: string;
	token_type: string;
	expires_in: number;
	scope: string;
}

export class SoundCloudAuthorization extends Model {
	@Field(String, { name: "access_token" })
	accessToken: string;

	@Field(String, { name: "refresh_token" })
	refreshToken: string;

	@Field(String, { name: "token_type" })
	tokenType: string;

	@Field(Number, { name: "expires_in" })
	expiresIn: number;

	@Field(String, { name: "scope" })
	scope: string;
}
//#endregion

//#region SoundCloud token error
export interface SoundCloudTokenErrorScheme {
	error: string;
	error_description: string;
}

export class SoundCloudTokenError extends Model {
	@Field(String, { name: "error" })
	error: string;

	@Field(String, { name: "error_description" })
	errorDescription: string;
}
//#endregion

//#region SoundCloud user
export interface SoundCloudUserScheme {
	id: number;
	username: string;
	permalink_url: string;
	avatar_url: string | null;
}

export class SoundCloudUser extends Model {
	@Field(Number, { name: "id" })
	id: number;

	@Field(String, { name: "username" })
	username: string;

	@Field(String, { name: "permalink_url" })
	permalinkUrl: string;

	@Field(Nullable.Of(String), { name: "avatar_url" })
	avatarUrl: string | null;
}
//#endregion

//#region SoundCloud track
export interface SoundCloudTrackScheme {
	id: number;
	title: string;
	permalink_url: string;
	artwork_url: string | null;
	created_at: string;
	user: SoundCloudUserScheme;
}

export class SoundCloudTrack extends Model {
	@Field(Number, { name: "id" })
	id: number;

	@Field(String, { name: "title" })
	title: string;

	@Field(String, { name: "permalink_url" })
	permalinkUrl: string;

	@Field(Nullable.Of(String), { name: "artwork_url" })
	artworkUrl: string | null;

	@Field(Date, { name: "created_at" })
	createdAt: Date;

	@Field(SoundCloudUser, { name: "user" })
	user: SoundCloudUser;
}
//#endregion

//#region SoundCloud page
export interface SoundCloudPageScheme {
	collection: unknown[];
	next_href: string | null;
}

export class SoundCloudPage extends Model {
	@Field(Array.Of(Any), { name: "collection" })
	collection: unknown[];

	@Field(Nullable.Of(String), { name: "next_href" })
	nextHref: string | null;
}
//#endregion
