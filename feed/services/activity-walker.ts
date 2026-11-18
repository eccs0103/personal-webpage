"use strict";

import "adaptive-extender/node";
import { type ActivitySource } from "./activity-source.js";
import { Activity } from "../models/activity.js";

//#region Authorization expired error
export class AuthorizationExpiredError extends Error {
	#platform: string;

	constructor(platform: string, message: string) {
		super(`Authorization for '${platform}' has expired: ${message}`);
		this.name = "AuthorizationExpiredError";
		this.#platform = platform;
	}

	get platform(): string { return this.#platform; }
}
//#endregion

//#region Activity walker
export class ActivityWalker {
	#name: string;

	constructor(name: string) {
		if (new.target === ActivityWalker) throw new TypeError("Unable to create an instance of an abstract class");
		if (this.crawl !== ActivityWalker.prototype.crawl) throw new TypeError(`Unable to override sealed member 'crawl' in '${typename(this)}'`);
		if (this.sources === ActivityWalker.prototype.sources) throw new TypeError(`Member 'sources' is not implemented in '${typename(this)}'`);
		this.#name = name;
	}

	get name(): string {
		return this.#name;
	}

	floor(since: Date, buffer: readonly Activity[]): Date {
		void buffer;
		return since;
	}

	async *sources(): AsyncIterable<ActivitySource<unknown, unknown>> {
		throw new TypeError(`Member 'sources' is not implemented in '${typename(this)}'`);
	}

	async *crawl(since: Date): AsyncIterable<Activity> {
		for await (const source of this.sources()) {
			yield* source.walk(since);
		}
	}
}
//#endregion
