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
		const index = cursor.index;
		const buffer: Activity[] = [];
		let { current } = cursor;
		buffer.push(current);
		cursor.index++;
		while (cursor.inRange) {
			const next = cursor.current;
			if (!this.#isSameGroup(current, next, root, gap)) break;
			buffer.push(next);
			current = next;
			cursor.index++;
		}
		if (!isFinal && !cursor.inRange) {
			cursor.index = index;
			return null;
		}
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
		const buffer: Activity[] = [];
		const anchor = cursor.current;
		buffer.push(anchor);

		let last = anchor;
		for (let index = cursor.index + 1; index < source.length; index++) {
			const candidate = source[index];
			if (consumed.has(candidate)) continue;
			if (!(candidate instanceof root)) continue;
			const difference = Timespan.fromValue(last.timestamp.valueOf() - candidate.timestamp.valueOf());
			if (difference.valueOf() > gap.valueOf()) return this.#consume(cursor, buffer);
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
