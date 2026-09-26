"use strict";

import "adaptive-extender/node";
import Http from "http";
import { SpotifyAuthorization, SpotifyTokenError } from "../models/spotify-event.js";

//#region Spotify authorizer
export class SpotifyAuthorizer {
	#idClient: string;
	#clientSecret: string;
	#uriRedirect: URL;

	constructor(idClient: string, clientSecret: string, uriRedirect: URL) {
		this.#idClient = idClient;
		this.#clientSecret = clientSecret;
		this.#uriRedirect = uriRedirect;
	}

	static async #describeError(data: unknown): Promise<string | null> {
		try {
			const { error, errorDescription } = SpotifyTokenError.import(data, "spotify_token_error");
			return `${error} — ${errorDescription}`;
		} catch {
			return null;
		}
	}

	#buildAuthorizeUrl(): URL {
		const url = new URL("https://accounts.spotify.com/authorize");
		url.searchParams.set("response_type", "code");
		url.searchParams.set("client_id", this.#idClient);
		url.searchParams.set("redirect_uri", String(this.#uriRedirect));
		url.searchParams.set("scope", "user-library-read");
		url.searchParams.set("show_dialog", "true");
		return url;
	}

	#awaitCode(): Promise<string> {
		const uriRedirect = this.#uriRedirect;
		const port = Number(uriRedirect.port);
		return new Promise((resolve, reject) => {
			const server = Http.createServer((request, response) => {
				if (request.url === undefined) return;
				const { pathname, searchParams } = new URL(request.url, this.#uriRedirect);
				if (pathname !== uriRedirect.pathname) {
					response.writeHead(404).end();
					return;
				}
				response.writeHead(200, { ["Content-Type"]: "text/plain" }).end("Authorization received. You may close this tab.");
				server.close();
				const error = searchParams.get("error");
				if (error !== null) {
					reject(new Error(`Spotify authorization was denied: ${error}`));
					return;
				}
				const code = searchParams.get("code");
				if (code === null) {
					reject(new ReferenceError("Spotify redirect did not include an authorization code"));
					return;
				}
				resolve(code);
			});
			server.listen(port);
		});
	}

	async #exchangeCode(code: string): Promise<SpotifyAuthorization> {
		const url = new URL("https://accounts.spotify.com/api/token");
		const method = "POST";
		const auth = Buffer.from(`${this.#idClient}:${this.#clientSecret}`).toString("base64");
		const headers: Record<string, string> = {
			["Authorization"]: `Basic ${auth}`,
			["Content-Type"]: "application/x-www-form-urlencoded"
		};
		const query: Record<string, string> = {
			["grant_type"]: "authorization_code",
			["code"]: code,
			["redirect_uri"]: String(this.#uriRedirect)
		};
		const body = new URLSearchParams(query);
		const response = await fetch(url, { method, headers, body });
		const data = await response.json();
		if (!response.ok) {
			const description = await SpotifyAuthorizer.#describeError(data);
			if (description !== null) throw new Error(`Spotify token exchange failed: ${description}`);
			throw new Error(`${response.status}: ${response.statusText}`);
		}
		return SpotifyAuthorization.import(data, "spotify_authorization");
	}

	async authorize(): Promise<string> {
		const urlAuthorize = this.#buildAuthorizeUrl();
		console.log(`Open this URL to authorize Spotify:\n${urlAuthorize}`);
		const code = await this.#awaitCode();
		const authorization = await this.#exchangeCode(code);
		return authorization.refreshToken;
	}
}
//#endregion
