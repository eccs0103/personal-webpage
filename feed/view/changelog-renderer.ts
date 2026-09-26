"use strict";

import "adaptive-extender/web";
import { Controller } from "adaptive-extender/web";
import { type ChangelogEntry } from "../models/changelog.js";
import { type ChangelogService } from "../services/changelog-service.js";
import { TextExpert } from "../services/text-expert.js";

//#region Changelog renderer
export class ChangelogRenderer extends Controller<[HTMLElement, ChangelogService, boolean]> {
	#buildEntry(dialog: HTMLDialogElement, unseen: readonly ChangelogEntry[], index: number): void {
		dialog.innerHTML = "";

		const entry = unseen[index]!;
		const remaining = unseen.length - index - 1;

		const divHeader = dialog.appendChild(document.createElement("div"));
		divHeader.classList.add("changelog-header", "with-padding", "large-padding");

		const strongTitle = divHeader.appendChild(document.createElement("strong"));
		strongTitle.classList.add("changelog-title");
		strongTitle.textContent = `Update · ${entry.date.toLocaleDateString()}`;

		const ulChanges = dialog.appendChild(document.createElement("ul"));
		ulChanges.classList.add("changelog-changes");
		for (const change of entry.changes) {
			const li = ulChanges.appendChild(document.createElement("li"));
			li.textContent = change;
		}

		const divFooter = dialog.appendChild(document.createElement("div"));
		divFooter.classList.add("changelog-footer", "flex", "alt-center", "with-gap", "with-padding", "large-padding");

		if (remaining > 0) {
			const spanMore = divFooter.appendChild(document.createElement("span"));
			spanMore.classList.add("font-smaller-2", "changelog-more-info");
			spanMore.textContent = `and ${remaining} more update${TextExpert.getPluralSuffix(remaining)} before this`;

			const buttonLoadOlder = divFooter.appendChild(document.createElement("button"));
			buttonLoadOlder.type = "button";
			buttonLoadOlder.classList.add("with-inline-padding", "with-padding", "rounded", "depth");
			buttonLoadOlder.textContent = "Load older";
			buttonLoadOlder.addEventListener("click", (event) => {
				this.#buildEntry(dialog, unseen, index + 1);
			});
		}

		const buttonClose = divFooter.appendChild(document.createElement("button"));
		buttonClose.type = "button";
		buttonClose.classList.add("with-inline-padding", "with-padding", "rounded", "highlight-background");
		buttonClose.textContent = "Got it";
		buttonClose.addEventListener("click", (event) => {
			dialog.close();
		});
	}

	async run(itemContainer: HTMLElement, changelog: ChangelogService, silent: boolean): Promise<void> {
		const { entries, unseen } = changelog;

		const dialog = await itemContainer.getElementAsync(HTMLDialogElement, "dialog#changelog");
		dialog.addEventListener("click", (event) => {
			if (event.target !== dialog) return;
			dialog.close();
		});

		const buttonChangelogTrigger = await itemContainer.getElementAsync(HTMLButtonElement, "button#changelog-trigger");
		if (entries.length > 0) {
			buttonChangelogTrigger.addEventListener("click", (event) => {
				this.#buildEntry(dialog, entries, 0);
				dialog.showModal();
			});
		} else {
			buttonChangelogTrigger.hidden = true;
		}

		if (silent) return;
		if (unseen.length < 1) return;
		this.#buildEntry(dialog, unseen, 0);
		await changelog.markAsSeen();
		dialog.showModal();
	}
}
//#endregion
