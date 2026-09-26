"use strict";

import { Optional, Random } from "adaptive-extender/web";
import { GitHubCreateRepositoryActivity, GitHubCreateTagActivity, GitHubDeleteBranchActivity, GitHubDeleteTagActivity, GitHubPushActivity, GitHubReleaseActivity, type GitHubActivity } from "../models/activity.js";
import { TextExpert } from "./text-expert.js";
import type { LinkCreationOptions } from "../view/view-builders.js";

const random = Random.global;

//#region Workflow report
enum ReportVibes {
	creation = "creation",
	milestone = "milestone",
	cleanup = "cleanup",
	focus = "focus",
	scattered = "scattered",
	chill = "chill"
}

class WorkflowReport {
	#vibe: ReportVibes;
	#primary: string;
	#secondary: string | undefined;
	#magnitude: number;
	#label: string;
	#modifier: string;
	#urls: Map<string, URL>;

	constructor(vibe: ReportVibes, primary: string, secondary: string | undefined, magnitude: number, label: string, modifier: string, urls: Map<string, URL>) {
		this.#vibe = vibe;
		this.#primary = primary;
		this.#secondary = secondary;
		this.#magnitude = magnitude;
		this.#label = label;
		this.#modifier = modifier;
		this.#urls = urls;
	}

	get vibe(): ReportVibes {
		return this.#vibe;
	}

	get primary(): string {
		return this.#primary;
	}

	get secondary(): string | undefined {
		return this.#secondary;
	}

	get magnitude(): number {
		return this.#magnitude;
	}

	get label(): string {
		return this.#label;
	}

	get modifier(): string {
		return this.#modifier;
	}

	get urls(): Map<string, URL> {
		return this.#urls;
	}
}
//#endregion
//#region Summary context
export class SummaryContext {
	readonly #primary: Node | undefined;
	readonly #secondary: Node | undefined;
	readonly #magnitude: number;
	readonly #label: string;
	readonly #modifier: string;

	constructor(primary: Node | undefined, secondary: Node | undefined, magnitude: number, label: string, modifier: string) {
		this.#primary = primary;
		this.#secondary = secondary;
		this.#magnitude = magnitude;
		this.#label = label;
		this.#modifier = modifier;
	}

	get primary(): Node {
		return ReferenceError.suppress(this.#primary, "Primary repository is missing");
	}

	get secondary(): Node {
		return ReferenceError.suppress(this.#secondary, "Secondary repository is missing");
	}

	get magnitude(): number {
		return this.#magnitude;
	}

	get label(): string {
		return this.#label;
	}

	get modifier(): string {
		return this.#modifier;
	}
}
//#endregion
//#region GitHub summary expert
export interface PrinterFunction {
	(strings: TemplateStringsArray, ...values: any[]): void;
}

export interface LinkerFunction {
	(url: URL, options: Partial<LinkCreationOptions>): Node;
}

export interface TemplateRenderer {
	(printer: PrinterFunction, context: SummaryContext): void;
}

export class GitHubSummaryExpert {
	static #templates: Map<ReportVibes, TemplateRenderer[]> = new Map([
		[ReportVibes.creation, [
			(print, { primary }) => print`Initialization sequence complete. New repository ${primary} allocated.`,
			(print, { primary }) => print`New directive established: ${primary}. Core structure generated.`,
			(print, { primary }) => print`Protocol ${primary} initiated. Version control tracking active.`,
			(print, { primary }) => print`Project scaffold instantiated for ${primary}. Awaiting input.`
		]],
		[ReportVibes.milestone, [
			(print, { primary, label, modifier }) => print`Production cycle complete. ${modifier} ${label} deployed to ${primary}.`,
			(print, { primary, label }) => print`Milestone reached. ${primary} state advanced to ${label}.`,
			(print, { primary, label }) => print`Version immutable. Identifier ${label} stamped on ${primary} history.`,
			(print, { primary, modifier }) => print`Deployment successful. Fresh ${modifier} integrated into ${primary}.`
		]],
		[ReportVibes.cleanup, [
			(print, { primary }) => print`Maintenance routine executed. Structure optimized in ${primary}.`,
			(print, { primary, modifier }) => print`Repo hygiene protocol engaged. ${modifier} eliminated from ${primary}.`,
			(print, { primary, magnitude }) => print`Garbage collection active. Purged ${magnitude} obsolete references in ${primary}.`,
			(print, { primary }) => print`Workspace sanitization complete for ${primary}. Redundancy reduced.`
		]],
		[ReportVibes.focus, [
			(print, { primary, magnitude }) => print`High-velocity development cycle detected in ${primary}. ${magnitude} iterations recorded.`,
			(print, { primary, magnitude }) => print`Focus modules locked on ${primary}. Throughput increased by ${magnitude} units.`,
			(print, { primary }) => print`Heavy processing loop engaged for ${primary}. Rapid status updates logged.`,
			(print, { primary }) => print`Development intensity: Maximum. Significant progress mapped in ${primary}.`,
			(print, { primary }) => print`Burst transmission received. Tickets resolved and code committed to ${primary}.`
		]],
		[ReportVibes.scattered, [
			(print, { primary, secondary }) => print`Multithreaded operation detected. Synchronizing contexts between ${primary} and ${secondary}.`,
			(print, { primary, secondary }) => print`Distributed workflow active. Updates propagated to ${primary}, ${secondary}, and peripheral nodes.`,
			(print, { primary }) => print`Context switching engaged. Oscillating between ${primary} and ecosystem dependencies.`,
			(print, { primary, modifier }) => print`Parallel execution: Sustaining momentum across ${primary} and ${modifier}.`,
			(print, { primary }) => print`Asynchronous sync engaged. Aligning ${primary} with external project states.`
		]],
		[ReportVibes.chill, [
			(print, { primary }) => print`Codebase integrity verification active for ${primary}.`,
			(print, { primary }) => print`Routine maintenance log. Incremental adjustments applied to ${primary}.`,
			(print, { primary }) => print`Low-latency patch committed to ${primary}. System nominal.`,
			(print, { primary }) => print`Minor variance corrected in ${primary}. Optimization minimal.`,
			(print, { primary }) => print`Background process: Brief update sequence executed for ${primary}.`
		]]
	]);

	#report: WorkflowReport;

	constructor(activities: readonly GitHubActivity[]) {
		this.#report = GitHubSummaryExpert.#analyze(activities);
	}

	static #analyze(activities: readonly GitHubActivity[]): WorkflowReport {
		const urls: Map<string, URL> = new Map();
		const usage: Map<string, number> = new Map();
		let pushes: number = 0;
		let creations: number = 0;
		let releases: number = 0;
		let deletions: number = 0;
		let label: string = "new version";
		let modifier: string = "updates";
		let highlight: string | undefined;
		let hasBranchDeletions = false;
		let hasTagDeletions = false;

		for (const activity of activities) {
			urls.add(activity.repository, new URL(activity.url));
			const count = usage.get(activity.repository) ?? 0;
			usage.set(activity.repository, count + 1);

			if (activity instanceof GitHubPushActivity) {
				pushes++;
			}
			if (activity instanceof GitHubCreateRepositoryActivity) {
				creations++;
				if (releases === 0) highlight = activity.repository;
			}
			if (activity instanceof GitHubCreateTagActivity && releases === 0) {
				releases++;
				label = activity.name;
				modifier = "milestone";
				highlight = activity.repository;
			}
			if (activity instanceof GitHubReleaseActivity) {
				releases++;
				label = activity.title;
				modifier = activity.isPrerelease ? "beta" : "update";
				highlight = activity.repository;
			}
			if (activity instanceof GitHubDeleteBranchActivity) {
				deletions++;
				hasBranchDeletions = true;
			}
			if (activity instanceof GitHubDeleteTagActivity) {
				deletions++;
				hasTagDeletions = true;
			}
		}

		if (deletions > 0) {
			if (hasBranchDeletions && !hasTagDeletions) modifier = "old drafts";
			else if (hasTagDeletions && !hasBranchDeletions) modifier = "unused versions";
			else modifier = "stale data";
		}

		const repositories = Array
			.from(usage)
			.sort(([, count1], [, count2]) => count2 - count1)
			.map(([name]) => name);
		const primary = repositories[0];
		const total = activities.length;

		if (releases > 0) {
			return new WorkflowReport(ReportVibes.milestone, highlight ?? primary, undefined, releases, label, modifier, urls);
		}
		if (creations > 0) {
			return new WorkflowReport(ReportVibes.creation, highlight ?? primary, undefined, creations, "new project", "experiment", urls);
		}
		if (deletions > 0 && (deletions > total / 3 || total === deletions)) {
			return new WorkflowReport(ReportVibes.cleanup, primary, undefined, deletions, "cleanup", modifier, urls);
		}
		if (repositories.length > 1) {
			const others = repositories.length - 1;
			return new WorkflowReport(ReportVibes.scattered, primary, repositories.at(1), total, "ecosystem", `${others} other project${TextExpert.getPluralSuffix(others)}`, urls);
		}
		if (total >= 8) {
			return new WorkflowReport(ReportVibes.focus, primary, undefined, pushes, "updates", "stack", urls);
		}
		return new WorkflowReport(ReportVibes.chill, primary, undefined, total, "fixes", "minor", urls);
	}

	build(linker: LinkerFunction): SummaryContext {
		const { primary, secondary, magnitude, label, modifier, urls } = this.#report;
		const nodePrimary = Optional.map(primary, primary => linker(ReferenceError.suppress(urls.get(primary)), { text: primary, translate: false }));
		const nodeSecondary = Optional.map(secondary, secondary => linker(ReferenceError.suppress(urls.get(secondary)), { text: secondary, translate: false }));
		return new SummaryContext(nodePrimary, nodeSecondary, magnitude, label, modifier);
	}

	choose(): TemplateRenderer {
		const { vibe } = this.#report;
		const templates = ReferenceError.suppress(GitHubSummaryExpert.#templates.get(vibe));
		return random.item(templates);
	}
}
//#endregion
