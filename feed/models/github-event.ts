"use strict";

import "adaptive-extender/core";
import { Deferred, Descendant, Field, Model, Nullable, Optional, type Constructor } from "adaptive-extender/core";

//#region GitHub event actor
export interface GitHubEventActorScheme {
	id: number;
	login: string;
	display_login?: string;
	gravatar_id: string;
	url: string;
	avatar_url: string;
}

export class GitHubEventActor extends Model {
	@Field(Number, { name: "id" })
	id: number;

	@Field(String, { name: "login" })
	login: string;

	@Field(Optional.Of(String), { name: "display_login" })
	displayLogin?: string;

	@Field(String, { name: "gravatar_id" })
	gravatarId: string;

	@Field(String, { name: "url" })
	url: string;

	@Field(String, { name: "avatar_url" })
	urlAvatar: string;
}
//#endregion

//#region GitHub event repository
export interface GitHubEventRepositoryScheme {
	id: number;
	name: string;
	url: string;
}

export class GitHubEventRepository extends Model {
	@Field(Number, { name: "id" })
	id: number;

	@Field(String, { name: "name" })
	name: string;

	@Field(String, { name: "url" })
	url: string;
}
//#endregion

//#region GitHub event release
export interface GitHubEventReleaseScheme {
	html_url: string;
	tag_name: string;
	name: string | null;
	draft: boolean;
	prerelease: boolean;
	published_at: string;
	body: string | null;
}

export class GitHubEventRelease extends Model {
	@Field(String, { name: "html_url" })
	htmlUrl: string;

	@Field(String, { name: "tag_name" })
	tagName: string;

	@Field(Nullable.Of(String), { name: "name" })
	name: string | null;

	@Field(Boolean, { name: "draft" })
	draft: boolean;

	@Field(Boolean, { name: "prerelease" })
	prerelease: boolean;

	@Field(String, { name: "published_at" })
	publishedAt: string;

	@Field(Nullable.Of(String), { name: "body" })
	body: string | null;
}
//#endregion

//#region GitHub push event payload
export interface GitHubPushEventPayloadDiscriminator {
	"PushEvent": any;
}

export interface GitHubPushEventPayloadScheme {
	$type: keyof GitHubPushEventPayloadDiscriminator;
	push_id: number;
	ref: string;
	head: string;
	before: string;
}

export class GitHubPushEventPayload extends Model {
	@Field(Number, { name: "push_id" })
	pushId: number;

	@Field(String, { name: "ref" })
	ref: string;

	@Field(String, { name: "head" })
	head: string;

	@Field(String, { name: "before" })
	before: string;
}
//#endregion

//#region GitHub release event payload
export interface GitHubReleaseEventPayloadDiscriminator {
	"ReleaseEvent": any;
}

export interface GitHubReleaseEventPayloadScheme {
	$type: keyof GitHubReleaseEventPayloadDiscriminator;
	action: string;
	release: GitHubEventReleaseScheme;
}

export class GitHubReleaseEventPayload extends Model {
	@Field(String, { name: "action" })
	action: string;

	@Field(GitHubEventRelease, { name: "release" })
	release: GitHubEventRelease;
}
//#endregion

//#region GitHub watch event payload
export interface GitHubWatchEventPayloadDiscriminator {
	"WatchEvent": any;
}

export interface GitHubWatchEventPayloadScheme {
	$type: keyof GitHubWatchEventPayloadDiscriminator;
	action: string;
}

export class GitHubWatchEventPayload extends Model {
	@Field(String, { name: "action" })
	action: string;
}
//#endregion

//#region GitHub create event payload
export interface GitHubCreateEventPayloadDiscriminator {
	"CreateEvent": any;
}

export interface GitHubCreateEventPayloadScheme {
	$type: keyof GitHubCreateEventPayloadDiscriminator;
	ref: string | null;
	ref_type: string;
	master_branch: string;
	description: string | null;
	pusher_type: string;
}

export class GitHubCreateEventPayload extends Model {
	@Field(Nullable.Of(String), { name: "ref" })
	ref: string | null;

	@Field(String, { name: "ref_type" })
	refType: string;

	@Field(String, { name: "master_branch" })
	masterBranch: string;

	@Field(Nullable.Of(String), { name: "description" })
	description: string | null;

	@Field(String, { name: "pusher_type" })
	pusherType: string;
}
//#endregion

//#region GitHub delete event payload
export interface GitHubDeleteEventPayloadDiscriminator {
	"DeleteEvent": any;
}

export interface GitHubDeleteEventPayloadScheme {
	$type: keyof GitHubDeleteEventPayloadDiscriminator;
	ref: string;
	ref_type: string;
	pusher_type: string;
}

export class GitHubDeleteEventPayload extends Model {
	@Field(String, { name: "ref" })
	ref: string;

	@Field(String, { name: "ref_type" })
	refType: string;

	@Field(String, { name: "pusher_type" })
	pusherType: string;
}
//#endregion

//#region GitHub event issue
export interface GitHubEventIssueScheme {
	html_url: string;
	number: number;
	title: string;
}

export class GitHubEventIssue extends Model {
	@Field(String, { name: "html_url" })
	htmlUrl: string;

	@Field(Number, { name: "number" })
	number: number;

	@Field(String, { name: "title" })
	title: string;
}
//#endregion

//#region GitHub event forkee
export interface GitHubEventForkeeScheme {
	html_url: string;
	full_name: string;
}

export class GitHubEventForkee extends Model {
	@Field(String, { name: "html_url" })
	htmlUrl: string;

	@Field(String, { name: "full_name" })
	fullName: string;
}
//#endregion

//#region GitHub event pull request
export interface GitHubEventPullRequestScheme {
	html_url: string;
	number: number;
	title: string;
	merged: boolean;
}

export class GitHubEventPullRequest extends Model {
	@Field(String, { name: "html_url" })
	htmlUrl: string;

	@Field(Number, { name: "number" })
	number: number;

	@Field(String, { name: "title" })
	title: string;

	@Field(Boolean, { name: "merged" })
	merged: boolean;
}
//#endregion

//#region GitHub issues event payload
export interface GitHubIssuesEventPayloadDiscriminator {
	"IssuesEvent": any;
}

export interface GitHubIssuesEventPayloadScheme {
	$type: keyof GitHubIssuesEventPayloadDiscriminator;
	action: string;
	issue: GitHubEventIssueScheme;
}

export class GitHubIssuesEventPayload extends Model {
	@Field(String, { name: "action" })
	action: string;

	@Field(GitHubEventIssue, { name: "issue" })
	issue: GitHubEventIssue;
}
//#endregion

//#region GitHub fork event payload
export interface GitHubForkEventPayloadDiscriminator {
	"ForkEvent": any;
}

export interface GitHubForkEventPayloadScheme {
	$type: keyof GitHubForkEventPayloadDiscriminator;
	forkee: GitHubEventForkeeScheme;
}

export class GitHubForkEventPayload extends Model {
	@Field(GitHubEventForkee, { name: "forkee" })
	forkee: GitHubEventForkee;
}
//#endregion

//#region GitHub pull request event payload
export interface GitHubPullRequestEventPayloadDiscriminator {
	"PullRequestEvent": any;
}

export interface GitHubPullRequestEventPayloadScheme {
	$type: keyof GitHubPullRequestEventPayloadDiscriminator;
	action: string;
	pull_request: GitHubEventPullRequestScheme;
}

export class GitHubPullRequestEventPayload extends Model {
	@Field(String, { name: "action" })
	action: string;

	@Field(GitHubEventPullRequest, { name: "pull_request" })
	pullRequest: GitHubEventPullRequest;
}
//#endregion

//#region GitHub event payload
export interface GitHubEventPayloadDiscriminator extends GitHubPushEventPayloadDiscriminator, GitHubReleaseEventPayloadDiscriminator, GitHubWatchEventPayloadDiscriminator, GitHubCreateEventPayloadDiscriminator, GitHubDeleteEventPayloadDiscriminator, GitHubIssuesEventPayloadDiscriminator, GitHubForkEventPayloadDiscriminator, GitHubPullRequestEventPayloadDiscriminator {
}

export interface GitHubEventPayloadScheme {
	$type: keyof GitHubEventPayloadDiscriminator;
}

@Descendant(Deferred(_ => GitHubPushEventPayload), { discriminator: "PushEvent" })
@Descendant(Deferred(_ => GitHubReleaseEventPayload), { discriminator: "ReleaseEvent" })
@Descendant(Deferred(_ => GitHubWatchEventPayload), { discriminator: "WatchEvent" })
@Descendant(Deferred(_ => GitHubCreateEventPayload), { discriminator: "CreateEvent" })
@Descendant(Deferred(_ => GitHubDeleteEventPayload), { discriminator: "DeleteEvent" })
@Descendant(Deferred(_ => GitHubIssuesEventPayload), { discriminator: "IssuesEvent" })
@Descendant(Deferred(_ => GitHubForkEventPayload), { discriminator: "ForkEvent" })
@Descendant(Deferred(_ => GitHubPullRequestEventPayload), { discriminator: "PullRequestEvent" })
export abstract class GitHubEventPayload extends Model {
}
//#endregion

//#region GitHub event
export interface GitHubEventDiscriminator extends GitHubEventPayloadDiscriminator {
}

export interface GitHubEventScheme {
	id: string;
	type: keyof GitHubEventDiscriminator;
	actor: GitHubEventActorScheme;
	repo: GitHubEventRepositoryScheme;
	public: boolean;
	created_at: string;
	payload: GitHubEventPayloadScheme;
}

export class GitHubEvent extends Model {
	@Field(String, { name: "id" })
	id: string;

	@Field(String, { name: "type" })
	type: string;

	@Field(GitHubEventActor, { name: "actor" })
	actor: GitHubEventActor;

	@Field(GitHubEventRepository, { name: "repo" })
	repo: GitHubEventRepository;

	@Field(Boolean, { name: "public" })
	public: boolean;

	@Field(Date, { name: "created_at" })
	createdAt: Date;

	@Field(GitHubEventPayload, { name: "payload" })
	payload: GitHubEventPayload;

	static import<I extends Model>(this: Constructor<I>, source: any, name: string): I {
		if (source && typeof source === "object" && "payload" in source && "type" in source) {
			source.payload.$type = source.type;
		}

		return super.import<I>(source, name);
	}
}
//#endregion
