"use strict";

import "adaptive-extender/web";
import { type MouseEvent, type ReactElement } from "react";
import { AnalyticsService } from "../../environment/services/analytics-service.js";
import { WelcomeAction } from "../models/welcome-action.js";
import { Description, useModal } from "./view-builders.js";

const analytics = AnalyticsService.instance;

//#region Welcome row
interface WelcomeRowProps {
	action: string;
	title: string;
	description: string;
	text: string;
	onChoose(): void;
}

function WelcomeRow({ action, title, description, text, onChoose }: WelcomeRowProps): ReactElement {
	return (
		<div className="welcome-row with-padding large-padding with-inline-gap" translate="yes">
			<strong className="welcome-row-title" translate="yes">{title}</strong>
			<Description text={description} className="welcome-row-description font-smaller-2" />
			<button type="button" className={`welcome-row-action welcome-${action} with-inline-padding with-padding rounded depth`} translate="yes" onClick={event => onChoose()}>{text}</button>
		</div>
	);
}
//#endregion
//#region Welcome dialog
export interface WelcomeDialogProps {
	open: boolean;
	changelog: boolean;
	onProfiles(): void;
	onFilters(): void;
	onTheme(): void;
	onChangelog(): void;
	onClose(): void;
}

export function WelcomeDialog({ open, changelog, onProfiles, onFilters, onTheme, onChangelog, onClose }: WelcomeDialogProps): ReactElement {
	const refDialog = useModal(open);

	const choose = (action: string): void => {
		analytics.dispatch("welcome_action", new WelcomeAction(action));
		onClose();
	};

	const dismiss = (event: MouseEvent<HTMLDialogElement>): void => {
		if (event.target !== event.currentTarget) return;
		choose("dismiss");
	};

	return (
		<dialog id="welcome" ref={refDialog} className="layer rounded flex column" translate="yes" onClick={dismiss} onClose={event => onClose()}>
			<div className="welcome-header flex column with-gap with-padding large-padding" translate="yes">
				<strong className="welcome-title font-larger-2" translate="yes">Hi! This is a live feed of what I'm up to</strong>
				<Description text="A few things here are easy to miss:" className="welcome-subtitle font-smaller-2" />
			</div>
			<div className="welcome-rows" translate="yes">
				<WelcomeRow action="profiles" title="Find me elsewhere" description="Every profile I have, in one place." text="Show platforms" onChoose={() => { choose("profiles"); onProfiles(); }} />
				<WelcomeRow action="filters" title="Hide what you don't care about" description="Tap a platform name on any post." text="Show me" onChoose={() => { choose("filters"); onFilters(); }} />
				<WelcomeRow action="theme" title="Not your style?" description="Switch to a calmer theme any time." text="Show me" onChoose={() => { choose("theme"); onTheme(); }} />
				{changelog && <WelcomeRow action="changelog" title="See what's new" description="Recent changes to this page." text="Change log" onChoose={() => { choose("changelog"); onChangelog(); }} />}
			</div>
			<div className="welcome-footer flex alt-center with-gap with-padding large-padding" translate="yes">
				<button type="button" className="welcome-close with-inline-padding with-padding rounded highlight-background" translate="yes" onClick={event => choose("dismiss")}>Got it</button>
			</div>
		</dialog>
	);
}
//#endregion
