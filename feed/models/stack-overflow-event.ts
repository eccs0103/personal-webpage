"use strict";

import "adaptive-extender/core";
import { Any, Field, Model, Optional, URI } from "adaptive-extender/core";

//#region Stack overflow owner
export interface StackOverflowOwnerScheme {
	reputation?: number; /** Репутация пользователя. Осутствует, если user_type = "does_not_exist" */
	user_id?: number; /** ID пользователя. */
	user_type: string; // "registered" | "unregistered" | "does_not_exist"; /** Тип аккаунта. Влияет на наличие других полей. */
	display_name?: string; /** Имя, отображаемое в профиле. */
	link?: string; /** Ссылка на профиль на сайте. */
	profile_image?: string; /** Ссылка на аватар. */
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
//#endregion

//#region Stack overflow question
/**
 * Объект Вопроса (Question).
 * Документация: https://api.stackexchange.com/docs/types/question
 */
export interface StackOverflowQuestionScheme {
	tags: string[]; /** Массив тегов. */
	owner: StackOverflowOwnerScheme;
	score: number; /** Суммарный рейтинг вопроса. */
	creation_date: number; /** Дата создания (Unix Epoch Time в секундах). */
	question_id: number; /** Уникальный ID вопроса. */
	link: string; /** Ссылка на страницу вопроса. */
	title: string; /** Заголовок вопроса (HTML-encoded). */
	view_count: number; /** Количество просмотров. */
	answer_count: number; /** Количество ответов на этот вопрос. */
	is_answered: boolean; /** Принят ли какой-либо ответ на этот вопрос (не обязательно твой). */
	body: string; // <-- Добавлено поле body (HTML)
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
//#endregion

//#region Stack overflow answer
/**
 * Объект Ответа (Answer).
 * Документация: https://api.stackexchange.com/docs/types/answer
 */
export interface StackOverflowAnswerScheme {
	owner: StackOverflowOwnerScheme;
	is_accepted: boolean; /** True, если автор вопроса пометил этот ответ как решение. */
	score: number; /** Рейтинг ответа (upvotes - downvotes). */
	creation_date: number; /** Дата создания (Unix Epoch Time в секундах). */
	answer_id: number; /** Уникальный ID ответа. */
	question_id: number;/** ID вопроса, к которому относится ответ. */
	link: string;/** Прямая ссылка на ответ. */
	title: string; /** Заголовок вопроса. Появляется ТОЛЬКО при использовании фильтра !6WPIomplt */
	body: string; // <-- Добавлено поле body (HTML). Появляется ТОЛЬКО при использовании фильтра !6WPIomplt
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
//#endregion

//#region Stack exchange response
/**
 * Обертка любого ответа от Stack Exchange API.
 */
export interface StackExchangeResponseScheme<T = any> {
	items: T[]; /** Список запрошенных объектов. */
	has_more: boolean; /** Указывает, есть ли еще данные на следующих страницах. */
	quota_remaining: number; /** Сколько запросов к API ты еще можешь сделать сегодня (обычно 300 без ключа, 10000 с ключом). */
	quota_max: number; /** Твой дневной лимит запросов. */
	backoff?: number; /** Время ожидания перед следующим запросом в секундах (приходит только при перегрузке). */
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
//#endregion
