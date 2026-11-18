"use strict";

import "adaptive-extender/core";
import { Field, Model, Optional, URI } from "adaptive-extender/core";

export interface SteamGameScheme {
	appid: number;
	name: string;
	playtime_forever: number;
	img_icon_url?: string;
	playtime_windows_forever?: number;
	playtime_mac_forever?: number;
	playtime_linux_forever?: number;
	rtime_last_played: number;
	has_community_visible_stats?: boolean;
}

export class SteamGame extends Model {
	@Field(Number, { name: "appid" })
	appId: number;

	@Field(String, { name: "name" })
	name: string;

	@Field(Number, { name: "playtime_forever" })
	playtimeForever: number;

	@Field(Optional.Of(String), { name: "img_icon_url" })
	imgIconUrl: string | undefined;

	@Field(Optional.Of(Number), { name: "playtime_windows_forever" })
	playtimeWindowsForever: number | undefined;

	@Field(Optional.Of(Number), { name: "playtime_mac_forever" })
	playtimeMacForever: number | undefined;

	@Field(Optional.Of(Number), { name: "playtime_linux_forever" })
	playtimeLinuxForever: number | undefined;

	@Field(Date.AsUnixSeconds, { name: "rtime_last_played" })
	rtimeLastPlayed: Date;

	@Field(Optional.Of(Boolean), { name: "has_community_visible_stats" })
	hasCommunityVisibleStats: boolean | undefined;
}

export interface SteamOwnedGamesScheme {
	game_count?: number;
	games?: SteamGameScheme[];
}

export class SteamOwnedGames extends Model {
	@Field(Optional.Of(Number), { name: "game_count" })
	gameCount: number | undefined;

	@Field(Optional.Of(Array.Of(SteamGame)), { name: "games" })
	games: SteamGame[] | undefined;
}

export interface SteamOwnedGamesContainerScheme {
	response: SteamOwnedGamesScheme;
}

export class SteamOwnedGamesContainer extends Model {
	@Field(SteamOwnedGames, { name: "response" })
	response: SteamOwnedGames;
}

export interface SteamGameSchemaStatsAchievementScheme {
	name: string;
	displayName?: string;
	description?: string;
	icon: string;
}

export class SteamGameSchemaStatsAchievement extends Model {
	@Field(String, { name: "name" })
	name: string;

	@Field(Optional.Of(String), { name: "displayName" })
	displayName: string | undefined;

	@Field(Optional.Of(String), { name: "description" })
	description: string | undefined;

	@Field(URI, { name: "icon" })
	icon: URI;
}

export interface SteamGameSchemaStatsScheme {
	achievements?: SteamGameSchemaStatsAchievementScheme[];
}

export class SteamGameSchemaStats extends Model {
	@Field(Optional.Of(Array.Of(SteamGameSchemaStatsAchievement)), { name: "achievements" })
	achievements: SteamGameSchemaStatsAchievement[] | undefined;
}

export interface SteamGameSchemaScheme {
	availableGameStats?: SteamGameSchemaStatsScheme;
}

export class SteamGameSchema extends Model {
	@Field(Optional.Of(SteamGameSchemaStats), { name: "availableGameStats" })
	availableGameStats: SteamGameSchemaStats | undefined;
}

export interface SteamGameSchemaContainerScheme {
	game: SteamGameSchemaScheme;
}

export class SteamGameSchemaContainer extends Model {
	@Field(SteamGameSchema, { name: "game" })
	game: SteamGameSchema;
}

export interface SteamAchievementScheme {
	apiname: string;
	achieved: number;
	unlocktime: number;
	name?: string;
	description?: string;
}

export class SteamAchievement extends Model {
	@Field(String, { name: "apiname" })
	apiName: string;

	@Field(Number, { name: "achieved" })
	achieved: number;

	@Field(Date.AsUnixSeconds, { name: "unlocktime" })
	unlockTime: Date;

	@Field(Optional.Of(String), { name: "name" })
	name: string | undefined;

	@Field(Optional.Of(String), { name: "description" })
	description: string | undefined;
}

export interface SteamPlayerStatsScheme {
	steamID?: string;
	gameName?: string;
	achievements?: SteamAchievementScheme[];
	success: boolean;
	error?: string;
}

export class SteamPlayerStats extends Model {
	@Field(Optional.Of(String), { name: "steamID" })
	steamId: string | undefined;

	@Field(Optional.Of(String), { name: "gameName" })
	gameName: string | undefined;

	@Field(Optional.Of(Array.Of(SteamAchievement)), { name: "achievements" })
	achievements: SteamAchievement[] | undefined;

	@Field(Boolean, { name: "success" })
	success: boolean;

	@Field(Optional.Of(String), { name: "error" })
	error: string | undefined;
}

export interface SteamPlayerStatsContainerScheme {
	playerstats: SteamPlayerStatsScheme;
}

export class SteamPlayerStatsContainer extends Model {
	@Field(SteamPlayerStats, { name: "playerstats" })
	playerStats: SteamPlayerStats;
}

export interface SteamPublishedFileScheme {
	consumer_appid: number;
	file_url?: string;
	preview_url?: string;
	short_description: string;
	time_created: number;
	visibility: number;
	banned: boolean;
}

export class SteamPublishedFile extends Model {
	@Field(Number, { name: "consumer_appid" })
	consumerAppId: number;

	@Field(Optional.Of(URI), { name: "file_url" })
	fileUrl: URI | undefined;

	@Field(Optional.Of(URI), { name: "preview_url" })
	previewUrl: URI | undefined;

	@Field(String, { name: "short_description" })
	shortDescription: string;

	@Field(Date.AsUnixSeconds, { name: "time_created" })
	timeCreated: Date;

	@Field(Number, { name: "visibility" })
	visibility: number;

	@Field(Boolean, { name: "banned" })
	banned: boolean;
}

export interface SteamUserFilesResponseScheme {
	publishedfiledetails?: SteamPublishedFileScheme[];
}

export class SteamUserFilesResponse extends Model {
	@Field(Optional.Of(Array.Of(SteamPublishedFile)), { name: "publishedfiledetails" })
	publishedFileDetails: SteamPublishedFile[] | undefined;
}

export interface SteamUserFilesResponseContainerScheme {
	response: SteamUserFilesResponseScheme;
}

export class SteamUserFilesResponseContainer extends Model {
	@Field(SteamUserFilesResponse, { name: "response" })
	response: SteamUserFilesResponse;
}

export interface SteamClientCommonScheme {
	clienticon?: string;
}

export class SteamClientCommon extends Model {
	@Field(Optional.Of(String), { name: "clienticon" })
	icon: string | undefined;
}

export interface SteamClientAppScheme {
	common?: SteamClientCommonScheme;
}

export class SteamClientApp extends Model {
	@Field(Optional.Of(SteamClientCommon), { name: "common" })
	common: SteamClientCommon | undefined;
}

export interface SteamClientInfoContainerScheme {
	data: Record<string, SteamClientAppScheme>;
}

export class SteamClientInfoContainer extends Model {
	@Field(Map.AsRecord(SteamClientApp), { name: "data" })
	data: Map<string, SteamClientApp>;
}
