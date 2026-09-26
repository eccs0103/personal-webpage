"use strict";

import "adaptive-extender/web";
import { Controller } from "adaptive-extender/web";
import { DOMBuilder } from "./view-builders.js";
import { AnalyticsService } from "../../environment/services/analytics-service.js";
import { WelcomeAction } from "../models/welcome-action.js";

const analytics = AnalyticsService.instance;

//#region Welcome renderer
export class WelcomeRenderer extends Controller<[HTMLElement]> {
	#choose(dialogWelcome: HTMLDialogElement, action: string): void {
		analytics.dispatch("welcome_action", new WelcomeAction(action));
		dialogWelcome.close();
	}

	#buildRow(itemParent: HTMLElement, action: string, title: string, description: string, text: string): HTMLButtonElement {
		const divWelcomeRow = itemParent.appendChild(document.createElement("div"));
		divWelcomeRow.classList.add("welcome-row", "with-padding", "large-padding", "with-inline-gap");

		const strongWelcomeRowTitle = divWelcomeRow.appendChild(document.createElement("strong"));
		strongWelcomeRowTitle.classList.add("welcome-row-title");
		strongWelcomeRowTitle.textContent = title;

		const spanWelcomeRowDescription = divWelcomeRow.appendChild(DOMBuilder.newDescription(description));
		spanWelcomeRowDescription.classList.add("welcome-row-description", "font-smaller-2");

		const buttonWelcomeRowAction = divWelcomeRow.appendChild(document.createElement("button"));
		buttonWelcomeRowAction.type = "button";
		buttonWelcomeRowAction.classList.add("welcome-row-action", `welcome-${action}`, "with-inline-padding", "with-padding", "rounded", "depth");
		buttonWelcomeRowAction.textContent = text;
		return buttonWelcomeRowAction;
	}

	#buildChangelogRow(itemParent: HTMLElement, dialogWelcome: HTMLDialogElement, buttonChangelogTrigger: HTMLButtonElement): void {
		if (buttonChangelogTrigger.hidden) return;
		const buttonWelcomeChangelog = this.#buildRow(itemParent, "changelog", "See what's new", "Recent changes to this page.", "Change log");
		buttonWelcomeChangelog.addEventListener("click", (event) => {
			this.#choose(dialogWelcome, "changelog");
			buttonChangelogTrigger.click();
		});
	}

	#spotlight(itemContainer: HTMLElement, buttonConnectionsHubTrigger: HTMLButtonElement): void {
		const buttonPlatformMenuTrigger = [...itemContainer.getElements(HTMLButtonElement, "main button.platform-menu-trigger")].find(button => button.checkVisibility());
		if (buttonPlatformMenuTrigger === undefined) return buttonConnectionsHubTrigger.click();
		const release = () => buttonPlatformMenuTrigger.classList.remove("spotlight");
		const observer = new IntersectionObserver(([entry]) => {
			if (!entry.isIntersecting) return;
			observer.disconnect();
			buttonPlatformMenuTrigger.addEventListener("blur", release, { once: true });
			buttonPlatformMenuTrigger.focus({ preventScroll: true });
			buttonPlatformMenuTrigger.classList.add("spotlight");
		}, { threshold: 1 });
		observer.observe(buttonPlatformMenuTrigger);
		buttonPlatformMenuTrigger.scrollIntoView({ behavior: "smooth", block: "center" });
	}

	async run(itemContainer: HTMLElement): Promise<void> {
		const dialogWelcome = await itemContainer.getElementAsync(HTMLDialogElement, "dialog#welcome");
		dialogWelcome.addEventListener("click", (event) => {
			if (event.target !== dialogWelcome) return;
			this.#choose(dialogWelcome, "dismiss");
		});

		const buttonConnectionsHubTrigger = await itemContainer.getElementAsync(HTMLButtonElement, "button#connections-hub-trigger");
		const buttonChangelogTrigger = await itemContainer.getElementAsync(HTMLButtonElement, "button#changelog-trigger");

		const divWelcomeHeader = dialogWelcome.appendChild(document.createElement("div"));
		divWelcomeHeader.classList.add("welcome-header", "flex", "column", "with-gap", "with-padding", "large-padding");

		const strongWelcomeTitle = divWelcomeHeader.appendChild(document.createElement("strong"));
		strongWelcomeTitle.classList.add("welcome-title", "font-larger-2");
		strongWelcomeTitle.textContent = "Hi! This is a live feed of what I'm up to";

		const spanWelcomeSubtitle = divWelcomeHeader.appendChild(DOMBuilder.newDescription("A few things here are easy to miss:"));
		spanWelcomeSubtitle.classList.add("welcome-subtitle", "font-smaller-2");

		const divWelcomeRows = dialogWelcome.appendChild(document.createElement("div"));
		divWelcomeRows.classList.add("welcome-rows");

		const buttonWelcomeProfiles = this.#buildRow(divWelcomeRows, "profiles", "Find me elsewhere", "Every profile I have, in one place.", "Show platforms");
		buttonWelcomeProfiles.addEventListener("click", (event) => {
			this.#choose(dialogWelcome, "profiles");
			buttonConnectionsHubTrigger.click();
		});

		const buttonWelcomeFilters = this.#buildRow(divWelcomeRows, "filters", "Hide what you don't care about", "Tap a platform name on any post.", "Show me");
		buttonWelcomeFilters.addEventListener("click", (event) => {
			this.#choose(dialogWelcome, "filters");
			this.#spotlight(itemContainer, buttonConnectionsHubTrigger);
		});

		this.#buildChangelogRow(divWelcomeRows, dialogWelcome, buttonChangelogTrigger);

		const divWelcomeFooter = dialogWelcome.appendChild(document.createElement("div"));
		divWelcomeFooter.classList.add("welcome-footer", "flex", "alt-center", "with-gap", "with-padding", "large-padding");

		const buttonWelcomeClose = divWelcomeFooter.appendChild(document.createElement("button"));
		buttonWelcomeClose.type = "button";
		buttonWelcomeClose.classList.add("welcome-close", "with-inline-padding", "with-padding", "rounded", "highlight-background");
		buttonWelcomeClose.textContent = "Got it";
		buttonWelcomeClose.addEventListener("click", (event) => {
			this.#choose(dialogWelcome, "dismiss");
		});

		dialogWelcome.showModal();
	}
}
//#endregion
