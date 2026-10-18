"use strict";

import "adaptive-extender/web";
import { type ReactElement, type RefObject, useCallback, useReducer, useRef, useState } from "react";
import { type ChangelogEntry } from "../models/changelog.js";
import { type Configuration, type Platform } from "../models/configuration.js";
import { PlatformToggle } from "../models/platform-toggle.js";
import { type ChangelogService } from "../services/changelog-service.js";
import { type FeedLoader } from "../services/feed-loader.js";
import { type SettingsService } from "../services/settings-service.js";
import { AnalyticsService } from "../../environment/services/analytics-service.js";
import { AppearanceService } from "../../environment/services/appearance-service.js";
import { ActivityFeed } from "./activity-feed.js";
import { ChangelogDialog } from "./changelog-dialog.js";
import { ConnectionsHub } from "./connections-hub.js";
import { PlatformMenu } from "./platform-menu.js";
import { Spotlight } from "./spotlight.js";
import { WelcomeDialog } from "./welcome-dialog.js";

const { body } = document;
const analytics = AnalyticsService.instance;
const appearance = AppearanceService.instance;

//#region Theme button
interface ThemeButtonProps {
	ref: RefObject<HTMLButtonElement | null>;
}

function ThemeButton({ ref }: ThemeButtonProps): ReactElement {
	const [theme, setTheme] = useState(appearance.theme);

	const cycle = async (): Promise<void> => {
		await appearance.next();
		setTheme(appearance.theme);
	};

	return (
		<button ref={ref} id="theme-trigger" type="button" title="Theme" className="flex wrap center with-gap" translate="yes" onClick={event => void cycle()}>
			<span className="icon" translate="no" />
			<span translate="yes">Theme: <span key={theme} id="theme-name" translate="no">{theme}</span></span>
		</button>
	);
}
//#endregion
//#region Feed app
export interface FeedAppProps {
	configuration: Configuration;
	settings: SettingsService;
	changelog: ChangelogService;
	unseen: readonly ChangelogEntry[];
	welcome: boolean;
	loader: FeedLoader;
}

export function FeedApp({ configuration, settings, changelog, unseen, welcome, loader }: FeedAppProps): ReactElement {
	const { platforms, intro, outro } = configuration;
	const [hub, setHub] = useState<boolean>(false);
	const [news, setNews] = useState<boolean>(unseen.length > 0);
	const [entries, setEntries] = useState<readonly ChangelogEntry[]>(unseen);
	const [session, setSession] = useState<number>(0);
	const [menu, setMenu] = useState<boolean>(false);
	const [chosen, setChosen] = useState<Platform | null>(null);
	const [greeting, setGreeting] = useState<boolean>(welcome);
	const [, refresh] = useReducer((version: number) => version + 1, 0);
	const refTheme: RefObject<HTMLButtonElement | null> = useRef(null);
	const preferences = settings.readPreferences();

	const read = (): void => {
		setEntries(changelog.entries);
		setSession(session + 1);
		setNews(true);
	};

	const choose = useCallback((platform: Platform): void => {
		setChosen(platform);
		setMenu(true);
	}, []);

	const toggle = (name: string, checked: boolean): void => {
		preferences.set(name, checked);
		analytics.dispatch("platform_toggle", new PlatformToggle(name, checked));
		void settings.save(200);
		refresh();
	};

	const hide = (platform: Platform): void => {
		toggle(platform.name, false);
		setMenu(false);
	};

	const reopen = (): void => {
		setMenu(false);
		setHub(true);
	};

	const filter = (): void => {
		const buttonPlatformMenuTrigger = [...body.getElements(HTMLButtonElement, "main button.platform-menu-trigger")].find(button => button.checkVisibility());
		if (buttonPlatformMenuTrigger === undefined) return setHub(true);
		new Spotlight(buttonPlatformMenuTrigger).focus();
	};

	const highlight = (): void => {
		const buttonThemeTrigger = refTheme.current;
		if (buttonThemeTrigger === null) return;
		new Spotlight(buttonThemeTrigger).focus();
	};

	return (
		<>
			<header className="flex column alt-center with-gap" translate="yes">
				<img src={String(new URL("../../assets/icons/circuit-2-gif-alpha-512.gif", import.meta.url))} fetchPriority="high" className="logo" alt="eccs0103 logo" translate="yes" />
				<ThemeButton ref={refTheme} />
				<button id="changelog-trigger" type="button" title="Change log" className="flex reversed wrap center with-gap" translate="yes" hidden={changelog.entries.length < 1} onClick={event => read()}>
					<span className="icon" translate="no" />
					<span translate="yes">Change log</span>
				</button>
				<button id="connections-hub-trigger" type="button" title="Platforms" className="flex wrap center with-gap" translate="yes" onClick={event => setHub(true)}>
					<span className="icon" translate="no" />
					<span translate="yes">Platforms</span>
				</button>
			</header>
			<ActivityFeed loader={loader} intro={intro} outro={outro} platforms={platforms} onMenu={choose} />
			<footer className="flex column alt-center with-gap" translate="yes">
				<span translate="yes">© <span id="footer-year" translate="no">{new Date().getFullYear()}</span> <span translate="no">Arman</span> </span>
			</footer>
			<ConnectionsHub platforms={platforms} preferences={preferences} open={hub} onToggle={toggle} onClose={() => setHub(false)} />
			<ChangelogDialog entries={entries} session={session} open={news} onClose={() => setNews(false)} />
			<PlatformMenu platform={chosen} open={menu} onHide={hide} onHub={reopen} onClose={() => setMenu(false)} />
			<WelcomeDialog open={greeting} changelog={changelog.entries.length > 0} onProfiles={() => setHub(true)} onFilters={filter} onTheme={highlight} onChangelog={read} onClose={() => setGreeting(false)} />
		</>
	);
}
//#endregion
