"use strict";

import "adaptive-extender/web";
import { Fragment, type MouseEvent, type ReactElement } from "react";
import { type Platform } from "../models/configuration.js";
import { Description, ExternalIcon, ExternalLink, useModal } from "./view-builders.js";

//#region Platform menu
export interface PlatformMenuProps {
	platform: Platform | null;
	open: boolean;
	onHide(platform: Platform): void;
	onHub(): void;
	onClose(): void;
}

export function PlatformMenu({ platform, open, onHide, onHub, onClose }: PlatformMenuProps): ReactElement {
	const refDialog = useModal(open);

	const dismiss = (event: MouseEvent<HTMLDialogElement>): void => {
		if (event.target !== event.currentTarget) return;
		onClose();
	};

	return (
		<dialog id="platform-menu" ref={refDialog} className="layer rounded flex column" translate="yes" onClick={dismiss} onClose={event => onClose()}>
			{platform !== null && <Fragment key={platform.name}>
				<div className="platform-menu-header with-padding large-padding" translate="yes">
					<strong className="platform-menu-title" translate="no">{platform.name}</strong>
				</div>
				<div className="platform-menu-actions flex column with-gap with-padding large-padding" translate="yes">
					{platform.webpage !== null && <ExternalLink url={new URL(platform.webpage)} text={`Open ${platform.name} profile `} role="button" className="platform-menu-profile with-inline-padding with-padding rounded depth highlight"><ExternalIcon /></ExternalLink>}
					{platform.status === "connected" && <button type="button" className="platform-menu-hide with-inline-padding with-padding rounded depth" translate="yes" onClick={event => onHide(platform)}>{`Hide ${platform.name} posts`}</button>}
				</div>
				<div className="platform-menu-footer flex alt-center with-gap with-padding large-padding" translate="yes">
					<Description text="Bring hidden ones back anytime in Platforms" className="platform-menu-hint font-smaller-2" />
					<button type="button" className="platform-menu-open with-inline-padding with-padding rounded highlight-background" translate="yes" onClick={event => onHub()}>Open</button>
				</div>
			</Fragment>}
		</dialog>
	);
}
//#endregion
