"use strict";

import "adaptive-extender/core";
import { type URI } from "adaptive-extender/core";

//#region Bridge
export abstract class Bridge {
	abstract read(path: Readonly<URI>): Promise<string | null>;
	abstract write(path: Readonly<URI>, content: string): Promise<void>;
}
//#endregion
