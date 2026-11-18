"use strict";

import "adaptive-extender/core";
import { Field, Model } from "adaptive-extender/core";

//#region Feed completed
export class FeedCompleted extends Model {
	@Field(Number, { name: "total_batches" })
	totalBatches: number;

	constructor();
	constructor(totalBatches: number);
	constructor(totalBatches?: number) {
		if (totalBatches === undefined) {
			super();
			return;
		}

		super();
		this.totalBatches = totalBatches;
	}
}
//#endregion
