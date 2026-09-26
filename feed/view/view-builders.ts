"use strict";

import "adaptive-extender/web";
import { type Platform } from "../models/configuration.js";
import { type Activity } from "../models/activity.js";
import { TextExpert } from "../services/text-expert.js";

const { round } = Math;
const { baseURI } = document;

//#region DOM builder
export interface LinkCreationOptions {
	text: string;
	disabled: boolean;
}

export interface MediaCreationOptions {
	loop: boolean;
	muted: boolean;
	controls: boolean;
	autoplay: boolean;
}

export interface AudioCreationOptions extends MediaCreationOptions {
}

export interface ImageCreationOptions {
	fetchPriority: "high" | "low" | "auto";
	loading: "eager" | "lazy";
}

export interface VideoCreationOptions extends MediaCreationOptions {
	playsInline: boolean;
}

export class DOMBuilder {
	static newText(text: string): Text {
		return document.createTextNode(text);
	}

	static newTextbox(text: string): HTMLElement {
		const spanDescription = document.createElement("span");
		spanDescription.innerText = text;

		return spanDescription;
	}

	static newDescription(text: string): HTMLElement {
		const spanDescription = document.createElement("span");
		spanDescription.classList.add("description");
		spanDescription.innerText = text;

		return spanDescription;
	}

	static newLink(url: Readonly<URL>): HTMLAnchorElement;
	static newLink(url: Readonly<URL>, options: Partial<LinkCreationOptions>): HTMLAnchorElement;
	static newLink(url: Readonly<URL>, options: Partial<LinkCreationOptions> = {}): HTMLAnchorElement {
		const { text } = options;
		const aLink = document.createElement("a");
		aLink.href = String(url);
		if (text !== undefined) aLink.innerText = text;
		aLink.target = "_blank";
		aLink.rel = "noopener noreferrer";
		aLink.inert = options.disabled ?? false;
		return aLink;
	}

	static newIcon(url: Readonly<URL>): HTMLElement {
		const icon = document.createElement("span");
		icon.classList.add("icon");
		icon.style.setProperty("--url", `url("${url}")`);

		return icon;
	}

	static newImage(url: Readonly<URL>, text: string): HTMLImageElement;
	static newImage(url: Readonly<URL>, text: string, options: Partial<ImageCreationOptions>): HTMLImageElement;
	static newImage(url: Readonly<URL>, text: string, options: Partial<ImageCreationOptions> = {}): HTMLImageElement {
		const img = document.createElement("img");
		img.src = String(url);
		img.alt = text;
		img.loading = options.loading ?? "lazy";
		if (options.fetchPriority !== undefined) img.fetchPriority = options.fetchPriority;

		return img;
	}

	static newVideo(url: Readonly<URL>): HTMLVideoElement;
	static newVideo(url: Readonly<URL>, options: Partial<VideoCreationOptions>): HTMLVideoElement;
	static newVideo(url: Readonly<URL>, options: Partial<VideoCreationOptions> = {}): HTMLVideoElement {
		const { loop, muted, controls, autoplay, playsInline } = options;
		const video = document.createElement("video");
		video.src = String(url);
		video.preload = "auto";
		if (loop !== undefined) video.loop = loop;
		if (muted !== undefined) video.muted = muted;
		if (controls !== undefined) video.controls = controls;
		if (autoplay !== undefined) video.autoplay = autoplay;
		if (playsInline !== undefined) video.playsInline = playsInline;
		return video;
	}

	static newAudio(url: Readonly<URL>): HTMLAudioElement;
	static newAudio(url: Readonly<URL>, options: Partial<AudioCreationOptions>): HTMLAudioElement;
	static newAudio(url: Readonly<URL>, options: Partial<AudioCreationOptions> = {}): HTMLAudioElement {
		const { loop, muted, controls, autoplay } = options;
		const audio = document.createElement("audio");
		audio.src = String(url);
		audio.preload = "auto";
		if (loop !== undefined) audio.loop = loop;
		if (muted !== undefined) audio.muted = muted;
		if (controls !== undefined) audio.controls = controls;
		if (autoplay !== undefined) audio.autoplay = autoplay;
		return audio;
	}

	static newCarousel(slides: readonly HTMLElement[]): HTMLElement {
		const divCarousel = document.createElement("div");
		divCarousel.classList.add("media-carousel");

		const divTrack = divCarousel.appendChild(document.createElement("div"));
		divTrack.classList.add("media-carousel-track");

		for (const slide of slides) {
			const divSlide = divTrack.appendChild(document.createElement("div"));
			divSlide.classList.add("media-carousel-slide", "depth");
			divSlide.appendChild(slide);
		}

		if (slides.length > 1) {
			const buttonPrevious = divCarousel.appendChild(document.createElement("button"));
			buttonPrevious.type = "button";
			buttonPrevious.hidden = true;
			buttonPrevious.classList.add("carousel-nav", "carousel-previous", "flex", "center");
			buttonPrevious.appendChild(DOMBuilder.newIcon(new URL("../icons/left.svg", baseURI)));
			buttonPrevious.addEventListener("click", (event) => {
				divTrack.scrollBy({ left: -divTrack.clientWidth, behavior: "smooth" });
			});

			const buttonNext = divCarousel.appendChild(document.createElement("button"));
			buttonNext.type = "button";
			buttonNext.classList.add("carousel-nav", "carousel-next", "flex", "center");
			buttonNext.appendChild(DOMBuilder.newIcon(new URL("../icons/right.svg", baseURI)));
			buttonNext.addEventListener("click", (event) => {
				divTrack.scrollBy({ left: divTrack.clientWidth, behavior: "smooth" });
			});

			const divDots = divCarousel.appendChild(document.createElement("div"));
			divDots.classList.add("carousel-dots", "flex", "with-gap", "small-gap");

			const dotElements: HTMLElement[] = [];
			for (let index = 0; index < slides.length; index++) {
				const spanDot = divDots.appendChild(document.createElement("span"));
				spanDot.classList.add("carousel-dot");
				if (index === 0) spanDot.classList.add("active");
				spanDot.addEventListener("click", (event) => {
					divTrack.scrollTo({ left: index * divTrack.clientWidth, behavior: "smooth" });
				});
				dotElements.push(spanDot);
			}

			divTrack.addEventListener("scroll", ((event) => {
				const current = round(divTrack.scrollLeft / divTrack.clientWidth);
				buttonPrevious.hidden = current === 0;
				buttonNext.hidden = current === slides.length - 1;
				for (let index = 0; index < dotElements.length; index++) {
					dotElements[index].classList.toggle("active", index === current);
				}
			}));
		}

		return divCarousel;
	}

	static print(itemContainer: HTMLElement, strings: TemplateStringsArray, ...values: any[]): void {
		strings.forEach((string, index) => {
			itemContainer.appendChild(DOMBuilder.newText(string));
			if (index >= values.length) return;
			const value = values[index];
			if (value instanceof Node) {
				itemContainer.appendChild(value);
				return;
			}
			itemContainer.appendChild(DOMBuilder.newText(String(value)));
		});
	}
}
//#endregion
//#region Activity builder
export class ActivityBuilder {
	static newIntro(itemContainer: HTMLElement, message: string): HTMLElement {
		const itemIntro = itemContainer.appendChild(DOMBuilder.newDescription(message));
		itemIntro.classList.add("intro", "font-smaller-2");

		return itemIntro;
	}

	static newWarning(itemContainer: HTMLElement): void {
		const span = itemContainer.appendChild(document.createElement("span"));
		span.classList.add("experimetnal-core", "warn", "font-smaller-2");

		span.appendChild(DOMBuilder.newText("This page operates on an "));
		span.appendChild(DOMBuilder.newLink(new URL("https://github.com/eccs0103/adaptive-extender/commits/main/"), { text: "experimental core" }));
		span.appendChild(DOMBuilder.newText(". Generated content may exhibit instability. Technical stabilization is in progress."));
	}

	static newSentinel(itemContainer: HTMLElement): HTMLElement {
		const itemSentinel = itemContainer.appendChild(document.createElement("div"));
		itemSentinel.classList.add("sentinel");

		return itemSentinel;
	}

	static newOutro(itemContainer: HTMLElement, itemChild: HTMLElement, message: string): HTMLElement {
		const itemOutro = DOMBuilder.newDescription(message);
		itemContainer.replaceChild(itemOutro, itemChild);
		itemOutro.classList.add("outro", "font-smaller-2");

		return itemOutro;
	}

	static newExternalIcon(itemContainer: HTMLElement): HTMLElement {
		const spanExternal = itemContainer.appendChild(DOMBuilder.newIcon(new URL("./icons/external.svg", new URL("../", baseURI))));
		spanExternal.classList.add("in-line");
		spanExternal.style.width = "fit-content";

		return spanExternal;
	}

	static newContainer(itemParent: HTMLElement, platforms: Map<string, Platform>, activity: Activity, observer: IntersectionObserver): HTMLElement {
		const itemContainer = itemParent.insertBefore(document.createElement("div"), itemParent.lastElementChild);
		itemContainer.classList.add("activity", "layer", "rounded", "with-padding", "with-gap", "awaiting-reveal");
		itemContainer.dataset["platform"] = activity.platform;
		observer.observe(itemContainer);

		const platform = platforms.get(activity.platform);
		if (platform !== undefined) {
			itemContainer.appendChild(DOMBuilder.newIcon(new URL(platform.icon, new URL("../", baseURI))));

			const h4Title = itemContainer.appendChild(document.createElement("h4"));
			h4Title.classList.add("platform");

			const buttonPlatformMenu = h4Title.appendChild(document.createElement("button"));
			buttonPlatformMenu.type = "button";
			buttonPlatformMenu.classList.add("platform-menu-trigger");
			buttonPlatformMenu.title = `${platform.name} options`;
			buttonPlatformMenu.dataset["platform"] = platform.name;
			buttonPlatformMenu.innerText = platform.name;
		}

		const timeElement = itemContainer.appendChild(document.createElement("time"));
		timeElement.dateTime = activity.timestamp.toISOString();
		timeElement.title = activity.timestamp.toLocaleString();
		timeElement.innerText = TextExpert.formatTime(activity.timestamp);
		timeElement.classList.add("activity-time", "font-smaller-2");

		const divContent = itemContainer.appendChild(document.createElement("div"));
		divContent.classList.add("content");

		return divContent;
	}
}
//#endregion
