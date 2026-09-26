"use strict";

import "adaptive-extender/web";
import { type ActivityRenderStrategy } from "../services/activity-registry.js";
import { TelegramActivity, TelegramMediaPostActivity, TelegramTextPostActivity } from "../models/activity.js";
import { DOMBuilder, type ImageCreationOptions } from "./view-builders.js";

//#region Telegram render strategy
export class TelegramRenderStrategy implements ActivityRenderStrategy<TelegramActivity> {
	#urlProxy: URL;
	#isPageFirst: boolean = true;

	constructor(urlProxy: URL) {
		this.#urlProxy = urlProxy;
	}

	#buildUrlMedia(idMessage: number): URL {
		return new URL(String(idMessage), this.#urlProxy);
	}

	#renderText(itemContainer: HTMLElement, activity: TelegramTextPostActivity): void {
		const { text } = activity;

		const textbox = itemContainer.appendChild(DOMBuilder.newTextbox(text));
		textbox.classList.add("telegram-text");
	}

	#renderPhotoSlide(photo: TelegramMediaPostActivity, isFirst: boolean): HTMLElement {
		const { idMessage, description } = photo;
		const url = this.#buildUrlMedia(idMessage);

		const aLink = DOMBuilder.newLink(new URL(url));
		aLink.classList.add("telegram-photo-card");

		const options: Partial<ImageCreationOptions> = {};
		if (isFirst) options.fetchPriority = "high";
		if (isFirst) options.loading = "eager";
		const imgPhoto = aLink.appendChild(DOMBuilder.newImage(url, description ?? "Telegram photo", options));
		imgPhoto.classList.add("telegram-photo");

		if (description !== null) {
			const divOverlay = aLink.appendChild(document.createElement("div"));
			divOverlay.classList.add("caption-overlay", "font-smaller-3");
			divOverlay.appendChild(DOMBuilder.newTextbox(description));
		}

		return aLink;
	}

	#renderPhotoGroup(itemContainer: HTMLElement, photos: TelegramMediaPostActivity[]): void {
		const slides = photos.map((photo, index) => {
			const isSlideFirst = this.#isPageFirst && index === 0;
			if (isSlideFirst) this.#isPageFirst = false;
			return this.#renderPhotoSlide(photo, isSlideFirst);
		});
		itemContainer.appendChild(DOMBuilder.newCarousel(slides));
	}

	#renderAnimation(itemContainer: HTMLElement, activity: TelegramMediaPostActivity): void {
		const { idMessage, description } = activity;

		const figure = itemContainer.appendChild(document.createElement("figure"));
		figure.classList.add("telegram-media");

		const urlMedia = this.#buildUrlMedia(idMessage);
		const loop = true;
		const muted = true;
		const controls = false;
		const autoplay = true;
		const playsInline = true;
		const video = figure.appendChild(DOMBuilder.newVideo(urlMedia, { loop, muted, controls, autoplay, playsInline }));
		video.classList.add("telegram-gif");

		if (description !== null) {
			const itemDescription = figure.appendChild(DOMBuilder.newDescription(description));
			itemDescription.classList.add("telegram-caption");
		}
	}

	#renderVideo(itemContainer: HTMLElement, activity: TelegramMediaPostActivity): void {
		const { idMessage, description } = activity;

		const figure = itemContainer.appendChild(document.createElement("figure"));
		figure.classList.add("telegram-media");

		const urlMedia = this.#buildUrlMedia(idMessage);
		const controls = true;
		const video = figure.appendChild(DOMBuilder.newVideo(urlMedia, { controls }));
		video.classList.add("telegram-video");

		if (description !== null) {
			const itemDescription = figure.appendChild(DOMBuilder.newDescription(description));
			itemDescription.classList.add("telegram-caption");
		}
	}

	#renderAudio(itemContainer: HTMLElement, activity: TelegramMediaPostActivity): void {
		const { idMessage, description } = activity;

		const urlMedia = this.#buildUrlMedia(idMessage);
		const controls = true;
		const audio = itemContainer.appendChild(DOMBuilder.newAudio(urlMedia, { controls }));
		audio.classList.add("telegram-audio");

		if (description !== null) itemContainer.appendChild(DOMBuilder.newDescription(description));
	}

	#renderDocument(itemContainer: HTMLElement, activity: TelegramMediaPostActivity): void {
		const { idMessage, fileName, description } = activity;

		const urlMedia = this.#buildUrlMedia(idMessage);
		const aLink = itemContainer.appendChild(DOMBuilder.newLink(urlMedia));
		aLink.download = fileName;
		aLink.classList.add("telegram-document", "rounded", "with-padding", "flex", "with-gap", "alt-center", "depth");

		aLink.appendChild(DOMBuilder.newIcon(new URL("./icons/file.svg", new URL("../", document.baseURI))));

		aLink.appendChild(DOMBuilder.newTextbox(fileName));

		if (description !== null) itemContainer.appendChild(DOMBuilder.newDescription(description));
	}

	#renderMedia(itemContainer: HTMLElement, activity: TelegramMediaPostActivity): void {
		const { mediaType } = activity;

		if (mediaType === "animation") return this.#renderAnimation(itemContainer, activity);
		if (mediaType === "video") return this.#renderVideo(itemContainer, activity);
		if (mediaType === "audio") return this.#renderAudio(itemContainer, activity);
		if (mediaType === "document") return this.#renderDocument(itemContainer, activity);
	}

	#renderSingle(itemContainer: HTMLElement, activity: TelegramActivity): void {
		if (activity instanceof TelegramTextPostActivity) return this.#renderText(itemContainer, activity);
		if (activity instanceof TelegramMediaPostActivity) {
			if (activity.mediaType === "photo") return this.#renderPhotoGroup(itemContainer, [activity]);
			return this.#renderMedia(itemContainer, activity);
		}
	}

	#renderCollection(itemContainer: HTMLElement, activities: readonly TelegramActivity[]): void {
		itemContainer.classList.add("flex", "column", "with-gap");

		for (let index = 0; index < activities.length; index++) {
			const activity = activities[index];

			if (activity instanceof TelegramTextPostActivity) {
				this.#renderSingle(itemContainer, activity);
				continue;
			}

			if (!(activity instanceof TelegramMediaPostActivity) || activity.mediaType !== "photo") {
				this.#renderSingle(itemContainer, activity);
				continue;
			}

			if (activity instanceof TelegramMediaPostActivity) {
				const group: TelegramMediaPostActivity[] = [activity];

				while (index + 1 < activities.length) {
					const next = activities[index + 1];
					if (!(next instanceof TelegramMediaPostActivity) || next.mediaType !== "photo") break;
					group.unshift(next);
					index++;
				}
				group.sort((photo1, photo2) => photo1.idMessage - photo2.idMessage);
				this.#renderPhotoGroup(itemContainer, group);
			}
		}
	}

	render(itemContainer: HTMLElement, buffer: readonly TelegramActivity[]): void {
		if (buffer.length > 1) return this.#renderCollection(itemContainer, buffer);
		return this.#renderSingle(itemContainer, buffer[0]);
	}
}
//#endregion
