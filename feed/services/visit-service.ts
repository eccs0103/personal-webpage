"use strict";

import "adaptive-extender/web";
import { Timespan, type BufferedCell } from "adaptive-extender/web";
import { VisitState } from "../models/visit.js";
import { LegacyCell } from "./legacy-cell.js";

//#region Visit service
export class VisitService {
	static #absence: Timespan = Timespan.fromComponents(30, 0, 0, 0);
	#repository: BufferedCell<typeof VisitState>;
	#isWelcomeDue: boolean;

	constructor() {
		LegacyCell.migrate("Personal webpage\\Feed\\Visit", "Personal webpage\\Visit");
		this.#repository = localStorage.openBufferedCell("Personal webpage\\Visit", VisitState, new VisitState(null));
		this.#isWelcomeDue = this.#repository.content.isAbsentLongerThan(VisitService.#absence, new Date());
	}

	get isWelcomeDue(): boolean { return this.#isWelcomeDue; }

	async markVisited(): Promise<void> {
		const repository = this.#repository;
		repository.content.visit(new Date());
		await repository.save();
	}
}
//#endregion
