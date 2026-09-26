"use strict";

import "adaptive-extender/node";
import { LocalEnviroment } from "../../environment/services/local-environment.js";
import { Controller } from "adaptive-extender/node";
import { SpotifyAuthorizer } from "../services/spotify-authorizer.js";

const environment = LocalEnviroment.instance;
const { spotifyClientId, spotifyClientSecret } = environment;

//#region Spotify authorization controller
class SpotifyAuthorizationController extends Controller {
	async run(): Promise<void> {
		const uriRedirect = new URL("http://127.0.0.1:3000/callback");
		const authorizer = new SpotifyAuthorizer(spotifyClientId, spotifyClientSecret, uriRedirect);
		const token = await authorizer.authorize();
		console.log(`New Spotify refresh token:\n${token}`);
		console.log("Paste this value into the 'TOKEN_SPOTIFY' repository secret (and SPOTIFY_TOKEN in .env for local runs).");
	}

	async catch(error: Error): Promise<void> {
		console.error(`Spotify authorization failed cause of:\n${error}`);
	}
}
//#endregion

await SpotifyAuthorizationController.launch();
