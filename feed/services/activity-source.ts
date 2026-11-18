"use strict";

import "adaptive-extender/node";
import { Activity } from "../models/activity.js";

//#region Activity source
export class ActivitySource<TEvent, TSource = unknown> {
	#since: Date = new Date(0);
	#platform: string;

	constructor(platform: string) {
		if (new.target === ActivitySource) throw new TypeError("Unable to create an instance of an abstract class");
		if (this.walk !== ActivitySource.prototype.walk) throw new TypeError(`Unable to override sealed member 'walk' in '${typename(this)}'`);
		if (this.fetch === ActivitySource.prototype.fetch) throw new TypeError(`Member 'fetch' is not implemented in '${typename(this)}'`);
		if (this.parse === ActivitySource.prototype.parse) throw new TypeError(`Member 'parse' is not implemented in '${typename(this)}'`);
		if (this.stamp === ActivitySource.prototype.stamp) throw new TypeError(`Member 'stamp' is not implemented in '${typename(this)}'`);
		if (this.map === ActivitySource.prototype.map) throw new TypeError(`Member 'map' is not implemented in '${typename(this)}'`);
		this.#platform = platform;
	}

	get name(): string { return typename(this); }

	get platform(): string { return this.#platform; }

	get sorted(): boolean { return true; }

	get since(): Date { return this.#since; }

	async *fetch(): AsyncIterable<TSource> {
		throw new TypeError(`Member 'fetch' is not implemented in '${typename(this)}'`);
	}

	parse(source: TSource, name: string): TEvent {
		void source, name;
		throw new TypeError(`Member 'parse' is not implemented in '${typename(this)}'`);
	}

	stamp(event: TEvent): Date {
		void event;
		throw new TypeError(`Member 'stamp' is not implemented in '${typename(this)}'`);
	}

	*map(event: TEvent): Iterable<Activity> {
		void event;
		throw new TypeError(`Member 'map' is not implemented in '${typename(this)}'`);
	}

	async *walk(since: Date): AsyncIterable<Activity> {
		this.#since = since;
		const name = this.name;
		const sorted = this.sorted;
		let index = 0;
		for await (const source of this.fetch()) {
			let event: TEvent;
			try {
				event = this.parse(source, `${name}[${index++}]`);
			} catch (reason) {
				console.error(`${Error.from(reason)}`);
				continue;
			}
			if (this.stamp(event) < since) {
				if (sorted) return;
				continue;
			}
			yield* this.map(event);
		}
	}
}
//#endregion
