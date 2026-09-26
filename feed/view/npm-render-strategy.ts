"use strict";

import "adaptive-extender/web";
import { Version } from "adaptive-extender/web";
import { type ActivityRenderStrategy } from "../services/activity-registry.js";
import { NpmActivity, NpmPublishActivity } from "../models/activity.js";
import { DOMBuilder } from "./view-builders.js";
import { TextExpert } from "../services/text-expert.js";

//#region Npm render strategy
export class NpmRenderStrategy implements ActivityRenderStrategy<NpmActivity> {
	static #getBump(version: Version): string {
		if (version.patch !== 0) return "patch";
		if (version.minor !== 0) return "minor";
		return "major";
	}

	#renderPackage(ulContent: HTMLElement, name: string, entries: readonly NpmPublishActivity[]): void {
		const liItem = ulContent.appendChild(document.createElement("li"));
		liItem.classList.add("flex", "column", "with-gap", "small-gap");
		liItem.translate = true;

		const divTitle = liItem.appendChild(document.createElement("div"));
		divTitle.classList.add("title-row", "flex", "wrap", "with-gap", "small-gap");
		divTitle.translate = true;

		const aName = divTitle.appendChild(DOMBuilder.newLink(new URL(`https://www.npmjs.com/package/${name}`), { text: name, translate: false }));
		aName.classList.add("package-name");

		const sorted = entries.toSorted((left, right) => Version.compare(left.version, right.version));

		let description: string | null = null;
		for (const entry of sorted) {
			const aBadge = divTitle.appendChild(DOMBuilder.newLink(new URL(entry.url), { text: entry.version.toString(), translate: false }));
			aBadge.classList.add("version-badge");
			aBadge.classList.add(`bump-${NpmRenderStrategy.#getBump(entry.version)}`);
			if (entry.description !== null) description = entry.description;
		}

		if (description !== null) liItem.appendChild(DOMBuilder.newDescription(description));
	}

	#renderCollection(itemContainer: HTMLElement, activities: readonly NpmPublishActivity[]): void {
		const details = itemContainer.appendChild(document.createElement("details"));
		details.classList.add("npm-collection");
		details.open = true;
		details.translate = true;

		const groups: Map<string, NpmPublishActivity[]> = new Map();
		for (const activity of activities) {
			const group = groups.get(activity.package);
			if (group === undefined) groups.set(activity.package, [activity]);
			else group.push(activity);
		}

		const summary = details.appendChild(document.createElement("summary"));
		summary.translate = true;
		summary.textContent = `Updated ${groups.size} package${TextExpert.getPluralSuffix(groups.size)}`;

		const ulContent = details.appendChild(document.createElement("ul"));
		ulContent.classList.add("collection-content");
		ulContent.translate = true;

		for (const [name, entries] of groups) {
			this.#renderPackage(ulContent, name, entries);
		}
	}

	render(itemContainer: HTMLElement, buffer: readonly NpmActivity[]): void {
		const publishes: NpmPublishActivity[] = [];
		for (const activity of buffer) {
			if (activity instanceof NpmPublishActivity) publishes.push(activity);
		}

		this.#renderCollection(itemContainer, publishes);
	}
}
//#endregion
