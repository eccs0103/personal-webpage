"use strict";

import "adaptive-extender/web";
import { Fragment, type MouseEvent, type ReactElement, useState } from "react";
import { type ChangelogEntry } from "../models/changelog.js";
import { TextExpert } from "../services/text-expert.js";
import { useModal } from "./view-builders.js";

//#region Changelog dialog
export interface ChangelogDialogProps {
	entries: readonly ChangelogEntry[];
	session: number;
	open: boolean;
	onClose(): void;
}

export function ChangelogDialog({ entries, session, open, onClose }: ChangelogDialogProps): ReactElement {
	const [index, setIndex] = useState<number>(0);
	const refDialog = useModal(open);

	const close = (): void => {
		setIndex(0);
		onClose();
	};

	const dismiss = (event: MouseEvent<HTMLDialogElement>): void => {
		if (event.target !== event.currentTarget) return;
		close();
	};

	const entry = entries.at(index);
	const remaining = entries.length - index - 1;

	return (
		<dialog id="changelog" ref={refDialog} className="layer rounded flex column" translate="yes" onClick={dismiss} onClose={event => close()}>
			{entry !== undefined && <Fragment key={`${session}:${index}`}>
				<div className="changelog-header with-padding large-padding" translate="yes">
					<strong className="changelog-title" translate="yes">{`Update · ${entry.date.toLocaleDateString()}`}</strong>
				</div>
				<ul className="changelog-changes" translate="yes">
					{entry.changes.map((change, number) => <li key={number} translate="yes">{change}</li>)}
				</ul>
				<div className="changelog-footer flex alt-center with-gap with-padding large-padding" translate="yes">
					{remaining > 0 && <>
						<span className="font-smaller-2 changelog-more-info" translate="yes">{`and ${remaining} more update${TextExpert.getPluralSuffix(remaining)} before this`}</span>
						<button type="button" className="with-inline-padding with-padding rounded depth" translate="yes" onClick={event => setIndex(index + 1)}>Load older</button>
					</>}
					<button type="button" className="with-inline-padding with-padding rounded highlight-background" translate="yes" onClick={event => close()}>Got it</button>
				</div>
			</Fragment>}
		</dialog>
	);
}
//#endregion
