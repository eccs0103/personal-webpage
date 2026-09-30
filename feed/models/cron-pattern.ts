"use strict";

import "adaptive-extender/core";

//#region Cron field
export class CronField {
	#values: Set<number>;
	#restricted: boolean;

	constructor(values: Set<number>, restricted: boolean) {
		this.#values = values;
		this.#restricted = restricted;
	}

	static #parseNumber(text: string, min: number, max: number): number {
		if (!/^\d+$/.test(text)) throw new SyntaxError(`Invalid '${text}' cron value`);
		const value = Number(text);
		if (value < min || value > max) throw new SyntaxError(`Cron value '${text}' is out of range ${min}-${max}`);
		return value;
	}

	static #parseItem(text: string, min: number, max: number): number[] {
		const bounds = text.split("-");
		if (bounds.length === 1) return [CronField.#parseNumber(text, min, max)];
		if (bounds.length !== 2) throw new SyntaxError(`Invalid '${text}' cron range`);
		const [start, end] = bounds.map(bound => CronField.#parseNumber(bound, min, max));
		if (start > end) throw new SyntaxError(`Invalid '${text}' cron range`);
		return Array.range(start, end + 1);
	}

	static parse(text: string, min: number, max: number): CronField {
		if (text === "*") return new CronField(new Set(Array.range(min, max + 1)), false);
		const values = new Set(text.split(",").flatMap(item => CronField.#parseItem(item, min, max)));
		return new CronField(values, true);
	}

	get restricted(): boolean { return this.#restricted; }

	has(value: number): boolean {
		return this.#values.has(value);
	}
}
//#endregion
//#region Cron pattern
export class CronPattern {
	#day: CronField;
	#month: CronField;
	#weekday: CronField;

	constructor(day: CronField, month: CronField, weekday: CronField) {
		this.#day = day;
		this.#month = month;
		this.#weekday = weekday;
	}

	static parse(text: string): CronPattern {
		const fields = text.trim().split(/\s+/);
		if (fields.length !== 3) throw new SyntaxError(`Cron pattern '${text}' must have 3 fields`);
		const [day, month, weekday] = fields;
		return new CronPattern(CronField.parse(day, 1, 31), CronField.parse(month, 1, 12), CronField.parse(weekday, 0, 6));
	}

	#matchDay(date: Date): boolean {
		const day = this.#day;
		const weekday = this.#weekday;
		if (day.restricted && weekday.restricted) return day.has(date.getDate()) || weekday.has(date.getDay());
		return day.has(date.getDate()) && weekday.has(date.getDay());
	}

	match(date: Date): boolean {
		if (!this.#month.has(date.getMonth() + 1)) return false;
		return this.#matchDay(date);
	}
}
//#endregion
