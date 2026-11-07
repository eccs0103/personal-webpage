"use strict";

import "adaptive-extender/core";
import { Field, Model, URI, type PortableConstructor } from "adaptive-extender/core";
import { Bridge } from "./bridge.js";

const { ceil } = Math;

//#region Data table metadata
export interface DataTableMetadataScheme {
	length: number;
}

export class DataTableMetadata extends Model {
	@Field(Number, { name: "length" })
	length: number;

	constructor();
	constructor(length: number);
	constructor(length?: number) {
		if (length === undefined) {
			super();
			return;
		}

		super();
		this.length = length;
	}
}
//#endregion
//#region Data table
export interface DataTableOptions {
	chunk: number;
}

export class DataTable<C extends PortableConstructor> extends Array<InstanceType<C>> {
	constructor(bridge: Bridge, path: URI, entity: C);
	constructor(bridge: Bridge, path: URI, entity: C, options: Partial<DataTableOptions>);
	constructor(bridge: Bridge, path: URI, entity: C, options: Partial<DataTableOptions> = {}) {
		super();
		this.#bridge = bridge;
		this.#path = path.href.endsWith("/") ? path : new URI(`${path.href}/`);
		this.#entity = entity;
		this.#chunk = options.chunk ?? 100;
	}

	#bridge: Bridge;
	#path: URI;
	#entity: C;
	#chunk: number;

	static get [Symbol.species](): ArrayConstructor {
		return Array;
	}

	#getMetadataPath(): URI {
		return new URI("meta.json", this.#path);
	}

	#getChunkPath(index: number): URI {
		return new URI(`${index}.json`, this.#path);
	}

	async #readMetadata(): Promise<DataTableMetadata | null> {
		const bridge = this.#bridge;
		const path = this.#getMetadataPath();
		const content = await bridge.read(path);
		if (content === null) {
			const meta = new DataTableMetadata(0);
			const saved = await this.#writeMetadata(meta);
			if (!saved) return null;
			return meta;
		}
		const object = JSON.parse(content);
		return DataTableMetadata.import(object, "metadata");
	}

	async #writeMetadata(meta: DataTableMetadata): Promise<boolean> {
		const bridge = this.#bridge;
		const path = this.#getMetadataPath();
		const object = DataTableMetadata.export(meta);
		const content = JSON.stringify(object, null, "\t");
		try {
			await bridge.write(path, content);
			return true;
		} catch (reason) {
			const message = "Write operation is restricted in Web context";
			if (reason instanceof TypeError && reason.message === message) return false;
			throw reason;
		}
	}

	async #readChunk(index: number): Promise<InstanceType<C>[]> {
		const bridge = this.#bridge;
		const path = this.#getChunkPath(index);
		const content = await bridge.read(path);
		if (content === null) throw new ReferenceError(`Missing data chunk at ${path.pathname}`);
		const object = JSON.parse(content);
		const entity = this.#entity;
		const name = typename(entity);
		const array = Array.import(object, name)
			.map((item, index) => entity.import(item, `${name}[${index}]`));
		return array;
	}

	async #writeChunk(index: number, array: InstanceType<C>[]): Promise<void> {
		const bridge = this.#bridge;
		const path = this.#getChunkPath(index);
		const entity = this.#entity;
		const source = array.map(item => entity.export(item));
		const content = JSON.stringify(source, null, "\t");
		await bridge.write(path, content);
	}

	async load(): Promise<boolean>;
	async load(page: number): Promise<boolean>;
	async load(...pages: number[]): Promise<boolean>;
	async load(...pages: number[]): Promise<boolean> {
		const meta = await this.#readMetadata();
		if (meta === null) return false;
		const length = meta.length;
		if (pages.length < 1) pages = Array.range(0, length);
		if (length < 1) return false;
		for (const page of pages) {
			const index = length - 1 - page;
			if (index < 0) return false;
			const array = await this.#readChunk(index);
			array.reverse();
			const chunk = this.#chunk;
			this.splice(page * chunk, chunk, ...array);
		}
		return true;
	}

	async save(): Promise<void> {
		const chunk = this.#chunk;
		const total = this.length;
		const length = ceil(total / chunk);
		for (let index = 0; index < length; index++) {
			const end = total - (index * chunk);
			const begin = (end - chunk).clamp(0, Infinity);
			const array = this
				.slice(begin, end)
				.reverse();
			await this.#writeChunk(index, array);
		}
		const meta = new DataTableMetadata(length);
		await this.#writeMetadata(meta);
	}
}
//#endregion
