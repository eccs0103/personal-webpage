"use strict";

import "adaptive-extender/web";
import { type BufferedCell } from "adaptive-extender/web";
import { ChangelogEntry, ChangelogState } from "../models/changelog.js";

//#region Changelog service
export class ChangelogService {
	#repository: BufferedCell<typeof ChangelogState>;
	#entries: readonly ChangelogEntry[];

	constructor(entries: readonly ChangelogEntry[]) {
		this.#entries = [...entries].sort((first, second) => second.date.valueOf() - first.date.valueOf());
		this.#repository = localStorage.openBufferedCell("Personal webpage\\Feed\\Changelog", ChangelogState, new ChangelogState(null));
	}

	get entries(): readonly ChangelogEntry[] {
		return this.#entries;
	}

	get isFirstVisit(): boolean {
		return this.#repository.content.lastSeen === null;
	}

	get unseen(): readonly ChangelogEntry[] {
		const { lastSeen } = this.#repository.content;
		return this.#entries.filter(entry => entry.isNotSeen(lastSeen));
	}

	async skipHistory(): Promise<void> {
		if (!this.isFirstVisit) return;
		await this.markAsSeen();
	}

	async markAsSeen(): Promise<void> {
		const repository = this.#repository;
		const latest = this.#entries.at(0);
		if (latest === undefined) return;
		repository.content.lastSeen = latest.date;
		await repository.save();
	}
}
//#endregion
