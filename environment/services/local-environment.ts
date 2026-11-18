"use strict";

import "adaptive-extender/node";
import "dotenv/config";
import { EnvironmentProvider, Field, Model, Optional } from "adaptive-extender/node";

//#region Local environment
export class LocalEnvironment extends Model {
	static #instance: LocalEnvironment | null = null;

	static get instance(): LocalEnvironment {
		if (LocalEnvironment.#instance === null) LocalEnvironment.#instance = EnvironmentProvider.resolve(process.env, LocalEnvironment);
		return LocalEnvironment.#instance;
	}

	@Field(Optional.Of(String), { name: "HOST" })
	host: string | undefined;

	@Field(String, { name: "GOOGLE_SEARCH_ID" })
	googleSearchId: string;

	@Field(String, { name: "GOOGLE_API_KEY" })
	googleApiKey: string;

	@Field(Map.AsRecord(String), { name: "SPECIFIC_DICTIONARY" })
	specialDictionary: Map<string, string>;

	@Field(Date, { name: "ORIGIN" })
	origin: Date;

	@Field(String, { name: "GITHUB_USERNAME" })
	githubUsername: string;

	@Field(String, { name: "GITHUB_TOKEN" })
	githubToken: string;

	@Field(String, { name: "GITHUB_REPOSITORY" })
	githubRepository: string;

	@Field(String, { name: "GITHUB_ISSUES_TOKEN" })
	githubIssuesToken: string;

	@Field(String, { name: "SPOTIFY_CLIENT_ID" })
	spotifyClientId: string;

	@Field(String, { name: "SPOTIFY_CLIENT_SECRET" })
	spotifyClientSecret: string;

	@Field(String, { name: "SPOTIFY_TOKEN" })
	spotifyToken: string;

	@Field(String, { name: "PINTEREST_CLIENT_ID" })
	pinterestClientId: string;

	@Field(String, { name: "PINTEREST_CLIENT_SECRET" })
	pinterestClientSecret: string;

	@Field(String, { name: "PINTEREST_TOKEN" })
	pinterestToken: string;

	@Field(String, { name: "STEAM_ID" })
	steamId: string;

	@Field(String, { name: "STEAM_API_KEY" })
	steamApiKey: string;

	@Field(String, { name: "STACK_OVERFLOW_ID" })
	stackOverflowId: string;

	@Field(String, { name: "STACK_OVERFLOW_API_KEY" })
	stackOverflowApiKey: string;

	@Field(String, { name: "SOUND_CLOUD_CLIENT_ID" })
	soundCloudClientId: string;

	@Field(String, { name: "SOUND_CLOUD_CLIENT_SECRET" })
	soundCloudClientSecret: string;

	@Field(String, { name: "SOUND_CLOUD_TOKEN" })
	soundCloudToken: string;

	@Field(String, { name: "SOUND_CLOUD_TOKEN_KEY" })
	soundCloudTokenKey: string;

	@Field(String, { name: "SOUND_CLOUD_USERNAME" })
	soundCloudUsername: string;

	@Field(String, { name: "NPM_USERNAME" })
	npmUsername: string;

	@Field(Number, { name: "TELEGRAM_CHANNEL_ID" })
	telegramChannelId: number;

	@Field(Number, { name: "TELEGRAM_API_ID" })
	telegramApiId: number;

	@Field(String, { name: "TELEGRAM_API_HASH" })
	telegramApiHash: string;

	@Field(String, { name: "TELEGRAM_SESSION" })
	telegramSession: string;
}
//#endregion
