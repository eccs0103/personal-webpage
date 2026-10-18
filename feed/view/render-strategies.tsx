"use strict";

import "adaptive-extender/web";
import { Version } from "adaptive-extender/web";
import { Fragment, isValidElement, type ReactElement, type ReactNode } from "react";
import { type ActivityRenderStrategy } from "../services/activity-registry.js";
import { GitHubActivity, GitHubCreateBranchActivity, GitHubCreateRepositoryActivity, GitHubCreateTagActivity, GitHubDeleteBranchActivity, GitHubDeleteTagActivity, GitHubForkActivity, GitHubIssueCloseActivity, GitHubIssueOpenActivity, GitHubPullRequestCloseActivity, GitHubPullRequestMergeActivity, GitHubPullRequestOpenActivity, GitHubPushActivity, GitHubReleaseActivity, GitHubWatchActivity, NpmActivity, NpmPublishActivity, SoundCloudActivity, SoundCloudLikeActivity, SoundCloudUploadActivity, SpotifyActivity, SpotifyLikeActivity, StackOverflowActivity, StackOverflowAnswerActivity, StackOverflowQuestionActivity, SteamAchievementActivity, SteamActivity, SteamScreenshotActivity, TelegramActivity, TelegramMediaPostActivity, TelegramTextPostActivity } from "../models/activity.js";
import { TextExpert } from "../services/text-expert.js";
import { GitHubSummaryExpert, type LinkerFunction, type PrinterFunction } from "../services/github-summary-expert.js";
import { Carousel, Description, ExternalIcon, ExternalLink, LazyImage, type LinkCreationOptions, Textbox } from "./view-builders.js";

//#region GitHub render strategy
export class GitHubRenderStrategy implements ActivityRenderStrategy<GitHubActivity> {
	#renderPush(activity: GitHubPushActivity, count: number): ReactElement {
		const { url, sha, repository } = activity;
		return <>{"Published "}<ExternalLink url={new URL(`${url}/commit/${sha}`)} text={`${count} update${TextExpert.getPluralSuffix(count)}`} />{" to the source code of "}<ExternalLink url={new URL(url)} text={repository} translate="no" />{"."}</>;
	}

	#renderRelease(activity: GitHubReleaseActivity): ReactElement {
		const { isPrerelease, title, url, repository, tagName } = activity;
		return <>{isPrerelease ? "Rolled out a test version " : "Shipped update "}<ExternalLink url={new URL(`${url}/releases/tag/${tagName}`)} text={title} />{" for "}<ExternalLink url={new URL(url)} text={repository} translate="no" />{"."}</>;
	}

	#renderWatch(activity: GitHubWatchActivity): ReactElement {
		const { repository, url } = activity;
		return <>{"Discovered and bookmarked the "}<ExternalLink url={new URL(url)} text={repository} translate="no" />{" open-source project."}</>;
	}

	#renderCreateTag(activity: GitHubCreateTagActivity): ReactElement {
		const { name, url, repository } = activity;
		return <>{"Marked a new milestone "}<ExternalLink url={new URL(`${url}/releases/tag/${name}`)} text={name} translate="no" />{" in "}<ExternalLink url={new URL(url)} text={repository} translate="no" />{" history."}</>;
	}

	#renderCreateBranch(activity: GitHubCreateBranchActivity): ReactElement {
		const { name, url, repository } = activity;
		return <>{"Started working on a new feature \""}<ExternalLink url={new URL(`${url}/tree/${name}`)} text={name} translate="no" />{"\" in "}<ExternalLink url={new URL(url)} text={repository} translate="no" />{"."}</>;
	}

	#renderCreateRepository(activity: GitHubCreateRepositoryActivity): ReactElement {
		const { name, url } = activity;
		return <>{"Initiated a new repository named "}<ExternalLink url={new URL(url)} text={name} translate="no" />{"."}</>;
	}

	#renderDeleteTag(activity: GitHubDeleteTagActivity): ReactElement {
		const { name, repository, url } = activity;
		return <>{"Unpublished version "}<ExternalLink url={new URL(`${url}/releases/tag/${name}`)} text={name} disabled translate="no" />{" from "}<ExternalLink url={new URL(url)} text={repository} translate="no" />{"."}</>;
	}

	#renderDeleteBranch(activity: GitHubDeleteBranchActivity): ReactElement {
		const { name, url, repository } = activity;
		return <>{"Finished working on the \""}<ExternalLink url={new URL(`${url}/tree/${name}`)} text={name} disabled translate="no" />{"\" feature in "}<ExternalLink url={new URL(url)} text={repository} translate="no" />{"."}</>;
	}

	#renderFork(activity: GitHubForkActivity): ReactElement {
		const { url, repository, urlFork, forkName } = activity;
		return <>{"Forked "}<ExternalLink url={new URL(url)} text={repository} translate="no" />{" into "}<ExternalLink url={new URL(urlFork)} text={forkName} translate="no" />{"."}</>;
	}

	#renderIssueOpen(activity: GitHubIssueOpenActivity): ReactElement {
		const { title, urlIssue, repository } = activity;
		return <>{"Flagged a new issue "}<ExternalLink url={new URL(urlIssue)} text={title} />{" in "}<Textbox text={repository} translate="no" />{"."}</>;
	}

	#renderIssueClose(activity: GitHubIssueCloseActivity): ReactElement {
		const { title, urlIssue, repository } = activity;
		return <>{"Resolved issue "}<ExternalLink url={new URL(urlIssue)} text={title} />{" in "}<Textbox text={repository} translate="no" />{"."}</>;
	}

	#renderPullRequestOpen(activity: GitHubPullRequestOpenActivity): ReactElement {
		const { title, urlRequest, repository } = activity;
		return <>{"Opened pull request "}<ExternalLink url={new URL(urlRequest)} text={title} />{" for "}<Textbox text={repository} translate="no" />{"."}</>;
	}

	#renderPullRequestMerge(activity: GitHubPullRequestMergeActivity): ReactElement {
		const { title, urlRequest, repository } = activity;
		return <>{"Merged pull request "}<ExternalLink url={new URL(urlRequest)} text={title} />{" into "}<Textbox text={repository} translate="no" />{"."}</>;
	}

	#renderPullRequestClose(activity: GitHubPullRequestCloseActivity): ReactElement {
		const { title, urlRequest, repository } = activity;
		return <>{"Closed pull request "}<ExternalLink url={new URL(urlRequest)} text={title} />{" for "}<Textbox text={repository} translate="no" />{" without merging."}</>;
	}

	#renderSingle(activity: GitHubActivity): ReactElement | null {
		if (activity instanceof GitHubPushActivity) return this.#renderPush(activity, 1);
		if (activity instanceof GitHubReleaseActivity) return this.#renderRelease(activity);
		if (activity instanceof GitHubWatchActivity) return this.#renderWatch(activity);
		if (activity instanceof GitHubCreateTagActivity) return this.#renderCreateTag(activity);
		if (activity instanceof GitHubCreateBranchActivity) return this.#renderCreateBranch(activity);
		if (activity instanceof GitHubCreateRepositoryActivity) return this.#renderCreateRepository(activity);
		if (activity instanceof GitHubDeleteBranchActivity) return this.#renderDeleteBranch(activity);
		if (activity instanceof GitHubDeleteTagActivity) return this.#renderDeleteTag(activity);
		if (activity instanceof GitHubForkActivity) return this.#renderFork(activity);
		if (activity instanceof GitHubIssueOpenActivity) return this.#renderIssueOpen(activity);
		if (activity instanceof GitHubIssueCloseActivity) return this.#renderIssueClose(activity);
		if (activity instanceof GitHubPullRequestOpenActivity) return this.#renderPullRequestOpen(activity);
		if (activity instanceof GitHubPullRequestMergeActivity) return this.#renderPullRequestMerge(activity);
		if (activity instanceof GitHubPullRequestCloseActivity) return this.#renderPullRequestClose(activity);
		return null;
	}

	#link(url: URL, options: Partial<LinkCreationOptions>): ReactElement {
		const { text, disabled, translate } = options;
		return <ExternalLink url={url} text={text} disabled={disabled} translate={translate === false ? "no" : "yes"} />;
	}

	#print(nodes: ReactNode[], strings: TemplateStringsArray, ...values: any[]): void {
		for (let index = 0; index < strings.length; index++) {
			nodes.push(<Fragment key={nodes.length}>{strings[index]}</Fragment>);
			if (index >= values.length) continue;
			const value = values[index];
			nodes.push(<Fragment key={nodes.length}>{isValidElement(value) ? value : String(value)}</Fragment>);
		}
	}

	#renderCollection(activities: readonly GitHubActivity[]): ReactElement {
		const expert = new GitHubSummaryExpert(activities);
		const linker: LinkerFunction = this.#link.bind(this);
		const context = expert.build(linker);
		const template = expert.choose();
		const nodes: ReactNode[] = [];
		const printer: PrinterFunction = this.#print.bind(this, nodes);
		template(printer, context);

		const items: ReactElement[] = [];
		for (let index = 0; index < activities.length; index++) {
			const activity = activities[index];

			if (!(activity instanceof GitHubPushActivity)) {
				items.push(<li key={index} translate="yes">{this.#renderSingle(activity)}</li>);
				continue;
			}

			const key = index;
			let count = 1;
			while (index + 1 < activities.length) {
				const current = activities[index + 1];
				if (!(current instanceof GitHubPushActivity)) break;
				if (current.repository !== activity.repository) break;
				count++;
				index++;
			}
			items.push(<li key={key} translate="yes">{this.#renderPush(activity, count)}</li>);
		}

		return (
			<div className="content" translate="yes">
				<details className="github-collection" open translate="yes">
					<summary translate="yes">{nodes}</summary>
					<ul className="collection-content" translate="yes">{items}</ul>
				</details>
			</div>
		);
	}

	render(buffer: readonly GitHubActivity[]): ReactElement {
		return this.#renderCollection(buffer);
	}
}
//#endregion
//#region Npm render strategy
export class NpmRenderStrategy implements ActivityRenderStrategy<NpmActivity> {
	static #getBump(version: Version): string {
		if (version.patch !== 0) return "patch";
		if (version.minor !== 0) return "minor";
		return "major";
	}

	#renderPackage(name: string, entries: readonly NpmPublishActivity[]): ReactElement {
		const sorted = entries.toSorted((left, right) => Version.compare(left.version, right.version));

		let description: string | null = null;
		const badges: ReactElement[] = [];
		for (const entry of sorted) {
			badges.push(<ExternalLink key={badges.length} url={new URL(entry.url)} text={entry.version.toString()} translate="no" className={`version-badge bump-${NpmRenderStrategy.#getBump(entry.version)}`} />);
			if (entry.description !== null) description = entry.description;
		}

		return (
			<li key={name} className="flex column with-gap small-gap" translate="yes">
				<div className="title-row flex wrap with-gap small-gap" translate="yes">
					<ExternalLink url={new URL(`https://www.npmjs.com/package/${name}`)} text={name} translate="no" className="package-name" />
					{badges}
				</div>
				{description !== null && <Description text={description} />}
			</li>
		);
	}

	#renderCollection(activities: readonly NpmPublishActivity[]): ReactElement {
		const groups: Map<string, NpmPublishActivity[]> = new Map();
		for (const activity of activities) {
			const group = groups.get(activity.package);
			if (group === undefined) groups.set(activity.package, [activity]);
			else group.push(activity);
		}

		const items: ReactElement[] = [];
		for (const [name, entries] of groups) {
			items.push(this.#renderPackage(name, entries));
		}

		return (
			<div className="content" translate="yes">
				<details className="npm-collection" open translate="yes">
					<summary translate="yes">{`Updated ${groups.size} package${TextExpert.getPluralSuffix(groups.size)}`}</summary>
					<ul className="collection-content" translate="yes">{items}</ul>
				</details>
			</div>
		);
	}

	render(buffer: readonly NpmActivity[]): ReactElement {
		const publishes: NpmPublishActivity[] = [];
		for (const activity of buffer) {
			if (activity instanceof NpmPublishActivity) publishes.push(activity);
		}

		return this.#renderCollection(publishes);
	}
}
//#endregion
//#region SoundCloud render strategy
export class SoundCloudRenderStrategy implements ActivityRenderStrategy<SoundCloudActivity> {
	static #patternUpsizeQuery: RegExp = /-large(?=\.\w+$)/;

	static #upsize(query: string): string {
		return query.replace(SoundCloudRenderStrategy.#patternUpsizeQuery, "-t500x500");
	}

	#renderCover(activity: SoundCloudActivity): ReactElement {
		const { title, artwork, avatar } = activity;
		const image = artwork ?? avatar;
		if (image === null) return <div className="depth rounded soundcloud-cover placeholder flex center" translate="no">♪</div>;
		return <LazyImage url={new URL(SoundCloudRenderStrategy.#upsize(image))} text={`'${title}' artwork`} translate="no" className="rounded soundcloud-cover" />;
	}

	#renderTrack(activity: SoundCloudActivity, message: string): ReactElement {
		const { title, publisher, url } = activity;
		return (
			<>
				<Textbox text={message} />
				<div className="flex with-gap" translate="yes">
					{this.#renderCover(activity)}
					<div className="flex column" translate="yes">
						<strong translate="no">{title}</strong>
						<Description text={publisher} translate="no" />
						<ExternalLink url={new URL(url)} text="Listen on SoundCloud " className="with-block-padding font-smaller-3"><ExternalIcon /></ExternalLink>
					</div>
				</div>
			</>
		);
	}

	#renderSingle(activity: SoundCloudActivity): ReactElement | null {
		if (activity instanceof SoundCloudUploadActivity) return this.#renderTrack(activity, "Published new track");
		if (activity instanceof SoundCloudLikeActivity) return this.#renderTrack(activity, "Published track, that has been added to music collection");
		return null;
	}

	render(buffer: readonly SoundCloudActivity[]): ReactElement {
		return <div className="content flex column with-gap" translate="yes">{buffer.map((activity, index) => <Fragment key={index}>{this.#renderSingle(activity)}</Fragment>)}</div>;
	}
}
//#endregion
//#region Spotify render strategy
export class SpotifyRenderStrategy implements ActivityRenderStrategy<SpotifyActivity> {
	#renderLike(activity: SpotifyLikeActivity): ReactElement {
		const { title, cover } = activity;
		return (
			<div className="flex with-gap" translate="yes">
				{cover !== null && <LazyImage url={new URL(cover)} text={`'${title}' cover`} translate="no" className="rounded spotify-cover" />}
				<div className="flex column" translate="yes">
					<strong translate="no">{title}</strong>
					<Description text={activity.artists.join(", ")} translate="no" />
					<ExternalLink url={new URL(activity.url)} text="Listen on Spotify " className="with-block-padding font-smaller-3"><ExternalIcon /></ExternalLink>
				</div>
			</div>
		);
	}

	#renderSingle(activity: SpotifyActivity): ReactElement | null {
		if (activity instanceof SpotifyLikeActivity) return this.#renderLike(activity);
		return null;
	}

	render(buffer: readonly SpotifyActivity[]): ReactElement {
		return (
			<div className="content flex column with-gap" translate="yes">
				<Textbox text="Added to music collection" />
				{buffer.map((activity, index) => <Fragment key={index}>{this.#renderSingle(activity)}</Fragment>)}
			</div>
		);
	}
}
//#endregion
//#region Stack Overflow render strategy
export class StackOverflowRenderStrategy implements ActivityRenderStrategy<StackOverflowActivity> {
	static #decorate(divBody: HTMLDivElement | null): void {
		if (divBody === null) return;
		for (const code of divBody.getElements(HTMLElement, "pre code")) code.classList.add("font-smaller-2");
		for (const code of divBody.getElements(HTMLElement, "code")) code.translate = false;
	}

	#renderScorePanel(isSuccessful: boolean, score: number, views: number): ReactElement {
		const classes = isSuccessful ? "score-panel flex column alt-center main-center status-success" : "score-panel flex column alt-center main-center";
		let viewsFormatted: string | null = null;
		if (!Number.isNaN(views)) viewsFormatted = new Intl.NumberFormat("en-US", { notation: "compact", compactDisplay: "short" }).format(views).toLowerCase();
		return (
			<div className={classes} translate="yes">
				<Textbox text={score.toString()} translate="no" className="value font-larger-4" />
				{viewsFormatted !== null && <Description text={`${viewsFormatted} views`} className="view-count font-smaller-3" />}
			</div>
		);
	}

	#renderTags(tags: readonly string[]): ReactElement | null {
		if (tags.length < 1) return null;
		return (
			<div className="tags-list flex with-gap" translate="no">
				{tags.map(tag => <ExternalLink key={tag} url={new URL(`https://ru.stackoverflow.com/tags/${tag}`)} text={tag} translate="no" className="tag depth rounded with-padding font-smaller-2" />)}
			</div>
		);
	}

	#renderSummary(isSuccessful: boolean, score: number, views: number, context: string, title: string, url: string, tags: readonly string[]): ReactElement {
		return (
			<summary className="flex with-gap" translate="yes">
				{this.#renderScorePanel(isSuccessful, score, views)}
				<div className="summary-content" translate="yes">
					{context}
					<ExternalLink url={new URL(url)} text={title} className="entry-title" />
					<Description text="Click to expand" className="expand-hint font-smaller-3" />
					{this.#renderTags(tags)}
				</div>
			</summary>
		);
	}

	#renderBody(htmlContent: string): ReactElement {
		return <div ref={StackOverflowRenderStrategy.#decorate} className="entry-body markup font-smaller-1" translate="yes" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
	}

	#renderQuestion(activity: StackOverflowQuestionActivity): ReactElement {
		const { title, score, tags, isAnswered, body, url, views } = activity;
		return (
			<details className="stack-overflow-entry" translate="yes">
				{this.#renderSummary(isAnswered, score, views, "Asked question: ", title, url, tags)}
				{this.#renderBody(body)}
			</details>
		);
	}

	#renderAnswer(activity: StackOverflowAnswerActivity): ReactElement {
		const { title, score, isAccepted, body, url } = activity;
		return (
			<details className="stack-overflow-entry" translate="yes">
				{this.#renderSummary(isAccepted, score, NaN, "Answer to: ", title, url, [])}
				{this.#renderBody(body)}
			</details>
		);
	}

	#renderSingle(activity: StackOverflowActivity): ReactElement | null {
		if (activity instanceof StackOverflowQuestionActivity) return this.#renderQuestion(activity);
		if (activity instanceof StackOverflowAnswerActivity) return this.#renderAnswer(activity);
		return null;
	}

	render(buffer: readonly StackOverflowActivity[]): ReactElement {
		return <div className="content flex column with-gap" translate="yes">{buffer.map((activity, index) => <Fragment key={index}>{this.#renderSingle(activity)}</Fragment>)}</div>;
	}
}
//#endregion
//#region Steam render strategy
export class SteamRenderStrategy implements ActivityRenderStrategy<SteamActivity> {
	#renderAchievement(activity: SteamAchievementActivity): ReactElement {
		const { game, webpage, title, description, url, icon } = activity;
		return (
			<div className="flex with-gap alt-center" translate="yes">
				{icon !== null && <LazyImage url={new URL(icon)} text={`'${title}' icon`} translate="no" className="rounded steam-icon" />}
				<div className="flex column" translate="yes">
					<span translate="yes">{"Earned \""}<ExternalLink url={new URL(url)} text={title} translate="no" />{"\" in "}<ExternalLink url={new URL(webpage)} text={game} translate="no" /></span>
					{description !== null && !String.isWhitespace(description) && <Description text={description} />}
				</div>
			</div>
		);
	}

	#renderScreenshotSlide(activity: SteamScreenshotActivity): ReactElement {
		const { title, url, game } = activity;
		return (
			<ExternalLink url={new URL(url)} className="screenshot-card">
				<LazyImage url={new URL(url)} text={title ?? `Screenshot from ${game}`} className="steam-screenshot" />
				{title !== null && <div className="caption-overlay font-smaller-3" translate="yes"><Textbox text={title} /></div>}
			</ExternalLink>
		);
	}

	#renderGallery(screenshots: readonly SteamScreenshotActivity[]): ReactElement {
		const { game, webpage } = screenshots[0];
		const count = screenshots.length;
		const slides = screenshots.map(screenshot => this.#renderScreenshotSlide(screenshot));
		return (
			<div className="steam-group flex column with-gap" translate="yes">
				<div className="group-header" translate="yes">{"Uploaded "}<Textbox text={`${TextExpert.getIndefiniteCardinal(count)} screenshot${TextExpert.getPluralSuffix(count)}`} />{" from "}<ExternalLink url={new URL(webpage)} text={game} translate="no" /></div>
				<Carousel slides={slides} />
			</div>
		);
	}

	#renderSingle(activity: SteamActivity): ReactElement | null {
		if (activity instanceof SteamAchievementActivity) return this.#renderAchievement(activity);
		if (activity instanceof SteamScreenshotActivity) return this.#renderGallery([activity]);
		return null;
	}

	#renderCollection(activities: readonly SteamActivity[]): ReactElement {
		const items: ReactElement[] = [];
		for (let index = 0; index < activities.length; index++) {
			const activity = activities[index];

			if (activity instanceof SteamAchievementActivity) {
				items.push(<Fragment key={index}>{this.#renderAchievement(activity)}</Fragment>);
				continue;
			}

			if (activity instanceof SteamScreenshotActivity) {
				const key = index;
				const group: SteamScreenshotActivity[] = [activity];

				while (index + 1 < activities.length) {
					const next = activities[index + 1];
					if (!(next instanceof SteamScreenshotActivity)) break;
					if (next.game !== activity.game) break;

					group.unshift(next);
					index++;
				}
				items.push(<Fragment key={key}>{this.#renderGallery(group)}</Fragment>);
			}
		}
		return <div className="content flex column with-gap" translate="yes">{items}</div>;
	}

	render(buffer: readonly SteamActivity[]): ReactElement {
		if (buffer.length > 1) return this.#renderCollection(buffer);
		return <div className="content" translate="yes">{this.#renderSingle(buffer[0])}</div>;
	}
}
//#endregion
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

	#renderText(activity: TelegramTextPostActivity): ReactElement {
		return <Textbox text={activity.text} className="telegram-text" />;
	}

	#renderPhotoSlide(photo: TelegramMediaPostActivity, isFirst: boolean): ReactElement {
		const { idMessage, description } = photo;
		const url = this.#buildUrlMedia(idMessage);
		return (
			<ExternalLink url={new URL(url)} className="telegram-photo-card">
				<LazyImage url={url} text={description ?? "Telegram photo"} fetchPriority={isFirst ? "high" : undefined} loading={isFirst ? "eager" : "lazy"} className="telegram-photo" />
				{description !== null && <div className="caption-overlay font-smaller-3" translate="yes"><Textbox text={description} /></div>}
			</ExternalLink>
		);
	}

	#renderPhotoGroup(photos: TelegramMediaPostActivity[]): ReactElement {
		const slides = photos.map((photo, index) => {
			const isSlideFirst = this.#isPageFirst && index === 0;
			if (isSlideFirst) this.#isPageFirst = false;
			return this.#renderPhotoSlide(photo, isSlideFirst);
		});
		return <Carousel slides={slides} />;
	}

	#renderAnimation(activity: TelegramMediaPostActivity): ReactElement {
		const { idMessage, description } = activity;
		const urlMedia = this.#buildUrlMedia(idMessage);
		return (
			<figure className="telegram-media" translate="yes">
				<video src={String(urlMedia)} preload="auto" translate="no" loop muted autoPlay playsInline className="telegram-gif" />
				{description !== null && <Description text={description} className="telegram-caption" />}
			</figure>
		);
	}

	#renderVideo(activity: TelegramMediaPostActivity): ReactElement {
		const { idMessage, description } = activity;
		const urlMedia = this.#buildUrlMedia(idMessage);
		return (
			<figure className="telegram-media" translate="yes">
				<video src={String(urlMedia)} preload="auto" translate="no" controls className="telegram-video" />
				{description !== null && <Description text={description} className="telegram-caption" />}
			</figure>
		);
	}

	#renderAudio(activity: TelegramMediaPostActivity): ReactElement {
		const { idMessage, description } = activity;
		const urlMedia = this.#buildUrlMedia(idMessage);
		return (
			<>
				<audio src={String(urlMedia)} preload="auto" translate="no" controls className="telegram-audio" />
				{description !== null && <Description text={description} />}
			</>
		);
	}

	#renderDocument(activity: TelegramMediaPostActivity): ReactElement {
		const { idMessage, fileName, description } = activity;
		const urlMedia = this.#buildUrlMedia(idMessage);
		return (
			<>
				<ExternalLink url={urlMedia} download={fileName} className="telegram-document rounded with-padding flex with-gap alt-center depth">
					<span className="icon" translate="no" />
					<Textbox text={fileName} translate="no" />
				</ExternalLink>
				{description !== null && <Description text={description} />}
			</>
		);
	}

	#renderMedia(activity: TelegramMediaPostActivity): ReactElement | null {
		const { mediaType } = activity;

		if (mediaType === "animation") return this.#renderAnimation(activity);
		if (mediaType === "video") return this.#renderVideo(activity);
		if (mediaType === "audio") return this.#renderAudio(activity);
		if (mediaType === "document") return this.#renderDocument(activity);
		return null;
	}

	#renderSingle(activity: TelegramActivity): ReactElement | null {
		if (activity instanceof TelegramTextPostActivity) return this.#renderText(activity);
		if (activity instanceof TelegramMediaPostActivity) {
			if (activity.mediaType === "photo") return this.#renderPhotoGroup([activity]);
			return this.#renderMedia(activity);
		}
		return null;
	}

	#renderCollection(activities: readonly TelegramActivity[]): ReactElement {
		const items: ReactElement[] = [];
		for (let index = 0; index < activities.length; index++) {
			const activity = activities[index];

			if (activity instanceof TelegramTextPostActivity) {
				items.push(<Fragment key={index}>{this.#renderSingle(activity)}</Fragment>);
				continue;
			}

			if (!(activity instanceof TelegramMediaPostActivity) || activity.mediaType !== "photo") {
				items.push(<Fragment key={index}>{this.#renderSingle(activity)}</Fragment>);
				continue;
			}

			if (activity instanceof TelegramMediaPostActivity) {
				const key = index;
				const group: TelegramMediaPostActivity[] = [activity];

				while (index + 1 < activities.length) {
					const next = activities[index + 1];
					if (!(next instanceof TelegramMediaPostActivity) || next.mediaType !== "photo") break;
					group.unshift(next);
					index++;
				}
				group.sort((photo1, photo2) => photo1.idMessage - photo2.idMessage);
				items.push(<Fragment key={key}>{this.#renderPhotoGroup(group)}</Fragment>);
			}
		}
		return <div className="content flex column with-gap" translate="yes">{items}</div>;
	}

	render(buffer: readonly TelegramActivity[]): ReactElement {
		if (buffer.length > 1) return this.#renderCollection(buffer);
		return <div className="content" translate="yes">{this.#renderSingle(buffer[0])}</div>;
	}
}
//#endregion
