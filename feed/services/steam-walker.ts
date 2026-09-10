"use strict";

import "adaptive-extender/node";
import { Optional } from "adaptive-extender/node";
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
				const icon =
					Optional.map(schema?.icon, url => url.replace(SteamUnlockSource.#legacyImagesHost, SteamUnlockSource.#currentImagesHost)) ??
					Optional.map(imgIconUrl, url => `https://media.steampowered.com/steamcommunity/public/images/apps/${appId}/${url}.jpg`) ??
					null;
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
		const { appId, game, achievement, schema, icon } = event;
		const webpage = `https://store.steampowered.com/app/${appId}`;
		const title = achievement.name?.insteadWhitespace(null) ?? schema?.displayName?.insteadWhitespace(null) ?? achievement.apiName;
		const description = achievement.description?.insteadWhitespace(null) ?? schema?.description?.insteadWhitespace(null) ?? null;
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

	*map(event: SteamPublishedFile): Iterable<Activity> {
		if (event.banned || event.visibility !== 0) return;
		const url = event.fileUrl ?? event.previewUrl;
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
