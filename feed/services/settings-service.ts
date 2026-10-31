"use strict";

import "adaptive-extender/web";
import { type BufferedCell } from "adaptive-extender/web";
import { OldSettings, Settings } from "../models/settings.js";
import { LegacyCell } from "./legacy-cell.js";

//#region Settings service
export class SettingsService {
	#repository: BufferedCell<typeof Settings>;

	constructor(preferences: Map<string, boolean>) {
		LegacyCell.migrate("Personal webpage\\Feed\\Settings", "Personal webpage\\Settings");
		try {
			this.#repository = localStorage.openBufferedCell("Personal webpage\\Settings", Settings, new Settings());
		} catch (reason) {
			if (!(reason instanceof SyntaxError)) throw reason;
			const { platforms } = localStorage.openBufferedCell("Personal webpage\\Settings", OldSettings, new OldSettings()).content;
			const recovered = new Map(platforms.map(preference => [preference, true]));
			localStorage.removeItem("Personal webpage\\Settings");
			this.#repository = localStorage.openBufferedCell("Personal webpage\\Settings", Settings, new Settings(recovered));
		}

		const stored = this.#repository.content.preferences;
		const unsaved = [...preferences.keys()].filter(name => stored.add(name, true));
		if (unsaved.length === 0) return;
		void this.#repository.save();
	}

	readPreferences(): Map<string, boolean> {
		return this.#repository.content.preferences;
	}

	save(): Promise<void>;
	save(delay: number): Promise<void>;
	async save(delay: number = 0): Promise<void> {
		await this.#repository.save(delay);
	}
}
//#endregion
