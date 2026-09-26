"use strict";

import "adaptive-extender/node";
import Crypto from "crypto";
import Http from "http";
import { SoundCloudAuthorization, SoundCloudTokenError } from "../models/soundcloud-event.js";

//#region SoundCloud authorizer
export class SoundCloudAuthorizer {
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
			const { error, errorDescription } = SoundCloudTokenError.import(data, "soundcloud_token_error");
			return `${error} — ${errorDescription}`;
		} catch {
			return null;
		}
	}

	static #toBase64Url(buffer: Buffer): string {
		return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
	}

	#buildAuthorizeUrl(challenge: string, state: string): URL {
		const url = new URL("https://secure.soundcloud.com/authorize");
		url.searchParams.set("response_type", "code");
		url.searchParams.set("client_id", this.#idClient);
		url.searchParams.set("redirect_uri", String(this.#uriRedirect));
		url.searchParams.set("code_challenge", challenge);
		url.searchParams.set("code_challenge_method", "S256");
		url.searchParams.set("state", state);
		return url;
	}

	#awaitCode(state: string): Promise<string> {
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
					reject(new Error(`SoundCloud authorization was denied: ${error}`));
					return;
				}
				if (searchParams.get("state") !== state) {
					reject(new Error("SoundCloud redirect state did not match the expected value"));
					return;
				}
				const code = searchParams.get("code");
				if (code === null) {
					reject(new ReferenceError("SoundCloud redirect did not include an authorization code"));
					return;
				}
				resolve(code);
			});
			server.listen(port);
		});
	}

	async #exchangeCode(code: string, verifier: string): Promise<SoundCloudAuthorization> {
		const url = new URL("https://secure.soundcloud.com/oauth/token");
		const method = "POST";
		const headers: Record<string, string> = {
			["Content-Type"]: "application/x-www-form-urlencoded",
			["Accept"]: "application/json; charset=utf-8"
		};
		const query: Record<string, string> = {
			["grant_type"]: "authorization_code",
			["client_id"]: this.#idClient,
			["client_secret"]: this.#clientSecret,
			["redirect_uri"]: String(this.#uriRedirect),
			["code_verifier"]: verifier,
			["code"]: code
		};
		const body = new URLSearchParams(query);
		const response = await fetch(url, { method, headers, body });
		const data = await response.json();
		if (!response.ok) {
			const description = await SoundCloudAuthorizer.#describeError(data);
			if (description !== null) throw new Error(`SoundCloud token exchange failed: ${description}`);
			throw new Error(`${response.status}: ${response.statusText}`);
		}
		return SoundCloudAuthorization.import(data, "soundcloud_authorization");
	}

	async authorize(): Promise<string> {
		const verifier = SoundCloudAuthorizer.#toBase64Url(Crypto.randomBytes(32));
		const challenge = SoundCloudAuthorizer.#toBase64Url(Crypto.createHash("sha256").update(verifier).digest());
		const state = Crypto.randomBytes(16).toString("hex");
		const urlAuthorize = this.#buildAuthorizeUrl(challenge, state);
		console.log(`Open this URL to authorize SoundCloud:\n${urlAuthorize}`);
		const code = await this.#awaitCode(state);
		const authorization = await this.#exchangeCode(code, verifier);
		return authorization.refreshToken;
	}
}
//#endregion
