"use strict";

import "adaptive-extender/web";
import { type ActivityRenderStrategy } from "../services/activity-registry.js";
import { GitHubActivity, GitHubCreateBranchActivity, GitHubCreateRepositoryActivity, GitHubCreateTagActivity, GitHubDeleteBranchActivity, GitHubDeleteTagActivity, GitHubForkActivity, GitHubIssueCloseActivity, GitHubIssueOpenActivity, GitHubPullRequestCloseActivity, GitHubPullRequestMergeActivity, GitHubPullRequestOpenActivity, GitHubPushActivity, GitHubReleaseActivity, GitHubWatchActivity } from "../models/activity.js";
import { TextExpert } from "../services/text-expert.js";
import { DOMBuilder } from "./view-builders.js";
import { GitHubSummaryExpert, type LinkerFunction, type PrinterFunction } from "../services/github-summary-expert.js";

//#region GitHub render strategy
export class GitHubRenderStrategy implements ActivityRenderStrategy<GitHubActivity> {
	#renderPush(itemContainer: HTMLElement, activity: GitHubPushActivity, count: number): void {
		const { url, sha, repository } = activity;
		itemContainer.appendChild(DOMBuilder.newText("Published "));
		itemContainer.appendChild(DOMBuilder.newLink(new URL(`${url}/commit/${sha}`), { text: `${count} update${TextExpert.getPluralSuffix(count)}` }));
		itemContainer.appendChild(DOMBuilder.newText(" to the source code of "));
		itemContainer.appendChild(DOMBuilder.newLink(new URL(url), { text: repository }));
		itemContainer.appendChild(DOMBuilder.newText("."));
	}

	#renderRelease(itemContainer: HTMLElement, activity: GitHubReleaseActivity): void {
		const { isPrerelease, title, url, repository, tagName } = activity;
		itemContainer.appendChild(DOMBuilder.newText(isPrerelease ? "Rolled out a test version " : "Shipped update "));
		itemContainer.appendChild(DOMBuilder.newLink(new URL(`${url}/releases/tag/${tagName}`), { text: title }));
		itemContainer.appendChild(DOMBuilder.newText(" for "));
		itemContainer.appendChild(DOMBuilder.newLink(new URL(url), { text: repository }));
		itemContainer.appendChild(DOMBuilder.newText("."));
	}

	#renderWatch(itemContainer: HTMLElement, activity: GitHubWatchActivity): void {
		const { repository, url } = activity;
		itemContainer.appendChild(DOMBuilder.newText("Discovered and bookmarked the "));
		itemContainer.appendChild(DOMBuilder.newLink(new URL(url), { text: repository }));
		itemContainer.appendChild(DOMBuilder.newText(" open-source project."));
	}

	#renderCreateTag(itemContainer: HTMLElement, activity: GitHubCreateTagActivity): void {
		const { name, url, repository } = activity;
		itemContainer.appendChild(DOMBuilder.newText("Marked a new milestone "));
		itemContainer.appendChild(DOMBuilder.newLink(new URL(`${url}/releases/tag/${name}`), { text: name }));
		itemContainer.appendChild(DOMBuilder.newText(" in "));
		itemContainer.appendChild(DOMBuilder.newLink(new URL(url), { text: repository }));
		itemContainer.appendChild(DOMBuilder.newText(" history."));
	}

	#renderCreateBranch(itemContainer: HTMLElement, activity: GitHubCreateBranchActivity): void {
		const { name, url, repository } = activity;
		itemContainer.appendChild(DOMBuilder.newText("Started working on a new feature \""));
		itemContainer.appendChild(DOMBuilder.newLink(new URL(`${url}/tree/${name}`), { text: name }));
		itemContainer.appendChild(DOMBuilder.newText("\" in "));
		itemContainer.appendChild(DOMBuilder.newLink(new URL(url), { text: repository }));
		itemContainer.appendChild(DOMBuilder.newText("."));
	}

	#renderCreateRepository(itemContainer: HTMLElement, activity: GitHubCreateRepositoryActivity): void {
		const { name, url } = activity;
		itemContainer.appendChild(DOMBuilder.newText("Initiated a new repository named "));
		itemContainer.appendChild(DOMBuilder.newLink(new URL(url), { text: name }));
		itemContainer.appendChild(DOMBuilder.newText("."));
	}

	#renderDeleteTag(itemContainer: HTMLElement, activity: GitHubDeleteTagActivity): void {
		const { name, repository, url } = activity;
		itemContainer.appendChild(DOMBuilder.newText("Unpublished version "));
		itemContainer.appendChild(DOMBuilder.newLink(new URL(`${url}/releases/tag/${name}`), { text: name, disabled: true }));
		itemContainer.appendChild(DOMBuilder.newText(" from "));
		itemContainer.appendChild(DOMBuilder.newLink(new URL(url), { text: repository }));
		itemContainer.appendChild(DOMBuilder.newText("."));
	}

	#renderDeleteBranch(itemContainer: HTMLElement, activity: GitHubDeleteBranchActivity): void {
		const { name, url, repository } = activity;
		itemContainer.appendChild(DOMBuilder.newText("Finished working on the \""));
		itemContainer.appendChild(DOMBuilder.newLink(new URL(`${url}/tree/${name}`), { text: name, disabled: true }));
		itemContainer.appendChild(DOMBuilder.newText("\" feature in "));
		itemContainer.appendChild(DOMBuilder.newLink(new URL(url), { text: repository }));
		itemContainer.appendChild(DOMBuilder.newText("."));
	}

	#renderFork(itemContainer: HTMLElement, activity: GitHubForkActivity): void {
		const { url, repository, urlFork, forkName } = activity;
		itemContainer.appendChild(DOMBuilder.newText("Forked "));
		itemContainer.appendChild(DOMBuilder.newLink(new URL(url), { text: repository }));
		itemContainer.appendChild(DOMBuilder.newText(" into "));
		itemContainer.appendChild(DOMBuilder.newLink(new URL(urlFork), { text: forkName }));
		itemContainer.appendChild(DOMBuilder.newText("."));
	}

	#renderIssueOpen(itemContainer: HTMLElement, activity: GitHubIssueOpenActivity): void {
		const { title, urlIssue, repository } = activity;
		itemContainer.appendChild(DOMBuilder.newText("Flagged a new issue "));
		itemContainer.appendChild(DOMBuilder.newLink(new URL(urlIssue), { text: title }));
		itemContainer.appendChild(DOMBuilder.newText(" in "));
		itemContainer.appendChild(DOMBuilder.newText(repository));
		itemContainer.appendChild(DOMBuilder.newText("."));
	}

	#renderIssueClose(itemContainer: HTMLElement, activity: GitHubIssueCloseActivity): void {
		const { title, urlIssue, repository } = activity;
		itemContainer.appendChild(DOMBuilder.newText("Resolved issue "));
		itemContainer.appendChild(DOMBuilder.newLink(new URL(urlIssue), { text: title, disabled: false }));
		itemContainer.appendChild(DOMBuilder.newText(" in "));
		itemContainer.appendChild(DOMBuilder.newText(repository));
		itemContainer.appendChild(DOMBuilder.newText("."));
	}

	#renderPullRequestOpen(itemContainer: HTMLElement, activity: GitHubPullRequestOpenActivity): void {
		const { title, urlRequest, repository } = activity;
		itemContainer.appendChild(DOMBuilder.newText("Opened pull request "));
		itemContainer.appendChild(DOMBuilder.newLink(new URL(urlRequest), { text: title }));
		itemContainer.appendChild(DOMBuilder.newText(" for "));
		itemContainer.appendChild(DOMBuilder.newText(repository));
		itemContainer.appendChild(DOMBuilder.newText("."));
	}

	#renderPullRequestMerge(itemContainer: HTMLElement, activity: GitHubPullRequestMergeActivity): void {
		const { title, urlRequest, repository } = activity;
		itemContainer.appendChild(DOMBuilder.newText("Merged pull request "));
		itemContainer.appendChild(DOMBuilder.newLink(new URL(urlRequest), { text: title, disabled: false }));
		itemContainer.appendChild(DOMBuilder.newText(" into "));
		itemContainer.appendChild(DOMBuilder.newText(repository));
		itemContainer.appendChild(DOMBuilder.newText("."));
	}

	#renderPullRequestClose(itemContainer: HTMLElement, activity: GitHubPullRequestCloseActivity): void {
		const { title, urlRequest, repository } = activity;
		itemContainer.appendChild(DOMBuilder.newText("Closed pull request "));
		itemContainer.appendChild(DOMBuilder.newLink(new URL(urlRequest), { text: title, disabled: false }));
		itemContainer.appendChild(DOMBuilder.newText(" for "));
		itemContainer.appendChild(DOMBuilder.newText(repository));
		itemContainer.appendChild(DOMBuilder.newText(" without merging."));
	}

	#renderSingle(itemContainer: HTMLElement, activity: GitHubActivity): void {
		if (activity instanceof GitHubPushActivity) return this.#renderPush(itemContainer, activity, 1);
		if (activity instanceof GitHubReleaseActivity) return this.#renderRelease(itemContainer, activity);
		if (activity instanceof GitHubWatchActivity) return this.#renderWatch(itemContainer, activity);
		if (activity instanceof GitHubCreateTagActivity) return this.#renderCreateTag(itemContainer, activity);
		if (activity instanceof GitHubCreateBranchActivity) return this.#renderCreateBranch(itemContainer, activity);
		if (activity instanceof GitHubCreateRepositoryActivity) return this.#renderCreateRepository(itemContainer, activity);
		if (activity instanceof GitHubDeleteBranchActivity) return this.#renderDeleteBranch(itemContainer, activity);
		if (activity instanceof GitHubDeleteTagActivity) return this.#renderDeleteTag(itemContainer, activity);
		if (activity instanceof GitHubForkActivity) return this.#renderFork(itemContainer, activity);
		if (activity instanceof GitHubIssueOpenActivity) return this.#renderIssueOpen(itemContainer, activity);
		if (activity instanceof GitHubIssueCloseActivity) return this.#renderIssueClose(itemContainer, activity);
		if (activity instanceof GitHubPullRequestOpenActivity) return this.#renderPullRequestOpen(itemContainer, activity);
		if (activity instanceof GitHubPullRequestMergeActivity) return this.#renderPullRequestMerge(itemContainer, activity);
		if (activity instanceof GitHubPullRequestCloseActivity) return this.#renderPullRequestClose(itemContainer, activity);
	}

	#renderCollection(itemContainer: HTMLElement, activities: readonly GitHubActivity[]): void {
		const details = itemContainer.appendChild(document.createElement("details"));
		details.classList.add("github-collection");
		details.open = true;

		const summary = details.appendChild(document.createElement("summary"));
		const expert = new GitHubSummaryExpert(activities);
		const linker: LinkerFunction = DOMBuilder.newLink;
		const context = expert.build(linker);
		const template = expert.choose();
		const printer: PrinterFunction = DOMBuilder.print.bind(null, summary);
		template(printer, context);

		const ulContent = details.appendChild(document.createElement("ul"));
		ulContent.classList.add("collection-content");

		for (let index = 0; index < activities.length; index++) {
			const activity = activities[index];
			const liItem = ulContent.appendChild(document.createElement("li"));

			if (!(activity instanceof GitHubPushActivity)) {
				this.#renderSingle(liItem, activity);
				continue;
			}

			let count = 1;
			while (index + 1 < activities.length) {
				const current = activities[index + 1];
				if (!(current instanceof GitHubPushActivity)) break;
				if (current.repository !== activity.repository) break;
				count++;
				index++;
			}
			this.#renderPush(liItem, activity, count);
		}
	}

	render(itemContainer: HTMLElement, buffer: readonly GitHubActivity[]): void {
		/* if (buffer.length > 1) */ return this.#renderCollection(itemContainer, buffer);
		// return this.#renderSingle(itemContainer, buffer[0]);
	}
}
//#endregion
