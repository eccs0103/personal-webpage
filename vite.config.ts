"use strict";

import { defineConfig, type UserConfig } from "vite";
import { type ViteConfig } from "./environment/configs/vite-config.js";
import { MPAConfig } from "./environment/configs/mpa-config.js";
import { CloudflareVitePlugin } from "./environment/plugins/cloudflare-vite-plugin.js";
import { type VitePlugin } from "./environment/plugins/vite-plugin.js";

export default defineConfig(async (env) => {
	const root: URL = new URL(import.meta.url);
	const inputs: URL[] = [
		new URL("./feed/index.html", root),
	];
	const rootEntries: URL[] = [
	];
	const pathEntries: URL[] = [
	];
	const output: URL = new URL("./dist", root);
	const plugins: VitePlugin[] = [new CloudflareVitePlugin()];
	const config: ViteConfig = await MPAConfig.construct(inputs, rootEntries, pathEntries, output, plugins);
	return config.build();
});
