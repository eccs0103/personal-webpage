"use strict";

import "adaptive-extender/core";
import { EnvironmentProvider, type Environment } from "adaptive-extender/core";
import { MediaProxy } from "../services/media-proxy.js";
import { CloudflareWorker } from "../../cloudflare-worker.js";
import { TelegramChannel } from "../services/telegram-channel.js";
import { ResponseFactory } from "../services/response-factory.js";
import { CacheService } from "../services/cache-service.js";
import { MediaProxyEnvironment } from "../models/media-proxy-environment.js";

//#region Telegram media proxy worker
class TelegramMediaProxyWorker extends CloudflareWorker {
	#factory: ResponseFactory = new ResponseFactory();
	#cache: CacheService = new CacheService();

	async run(request: Request, environment: Environment, context: ExecutionContext): Promise<Response> {
		const cache = this.#cache;
		const { method, url } = request;
		let key: URL | null = null;
		if (method === "GET") key = cache.keyFor(request);
		if (key !== null) {
			const cached = await cache.tryMatch(key);
			if (cached !== null) return cached;
		}

		const { searchParams } = new URL(url);
		const isDevelopment = searchParams.has("development");
		const { idChannel, idChannelDevelopment, apiId, apiHash, session } = EnvironmentProvider.resolve(environment, MediaProxyEnvironment);
		let id = idChannel;
		if (isDevelopment) id = idChannelDevelopment;
		const channel = await TelegramChannel.connect(id, apiId, apiHash, session);
		const proxy = new MediaProxy(channel, this.#factory);
		const response = await proxy.handle(request, context);
		if (key !== null) cache.tryStore(key, response, context);
		return response;
	}

	async catch(error: Error): Promise<Response> {
		return this.#factory.error(500, error.message);
	}
}

export default new TelegramMediaProxyWorker();
//#endregion
