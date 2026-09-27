"use strict";

import "adaptive-extender/web";

//#region Spotlight
export class Spotlight {
	static #releases: readonly string[] = ["pointerdown", "wheel", "touchmove", "keydown"];
	#element: HTMLElement;
	#controller: AbortController = new AbortController();

	constructor(element: HTMLElement) {
		this.#element = element;
	}

	#release(): void {
		this.#controller.abort();
		this.#element.classList.remove("spotlight");
	}

	#highlight(): void {
		const element = this.#element;
		const { signal } = this.#controller;
		element.addEventListener("blur", this.#release.bind(this), { signal });
		for (const type of Spotlight.#releases) window.addEventListener(type, this.#release.bind(this), { signal, capture: true, passive: true });
		element.focus({ preventScroll: true });
		element.classList.add("spotlight");
	}

	#observe([entry]: IntersectionObserverEntry[], observer: IntersectionObserver): void {
		if (!entry.isIntersecting) return;
		observer.disconnect();
		this.#highlight();
	}

	focus(): void {
		const element = this.#element;
		new IntersectionObserver(this.#observe.bind(this), { threshold: 1 }).observe(element);
		element.scrollIntoView({ behavior: "smooth", block: "center" });
	}
}
//#endregion
