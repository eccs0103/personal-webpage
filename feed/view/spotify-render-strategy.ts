"use strict";

import "adaptive-extender/web";
import { type ActivityRenderStrategy } from "../services/activity-registry.js";
import { SpotifyActivity, SpotifyLikeActivity } from "../models/activity.js";
import { ActivityBuilder, DOMBuilder } from "./view-builders.js";

//#region Spotify render strategy
export class SpotifyRenderStrategy implements ActivityRenderStrategy<SpotifyActivity> {
	#renderLike(itemContainer: HTMLElement, activity: SpotifyLikeActivity): void {
		const { title, cover } = activity;

		const divWrapper = itemContainer.appendChild(document.createElement("div"));
		divWrapper.classList.add("flex", "with-gap");
		divWrapper.translate = true;

		if (cover !== null) {
			const imgCover = divWrapper.appendChild(DOMBuilder.newImage(new URL(cover), `'${title}' cover`, { translate: false }));
			imgCover.classList.add("rounded", "spotify-cover");
		}

		const divInformation = divWrapper.appendChild(document.createElement("div"));
		divInformation.classList.add("flex", "column");
		divInformation.translate = true;

		const strongHeader = divInformation.appendChild(document.createElement("strong"));
		strongHeader.translate = false;
		strongHeader.textContent = title;

		const spanArtists = divInformation.appendChild(DOMBuilder.newDescription(activity.artists.join(", ")));
		spanArtists.translate = false;

		const aLink = divInformation.appendChild(DOMBuilder.newLink(new URL(activity.url), { text: "Listen on Spotify " }));
		aLink.classList.add("with-block-padding", "font-smaller-3");

		ActivityBuilder.newExternalIcon(aLink);
	}

	#renderSingle(itemContainer: HTMLElement, activity: SpotifyActivity): void {
		if (activity instanceof SpotifyLikeActivity) return this.#renderLike(itemContainer, activity);
	}

	render(itemContainer: HTMLElement, buffer: readonly SpotifyActivity[]): void {
		itemContainer.classList.add("flex", "column", "with-gap");

		itemContainer.appendChild(DOMBuilder.newTextbox("Added to music collection"));

		for (const activity of buffer) {
			this.#renderSingle(itemContainer, activity);
		}
	}
}
//#endregion
