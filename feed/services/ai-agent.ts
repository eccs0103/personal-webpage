"use strict";

import "adaptive-extender/node";
import { GoogleGenerativeAI, GenerativeModel, type GenerationConfig } from "@google/generative-ai";
import { BooleanResponse } from "../models/ai-responses.js";

//#region AI agent
export class AIAgent {
	#model: GenerativeModel;

	constructor(apiKey: string) {
		const aiGenerator = new GoogleGenerativeAI(apiKey);
		const model = "gemini-1.5-flash";
		const temperature: number = 0.1;
		const responseMimeType: string = "application/json";
		const generationConfig: GenerationConfig = { temperature, responseMimeType };
		this.#model = aiGenerator.getGenerativeModel({ model, generationConfig });
	}

	async askBoolean(question: string, context: string): Promise<boolean> {
		const request = `Context: ${context}\nQuestion: ${question}\nRule: Respond with a JSON object containing a single key "result" (boolean).\nIf the information confirms the event strictly, set "result" to true.\nIf ambiguous or no information, set "result" to false.`;
		const { response } = await this.#model.generateContent(request);
		const object = JSON.parse(response.text());
		return BooleanResponse.import(object, "ai_agent").result;
	}
}
//#endregion
