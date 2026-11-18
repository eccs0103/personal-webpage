"use strict";

import "adaptive-extender/core";
import { Field, Model } from "adaptive-extender/core";

//#region Feed batch loaded
export class FeedBatchLoaded extends Model {
	@Field(Number, { name: "batches_loaded" })
	batchesLoaded: number;

	constructor();
	constructor(batchesLoaded: number);
	constructor(batchesLoaded?: number) {
		if (batchesLoaded === undefined) {
			super();
			return;
		}

		super();
		this.batchesLoaded = batchesLoaded;
	}
}
//#endregion
