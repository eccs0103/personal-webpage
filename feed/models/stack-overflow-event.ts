"use strict";

import "adaptive-extender/core";
import { Any, Field, Model, Optional, URI } from "adaptive-extender/core";

export interface StackOverflowOwnerScheme {
	reputation?: number;
	user_id?: number;
	user_type: string;
	display_name?: string;
	link?: string;
	profile_image?: string;
}

export class StackOverflowOwner extends Model {
	@Field(Optional.Of(Number), { name: "reputation" })
	reputation: number | undefined;

	@Field(Optional.Of(Number), { name: "user_id" })
	userId: number | undefined;

	@Field(String, { name: "user_type" })
	userType: string;

	@Field(Optional.Of(String), { name: "display_name" })
	displayName: string | undefined;

	@Field(Optional.Of(URI), { name: "link" })
	link: URI | undefined;

	@Field(Optional.Of(URI), { name: "profile_image" })
	profileImage: URI | undefined;
}

export interface StackOverflowQuestionScheme {
	tags: string[];
	owner: StackOverflowOwnerScheme;
	score: number;
	creation_date: number;
	question_id: number;
	link: string;
	title: string;
	view_count: number;
	answer_count: number;
	is_answered: boolean;
	body: string;
}

export class StackOverflowQuestion extends Model {
	@Field(Array.Of(String), { name: "tags" })
	tags: string[];

	@Field(StackOverflowOwner, { name: "owner" })
	owner: StackOverflowOwner;

	@Field(Number, { name: "score" })
	score: number;

	@Field(Date.AsUnixSeconds, { name: "creation_date" })
	creationDate: Date;

	@Field(Number, { name: "question_id" })
	questionId: number;

	@Field(URI, { name: "link" })
	link: URI;

	@Field(String, { name: "title" })
	title: string;

	@Field(Number, { name: "view_count" })
	viewCount: number;

	@Field(Number, { name: "answer_count" })
	answerCount: number;

	@Field(Boolean, { name: "is_answered" })
	isAnswered: boolean;

	@Field(String, { name: "body" })
	body: string;
}

// title and body arrive only because StackOverflowWalker asks for them through its custom API filter
export interface StackOverflowAnswerScheme {
	owner: StackOverflowOwnerScheme;
	is_accepted: boolean;
	score: number;
	creation_date: number;
	answer_id: number;
	question_id: number;
	link: string;
	title: string;
	body: string;
}

export class StackOverflowAnswer extends Model {
	@Field(StackOverflowOwner, { name: "owner" })
	owner: StackOverflowOwner;

	@Field(Boolean, { name: "is_accepted" })
	isAccepted: boolean;

	@Field(Number, { name: "score" })
	score: number;

	@Field(Date.AsUnixSeconds, { name: "creation_date" })
	creationDate: Date;

	@Field(Number, { name: "answer_id" })
	answerId: number;

	@Field(Number, { name: "question_id" })
	questionId: number;

	@Field(URI, { name: "link" })
	link: URI;

	@Field(String, { name: "title" })
	title: string;

	@Field(String, { name: "body" })
	body: string;
}

export interface StackExchangeResponseScheme<T = any> {
	items: T[];
	has_more: boolean;
	quota_remaining: number;
	quota_max: number;
	backoff?: number;
}

export class StackExchangeResponse extends Model {
	@Field(Array.Of(Any), { name: "items" })
	items: any[];

	@Field(Boolean, { name: "has_more" })
	hasMore: boolean;

	@Field(Number, { name: "quota_remaining" })
	quotaRemaining: number;

	@Field(Number, { name: "quota_max" })
	quotaMax: number;

	@Field(Optional.Of(Number), { name: "backoff" })
	backoff: number | undefined;
}
