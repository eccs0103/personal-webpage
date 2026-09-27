"use strict";

import "adaptive-extender/web";
import { Controller } from "adaptive-extender/web";
import { AppearanceService } from "../services/appearance-service.js";

const appearance = AppearanceService.instance;

//#region Appearance controller
export class AppearanceController extends Controller {
	async run(): Promise<void> {
		appearance.apply();
	}

	async catch(error: Error): Promise<void> {
		console.error(`Appearance setup failed:\n${error}`);
	}
}
//#endregion

await AppearanceController.launch();
