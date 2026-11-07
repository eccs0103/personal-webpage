"use strict";

import "adaptive-extender/node";
import { type URI } from "adaptive-extender/node";
import FileSystem from "fs";
import AsyncFileSystem from "fs/promises";

//#region Server bridge
export class ServerBridge {
	async read(path: Readonly<URI>): Promise<string | null> {
		const file = path.toPath();
		if (!FileSystem.existsSync(file)) return null;
		const content = await AsyncFileSystem.readFile(file, "utf-8");
		return content;
	}

	async write(path: Readonly<URI>, content: string): Promise<void> {
		await AsyncFileSystem.writeFile(path.toPath(), content);
	}
}
//#endregion
