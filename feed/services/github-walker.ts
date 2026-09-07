"use strict";

import "adaptive-extender/node";
import { ActivitySource } from "./activity-source.js";
import { ActivityWalker } from "./activity-walker.js";
import { GitHubCreateEventPayload, GitHubDeleteEventPayload, GitHubEvent, GitHubForkEventPayload, GitHubIssuesEventPayload, GitHubPullRequestEventPayload, GitHubPushEventPayload, GitHubReleaseEventPayload, GitHubWatchEventPayload } from "../models/github-event.js";
import { Activity, GitHubCreateBranchActivity, GitHubCreateRepositoryActivity, GitHubCreateTagActivity, GitHubDeleteBranchActivity, GitHubDeleteTagActivity, GitHubForkActivity, GitHubIssueCloseActivity, GitHubIssueOpenActivity, GitHubPullRequestCloseActivity, GitHubPullRequestMergeActivity, GitHubPullRequestOpenActivity, GitHubPushActivity, GitHubReleaseActivity, GitHubWatchActivity } from "../models/activity.js";

const { min } = Math;

//#region GitHub event source
class GitHubEventSource extends ActivitySource<GitHubEvent, unknown> {
	#username: string;
	#token: string;

	constructor(platform: string, username: string, token: string) {
		super(platform);
		this.#username = username;
		this.#token = token;
	}

	async *#fetchPaginated(page: number, count: number): AsyncIterable<unknown> {
		const url = new URL(`https://api.github.com/users/${this.#username}/events`);
		url.searchParams.set("per_page", String(count));
		url.searchParams.set("page", String(page));
		const headers: Record<string, string> = {
			["Authorization"]: `Bearer ${this.#token}`,
			["Accept"]: "application/vnd.github+json",
			["User-Agent"]: "Digital garden"
		};
		const response = await fetch(url, { headers });
		if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
		yield* Array.import(await response.json(), "github_events");
	}

	async *fetch(): AsyncIterable<unknown> {
		const chunk = 100;
		const pages = 3; // the timeline caps at 300 events; page 4 fails with 422
		let page = 1;
		while (page <= pages) {
			let count = 0;
			for await (const item of this.#fetchPaginated(page, chunk)) {
				count++;
				yield item;
			}
			if (count < chunk) return;
			page++;
		}
	}

	parse(source: unknown, name: string): GitHubEvent {
		return GitHubEvent.import(source, name);
	}

	stamp(event: GitHubEvent): Date {
		return event.createdAt;
	}

	*map(event: GitHubEvent): Iterable<Activity> {
		if (!event.public) return;
		const { payload, repo } = event;
		const platform = this.platform;
		const timestamp = event.createdAt;
		const username = event.actor.login;
		const parts = repo.name.split("/", 2);
		if (parts.length < 2) throw new SyntaxError(`Incorrect syntax of '${repo.name}' repository`);
		const [, repository] = parts;
		const url = `https://github.com/${username}/${repository}`;
		if (payload instanceof GitHubPushEventPayload) {
			yield new GitHubPushActivity(platform, timestamp, username, url, repository, payload.head);
		}
		if (payload instanceof GitHubReleaseEventPayload) {
			const { name, tagName, prerelease } = payload.release;
			yield new GitHubReleaseActivity(platform, timestamp, username, url, repository, name ?? tagName, tagName, prerelease);
		}
		if (payload instanceof GitHubWatchEventPayload) {
			yield new GitHubWatchActivity(platform, timestamp, username, url, repository);
		}
		if (payload instanceof GitHubCreateEventPayload) {
			const { ref, refType } = payload;
			const name = ref ?? repository;
			switch (refType) {
			case "tag": yield new GitHubCreateTagActivity(platform, timestamp, username, url, repository, name); break;
			case "branch": yield new GitHubCreateBranchActivity(platform, timestamp, username, url, repository, name); break;
			case "repository": yield new GitHubCreateRepositoryActivity(platform, timestamp, username, url, repository, name); break;
			default: throw new Error(`Invalid '${refType}' refType for GitHubCreateEventPayload`);
			}
		}
		if (payload instanceof GitHubDeleteEventPayload) {
			const { ref: name, refType } = payload;
			switch (refType) {
			case "tag": yield new GitHubDeleteTagActivity(platform, timestamp, username, url, repository, name); break;
			case "branch": yield new GitHubDeleteBranchActivity(platform, timestamp, username, url, repository, name); break;
			default: throw new Error(`Invalid '${refType}' refType for GitHubDeleteEventPayload`);
			}
		}
		if (payload instanceof GitHubForkEventPayload) {
			const { htmlUrl: forkUrl, fullName: forkName } = payload.forkee;
			yield new GitHubForkActivity(platform, timestamp, username, url, repository, forkUrl, forkName);
		}
		if (payload instanceof GitHubIssuesEventPayload) {
			const { action, issue } = payload;
			const { number, title, htmlUrl: issueUrl } = issue;
			switch (action) {
			case "opened":
			case "reopened": yield new GitHubIssueOpenActivity(platform, timestamp, username, url, repository, number, title, issueUrl); break;
			case "closed": yield new GitHubIssueCloseActivity(platform, timestamp, username, url, repository, number, title, issueUrl); break;
			}
		}
		if (payload instanceof GitHubPullRequestEventPayload) {
			const { action, pullRequest } = payload;
			const { number, title, htmlUrl: requestUrl, merged } = pullRequest;
			switch (action) {
			case "opened":
			case "reopened": yield new GitHubPullRequestOpenActivity(platform, timestamp, username, url, repository, number, title, requestUrl); break;
			case "closed":
				yield merged
					? new GitHubPullRequestMergeActivity(platform, timestamp, username, url, repository, number, title, requestUrl)
					: new GitHubPullRequestCloseActivity(platform, timestamp, username, url, repository, number, title, requestUrl);
				break;
			}
		}
	}
}
//#endregion

//#region GitHub walker
export class GitHubWalker extends ActivityWalker {
	#username: string;
	#token: string;

	constructor(username: string, token: string) {
		super("GitHub");
		this.#username = username;
		this.#token = token;
	}

	async *sources(): AsyncIterable<ActivitySource<unknown, unknown>> {
		yield new GitHubEventSource(this.name, this.#username, this.#token);
	}

	floor(since: Date, buffer: readonly Activity[]): Date {
		const start = (Date.now() - 2_592_000_000).clamp(since.valueOf(), Infinity);
		const oldest = buffer.reduce((result, activity) => min(result, activity.timestamp.valueOf()), start);
		return new Date(oldest.clamp(since.valueOf(), Infinity));
	}
}
//#endregion
