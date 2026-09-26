"use strict";

import "adaptive-extender/node";
import { Version } from "adaptive-extender/node";
import { ActivitySource } from "./activity-source.js";
import { ActivityWalker } from "./activity-walker.js";
import { NpmPackument, NpmSearchResult } from "../models/npm-event.js";
import { Activity, NpmPublishActivity } from "../models/activity.js";

//#region Npm release
class NpmRelease {
	name: string;
	version: string;
	published: Date;
	description: string | null;

	constructor(name: string, version: string, published: Date, description: string | null) {
		this.name = name;
		this.version = version;
		this.published = published;
		this.description = description;
	}
}
//#endregion

//#region Npm publish source
class NpmPublishSource extends ActivitySource<NpmRelease, NpmRelease> {
	#username: string;

	constructor(platform: string, username: string) {
		super(platform);
		this.#username = username;
	}

	async #fetchPackageNames(): Promise<string[]> {
		const url = new URL("https://registry.npmjs.org/-/v1/search");
		url.searchParams.set("text", `maintainer:${this.#username}`);
		url.searchParams.set("size", "250");
		const response = await fetch(url);
		if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
		const result = NpmSearchResult.import(await response.json(), "npm_search_result");
		return result.objects.map(({ package: item }) => item.name);
	}

	async #fetchPackument(name: string): Promise<NpmPackument> {
		const url = new URL(`https://registry.npmjs.org/${name}`);
		const response = await fetch(url);
		if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
		return NpmPackument.import(await response.json(), "npm_packument");
	}

	async *#fetchReleases(name: string): AsyncIterable<NpmRelease> {
		const packument = await this.#fetchPackument(name);
		const { description: packageDescription, time, versions } = packument;
		for (const [version, published] of time) {
			if (version === "created" || version === "modified") continue;
			const timestamp = new Date(published);
			const details = versions.get(version);
			let description = packageDescription;
			if (details !== undefined) description = details.description;
			yield new NpmRelease(name, version, timestamp, description);
		}
	}

	async *fetch(): AsyncIterable<NpmRelease> {
		const names = await this.#fetchPackageNames();
		for (const name of names) {
			try {
				yield* this.#fetchReleases(name);
			} catch (reason) {
				console.error(reason);
			}
		}
	}

	parse(source: NpmRelease, name: string): NpmRelease {
		void name;
		return source;
	}

	stamp(event: NpmRelease): Date {
		return event.published;
	}

	get sorted(): boolean {
		return false;
	}

	*map(event: NpmRelease): Iterable<Activity> {
		const { name, version, published: timestamp, description } = event;
		const url = `https://www.npmjs.com/package/${name}/v/${version}`;
		yield new NpmPublishActivity(this.platform, timestamp, name, Version.parse(version), description, url);
	}
}
//#endregion

//#region Npm walker
export class NpmWalker extends ActivityWalker {
	#username: string;

	constructor(username: string) {
		super("npm");
		this.#username = username;
	}

	async *sources(): AsyncIterable<ActivitySource<unknown, unknown>> {
		yield new NpmPublishSource(this.name, this.#username);
	}
}
//#endregion
