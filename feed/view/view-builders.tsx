"use strict";

import "adaptive-extender/web";
import { type AnchorHTMLAttributes, type CSSProperties, Fragment, type HTMLAttributes, type ImgHTMLAttributes, type ReactElement, type RefObject, type UIEvent, useEffect, useRef, useState } from "react";

const { round } = Math;

//#region View builders
export interface LinkCreationOptions {
	text: string;
	disabled: boolean;
	translate: boolean;
}

export interface LinesProps {
	text: string;
}

export function Lines({ text }: LinesProps): ReactElement {
	return <>{text.split("\n").map((line, index) => <Fragment key={index}>{index > 0 && <br />}{line}</Fragment>)}</>;
}

export interface TextboxProps extends Pick<HTMLAttributes<HTMLSpanElement>, "className" | "translate"> {
	text: string;
}

export function Textbox({ text, className, translate = "yes" }: TextboxProps): ReactElement {
	return <span className={className} translate={translate}><Lines text={text} /></span>;
}

export interface DescriptionProps extends Pick<HTMLAttributes<HTMLSpanElement>, "className" | "translate"> {
	text: string;
}

export function Description({ text, className, translate = "yes" }: DescriptionProps): ReactElement {
	const classes = className === undefined ? "description" : `description ${className}`;
	return <span className={classes} translate={translate}><Lines text={text} /></span>;
}

export interface ExternalLinkProps extends Pick<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "translate" | "role" | "download" | "children"> {
	url: Readonly<URL>;
	text?: string;
	disabled?: boolean;
}

export function ExternalLink({ url, text, disabled = false, translate = "yes", className, role, download, children }: ExternalLinkProps): ReactElement {
	return (
		<a href={String(url)} target="_blank" rel="noopener noreferrer" inert={disabled} translate={translate} className={className} role={role} download={download}>
			{text !== undefined && <Lines text={text} />}
			{children}
		</a>
	);
}

interface IconStyle extends CSSProperties {
	"--url": string;
}

export interface IconProps extends Pick<HTMLAttributes<HTMLSpanElement>, "className"> {
	url: Readonly<URL>;
}

export function Icon({ url, className }: IconProps): ReactElement {
	const style: IconStyle = { "--url": `url("${url}")` };
	const classes = className === undefined ? "icon" : `icon ${className}`;
	return <span className={classes} translate="no" style={style} />;
}

export function ExternalIcon(): ReactElement {
	return <span className="icon in-line external" translate="no" />;
}

export interface LazyImageProps extends Pick<ImgHTMLAttributes<HTMLImageElement>, "className" | "translate" | "loading" | "fetchPriority"> {
	url: Readonly<URL>;
	text: string;
}

export function LazyImage({ url, text, className, loading = "lazy", translate = "yes", fetchPriority }: LazyImageProps): ReactElement {
	return <img src={String(url)} alt={text} loading={loading} translate={translate} fetchPriority={fetchPriority} className={className} />;
}

export interface CarouselProps {
	slides: readonly ReactElement[];
}

export function Carousel({ slides }: CarouselProps): ReactElement {
	const [current, setCurrent] = useState<number>(0);
	const refTrack: RefObject<HTMLDivElement | null> = useRef(null);
	const last = slides.length - 1;

	const track = (): HTMLDivElement => {
		const divTrack = refTrack.current;
		if (divTrack === null) throw new ReferenceError("Carousel track is not mounted");
		return divTrack;
	};

	const shift = (direction: number): void => {
		const divTrack = track();
		divTrack.scrollBy({ left: direction * divTrack.clientWidth, behavior: "smooth" });
	};

	const jump = (index: number): void => {
		const divTrack = track();
		divTrack.scrollTo({ left: index * divTrack.clientWidth, behavior: "smooth" });
	};

	const follow = (event: UIEvent<HTMLDivElement>): void => {
		const { scrollLeft, clientWidth } = event.currentTarget;
		setCurrent(round(scrollLeft / clientWidth));
	};

	return (
		<div className="media-carousel" translate="yes">
			<div ref={refTrack} className="media-carousel-track" translate="yes" onScroll={slides.length > 1 ? follow : undefined}>
				{slides.map((slide, index) => <div key={index} className="media-carousel-slide depth" translate="yes">{slide}</div>)}
			</div>
			{slides.length > 1 && <>
				<button type="button" hidden={current === 0} className="carousel-nav carousel-previous flex center" translate="no" onClick={event => shift(-1)}>
					<span className="icon" translate="no" />
				</button>
				<button type="button" hidden={current === last} className="carousel-nav carousel-next flex center" translate="no" onClick={event => shift(1)}>
					<span className="icon" translate="no" />
				</button>
				<div className="carousel-dots flex with-gap small-gap" translate="no">
					{slides.map((slide, index) => <span key={index} className={index === current ? "carousel-dot active" : "carousel-dot"} translate="no" onClick={event => jump(index)} />)}
				</div>
			</>}
		</div>
	);
}

export function useModal(open: boolean): RefObject<HTMLDialogElement | null> {
	const refDialog: RefObject<HTMLDialogElement | null> = useRef(null);

	useEffect(() => {
		const dialog = refDialog.current;
		if (dialog === null) return;
		if (dialog.open === open) return;
		if (open) {
			dialog.showModal();
			return;
		}
		dialog.close();
	}, [open]);

	return refDialog;
}
//#endregion
