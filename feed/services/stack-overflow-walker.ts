"use strict";

import "adaptive-extender/node";
import { URI } from "adaptive-extender/node";
import { ActivitySource } from "./activity-source.js";
import { ActivityWalker } from "./activity-walker.js";
import { StackExchangeResponse, StackOverflowQuestion, StackOverflowAnswer } from "../models/stack-overflow-event.js";
import { Activity, StackOverflowAnswerActivity, StackOverflowQuestionActivity } from "../models/activity.js";

//#region Stack overflow source
class StackOverflowSource<TEvent> extends ActivitySource<TEvent, unknown> {
	#id: string;
	#apiKey: string;

	constructor(platform: string, id: string, apiKey: string) {
		super(platform);
		if (new.target === StackOverflowSource) throw new TypeError("Unable to create an instance of an abstract class");
		this.#id = id;
		this.#apiKey = apiKey;
	}

	get endpoint(): string { throw new TypeError(`Member 'endpoint' is not implemented in '${typename(this)}'`); }

	decodeEntities(text: string): string {
		const entities: Record<string, string> = {
			"&quot;": "\"",
			"&amp;": "&",
			"&lt;": "<",
			"&gt;": ">",
			"&nbsp;": " ",
			"&#39;": "'"
		};
		return text.replace(/&[a-z0-9#]+;/gi, match => entities[match] ?? match);
	}

	async *fetch(): AsyncIterable<unknown> {
		let page = 1;
		while (true) {
			const uri = new URI(`https://api.stackexchange.com/2.3/users/${this.#id}/${this.endpoint}`);
			uri.searchParams.set("key", this.#apiKey);
			uri.searchParams.set("site", "ru.stackoverflow");
			uri.searchParams.set("order", "desc");
			uri.searchParams.set("sort", "creation");
			uri.searchParams.set("pagesize", "100");
			uri.searchParams.set("page", String(page));
			uri.searchParams.set("filter", "!)P9_qyD6XyHJLYKWY3jS6x.uxt2eB36b0OK2mkKT5P)M88undp-XHpcemjsoNQzGVtVO)*");
			const response = await fetch(uri.href);
			if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
			const data = StackExchangeResponse.import(await response.json(), "stack_overflow_response");
			yield* data.items;
			if (!data.hasMore) break;
			page++;
		}
	}
}
//#endregion

//#region Stack overflow answer source
class StackOverflowAnswerSource extends StackOverflowSource<StackOverflowAnswer> {
	get endpoint(): string { return "answers"; }

	parse(source: unknown, name: string): StackOverflowAnswer {
		return StackOverflowAnswer.import(source, name);
	}

	stamp(event: StackOverflowAnswer): Date {
		return event.creationDate;
	}

	*map(event: StackOverflowAnswer): Iterable<Activity> {
		const platform = this.platform;
		const timestamp = event.creationDate;
		const title = this.decodeEntities(event.title);
		const { body, score, isAccepted } = event;
		const url = event.link;
		yield new StackOverflowAnswerActivity(platform, timestamp, title, body, score, url, isAccepted);
	}
}
//#endregion

//#region Stack overflow question source
class StackOverflowQuestionSource extends StackOverflowSource<StackOverflowQuestion> {
	get endpoint(): string { return "questions"; }

	parse(source: unknown, name: string): StackOverflowQuestion {
		return StackOverflowQuestion.import(source, name);
	}

	stamp(event: StackOverflowQuestion): Date {
		return event.creationDate;
	}

	*map(event: StackOverflowQuestion): Iterable<Activity> {
		const platform = this.platform;
		const timestamp = event.creationDate;
		const title = this.decodeEntities(event.title);
		const { body, score, tags, isAnswered } = event;
		const url = event.link;
		const views = event.viewCount;
		yield new StackOverflowQuestionActivity(platform, timestamp, title, body, score, url, tags, views, isAnswered);
	}
}
//#endregion

//#region Stack overflow walker
export class StackOverflowWalker extends ActivityWalker {
	#id: string;
	#apiKey: string;

	constructor(id: string, apiKey: string) {
		super("Stack overflow");
		this.#id = id;
		this.#apiKey = apiKey;
	}

	async *sources(): AsyncIterable<ActivitySource<unknown, unknown>> {
		const platform = this.name;
		yield new StackOverflowAnswerSource(platform, this.#id, this.#apiKey);
		yield new StackOverflowQuestionSource(platform, this.#id, this.#apiKey);
	}
}
//#endregion
