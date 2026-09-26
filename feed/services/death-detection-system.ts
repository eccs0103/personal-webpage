"use strict";

import "adaptive-extender/node";
import { type AIAgent } from "./ai-agent.js";
import { type SearchProvider } from "./search-provider.js";

//#region Death detection system
export class DeathDetectionSystem {
	#agent: AIAgent;
	#search: SearchProvider;
	#target: string;

	constructor(agent: AIAgent, search: SearchProvider, target: string) {
		this.#agent = agent;
		this.#search = search;
		this.#target = target;
	}

	async runDiagnostics(): Promise<boolean> {
		const target = this.#target;
		try {
			const query = `"${target}" obituary death funeral news`;
			const context = await this.#search.search(query);
			const isDead = await this.#agent.askBoolean(`Is there explicit confirmation in the text that "${target}" has died?`, context);
			return isDead;
		} catch (reason) {
			const error = Error.from(reason);
			console.error(`Failed run death diagnostics cause of:\n${error}`);
			return false;
		}
	}
}
//#endregion
