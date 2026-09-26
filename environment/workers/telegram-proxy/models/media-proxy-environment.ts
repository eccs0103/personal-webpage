"use strict";

import "adaptive-extender/core";
import { Field, Model } from "adaptive-extender/core";

//#region Media proxy environment
export class MediaProxyEnvironment extends Model {
	@Field(Number, { name: "TELEGRAM_CHANNEL_ID" })
	idChannel: number;

	@Field(Number, { name: "TELEGRAM_CHANNEL_ID_DEVELOPMENT" })
	idChannelDevelopment: number;

	@Field(Number, { name: "TELEGRAM_API_ID" })
	apiId: number;

	@Field(String, { name: "TELEGRAM_API_HASH" })
	apiHash: string;

	@Field(String, { name: "TELEGRAM_SESSION" })
	session: string;
}
//#endregion
