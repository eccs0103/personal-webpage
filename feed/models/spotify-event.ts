"use strict";

import "adaptive-extender/core";
import { Any, Field, Nullable, Model, URI } from "adaptive-extender/core";

//#region Spotify token
export interface SpotifyTokenScheme {
	access_token: string;
	token_type: string;
	expires_in: number;
	scope: string;
}

export class SpotifyToken extends Model {
	@Field(String, { name: "access_token" })
	accessToken: string;

	@Field(String, { name: "token_type" })
	tokenType: string;

	@Field(Number, { name: "expires_in" })
	expiresIn: number;

	@Field(String, { name: "scope" })
	scope: string;
}
//#endregion

//#region Spotify authorization
export interface SpotifyAuthorizationScheme {
	access_token: string;
	refresh_token: string;
	token_type: string;
	expires_in: number;
	scope: string;
}

export class SpotifyAuthorization extends Model {
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

//#region Spotify token error
export interface SpotifyTokenErrorScheme {
	error: string;
	error_description: string;
}

export class SpotifyTokenError extends Model {
	@Field(String, { name: "error" })
	error: string;

	@Field(String, { name: "error_description" })
	errorDescription: string;
}
//#endregion

//#region Spotify external urls
export interface SpotifyExternalUrlsScheme {
	spotify: string;
}

export class SpotifyExternalUrls extends Model {
	@Field(URI, { name: "spotify" })
	spotify: URI;
}
//#endregion

//#region Spotify image
export interface SpotifyImageScheme {
	url: string;
	height: number | null;
	width: number | null;
}

export class SpotifyImage extends Model {
	@Field(URI, { name: "url" })
	url: URI;

	@Field(Nullable.Of(Number), { name: "height" })
	height: number | null;

	@Field(Nullable.Of(Number), { name: "width" })
	width: number | null;
}
//#endregion

//#region Spotify album
export interface SpotifyAlbumScheme {
	id: string;
	name: string;
	images: SpotifyImageScheme[];
	release_date: string;
	external_urls: SpotifyExternalUrlsScheme;
}

export class SpotifyAlbum extends Model {
	@Field(String, { name: "id" })
	id: string;

	@Field(String, { name: "name" })
	name: string;

	@Field(Array.Of(SpotifyImage), { name: "images" })
	images: SpotifyImage[];

	@Field(String, { name: "release_date" })
	releaseDate: string;

	@Field(SpotifyExternalUrls, { name: "external_urls" })
	externalUrls: SpotifyExternalUrls;
}
//#endregion

//#region Spotify artist
export interface SpotifyArtistScheme {
	id: string;
	name: string;
	external_urls: SpotifyExternalUrlsScheme;
	uri: string;
}

export class SpotifyArtist extends Model {
	@Field(String, { name: "id" })
	id: string;

	@Field(String, { name: "name" })
	name: string;

	@Field(SpotifyExternalUrls, { name: "external_urls" })
	externalUrls: SpotifyExternalUrls;

	@Field(URI, { name: "uri" })
	uri: URI;
}
//#endregion

//#region Spotify track
export interface SpotifyTrackScheme {
	id: string;
	name: string;
	artists: SpotifyArtistScheme[];
	album: SpotifyAlbumScheme;
	external_urls: SpotifyExternalUrlsScheme;
	duration_ms: number;
	preview_url: string | null;
	uri: string;
}

export class SpotifyTrack extends Model {
	@Field(String, { name: "id" })
	id: string;

	@Field(String, { name: "name" })
	name: string;

	@Field(Array.Of(SpotifyArtist), { name: "artists" })
	artists: SpotifyArtist[];

	@Field(SpotifyAlbum, { name: "album" })
	album: SpotifyAlbum;

	@Field(SpotifyExternalUrls, { name: "external_urls" })
	externalUrls: SpotifyExternalUrls;

	@Field(Number, { name: "duration_ms" })
	durationMs: number;

	@Field(Nullable.Of(URI), { name: "preview_url" })
	previewUrl: URI | null;

	@Field(URI, { name: "uri" })
	uri: URI;
}
//#endregion

//#region Spotify save event
export interface SpotifySaveEventScheme {
	added_at: string;
	track: SpotifyTrackScheme;
}

export class SpotifySaveEvent extends Model {
	@Field(Date, { name: "added_at" })
	addedAt: Date;

	@Field(SpotifyTrack, { name: "track" })
	track: SpotifyTrack;
}
//#endregion

//#region Spotify saves collection
export interface SpotifySavesCollectionScheme {
	href: string;
	limit: number;
	next: string | null;
	offset: number;
	previous: string | null;
	total: number;
	items: any[];
}

export class SpotifySavesCollection extends Model {
	@Field(URI, { name: "href" })
	href: URI;

	@Field(Number, { name: "limit" })
	limit: number;

	@Field(Nullable.Of(String), { name: "next" })
	next: string | null;

	@Field(Number, { name: "offset" })
	offset: number;

	@Field(Nullable.Of(String), { name: "previous" })
	previous: string | null;

	@Field(Number, { name: "total" })
	total: number;

	@Field(Array.Of(Any), { name: "items" })
	items: any[];
}
//#endregion
