"use strict";

import "adaptive-extender/core";
import { Field, Model, Nullable } from "adaptive-extender/core";

//#region Changelog entry
export interface ChangelogEntryScheme {
	date: string;
	changes: string[];
}

export class ChangelogEntry extends Model {
	@Field(Date, { name: "date" })
	date: Date;

	@Field(Array.Of(String), { name: "changes" })
	changes: string[];

	constructor();
	constructor(date: Date, changes: string[]);
	constructor(date?: Date, changes?: string[]) {
		if (date === undefined || changes === undefined) {
			super();
			return;
		}

		super();
		this.date = date;
		this.changes = changes;
	}

	isNotSeen(since: Date | null): boolean {
		if (since === null) return true;
		if (since < this.date) return true;
		return false;
	}
}
//#endregion

//#region Changelog state
export interface ChangelogStateScheme {
	last_seen: string | null;
}

export class ChangelogState extends Model {
	@Field(Nullable.Of(Date), { name: "last_seen" })
	lastSeen: Date | null = null;
}
//#endregion
