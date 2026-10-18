"use strict";

import "adaptive-extender/web";
import { type ReactElement } from "react";
import { Activity } from "../models/activity.js";
import { ActivityCollector, type GroupingOptions, type TypeOf } from "./activity-collector.js";

//#region Activity registry
export interface ActivityRenderStrategy<T extends Activity> {
	render(buffer: readonly T[]): ReactElement;
}

export class ActivityRegistry {
	#entries: Map<TypeOf<Activity>, [ActivityRenderStrategy<Activity>, Partial<GroupingOptions>]> = new Map();

	register<T extends Activity>(root: TypeOf<T>, strategy: ActivityRenderStrategy<T>): void;
	register<T extends Activity>(root: TypeOf<T>, strategy: ActivityRenderStrategy<T>, options: Partial<GroupingOptions>): void;
	register<T extends Activity>(root: TypeOf<T>, strategy: ActivityRenderStrategy<T>, options: Partial<GroupingOptions> = {}): void {
		this.#entries.set(root, [strategy, options]);
	}

	findStrategy(root: TypeOf<Activity>): ActivityRenderStrategy<Activity> | null {
		const entry = this.#entries.get(root);
		if (entry === undefined) return null;
		const [strategy] = entry;
		return strategy;
	}

	newCollector(source: readonly Activity[]): ActivityCollector {
		const collector = new ActivityCollector(source);
		for (const [root, [, options]] of this.#entries) {
			collector.register(root, options);
		}
		return collector;
	}
}
//#endregion
