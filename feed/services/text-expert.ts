"use strict";

import { Timespan, Version } from "adaptive-extender/core";

const { trunc } = Math;

//#region Text expert
export class TextExpert {
	static getPluralSuffix(count: number): string {
		if (count > 1) return "s";
		return String.empty;
	}

	static getIndefiniteCardinal(count: number): string {
		if (count === 1) return "a";
		return count.toString();
	}

	static getBump(version: Version): string {
		if (version.patch !== 0) return "patch";
		if (version.minor !== 0) return "minor";
		return "major";
	}

	static formatTime(timestamp: Date): string {
		const span = Timespan.fromValue(Date.now() - timestamp.valueOf());
		// if (span.days > 6) return timestamp.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
		if (span.days > 6) {
			const weeks = trunc(span.days / 7);
			return `${weeks} week${TextExpert.getPluralSuffix(weeks)} ago`;
		}
		if (span.days > 0) return `${span.days} day${TextExpert.getPluralSuffix(span.days)} ago`;
		if (span.hours > 0) return `${span.hours} hour${TextExpert.getPluralSuffix(span.hours)} ago`;
		if (span.minutes > 0) return `${span.minutes} min${TextExpert.getPluralSuffix(span.minutes)} ago`;
		return "Just now";
	}
}
//#endregion
