"use strict";

import "adaptive-extender/node";
import { ActivitySource } from "./activity-source.js";
import { ActivityWalker } from "./activity-walker.js";
import { SteamGame, SteamAchievement, SteamOwnedGamesContainer, SteamPlayerStatsContainer, SteamGameSchemaContainer, SteamUserFilesResponseContainer, SteamPublishedFile, SteamGameSchemaStatsAchievement } from "../models/steam-event.js";
import { Activity, SteamAchievementActivity, SteamScreenshotActivity } from "../models/activity.js";

//#region Steam unlock
class SteamUnlock {
	appId: number;
	game: string;
	achievement: SteamAchievement;
	schema: SteamGameSchemaStatsAchievement | undefined;
	icon: string | null;

	constructor(appId: number, game: string, achievement: SteamAchievement, schema: SteamGameSchemaStatsAchievement | undefined, icon: string | null) {
		this.appId = appId;
		this.game = game;
		this.achievement = achievement;
		this.schema = schema;
		this.icon = icon;
	}

	static #visible(text: string | undefined): string | null {
		if (text === undefined) return null;
		return text.insteadWhitespace(null);
	}

	get title(): string {
		const { achievement, schema } = this;
		const name = SteamUnlock.#visible(achievement.name);
		if (name !== null) return name;
		if (schema === undefined) return achievement.apiName;
		const display = SteamUnlock.#visible(schema.displayName);
		if (display !== null) return display;
		return achievement.apiName;
	}

	get description(): string | null {
		const { achievement, schema } = this;
		const description = SteamUnlock.#visible(achievement.description);
		if (description !== null) return description;
		if (schema === undefined) return null;
		return SteamUnlock.#visible(schema.description);
	}
}
//#endregion

//#region Steam unlock source
class SteamUnlockSource extends ActivitySource<SteamUnlock, SteamUnlock> {
	static #legacyImagesHost = "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/";
	static #currentImagesHost = "https://shared.akamai.steamstatic.com/community_assets/images/";
	#id: string;
	#apiKey: string;
	#games: Map<number, string>;

	constructor(platform: string, id: string, apiKey: string, games: Map<number, string>) {
		super(platform);
		this.#id = id;
		this.#apiKey = apiKey;
		this.#games = games;
	}

	async #fetchApi($interface: string, method: string, version: string, params: Record<string, string>): Promise<unknown> {
		const url = new URL(`https://api.steampowered.com/${$interface}/${method}/${version}/`);
		url.searchParams.set("key", this.#apiKey);
		url.searchParams.set("format", "json");
		for (const [key, value] of Object.entries(params)) {
			url.searchParams.set(key, value);
		}
		const response = await fetch(url);
		if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
		return await response.json();
	}

	async *#fetchOwnedGames(): AsyncIterable<SteamGame> {
		const data = await this.#fetchApi("IPlayerService", "GetOwnedGames", "v0001", {
			["steamid"]: this.#id,
			["include_appinfo"]: "1",
			["include_played_free_games"]: "1"
		});
		const { response } = SteamOwnedGamesContainer.import(data, "steam_owned_games");
		const { games } = response;
		if (games === undefined) {
			console.warn("⚠️ Information about games is missing. Maybe profile is hidden.");
			return;
		}
		yield* games;
	}

	async *#fetchAchievementsMapping(appId: number): AsyncIterable<readonly [string, SteamGameSchemaStatsAchievement]> {
		const data = await this.#fetchApi("ISteamUserStats", "GetSchemaForGame", "v2", {
			["appid"]: String(appId),
			["l"]: "english"
		});
		const { game } = SteamGameSchemaContainer.import(data, "steam_game_schema");
		const { availableGameStats } = game;
		if (availableGameStats === undefined) return;
		const { achievements } = availableGameStats;
		if (achievements === undefined) return;
		for (const achievement of achievements) {
			yield [achievement.name, achievement];
		}
	}

	async *#fetchPlayerAchievements(appId: number): AsyncIterable<SteamAchievement> {
		const data = await this.#fetchApi("ISteamUserStats", "GetPlayerAchievements", "v0001", {
			["steamid"]: this.#id,
			["appid"]: String(appId),
			["l"]: "english"
		});
		const { playerStats } = SteamPlayerStatsContainer.import(data, "steam_player_stats");
		if (!playerStats.success) throw new Error(playerStats.error);
		const { achievements } = playerStats;
		if (achievements === undefined) return;
		yield* achievements;
	}

	static #resolveIcon(appId: number, schema: SteamGameSchemaStatsAchievement | undefined, imgIconUrl: string | undefined): string | null {
		if (schema !== undefined) return schema.icon.replace(SteamUnlockSource.#legacyImagesHost, SteamUnlockSource.#currentImagesHost);
		if (imgIconUrl !== undefined) return `https://media.steampowered.com/steamcommunity/public/images/apps/${appId}/${imgIconUrl}.jpg`;
		return null;
	}

	async *fetch(): AsyncIterable<SteamUnlock> {
		const since = this.since;
		for await (const game of this.#fetchOwnedGames()) {
			const { appId, name } = game;
			this.#games.set(appId, name);
			if (game.playtimeForever < 120) continue;
			if (game.rtimeLastPlayed < since) continue;
			const { imgIconUrl, hasCommunityVisibleStats } = game;
			if (hasCommunityVisibleStats === undefined || !hasCommunityVisibleStats) continue;
			const mapping = new Map(await Array.fromAsync(this.#fetchAchievementsMapping(appId)));
			for await (const achievement of this.#fetchPlayerAchievements(appId)) {
				if (achievement.achieved !== 1) continue;
				const schema = mapping.get(achievement.apiName);
				const icon = SteamUnlockSource.#resolveIcon(appId, schema, imgIconUrl);
				yield new SteamUnlock(appId, name, achievement, schema, icon);
			}
		}
	}

	parse(source: SteamUnlock, name: string): SteamUnlock {
		void name;
		return source;
	}

	stamp(event: SteamUnlock): Date {
		return event.achievement.unlockTime;
	}

	get sorted(): boolean {
		return false;
	}

	*map(event: SteamUnlock): Iterable<Activity> {
		const platform = this.platform;
		const { appId, game, achievement, icon, title, description } = event;
		const webpage = `https://store.steampowered.com/app/${appId}`;
		const url = `https://steamcommunity.com/stats/${appId}/achievements`;
		yield new SteamAchievementActivity(platform, achievement.unlockTime, game, webpage, icon, title, description, url);
	}
}
//#endregion

//#region Steam screenshot source
class SteamScreenshotSource extends ActivitySource<SteamPublishedFile, SteamPublishedFile> {
	#id: string;
	#apiKey: string;
	#games: ReadonlyMap<number, string>;

	constructor(platform: string, id: string, apiKey: string, games: ReadonlyMap<number, string>) {
		super(platform);
		this.#id = id;
		this.#apiKey = apiKey;
		this.#games = games;
	}

	async #fetchApi($interface: string, method: string, version: string, params: Record<string, string>): Promise<unknown> {
		const url = new URL(`https://api.steampowered.com/${$interface}/${method}/${version}/`);
		url.searchParams.set("key", this.#apiKey);
		url.searchParams.set("format", "json");
		for (const [key, value] of Object.entries(params)) {
			url.searchParams.set(key, value);
		}
		const response = await fetch(url);
		if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
		return await response.json();
	}

	async *#fetchPaginatedFiles(page: number, count: number): AsyncIterable<SteamPublishedFile> {
		const data = await this.#fetchApi("IPublishedFileService", "GetUserFiles", "v1", {
			["steamid"]: this.#id,
			["appid"]: "0",
			["page"]: String(page),
			["numperpage"]: String(count),
			["filetype"]: "4",
		});
		const { response } = SteamUserFilesResponseContainer.import(data, "steam_user_files");
		const { publishedFileDetails } = response;
		if (publishedFileDetails === undefined) return;
		yield* publishedFileDetails;
	}

	async *fetch(): AsyncIterable<SteamPublishedFile> {
		const chunk = 100;
		let page = 1;
		while (true) {
			let index = 0;
			for await (const file of this.#fetchPaginatedFiles(page, chunk)) {
				index++;
				yield file;
			}
			if (index < chunk) return;
			page++;
		}
	}

	parse(source: SteamPublishedFile, name: string): SteamPublishedFile {
		void name;
		return source;
	}

	stamp(event: SteamPublishedFile): Date {
		return event.timeCreated;
	}

	get sorted(): boolean { return false; }

	static #resolveUrl(event: SteamPublishedFile): string | undefined {
		const { fileUrl } = event;
		if (fileUrl !== undefined) return fileUrl;
		return event.previewUrl;
	}

	*map(event: SteamPublishedFile): Iterable<Activity> {
		if (event.banned || event.visibility !== 0) return;
		const url = SteamScreenshotSource.#resolveUrl(event);
		if (url === undefined) return;
		const timestamp = event.timeCreated;
		const { consumerAppId } = event;
		const game = this.#games.get(consumerAppId);
		if (game === undefined) return;
		const webpage = `https://store.steampowered.com/app/${consumerAppId}`;
		const title = event.shortDescription.insteadWhitespace(null);
		yield new SteamScreenshotActivity(this.platform, timestamp, game, webpage, url, title);
	}
}
//#endregion

//#region Steam walker
export class SteamWalker extends ActivityWalker {
	#id: string;
	#apiKey: string;

	constructor(id: string, apiKey: string) {
		super("Steam");
		this.#id = id;
		this.#apiKey = apiKey;
	}

	async *sources(): AsyncIterable<ActivitySource<unknown, unknown>> {
		const games: Map<number, string> = new Map();
		const platform = this.name;
		yield new SteamUnlockSource(platform, this.#id, this.#apiKey, games);
		yield new SteamScreenshotSource(platform, this.#id, this.#apiKey, games);
	}
}
//#endregion
