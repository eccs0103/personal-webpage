"use strict";

import "adaptive-extender/core";
import { URI } from "adaptive-extender/core";

//#region Cache service
export class CacheService {
	keyFor(request: Request): URI {
		const uri = new URI(request.url);
		const range = request.headers.get("range");
		if (range !== null) uri.searchParams.set("_range", range);
		return uri;
	}

	async tryMatch(key: URI): Promise<Response | null> {
		const { href } = key;
		try {
			const cached = await caches.default.match(href);
			if (cached === undefined) return null;
			if (!this.#isValid(cached)) {
				void caches.default.delete(href).catch(reason => console.error(`Cache eviction failed:\n${Error.from(reason)}`));
				return null;
			}
			return cached;
		} catch (reason) {
			console.error(`Cache lookup failed:\n${Error.from(reason)}`);
			return null;
		}
	}

	tryStore(key: URI, response: Response, context: ExecutionContext): void {
		if (response.status !== 200 && response.status !== 206) return;
		if (response.body === null) return;
		context.waitUntil(caches.default.put(key.href, response.clone()).catch(reason => console.error(`Cache store failed:\n${Error.from(reason)}`)));
	}

	#isValid(response: Response): boolean {
		if (response.status !== 200 && response.status !== 206) return false;
		if (!response.headers.has("Content-Type")) return false;
		return true;
	}
}
//#endregion
