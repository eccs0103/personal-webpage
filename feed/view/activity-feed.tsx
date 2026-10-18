"use strict";

import "adaptive-extender/web";
import { type Dispatch, memo, type ReactElement, type RefObject, type SetStateAction, type SyntheticEvent, useEffect, useMemo, useRef, useState } from "react";
import { type Activity } from "../models/activity.js";
import { type Platform } from "../models/configuration.js";
import { flushSync } from "react-dom";
import { type FeedListener, type FeedLoader } from "../services/feed-loader.js";
import { TextExpert } from "../services/text-expert.js";
import { AnalyticsService } from "../../environment/services/analytics-service.js";
import { MediaPlay } from "../models/media-play.js";
import { Description, Icon } from "./view-builders.js";

const { baseURI } = document;
const analytics = AnalyticsService.instance;

//#region Reveal observer
class RevealObserver {
	#observer: IntersectionObserver = new IntersectionObserver(this.#reveal.bind(this), { threshold: 0.1 });

	#reveal(entries: IntersectionObserverEntry[]): void {
		const observer = this.#observer;
		for (const { isIntersecting, target } of entries) {
			if (!isIntersecting) continue;
			target.classList.add("revealed");
			observer.unobserve(target);
		}
	}

	observe(element: HTMLElement | null): void {
		if (element === null) return;
		this.#observer.observe(element);
	}
}
//#endregion
//#region Feed pump
class FeedPump {
	#loader: FeedLoader;
	#cards: Dispatch<SetStateAction<readonly (readonly [Activity, ReactElement])[]>>;
	#completed: Dispatch<SetStateAction<boolean>>;
	#isSentinelIntersecting: boolean = true;
	#isRunning: boolean = false;
	#observer: IntersectionObserver | null = null;

	constructor(loader: FeedLoader, cards: Dispatch<SetStateAction<readonly (readonly [Activity, ReactElement])[]>>, completed: Dispatch<SetStateAction<boolean>>) {
		this.#loader = loader;
		this.#cards = cards;
		this.#completed = completed;
	}

	#frame(): Promise<number> {
		return new Promise(resolve => requestAnimationFrame(resolve));
	}

	#finish(): void {
		this.disconnect();
		this.#completed(true);
	}

	#append(cards: readonly (readonly [Activity, ReactElement])[]): void {
		flushSync(() => this.#cards(previous => [...previous, ...cards]));
	}

	async #run(): Promise<void> {
		if (this.#isRunning) return;
		this.#isRunning = true;
		try {
			const loader = this.#loader;
			const listener: FeedListener = this.#append.bind(this);
			while (this.#isSentinelIntersecting) {
				const hasNext = await loader.next(listener);
				if (!hasNext) return this.#finish();
				await this.#frame();
			}
		} finally {
			this.#isRunning = false;
		}
	}

	#observe([entry]: IntersectionObserverEntry[]): void {
		this.#isSentinelIntersecting = entry.isIntersecting;
		void this.#run();
	}

	observe(divSentinel: HTMLDivElement): void {
		const observer = new IntersectionObserver(this.#observe.bind(this), { rootMargin: "200px" });
		this.#observer = observer;
		observer.observe(divSentinel);
	}

	disconnect(): void {
		this.#observer?.disconnect();
		this.#observer = null;
	}
}
//#endregion
//#region Activity card
interface ActivityCardProps {
	activity: Activity;
	content: ReactElement;
	platform: Platform | null;
	reveal: RevealObserver;
	onMenu(platform: Platform): void;
}

const ActivityCard = memo(function ActivityCard({ activity, content, platform, reveal, onMenu }: ActivityCardProps): ReactElement {
	const { timestamp } = activity;
	return (
		<div ref={reveal.observe.bind(reveal)} className="activity layer rounded with-padding with-gap awaiting-reveal" data-platform={activity.platform} translate="yes">
			{platform !== null && <>
				<Icon url={new URL(platform.icon, new URL("../", baseURI))} />
				<h4 className="platform" translate="no">
					<button type="button" className="platform-menu-trigger" translate="no" title={`${platform.name} options`} data-platform={platform.name} onClick={event => onMenu(platform)}>{platform.name}</button>
				</h4>
			</>}
			<time dateTime={timestamp.toISOString()} title={timestamp.toLocaleString()} className="activity-time font-smaller-2" translate="yes">{TextExpert.formatTime(timestamp)}</time>
			{content}
		</div>
	);
});
//#endregion
//#region Activity feed
export interface ActivityFeedProps {
	loader: FeedLoader;
	intro: string;
	outro: string;
	platforms: readonly Platform[];
	onMenu(platform: Platform): void;
}

export function ActivityFeed({ loader, intro, outro, platforms, onMenu }: ActivityFeedProps): ReactElement {
	const [cards, setCards] = useState<readonly (readonly [Activity, ReactElement])[]>([]);
	const [completed, setCompleted] = useState<boolean>(false);
	const [pump] = useState(() => new FeedPump(loader, setCards, setCompleted));
	const [reveal] = useState(() => new RevealObserver());
	const refSentinel: RefObject<HTMLDivElement | null> = useRef(null);
	const registry = useMemo(() => new Map(platforms.map(platform => [platform.name, platform])), [platforms]);

	useEffect(() => {
		const divSentinel = refSentinel.current;
		if (divSentinel === null) return;
		pump.observe(divSentinel);
		return () => pump.disconnect();
	}, [pump]);

	const play = (event: SyntheticEvent<HTMLElement>): void => {
		const playing = event.target;
		if (!(playing instanceof HTMLMediaElement)) return;
		if (!playing.muted) analytics.dispatch("media_play", new MediaPlay(playing.tagName.toLowerCase()));
		for (const element of event.currentTarget.getElements(HTMLMediaElement, "video, audio")) {
			if (element === playing || element.muted || element.paused) continue;
			element.pause();
		}
	};

	return (
		<main className="flex column with-block-gap" translate="yes" onPlayCapture={play}>
			<Description text={intro} className="intro font-smaller-2" />
			{cards.map(([activity, content], index) => <ActivityCard key={index} activity={activity} content={content} platform={registry.get(activity.platform) ?? null} reveal={reveal} onMenu={onMenu} />)}
			{completed ? <Description text={outro} className="outro font-smaller-2" /> : <div ref={refSentinel} className="sentinel" translate="no" />}
		</main>
	);
}
//#endregion
