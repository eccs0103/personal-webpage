"use strict";

import "adaptive-extender/node";
import { SearchResponse } from "../models/search-response.js";

//#region Search provider
export class SearchProvider {
	#apiKey: string;
	#idSearch: string;

	constructor(apiKey: string, idSearch: string) {
		this.#apiKey = apiKey;
		this.#idSearch = idSearch;
	}

	async search(query: string): Promise<string> {
		const url = new URL(`https://www.googleapis.com/customsearch/v1?key=${this.#apiKey}&cx=${this.#idSearch}&q=${encodeURIComponent(query)}`);
		const response = await fetch(url);
		if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
		const object = await response.json();
		const { items } = SearchResponse.import(object, "search_response");
		const snippets = items.map(item => `Title: ${item.title}\nSnippet: ${item.snippet}`);
		return snippets.join("\n---\n");
	}
}
//#endregion
