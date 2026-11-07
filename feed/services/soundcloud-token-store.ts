"use strict";

import "adaptive-extender/node";
import { type URI } from "adaptive-extender/node";
import Crypto from "crypto";
import { type Bridge } from "./bridge.js";
import { SoundCloudEncryptedToken } from "../models/soundcloud-token.js";
import { ServerBridge } from "./server-bridge.js";

//#region SoundCloud token store
export class SoundCloudTokenStore {
	#bridge: Bridge = new ServerBridge();
	#path: URI;
	#key: Buffer;
	#initial: string;

	constructor(path: URI, key: string, initial: string) {
		this.#path = path;
		this.#key = Buffer.from(key, "hex");
		this.#initial = initial;
	}

	async read(): Promise<string> {
		const content = await this.#bridge.read(this.#path);
		if (content === null) return this.#initial;
		const encrypted = SoundCloudEncryptedToken.import(JSON.parse(content), "soundcloud_encrypted_token");
		const decipher = Crypto.createDecipheriv("aes-256-gcm", this.#key, Buffer.from(encrypted.iv, "base64"));
		decipher.setAuthTag(Buffer.from(encrypted.tag, "base64"));
		const decrypted = Buffer.concat([decipher.update(Buffer.from(encrypted.ciphertext, "base64")), decipher.final()]);
		return decrypted.toString("utf-8");
	}

	async write(token: string): Promise<void> {
		const iv = Crypto.randomBytes(12);
		const cipher = Crypto.createCipheriv("aes-256-gcm", this.#key, iv);
		const ciphertext = Buffer.concat([cipher.update(token, "utf-8"), cipher.final()]);
		const tag = cipher.getAuthTag();
		const encrypted = new SoundCloudEncryptedToken(iv.toString("base64"), tag.toString("base64"), ciphertext.toString("base64"));
		const content = JSON.stringify(SoundCloudEncryptedToken.export(encrypted), null, "\t");
		await this.#bridge.write(this.#path, content);
	}
}
//#endregion
