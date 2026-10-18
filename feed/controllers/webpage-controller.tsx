"use strict";

import "adaptive-extender/web";
import { Controller, Timespan } from "adaptive-extender/web";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClientBridge } from "../services/client-bridge.js";
import { DataTable } from "../services/data-table.js";
import { Activity, GitHubActivity, NpmActivity, SoundCloudActivity, SpotifyActivity, StackOverflowActivity, SteamAchievementActivity, SteamScreenshotActivity, TelegramActivity } from "../models/activity.js";
import { Configuration } from "../models/configuration.js";
import { ChangelogEntry, type ChangelogEntryScheme } from "../models/changelog.js";
import { type Bridge } from "../services/bridge.js";
import { SettingsService } from "../services/settings-service.js";
import { ChangelogService } from "../services/changelog-service.js";
import { VisitService } from "../services/visit-service.js";
import { AnalyticsController } from "../../environment/controllers/analytics-controller.js";
import { MetadataController } from "./metadata-controller.js";
import { ActivityRegistry } from "../services/activity-registry.js";
import { FeedLoader } from "../services/feed-loader.js";
import { GitHubRenderStrategy, NpmRenderStrategy, SoundCloudRenderStrategy, SpotifyRenderStrategy, StackOverflowRenderStrategy, SteamRenderStrategy, TelegramRenderStrategy } from "../view/render-strategies.js";
import { TranslationGuard } from "../view/translation-guard.js";
import { FeedApp } from "../view/feed-app.js";

const { baseURI, body } = document;

//#region Webpage controller
class WebpageController extends Controller {
	#bridge: Bridge = new ClientBridge();

	async #readConfiguration(url: Readonly<URL>): Promise<Configuration> {
		const bridge = this.#bridge;
		const content = await bridge.read(url);
		if (content === null) throw new ReferenceError();
		const object = JSON.parse(content);
		return Configuration.import(object, "configuration");
	}

	async #readChangelog(url: Readonly<URL>): Promise<ChangelogEntry[]> {
		const bridge = this.#bridge;
		const content = await bridge.read(url);
		if (content === null) throw new ReferenceError();
		const object = JSON.parse(content);
		return Array.Of<ChangelogEntry, ChangelogEntryScheme>(ChangelogEntry).import(object, "changelog");
	}

	#newRegistry(urlProxy: Readonly<URL>): ActivityRegistry {
		const registry = new ActivityRegistry();
		registry.register(GitHubActivity, new GitHubRenderStrategy());
		registry.register(SpotifyActivity, new SpotifyRenderStrategy());
		registry.register(SteamAchievementActivity, new SteamRenderStrategy());
		registry.register(SteamScreenshotActivity, new SteamRenderStrategy());
		registry.register(StackOverflowActivity, new StackOverflowRenderStrategy());
		registry.register(TelegramActivity, new TelegramRenderStrategy(urlProxy), { gap: Timespan.newZero });
		registry.register(NpmActivity, new NpmRenderStrategy());
		registry.register(SoundCloudActivity, new SoundCloudRenderStrategy());
		return registry;
	}

	async #mount(configuration: Configuration, settings: SettingsService, changelog: ChangelogService, visits: VisitService, loader: FeedLoader): Promise<void> {
		const { searchParams } = new URL(location.href);
		const isWelcomeDue = visits.isWelcomeDue || searchParams.has("welcome");
		await visits.markVisited();
		if (isWelcomeDue) await changelog.skipHistory();
		const unseen = isWelcomeDue ? [] : changelog.unseen;
		if (unseen.length > 0) await changelog.markAsSeen();
		const divRoot = body.getElement(HTMLDivElement, "div#root");
		createRoot(divRoot).render(<StrictMode><FeedApp configuration={configuration} settings={settings} changelog={changelog} unseen={unseen} welcome={isWelcomeDue} loader={loader} /></StrictMode>);
	}

	async run(): Promise<void> {
		new TranslationGuard().observe(body);

		const configuration = await this.#readConfiguration(new URL("../data/feed-configuration.json", baseURI));
		const { platforms } = configuration;
		const settings = new SettingsService(new Map(platforms.filter(platform => platform.status === "connected").map(platform => [platform.name, true])));
		const activities = new DataTable(this.#bridge, new URL("../data/activities", baseURI), Activity);
		const dataChangelog = await this.#readChangelog(new URL("../data/feed-changelog.json", baseURI));
		const changelog = new ChangelogService(dataChangelog);
		const registry = this.#newRegistry(new URL(configuration.urlProxy));
		const loader = new FeedLoader(activities, registry);

		const mounting = this.#mount(configuration, settings, changelog, new VisitService(), loader);
		const promiseMetadata = MetadataController.launch(platforms);
		const promiseAnalytics = AnalyticsController.launch();

		await Promise.all([mounting, promiseMetadata, promiseAnalytics]);
	}

	async catch(error: Error): Promise<void> {
		console.error(error);
	}
}
//#endregion

await WebpageController.launch();
