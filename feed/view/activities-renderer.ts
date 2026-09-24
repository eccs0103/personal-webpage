"use strict";

import "adaptive-extender/web";
import { Controller } from "adaptive-extender/web";
import { Activity } from "../models/activity.js";
import { ArrayCursor } from "../services/array-cursor.js";
import { Configuration, type Platform } from "../models/configuration.js";
import { ActivityBuilder } from "./view-builders.js";
import { type ActivityRegistry } from "../services/activity-registry.js";
import { type ActivityCollector } from "../services/activity-collector.js";
import { type DataTable } from "../services/data-table.js";
import { AnalyticsService } from "../../environment/services/analytics-service.js";
import { FeedBatchLoaded } from "../models/feed-batch-loaded.js";
import { FeedCompleted } from "../models/feed-completed.js";
import { MediaPlay } from "../models/media-play.js";

const analytics = AnalyticsService.instance;

//#region Activities renderer
interface RenderContext {
	cursor: ArrayCursor<Activity>;
	collector: ActivityCollector;
	registry: ActivityRegistry;
	platforms: Map<string, Platform>;
	outro: string;
	batch: number;
	observerAnimatedReveal: IntersectionObserver;
	observerDynamicLoad: IntersectionObserver;
	itemSentinel: HTMLElement;
	activities: DataTable<typeof Activity>;
}

export interface ActivitiesRendererOptions {
	batch: number;
}

export class ActivitiesRenderer extends Controller<[HTMLElement, DataTable<typeof Activity>, Configuration, ActivityRegistry]> {
	#isSentinelIntersecting: boolean = true;
	#page: number = 0;
	#isLoading: boolean = false;

	#attachMediaController(itemContainer: HTMLElement): void {
		itemContainer.addEventListener("play", (event) => {
			const playing = event.target;
			if (!(playing instanceof HTMLMediaElement)) return;
			if (!playing.muted) analytics.dispatch("media_play", new MediaPlay(playing.tagName.toLowerCase()));
			for (const element of itemContainer.getElements(HTMLMediaElement, "video, audio")) {
				if (element === playing || element.muted || element.paused) continue;
				element.pause();
			}
		}, true);
	}

	#renderChunk(itemContainer: HTMLElement, cursor: ArrayCursor<Activity>, collector: ActivityCollector, registry: ActivityRegistry, platforms: Map<string, Platform>, batch: number, observerAnimatedReveal: IntersectionObserver, isFinal: boolean): boolean {
		let rendered = 0;
		while (cursor.inRange && rendered < batch) {
			const index = cursor.index;
			if (collector.isConsumed(cursor.current)) {
				cursor.index++;
				continue;
			}
			const root = collector.findRoot(cursor.current);
			if (root === null) {
				cursor.index++;
				continue;
			}
			const buffer = collector.findGroup(cursor, root);
			if (buffer.length < 1) {
				cursor.index++;
				continue;
			}
			if (!isFinal && !cursor.inRange) {
				cursor.index = index;
				return false;
			}
			const strategy = registry.findStrategy(root);
			if (strategy === null) continue;
			const activity = ActivityBuilder.newContainer(itemContainer, platforms, buffer[0], observerAnimatedReveal);
			strategy.render(activity, buffer);
			rendered++;
		}
		return cursor.inRange;
	}

	async #render(itemContainer: HTMLElement, context: RenderContext): Promise<unknown> {
		if (!this.#isSentinelIntersecting) return;
		const { cursor, collector, registry, platforms, outro, batch, observerAnimatedReveal, observerDynamicLoad, itemSentinel, activities } = context;
		const hasMore = this.#renderChunk(itemContainer, cursor, collector, registry, platforms, batch, observerAnimatedReveal, false);
		if (hasMore) return requestAnimationFrame(this.#render.bind(this, itemContainer, context));

		if (this.#isLoading) return;
		this.#isLoading = true;
		const isLoaded = await activities.load(this.#page++);
		this.#isLoading = false;
		if (isLoaded) {
			analytics.dispatch("feed_batch_loaded", new FeedBatchLoaded(this.#page));
			return requestAnimationFrame(this.#render.bind(this, itemContainer, context));
		}

		analytics.dispatch("feed_completed", new FeedCompleted(this.#page));
		this.#renderChunk(itemContainer, cursor, collector, registry, platforms, batch, observerAnimatedReveal, true);
		observerDynamicLoad.disconnect();
		ActivityBuilder.newOutro(itemContainer, itemSentinel, outro);
	}

	async run(itemContainer: HTMLElement, activities: DataTable<typeof Activity>, configuration: Configuration, registry: ActivityRegistry, options: Partial<ActivitiesRendererOptions> = {}): Promise<void> {
		this.#attachMediaController(itemContainer);

		const outro = configuration.outro;
		const batch = options.batch ?? 10;
		const platforms = new Map(configuration.platforms.map(platform => [platform.name, platform]));
		const cursor = new ArrayCursor(activities);
		const collector = registry.newCollector(activities);

		const observerAnimatedReveal = new IntersectionObserver((entries) => {
			for (const { isIntersecting, target } of entries) {
				if (!isIntersecting) continue;
				target.classList.add("revealed");
				observerAnimatedReveal.unobserve(target);
			}
		}, { threshold: 0.1 });

		ActivityBuilder.newIntro(itemContainer, configuration.intro);

		const itemSentinel = ActivityBuilder.newSentinel(itemContainer);
		const observerDynamicLoad = new IntersectionObserver(([entry]) => {
			this.#isSentinelIntersecting = entry.isIntersecting;
			this.#render(itemContainer, context);
		}, { rootMargin: "200px" });
		const context: RenderContext = { cursor, collector, registry, platforms, outro, batch, observerAnimatedReveal, observerDynamicLoad, itemSentinel, activities };
		observerDynamicLoad.observe(itemSentinel);
		this.#render(itemContainer, context);
	}
}
//#endregion
