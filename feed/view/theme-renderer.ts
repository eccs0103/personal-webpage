"use strict";

import "adaptive-extender/web";
import { Controller } from "adaptive-extender/web";
import { AppearanceService } from "../../environment/services/appearance-service.js";
import { type Theme } from "../../environment/models/appearance.js";

const appearance = AppearanceService.instance;

//#region Theme renderer
export class ThemeRenderer extends Controller<[HTMLElement]> {
	#newName(theme: Theme): HTMLSpanElement {
		const spanThemeName = document.createElement("span");
		spanThemeName.id = "theme-name";
		spanThemeName.translate = false;
		spanThemeName.textContent = theme;
		return spanThemeName;
	}

	async run(itemContainer: HTMLElement): Promise<void> {
		const buttonThemeTrigger = await itemContainer.getElementAsync(HTMLButtonElement, "button#theme-trigger");
		let spanThemeName = await itemContainer.getElementAsync(HTMLSpanElement, "span#theme-name");
		spanThemeName.textContent = appearance.theme;

		buttonThemeTrigger.addEventListener("click", async (event) => {
			await appearance.next();
			const spanThemeName2 = this.#newName(appearance.theme);
			spanThemeName.replaceWith(spanThemeName2);
			spanThemeName = spanThemeName2;
		});
	}
}
//#endregion
