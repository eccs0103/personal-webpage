"use strict";

import "adaptive-extender/web";
import { Controller } from "adaptive-extender/web";
import { DOMBuilder } from "./view-builders.js";
import { AnalyticsService } from "../../environment/services/analytics-service.js";
import { WelcomeAction } from "../models/welcome-action.js";

const analytics = AnalyticsService.instance;

//#region Welcome renderer
export class WelcomeRenderer extends Controller<[HTMLElement]> {
	#choose(dialog: HTMLDialogElement, action: string): void {
		analytics.dispatch("welcome_action", new WelcomeAction(action));
		dialog.close();
	}

	#buildRow(itemContainer: HTMLElement, dialog: HTMLDialogElement, title: string, description: string, text: string, action: string, trigger: HTMLButtonElement): void {
		const divRow = itemContainer.appendChild(document.createElement("div"));
		divRow.classList.add("welcome-row", "with-padding", "large-padding", "with-inline-gap");

		const strongTitle = divRow.appendChild(document.createElement("strong"));
		strongTitle.classList.add("welcome-row-title");
		strongTitle.textContent = title;

		const spanDescription = divRow.appendChild(DOMBuilder.newDescription(description));
		spanDescription.classList.add("welcome-row-description", "font-smaller-2");

		const buttonAction = divRow.appendChild(document.createElement("button"));
		buttonAction.type = "button";
		buttonAction.classList.add("welcome-row-action", "with-inline-padding", "with-padding", "rounded", "depth");
		buttonAction.textContent = text;
		buttonAction.addEventListener("click", (event) => {
			this.#choose(dialog, action);
			trigger.click();
		});
	}

	async run(itemContainer: HTMLElement): Promise<void> {
		const dialog = await itemContainer.getElementAsync(HTMLDialogElement, "dialog#welcome");
		dialog.addEventListener("click", (event) => {
			if (event.target !== dialog) return;
			this.#choose(dialog, "dismiss");
		});

		const buttonConnectionsHubTrigger = await itemContainer.getElementAsync(HTMLButtonElement, "button#connections-hub-trigger");
		const buttonChangelogTrigger = await itemContainer.getElementAsync(HTMLButtonElement, "button#changelog-trigger");

		const divHeader = dialog.appendChild(document.createElement("div"));
		divHeader.classList.add("welcome-header", "flex", "column", "with-gap", "with-padding", "large-padding");

		const strongTitle = divHeader.appendChild(document.createElement("strong"));
		strongTitle.classList.add("welcome-title");
		strongTitle.textContent = "Hi! This is a live feed of what I'm up to";

		const spanSubtitle = divHeader.appendChild(DOMBuilder.newDescription("A few things here are easy to miss:"));
		spanSubtitle.classList.add("font-smaller-2");

		const divRows = dialog.appendChild(document.createElement("div"));
		divRows.classList.add("welcome-rows");
		this.#buildRow(divRows, dialog, "Find me elsewhere", "All my profiles, in one place.", "Show profiles", "profiles", buttonConnectionsHubTrigger);
		this.#buildRow(divRows, dialog, "Hide what you don't care about", "Switch platforms off in Profiles & filters, or tap a platform name on any post.", "Filter", "filters", buttonConnectionsHubTrigger);
		if (!buttonChangelogTrigger.hidden) {
			this.#buildRow(divRows, dialog, "See what's new", "Recent changes to this page.", "What's new", "changelog", buttonChangelogTrigger);
		}

		const divFooter = dialog.appendChild(document.createElement("div"));
		divFooter.classList.add("welcome-footer", "flex", "alt-center", "with-gap", "with-padding", "large-padding");

		const buttonClose = divFooter.appendChild(document.createElement("button"));
		buttonClose.type = "button";
		buttonClose.classList.add("with-inline-padding", "with-padding", "rounded", "highlight-background");
		buttonClose.textContent = "Got it";
		buttonClose.addEventListener("click", (event) => {
			this.#choose(dialog, "dismiss");
		});

		dialog.showModal();
	}
}
//#endregion
