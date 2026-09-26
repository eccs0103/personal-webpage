"use strict";

import "adaptive-extender/web";
import { Controller, Timespan } from "adaptive-extender/web";
import { ActivitiesRenderer } from "../view/activities-renderer.js";
import { ClientBridge } from "../services/client-bridge.js";
import { DataTable } from "../services/data-table.js";
import { Activity, GitHubActivity, NpmActivity, SoundCloudActivity, SpotifyActivity, StackOverflowActivity, SteamAchievementActivity, SteamScreenshotActivity, TelegramActivity } from "../models/activity.js";
import { FooterRenderer } from "../view/footer-renderer.js";
import { HeaderRenderer } from "../view/header-renderer.js";
import { Configuration } from "../models/configuration.js";
import { ChangelogEntry, type ChangelogEntryScheme } from "../models/changelog.js";
import { type Bridge } from "../services/bridge.js";
import { SettingsService } from "../services/settings-service.js";
import { ChangelogService } from "../services/changelog-service.js";
import { ChangelogRenderer } from "../view/changelog-renderer.js";
import { WelcomeRenderer } from "../view/welcome-renderer.js";
import { PlatformMenuRenderer } from "../view/platform-menu-renderer.js";
import { VisitService } from "../services/visit-service.js";
import { AnalyticsController } from "../../environment/controllers/analytics-controller.js";
import { MetadataController } from "./metadata-controller.js";
import { ActivityRegistry } from "../services/activity-registry.js";
import { GitHubRenderStrategy } from "../view/github-render-strategy.js";
import { SpotifyRenderStrategy } from "../view/spotify-render-strategy.js";
import { SteamRenderStrategy } from "../view/steam-render-strategy.js";
import { StackOverflowRenderStrategy } from "../view/stack-overflow-render-strategy.js";
import { TelegramRenderStrategy } from "../view/telegram-render-strategy.js";
import { NpmRenderStrategy } from "../view/npm-render-strategy.js";
import { SoundCloudRenderStrategy } from "../view/soundcloud-render-strategy.js";

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

	async #launchDialogs(changelog: ChangelogService, visits: VisitService): Promise<void> {
		const { isWelcomeDue } = visits;
		await visits.markVisited();
		if (isWelcomeDue && changelog.isFirstVisit) await changelog.markAsSeen();
		await ChangelogRenderer.launch(body, changelog, isWelcomeDue);
		if (!isWelcomeDue) return;
		await WelcomeRenderer.launch(body);
	}

	async run(): Promise<void> {
		const configuration = await this.#readConfiguration(new URL("../data/feed-configuration.json", baseURI));
		const { platforms } = configuration;
		const settings = new SettingsService(new Map(platforms.filter(platform => platform.status === "connected").map(platform => [platform.name, true])));
		const main = await body.getElementAsync(HTMLElement, "main");
		const activities = new DataTable(this.#bridge, new URL("../data/activities", baseURI), Activity);
		const footer = await body.getElementAsync(HTMLElement, "footer");
		const dataChangelog = await this.#readChangelog(new URL("../data/feed-changelog.json", baseURI));
		const changelog = new ChangelogService(dataChangelog);
		const registry = this.#newRegistry(new URL(configuration.urlProxy));

		const promiseHeader = HeaderRenderer.launch(body, settings, platforms);
		const promiseActivities = ActivitiesRenderer.launch(main, activities, configuration, registry);
		const promiseFooter = FooterRenderer.launch(footer);
		const promisePlatformMenu = PlatformMenuRenderer.launch(body, platforms);
		const promiseDialogs = this.#launchDialogs(changelog, new VisitService());
		const promiseMetadata = MetadataController.launch(platforms);
		const promiseAnalytics = AnalyticsController.launch();

		await Promise.all([promiseHeader, promiseActivities, promiseFooter, promisePlatformMenu, promiseDialogs, promiseMetadata, promiseAnalytics]);
	}

	async catch(error: Error): Promise<void> {
		console.error(error);
	}
}
//#endregion

await WebpageController.launch();
