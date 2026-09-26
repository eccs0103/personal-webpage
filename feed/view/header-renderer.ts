"use strict";

import "adaptive-extender/web";
import { Controller } from "adaptive-extender/web";
import { type Platform } from "../models/configuration.js";
import { ActivityBuilder, DOMBuilder } from "./view-builders.js";
import { SettingsService } from "../services/settings-service.js";
import { AnalyticsService } from "../../environment/services/analytics-service.js";
import { PlatformToggle } from "../models/platform-toggle.js";

const { baseURI } = document;
const analytics = AnalyticsService.instance;

//#region Header renderer
export class HeaderRenderer extends Controller<[HTMLElement, SettingsService, readonly Platform[]]> {
	async run(itemContainer: HTMLElement, settings: SettingsService, platforms: readonly Platform[]): Promise<void> {
		const buttonConnectionsHubTrigger = await itemContainer.getElementAsync(HTMLButtonElement, "button#connections-hub-trigger");
		buttonConnectionsHubTrigger.addEventListener("click", (event) => {
			dialogConnectionsHub.showModal();
		});

		const dialogConnectionsHub = await itemContainer.getElementAsync(HTMLDialogElement, "dialog#connections-hub");
		dialogConnectionsHub.addEventListener("click", (event) => {
			if (event.target !== dialogConnectionsHub) return;
			dialogConnectionsHub.close();
		});

		const preferences = settings.readPreferences();
		const style = document.head.appendChild(document.createElement("style"));
		const cssParts: string[] = [];
		for (const platform of platforms) {
			const { name, icon, webpage, status, note } = platform;

			const divConnectionRow = dialogConnectionsHub.appendChild(document.createElement("div"));
			divConnectionRow.dataset["status"] = status ?? "none";
			divConnectionRow.classList.add("connection-row", "with-padding", "with-inline-gap");

			if (status === "connected") {
				const inputPlatformToggle = divConnectionRow.appendChild(document.createElement("input"));
				inputPlatformToggle.type = "checkbox";
				inputPlatformToggle.checked = preferences.get(name) ?? true;
				inputPlatformToggle.id = `platform-toggle-${name.replace(/\s+/g, "-").toLowerCase()}`;
				inputPlatformToggle.dataset["platform"] = name;
				inputPlatformToggle.hidden = true;
				cssParts.push(`body:has(dialog#connections-hub input#${inputPlatformToggle.id}:not(:checked)) main div.activity[data-platform="${name}"] { display: none; }`);
				inputPlatformToggle.addEventListener("change", (event) => {
					preferences.set(name, inputPlatformToggle.checked);
					analytics.dispatch("platform_toggle", new PlatformToggle(name, inputPlatformToggle.checked));
				void settings.save(200);
				});

				const labelPlatformToggle = divConnectionRow.appendChild(document.createElement("label"));
				labelPlatformToggle.htmlFor = inputPlatformToggle.id;
				labelPlatformToggle.classList.add("platform-toggle", "in-line", "toggle", "layer");
				labelPlatformToggle.role = "checkbox";
				labelPlatformToggle.title = `Toggle ${name}`;

				const spanKnob = labelPlatformToggle.appendChild(document.createElement("span"));
				spanKnob.classList.add("knob", "depth");
			}

			const spanConnectionIcon = divConnectionRow.appendChild(DOMBuilder.newIcon(new URL(icon, new URL("../", baseURI))));
			spanConnectionIcon.classList.add("connection-icon");

			const strongConnectionName = divConnectionRow.appendChild(document.createElement("strong"));
			strongConnectionName.classList.add("connection-name");
			strongConnectionName.textContent = name;

			if (webpage !== null) {
				const aConnectionLink = divConnectionRow.appendChild(DOMBuilder.newLink(new URL(webpage)));
				aConnectionLink.classList.add("connection-link", "with-inline-padding", "font-smaller-2");

				ActivityBuilder.newExternalIcon(aConnectionLink);
			}

			if (note !== null) {
				const spanConnectionNote = divConnectionRow.appendChild(DOMBuilder.newDescription(note));
				spanConnectionNote.classList.add("connection-note", "font-smaller-2");
			}
		}
		style.textContent = cssParts.join("\n");
	}
}
//#endregion
