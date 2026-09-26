"use strict";

import "adaptive-extender/node";
import { LocalEnviroment } from "../../environment/services/local-environment.js";
import { Controller } from "adaptive-extender/node";
import { SoundCloudAuthorizer } from "../services/soundcloud-authorizer.js";

const environment = LocalEnviroment.instance;
const { soundCloudClientId, soundCloudClientSecret } = environment;

//#region SoundCloud authorization controller
class SoundCloudAuthorizationController extends Controller {
	async run(): Promise<void> {
		const uriRedirect = new URL("http://127.0.0.1:3000/callback");
		const authorizer = new SoundCloudAuthorizer(soundCloudClientId, soundCloudClientSecret, uriRedirect);
		const token = await authorizer.authorize();
		console.log(`New SoundCloud refresh token:\n${token}`);
		console.log("Paste this value into the 'SOUND_CLOUD_TOKEN' repository secret (and SOUND_CLOUD_TOKEN in .env for local runs).");
	}

	async catch(error: Error): Promise<void> {
		console.error(`SoundCloud authorization failed cause of:\n${error}`);
	}
}
//#endregion

await SoundCloudAuthorizationController.launch();
