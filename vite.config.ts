"use strict";

import "adaptive-extender/node";
import { URI } from "adaptive-extender/node";
import { defineConfig, type UserConfig } from "vite";
import { type ViteConfig } from "./environment/configs/vite-config.js";
import { MPAConfig } from "./environment/configs/mpa-config.js";
import { CloudflareVitePlugin } from "./environment/plugins/cloudflare-vite-plugin.js";
import { ReactVitePlugin } from "./environment/plugins/react-vite-plugin.js";
import { type VitePlugin } from "./environment/plugins/vite-plugin.js";

export default defineConfig(async (env) => {
	const root: URI = new URI(import.meta.url);
	const inputs: URI[] = [
		new URI("./feed/index.html", root),
	];
	const rootEntries: URI[] = [
	];
	const pathEntries: URI[] = [
	];
	const output: URI = new URI("./dist/client", root);
	const plugins: VitePlugin[] = [new CloudflareVitePlugin(), new ReactVitePlugin()];
	const config: ViteConfig = await MPAConfig.construct(inputs, rootEntries, pathEntries, output, plugins);
	return config.build();
});
