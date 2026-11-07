"use strict";

import "adaptive-extender/core";
import { Field, Model, Optional, URI } from "adaptive-extender/core";

//#region Steam game
export interface SteamGameScheme {
	appid: number; /** Уникальный ID игры */
	name: string; /** Название игры */
	playtime_forever: number; /** Общее время в игре (минуты) */
	img_icon_url?: string; /** Хэш иконки (для построения URL) */
	playtime_windows_forever?: number; /** Время в игре на Windows (минуты) */
	playtime_mac_forever?: number; /** Время в игре на Mac (минуты) */
	playtime_linux_forever?: number; /** Время в игре на Linux (минуты) */
	rtime_last_played: number; /** Время последнего запуска (Unix Timestamp) */
	has_community_visible_stats?: boolean; /** Доступна ли статистика сообщества (ачивки) */
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
//#endregion

//#region Steam owned games
export interface SteamOwnedGamesScheme {
	game_count?: number; /** Количество игр */
	games?: SteamGameScheme[]; /** Список игр */
}

export class SteamOwnedGames extends Model {
	@Field(Optional.Of(Number), { name: "game_count" })
	gameCount: number | undefined;

	@Field(Optional.Of(Array.Of(SteamGame)), { name: "games" })
	games: SteamGame[] | undefined;
}
//#endregion

//#region Steam owned games container
export interface SteamOwnedGamesContainerScheme {
	response: SteamOwnedGamesScheme;
}

export class SteamOwnedGamesContainer extends Model {
	@Field(SteamOwnedGames, { name: "response" })
	response: SteamOwnedGames;
}
//#endregion

//#region Steam game schema stats achievement
export interface SteamGameSchemaStatsAchievementScheme {
	name: string; /** Технический ID (напр. "NEW_ACHIEVEMENT_1_0"). Совпадает с apiname в stats. */
	// defaultvalue: number;  /** Начальное значение (обычно 0). */
	displayName?: string; /** Отображаемое название (может отсутствовать). */
	// hidden: number; /** Скрытая ачивка (0 или 1). */
	description?: string; /** Описание (может отсутствовать). */
	icon: string; /** URL цветной иконки (64x64). */
	// icongray: string; /** URL серой иконки (64x64). */
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
//#endregion

//#region Steam game schema stats
export interface SteamGameSchemaStatsScheme {
	achievements?: SteamGameSchemaStatsAchievementScheme[]; /** Список ачивок. Может отсутствовать, если есть только стата (килы/смерти), но нет ачивок. */
}

export class SteamGameSchemaStats extends Model {
	@Field(Optional.Of(Array.Of(SteamGameSchemaStatsAchievement)), { name: "achievements" })
	achievements: SteamGameSchemaStatsAchievement[] | undefined;
}
//#endregion

//#region Steam game schema
export interface SteamGameSchemaScheme {
	// gameName: string; /** Название игры в базе Steam. */
	// gameVersion: string; /** Версия данных. */
	availableGameStats?: SteamGameSchemaStatsScheme; /** Доступная статистика. @undefined Если у игры нет публичной статистики или ачивок. */
}

export class SteamGameSchema extends Model {
	@Field(Optional.Of(SteamGameSchemaStats), { name: "availableGameStats" })
	availableGameStats: SteamGameSchemaStats | undefined;
}
//#endregion

//#region Steam game schema container
export interface SteamGameSchemaContainerScheme {
	game: SteamGameSchemaScheme;
}

export class SteamGameSchemaContainer extends Model {
	@Field(SteamGameSchema, { name: "game" })
	game: SteamGameSchema;
}
//#endregion

//#region Steam achievement
export interface SteamAchievementScheme {
	apiname: string; /** Техническое имя ачивки (NEW_ACHIEVEMENT_1_0) */
	achieved: number; /** Статус получения (1 - получено, 0 - нет) */
	unlocktime: number; /** Время получения (Unix Timestamp) */
	name?: string; /** Локализованное название (может отсутствовать) */
	description?: string; /** Локализованное описание (может отсутствовать) */
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
//#endregion

//#region Steam player stats
export interface SteamPlayerStatsScheme {
	steamID?: string; /** SteamID игрока */
	gameName?: string; /** Техническое название игры */
	achievements?: SteamAchievementScheme[]; /** Список ачивок (может не быть, если у игры их нет) */
	success: boolean; /** Статус успешности запроса */
	error?: string; /** Сообщение об ошибке (если success: false) */
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
//#endregion

//#region Steam player stats container
export interface SteamPlayerStatsContainerScheme {
	playerstats: SteamPlayerStatsScheme;
}

export class SteamPlayerStatsContainer extends Model {
	@Field(SteamPlayerStats, { name: "playerstats" })
	playerStats: SteamPlayerStats;
}
//#endregion

//#region Steam published file
export interface SteamPublishedFileScheme {
	// publishedfileid: string; // Уникальный ID опубликованного файла (строка, так как uint64)
	// creator: string; // SteamID автора (строка)
	// creator_appid: number; // ID приложения, через которое загружено (например, Steam Cloud)
	consumer_appid: number; // ID игры, к которой относится скриншот
	// filename: string; // Имя файла на сервере (редко нужно для логики)
	// file_size: number; // Размер файла в байтах
	file_url?: string; // Прямая ссылка на полный скриншот (может отсутствовать, если доступ закрыт/удалено)
	// hcontent_file?: string; // Хэш контента файла (внутренний механизм Steam)
	preview_url?: string; // Ссылка на превью/миниатюру (обычно есть всегда)
	// hcontent_preview?: string; // Хэш превью
	short_description: string; // Заголовок/описание, которое дал пользователь
	time_created: number; // Время публикации (Unix Timestamp)
	// time_updated: number; // Время последнего обновления (Unix Timestamp)
	visibility: number; // Уровень приватности (0 = Public, 1 = FriendsOnly, 2 = Private)
	banned: boolean; // Флаг бана (1 = забанен модерацией)
	// ban_reason?: string; // Причина бана (если banned = 1)
	// subscriptions: number; // Количество подписок (для Workshop, у скриншотов обычно 0)
	// favorited: number; // Количество добавлений в избранное
	// lifetime_subscriptions: number; // Подписки за все время
	// lifetime_favorited: number; // Избранное за все время
	// views: number; // Количество просмотров
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
//#endregion

//#region Steam user files response
export interface SteamUserFilesResponseScheme {
	// total: number; // Общее количество файлов у пользователя (для пагинации)
	publishedfiledetails?: SteamPublishedFileScheme[]; // Массив самих файлов (может быть пустым)
}

export class SteamUserFilesResponse extends Model {
	@Field(Optional.Of(Array.Of(SteamPublishedFile)), { name: "publishedfiledetails" })
	publishedFileDetails: SteamPublishedFile[] | undefined;
}
//#endregion

//#region Steam user files response container
export interface SteamUserFilesResponseContainerScheme {
	response: SteamUserFilesResponseScheme;
}

export class SteamUserFilesResponseContainer extends Model {
	@Field(SteamUserFilesResponse, { name: "response" })
	response: SteamUserFilesResponse;
}
//#endregion
