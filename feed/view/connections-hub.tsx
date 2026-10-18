"use strict";

import "adaptive-extender/web";
import { type MouseEvent, type ReactElement } from "react";
import { type Platform } from "../models/configuration.js";
import { Description, ExternalIcon, ExternalLink, Icon, useModal } from "./view-builders.js";

const { baseURI } = document;

//#region Connections hub
export interface ConnectionsHubProps {
	platforms: readonly Platform[];
	preferences: ReadonlyMap<string, boolean>;
	open: boolean;
	onToggle(name: string, checked: boolean): void;
	onClose(): void;
}

export function ConnectionsHub({ platforms, preferences, open, onToggle, onClose }: ConnectionsHubProps): ReactElement {
	const refDialog = useModal(open);

	const dismiss = (event: MouseEvent<HTMLDialogElement>): void => {
		if (event.target !== event.currentTarget) return;
		onClose();
	};

	const rules: string[] = [];
	const rows: ReactElement[] = [];
	for (const platform of platforms) {
		const { name, icon, webpage, status, note } = platform;
		const id = `platform-toggle-${name.replace(/\s+/g, "-").toLowerCase()}`;
		if (status === "connected") rules.push(`body:has(dialog#connections-hub input#${id}:not(:checked)) main div.activity[data-platform="${name}"] { display: none; }`);

		rows.push(
			<div key={name} data-status={status ?? "none"} className="connection-row with-padding with-inline-gap" translate="yes">
				{status === "connected" && <>
					<input type="checkbox" checked={preferences.get(name) ?? true} id={id} data-platform={name} hidden translate="no" onChange={event => onToggle(name, event.currentTarget.checked)} />
					<label htmlFor={id} className="platform-toggle in-line toggle layer" role="checkbox" title={`Toggle ${name}`} translate="yes">
						<span className="knob depth" translate="no" />
					</label>
				</>}
				<Icon url={new URL(icon, new URL("../", baseURI))} className="connection-icon" />
				<strong className="connection-name" translate="no">{name}</strong>
				{webpage !== null && <ExternalLink url={new URL(webpage)} translate="no" className="connection-link with-inline-padding font-smaller-2"><ExternalIcon /></ExternalLink>}
				{note !== null && <Description text={note} className="connection-note font-smaller-2" />}
			</div>
		);
	}

	return (
		<dialog id="connections-hub" ref={refDialog} className="layer rounded flex column" translate="yes" onClick={dismiss} onClose={event => onClose()}>
			<style>{rules.join("\n")}</style>
			{rows}
		</dialog>
	);
}
//#endregion
