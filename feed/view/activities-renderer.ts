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
	#isCompleted: boolean = false;

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

	#renderChunk(itemContainer: HTMLElement, context: RenderContext, isFinal: boolean): boolean {
		const { cursor, collector, registry, platforms, batch, observerAnimatedReveal } = context;
		let rendered = 0;
		while (cursor.inRange && rendered < batch) {
			const { current } = cursor;
			const root = collector.findRoot(current);
			if (root === null || collector.isConsumed(current)) {
				cursor.index++;
				continue;
			}
			const buffer = collector.findGroup(cursor, root, isFinal);
			if (buffer === null) return false;
			const strategy = registry.findStrategy(root);
			if (strategy === null) continue;
			const activity = ActivityBuilder.newContainer(itemContainer, platforms, buffer[0], observerAnimatedReveal);
			strategy.render(activity, buffer);
			rendered++;
		}
		return cursor.inRange;
	}

	#proceed(itemContainer: HTMLElement, context: RenderContext): void {
		requestAnimationFrame(this.#render.bind(this, itemContainer, context));
	}

	#finish(itemContainer: HTMLElement, context: RenderContext): void {
		const { observerDynamicLoad, itemSentinel, outro } = context;
		observerDynamicLoad.disconnect();
		ActivityBuilder.newOutro(itemContainer, itemSentinel, outro);
	}

	async #load(activities: DataTable<typeof Activity>): Promise<void> {
		this.#isLoading = true;
		const isLoaded = await activities.load(this.#page++);
		this.#isLoading = false;
		if (isLoaded) return analytics.dispatch("feed_batch_loaded", new FeedBatchLoaded(this.#page));
		analytics.dispatch("feed_completed", new FeedCompleted(this.#page));
		this.#isCompleted = true;
	}

	async #render(itemContainer: HTMLElement, context: RenderContext): Promise<void> {
		if (!this.#isSentinelIntersecting) return;
		const isCompleted = this.#isCompleted;
		const hasMore = this.#renderChunk(itemContainer, context, isCompleted);
		if (hasMore) return this.#proceed(itemContainer, context);
		if (isCompleted) return this.#finish(itemContainer, context);
		if (this.#isLoading) return;
		await this.#load(context.activities);
		this.#proceed(itemContainer, context);
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
