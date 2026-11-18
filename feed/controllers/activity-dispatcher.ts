"use strict";

import "adaptive-extender/node";
import { Controller } from "adaptive-extender/node";
import { AuthorizationExpiredError, type ActivityWalker } from "../services/activity-walker.js";
import { Activity } from "../models/activity.js";
import { type DataTable } from "../services/data-table.js";
import { type Platform } from "../models/configuration.js";
import { type GitHubReporter } from "../services/github-reporter.js";

//#region Activity dispatcher
export class ActivityDispatcher extends Controller<[DataTable<typeof Activity>, Date, readonly ActivityWalker[], readonly Platform[], GitHubReporter]> {
	static async #report(reporter: GitHubReporter, error: AuthorizationExpiredError): Promise<void> {
		const title = `${error.platform} authorization expired — re-authorization required`;
		const body = [
			`The refresh token for **${error.platform}** was rejected by its API (\`invalid_grant\`) and the activity feed can no longer sync from it.`,
			"This happens when the provider's refresh token has expired. Re-authorize the app to obtain a new refresh token, then update the corresponding repository secret.",
			`Detail: ${error.message}`
		].join("\n");
		try {
			await reporter.report(title, body);
		} catch (reason) {
			console.error(`Unable to report expired authorization for ${error.platform} cause:\n${Error.from(reason)}`);
		}
	}

	static async #runWalker(walker: ActivityWalker, since: Date, activities: Activity[]): Promise<void> {
		const buffer: Activity[] = [];

		for await (const target of walker.crawl(since)) {
			buffer.push(target);
		}

		since = walker.floor(since, buffer);
		let index = activities.length;
		while (index--) {
			const activity = activities[index];
			if (activity.platform !== walker.name) continue;
			if (activity.timestamp < since) continue;
			const indexRemote = buffer.findIndex(remote => Activity.isSame(activity, remote));
			if (indexRemote < 0) {
				activities.splice(index, 1);
				continue;
			}
			activities[index] = buffer[indexRemote];
			buffer.splice(indexRemote, 1);
		}

		activities.push(...buffer);
	}

	static async #runWalkers(walkers: readonly ActivityWalker[], platforms: readonly Platform[], since: Date, activities: Activity[], reporter: GitHubReporter): Promise<void> {
		for (const walker of walkers) {
			try {
				const platform = platforms.find(({ name }) => name === walker.name);
				if (platform === undefined || platform.status !== "connected") continue;
				console.log(`Launching ${walker.name} for crawl`);
				const before = activities.length;
				await ActivityDispatcher.#runWalker(walker, since, activities);
				const count = activities.length - before;
				if (count === 0) continue;
				console.log(`Synced activities from ${walker.name}. Net change: ${count}`);
			} catch (reason) {
				console.error(`Unable to fetch activities from ${walker.name} cause:\n${Error.from(reason)}`);
				if (reason instanceof AuthorizationExpiredError) await ActivityDispatcher.#report(reporter, reason);
			}
		}
		activities.sort(Activity.earlier);
	}

	async run(activities: DataTable<typeof Activity>, since: Date, walkers: readonly ActivityWalker[], platforms: readonly Platform[], reporter: GitHubReporter): Promise<void> {
		await activities.load();
		await ActivityDispatcher.#runWalkers(walkers, platforms, since, activities, reporter);
		await activities.save();
	}

	async catch(error: Error): Promise<void> {
		console.error(`Feed update failed cause of:\n${error}`);
	}
}
//#endregion
