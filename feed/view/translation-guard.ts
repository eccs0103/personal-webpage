"use strict";

import "adaptive-extender/web";

//#region Translation guard
// Edge's built-in translator empties inline translate="no" elements inside translated sentences, although the HTML standard requires them to be left as-is; this puts the original text back.
export class TranslationGuard {
	static #selector: string = "[translate=\"no\"]";
	#texts: WeakMap<Element, string> = new WeakMap();

	#remember(element: Element): void {
		const texts = this.#texts;
		if (texts.has(element)) return;
		if (element.childElementCount > 0) return;
		const text = element.textContent;
		if (text === String.empty) return;
		texts.set(element, text);
	}

	#collect(node: Node): void {
		if (!(node instanceof Element)) return;
		const selector = TranslationGuard.#selector;
		if (node.matches(selector)) this.#remember(node);
		for (const element of node.querySelectorAll(selector)) this.#remember(element);
	}

	#repair(record: MutationRecord): void {
		record.addedNodes.forEach(node => this.#collect(node));
		const { target } = record;
		const parent = target instanceof Element ? target : target.parentElement;
		if (parent === null) return;
		const element = parent.closest(TranslationGuard.#selector);
		if (element === null) return;
		const text = this.#texts.get(element);
		if (text === undefined) return this.#remember(element);
		if (element.textContent === text) return;
		element.textContent = text;
	}

	observe(root: Element): void {
		this.#collect(root);
		const observer = new MutationObserver(records => records.forEach(record => this.#repair(record)));
		observer.observe(root, { childList: true, subtree: true, characterData: true });
	}
}
//#endregion
