"use strict";

import "adaptive-extender/web";
import { Timespan } from "adaptive-extender/web";
import { Activity } from "../models/activity.js";
import { ArrayCursor } from "../services/array-cursor.js";

//#region Activity collector
export type TypeOf<T> = abstract new (...args: any[]) => T;

export interface GroupingOptions {
	gap: Timespan;
	passThrough: boolean;
}

export class ActivityCollector {
	#source: readonly Activity[];
	#roots: Map<TypeOf<Activity>, GroupingOptions> = new Map();
	#consumed: WeakSet<Activity> = new WeakSet();

	constructor(source: readonly Activity[]) {
		this.#source = source;
	}

	register<T extends Activity>(root: TypeOf<T>): void;
	register<T extends Activity>(root: TypeOf<T>, options: Partial<GroupingOptions>): void;
	register<T extends Activity>(root: TypeOf<T>, options: Partial<GroupingOptions> = {}): void {
		const gap = options.gap ?? Timespan.fromComponents(36, 0, 0);
		const passThrough = options.passThrough ?? true;
		this.#roots.set(root, { gap, passThrough });
	}

	isConsumed(activity: Activity): boolean {
		return this.#consumed.has(activity);
	}

	#isSameGroup(current: Activity, next: Activity, root: TypeOf<Activity>, gap: Timespan): boolean {
		if (!(next instanceof root)) return false;
		const difference = Timespan.fromValue(current.timestamp.valueOf() - next.timestamp.valueOf());
		return difference.valueOf() <= gap.valueOf();
	}

	findRoot<T extends Activity>(target: T): TypeOf<T> | null {
		for (const [root] of this.#roots) {
			if (!(target instanceof root)) continue;
			return root as TypeOf<T>;
		}
		return null;
	}

	#findGroupConsecutive(cursor: ArrayCursor<Activity>, root: TypeOf<Activity>, gap: Timespan, isFinal: boolean): Activity[] | null {
		const source = this.#source;
		const anchor = cursor.current;
		const buffer: Activity[] = [anchor];
		let last = anchor;
		let index = cursor.index + 1;
		for (; index < source.length; index++) {
			const candidate = source[index];
			if (!this.#isSameGroup(last, candidate, root, gap)) break;
			buffer.push(candidate);
			last = candidate;
		}
		if (!isFinal && index === source.length) return null;
		cursor.index = index;
		return buffer;
	}

	#consume(cursor: ArrayCursor<Activity>, buffer: Activity[]): Activity[] {
		const consumed = this.#consumed;
		for (const activity of buffer) consumed.add(activity);
		cursor.index++;
		return buffer;
	}

	#findGroupPassThrough(cursor: ArrayCursor<Activity>, root: TypeOf<Activity>, gap: Timespan, isFinal: boolean): Activity[] | null {
		const source = this.#source;
		const consumed = this.#consumed;
		const anchor = cursor.current;
		const buffer: Activity[] = [anchor];
		let last = anchor;
		for (let index = cursor.index + 1; index < source.length; index++) {
			const candidate = source[index];
			if (consumed.has(candidate) || !(candidate instanceof root)) continue;
			if (!this.#isSameGroup(last, candidate, root, gap)) return this.#consume(cursor, buffer);
			buffer.push(candidate);
			last = candidate;
		}
		if (!isFinal) return null;
		return this.#consume(cursor, buffer);
	}

	findGroup(cursor: ArrayCursor<Activity>, root: TypeOf<Activity>, isFinal: boolean): Activity[] | null {
		const { passThrough, gap } = ReferenceError.suppress(this.#roots.get(root));
		if (passThrough) return this.#findGroupPassThrough(cursor, root, gap, isFinal);
		return this.#findGroupConsecutive(cursor, root, gap, isFinal);
	}
}
//#endregion
