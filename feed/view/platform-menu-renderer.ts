"use strict";

import "adaptive-extender/web";
import { Controller } from "adaptive-extender/web";
import { type Platform } from "../models/configuration.js";
import { ActivityBuilder, DOMBuilder } from "./view-builders.js";

//#region Platform menu renderer
export class PlatformMenuRenderer extends Controller<[HTMLElement, readonly Platform[]]> {
	#buildProfile(itemParent: HTMLElement, platform: Platform): void {
		const { name, webpage } = platform;
		if (webpage === null) return;

		const aPlatformMenuProfile = itemParent.appendChild(DOMBuilder.newLink(new URL(webpage), { text: `Open ${name} profile ` }));
		aPlatformMenuProfile.role = "button";
		aPlatformMenuProfile.classList.add("platform-menu-profile", "with-inline-padding", "with-padding", "rounded", "depth", "highlight");
		ActivityBuilder.newExternalIcon(aPlatformMenuProfile);
	}

	#buildHide(itemContainer: HTMLElement, itemParent: HTMLElement, dialogPlatformMenu: HTMLDialogElement, platform: Platform): void {
		const { name, status } = platform;
		if (status !== "connected") return;

		const buttonPlatformMenuHide = itemParent.appendChild(document.createElement("button"));
		buttonPlatformMenuHide.type = "button";
		buttonPlatformMenuHide.classList.add("platform-menu-hide", "with-inline-padding", "with-padding", "rounded", "depth");
		buttonPlatformMenuHide.textContent = `Hide ${name} posts`;
		buttonPlatformMenuHide.addEventListener("click", (event) => {
			const inputPlatformToggle = itemContainer.getElement(HTMLInputElement, `dialog#connections-hub input[data-platform="${CSS.escape(name)}"]`);
			inputPlatformToggle.checked = false;
			inputPlatformToggle.dispatchEvent(new Event("change"));
			dialogPlatformMenu.close();
		});
	}

	#build(itemContainer: HTMLElement, dialogPlatformMenu: HTMLDialogElement, platform: Platform): void {
		dialogPlatformMenu.replaceChildren();

		const divPlatformMenuHeader = dialogPlatformMenu.appendChild(document.createElement("div"));
		divPlatformMenuHeader.classList.add("platform-menu-header", "with-padding", "large-padding");

		const strongPlatformMenuTitle = divPlatformMenuHeader.appendChild(document.createElement("strong"));
		strongPlatformMenuTitle.classList.add("platform-menu-title");
		strongPlatformMenuTitle.textContent = platform.name;

		const divPlatformMenuActions = dialogPlatformMenu.appendChild(document.createElement("div"));
		divPlatformMenuActions.classList.add("platform-menu-actions", "flex", "column", "with-gap", "with-padding", "large-padding");
		this.#buildProfile(divPlatformMenuActions, platform);
		this.#buildHide(itemContainer, divPlatformMenuActions, dialogPlatformMenu, platform);

		const divPlatformMenuFooter = dialogPlatformMenu.appendChild(document.createElement("div"));
		divPlatformMenuFooter.classList.add("platform-menu-footer", "flex", "alt-center", "with-gap", "with-padding", "large-padding");

		const spanPlatformMenuHint = divPlatformMenuFooter.appendChild(DOMBuilder.newDescription("Bring hidden ones back anytime in Platforms"));
		spanPlatformMenuHint.classList.add("platform-menu-hint", "font-smaller-2");

		const buttonPlatformMenuOpen = divPlatformMenuFooter.appendChild(document.createElement("button"));
		buttonPlatformMenuOpen.type = "button";
		buttonPlatformMenuOpen.classList.add("platform-menu-open", "with-inline-padding", "with-padding", "rounded", "highlight-background");
		buttonPlatformMenuOpen.textContent = "Open";
		buttonPlatformMenuOpen.addEventListener("click", (event) => {
			dialogPlatformMenu.close();
			itemContainer.getElement(HTMLButtonElement, "button#connections-hub-trigger").click();
		});
	}

	async run(itemContainer: HTMLElement, platforms: readonly Platform[]): Promise<void> {
		const registry = new Map(platforms.map(platform => [platform.name, platform]));

		const dialogPlatformMenu = await itemContainer.getElementAsync(HTMLDialogElement, "dialog#platform-menu");
		dialogPlatformMenu.addEventListener("click", (event) => {
			if (event.target !== dialogPlatformMenu) return;
			dialogPlatformMenu.close();
		});

		const main = await itemContainer.getElementAsync(HTMLElement, "main");
		main.addEventListener("click", (event) => {
			const { target } = event;
			if (!(target instanceof HTMLButtonElement)) return;
			if (!target.classList.contains("platform-menu-trigger")) return;
			const name = target.dataset["platform"];
			if (name === undefined) return;
			const platform = registry.get(name);
			if (platform === undefined) return;
			this.#build(itemContainer, dialogPlatformMenu, platform);
			dialogPlatformMenu.showModal();
		});
	}
}
//#endregion
