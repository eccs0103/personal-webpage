"use strict";

import "adaptive-extender/web";
import { type BufferedCell } from "adaptive-extender/web";
import { Appearance, Theme } from "../models/appearance.js";

//#region Appearance service
export class AppearanceService {
	static #key: string = "Personal webpage\\Appearance";
	static #lock: boolean = true;
	static #instance: AppearanceService | null = null;
	#repository: BufferedCell<typeof Appearance>;

	constructor() {
		if (AppearanceService.#lock) throw new TypeError("Illegal constructor");

		const key = AppearanceService.#key;
		try {
			this.#repository = localStorage.openBufferedCell(key, Appearance, new Appearance(Theme.blackwall));
		} catch (reason) {
			if (!(reason instanceof SyntaxError)) throw reason;
			localStorage.removeItem(key);
			this.#repository = localStorage.openBufferedCell(key, Appearance, new Appearance(Theme.blackwall));
		}
	}

	static get instance(): AppearanceService {
		if (AppearanceService.#instance === null) {
			AppearanceService.#lock = false;
			AppearanceService.#instance = new AppearanceService();
			AppearanceService.#lock = true;
		}
		return AppearanceService.#instance;
	}

	get theme(): Theme {
		return this.#repository.content.theme;
	}

	apply(): void {
		document.documentElement.dataset["theme"] = this.theme;
	}

	async next(): Promise<void> {
		const repository = this.#repository;
		repository.content.next();
		this.apply();
		await repository.save();
	}
}
//#endregion
