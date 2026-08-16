"use strict";

import "adaptive-extender/web";
import { Controller, MetadataInjector } from "adaptive-extender/web";
import { type Platform } from "../models/configuration.js";

const { baseURI } = document;

//#region Metadata controller
export class MetadataController extends Controller<[readonly Platform[]]> {
	async run(platforms: readonly Platform[]): Promise<void> {
		MetadataInjector.inject({
			type: "Person",
			name: "eccs0103",
			webpage: new URL("https://eccs.dev"),
			preview: new URL("../icons/png_alpha_1024.png", baseURI),
			associations: platforms
				.map(platform => platform.webpage)
				.filter(webpage => webpage !== null)
				.map(webpage => new URL(webpage)),
			job: "Software engineer",
			description: "Webpage of the person known by the nickname eccs0103.",
		});
	}
}
//#endregion
