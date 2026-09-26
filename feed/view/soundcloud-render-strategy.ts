"use strict";

import "adaptive-extender/web";
import { type ActivityRenderStrategy } from "../services/activity-registry.js";
import { SoundCloudActivity, SoundCloudLikeActivity, SoundCloudUploadActivity } from "../models/activity.js";
import { ActivityBuilder, DOMBuilder } from "./view-builders.js";

//#region SoundCloud render strategy
export class SoundCloudRenderStrategy implements ActivityRenderStrategy<SoundCloudActivity> {
	static #patternUpsizeQuery: RegExp = /-large(?=\.\w+$)/;

	static #upsize(query: string): string {
		return query.replace(SoundCloudRenderStrategy.#patternUpsizeQuery, "-t500x500");
	}

	#renderTrack(itemContainer: HTMLElement, activity: SoundCloudActivity, message: string): void {
		const { title, publisher, artwork, avatar, url } = activity;

		itemContainer.appendChild(DOMBuilder.newTextbox(message));

		const divWrapper = itemContainer.appendChild(document.createElement("div"));
		divWrapper.classList.add("flex", "with-gap");
		divWrapper.translate = true;

		const image = artwork ?? avatar;
		if (image !== null) {
			const imgArtwork = divWrapper.appendChild(DOMBuilder.newImage(new URL(SoundCloudRenderStrategy.#upsize(image)), `'${title}' artwork`, { translate: false }));
			imgArtwork.classList.add("rounded", "soundcloud-cover");
		} else {
			const divPlaceholder = divWrapper.appendChild(document.createElement("div"));
			divPlaceholder.classList.add("depth", "rounded", "soundcloud-cover", "placeholder", "flex", "center");
			divPlaceholder.translate = false;
			divPlaceholder.textContent = "♪";
		}

		const divInformation = divWrapper.appendChild(document.createElement("div"));
		divInformation.classList.add("flex", "column");
		divInformation.translate = true;

		const strongHeader = divInformation.appendChild(document.createElement("strong"));
		strongHeader.translate = false;
		strongHeader.textContent = title;

		divInformation.appendChild(DOMBuilder.newDescription(publisher)).translate = false;

		const aLink = divInformation.appendChild(DOMBuilder.newLink(new URL(url), { text: "Listen on SoundCloud " }));
		aLink.classList.add("with-block-padding", "font-smaller-3");

		ActivityBuilder.newExternalIcon(aLink);
	}

	#renderSingle(itemContainer: HTMLElement, activity: SoundCloudActivity): void {
		if (activity instanceof SoundCloudUploadActivity) return this.#renderTrack(itemContainer, activity, "Published new track");
		if (activity instanceof SoundCloudLikeActivity) return this.#renderTrack(itemContainer, activity, "Published track, that has been added to music collection");
	}

	render(itemContainer: HTMLElement, buffer: readonly SoundCloudActivity[]): void {
		itemContainer.classList.add("flex", "column", "with-gap");

		for (const activity of buffer) {
			this.#renderSingle(itemContainer, activity);
		}
	}
}
//#endregion
