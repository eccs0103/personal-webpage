"use strict";

import "adaptive-extender/web";
import { type ReactElement } from "react";
import { Activity } from "../models/activity.js";
import { ArrayCursor } from "./array-cursor.js";
import { type ActivityCollector } from "./activity-collector.js";
import { type ActivityRegistry } from "./activity-registry.js";
import { type DataTable } from "./data-table.js";
import { AnalyticsService } from "../../environment/services/analytics-service.js";
import { FeedBatchLoaded } from "../models/feed-batch-loaded.js";
import { FeedCompleted } from "../models/feed-completed.js";

const analytics = AnalyticsService.instance;

//#region Feed loader
export interface FeedListener {
	(cards: readonly (readonly [Activity, ReactElement])[]): void;
}

export interface FeedLoaderOptions {
	batch: number;
}

export class FeedLoader {
	#activities: DataTable<typeof Activity>;
	#registry: ActivityRegistry;
	#cursor: ArrayCursor<Activity>;
	#collector: ActivityCollector;
	#batch: number;
	#page: number = 0;
	#isCompleted: boolean = false;

	constructor(activities: DataTable<typeof Activity>, registry: ActivityRegistry);
	constructor(activities: DataTable<typeof Activity>, registry: ActivityRegistry, options: Partial<FeedLoaderOptions>);
	constructor(activities: DataTable<typeof Activity>, registry: ActivityRegistry, options: Partial<FeedLoaderOptions> = {}) {
		this.#activities = activities;
		this.#registry = registry;
		this.#cursor = new ArrayCursor(activities);
		this.#collector = registry.newCollector(activities);
		this.#batch = options.batch ?? 10;
	}

	#renderChunk(cards: (readonly [Activity, ReactElement])[], isFinal: boolean): boolean {
		const cursor = this.#cursor;
		const collector = this.#collector;
		const registry = this.#registry;
		const batch = this.#batch;
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
			cards.push([buffer[0], strategy.render(buffer)]);
			rendered++;
		}
		return cursor.inRange;
	}

	async #load(): Promise<void> {
		const page = this.#page;
		this.#page = page + 1;
		const isLoaded = await this.#activities.load(page);
		if (isLoaded) return analytics.dispatch("feed_batch_loaded", new FeedBatchLoaded(page + 1));
		analytics.dispatch("feed_completed", new FeedCompleted(page + 1));
		this.#isCompleted = true;
	}

	async next(listener: FeedListener): Promise<boolean> {
		const cards: (readonly [Activity, ReactElement])[] = [];
		const isCompleted = this.#isCompleted;
		const hasMore = this.#renderChunk(cards, isCompleted);
		if (cards.length > 0) listener(cards);
		if (hasMore) return true;
		if (isCompleted) return false;
		await this.#load();
		return true;
	}
}
//#endregion
