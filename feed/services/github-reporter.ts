"use strict";

import "adaptive-extender/node";
import { URI } from "adaptive-extender/node";
import { GitHubIssueSearchResult } from "../models/github-issue.js";

//#region GitHub reporter
export class GitHubReporter {
	#repository: string;
	#token: string;

	constructor(repository: string, token: string) {
		this.#repository = repository;
		this.#token = token;
	}

	#headers(): Record<string, string> {
		return {
			["Authorization"]: `Bearer ${this.#token}`,
			["Accept"]: "application/vnd.github+json",
			["Content-Type"]: "application/json",
			["User-Agent"]: "Digital garden"
		};
	}

	async #hasOpenIssue(title: string): Promise<boolean> {
		const uri = new URI("https://api.github.com/search/issues");
		const query = `repo:${this.#repository} in:title is:issue state:open "${title}"`;
		uri.searchParams.set("q", query);
		const headers = this.#headers();
		const response = await fetch(uri.href, { headers });
		if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
		const data = await response.json();
		const result = GitHubIssueSearchResult.import(data, "github_issue_search_result");
		return result.totalCount > 0;
	}

	async #createIssue(title: string, body: string): Promise<void> {
		const uri = new URI(`https://api.github.com/repos/${this.#repository}/issues`);
		const method = "POST";
		const headers = this.#headers();
		const content = JSON.stringify({ title, body });
		const response = await fetch(uri.href, { method, headers, body: content });
		if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
	}

	async report(title: string, body: string): Promise<void> {
		if (await this.#hasOpenIssue(title)) return;
		await this.#createIssue(title, body);
	}
}
//#endregion
