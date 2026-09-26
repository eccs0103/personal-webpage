"use strict";

import "adaptive-extender/core";
import { Field, Model } from "adaptive-extender/core";

//#region Welcome action
export class WelcomeAction extends Model {
	/** What the visitor chose in the welcome dialog: "profiles", "filters", "changelog" or "dismiss". */
	@Field(String, { name: "action" })
	action: string;

	constructor();
	constructor(action: string);
	constructor(action?: string) {
		if (action === undefined) {
			super();
			return;
		}

		super();
		this.action = action;
	}
}
//#endregion
