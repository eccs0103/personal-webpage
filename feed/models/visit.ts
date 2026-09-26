"use strict";

import "adaptive-extender/core";
import { Field, Model, Nullable, type Timespan } from "adaptive-extender/core";

//#region Visit state
export interface VisitStateScheme {
	last_visit: string | null;
}

export class VisitState extends Model {
	@Field(Nullable.Of(Date), { name: "last_visit" })
	lastVisit: Date | null;

	constructor();
	constructor(lastVisit: Date | null);
	constructor(lastVisit?: Date | null) {
		if (lastVisit === undefined) {
			super();
			return;
		}
		super();
		this.lastVisit = lastVisit;
	}

	isAbsentLongerThan(absence: Readonly<Timespan>, now: Date): boolean {
		const { lastVisit } = this;
		if (lastVisit === null) return true;
		return now.valueOf() - lastVisit.valueOf() > absence.valueOf();
	}

	visit(now: Date): void {
		this.lastVisit = now;
	}
}
//#endregion
