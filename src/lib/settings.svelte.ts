import { browser } from '$app/environment';

const STORAGE_KEY = 'tits-pantry-settings';
export const DEFAULT_TIMEOUT_MS = 4000;

export type AppSettings = {
	grocyUrl: string;
	apiKey: string;
	timeoutMs: number;
};

function readStored(): AppSettings {
	if (!browser) {
		return { grocyUrl: '', apiKey: '', timeoutMs: DEFAULT_TIMEOUT_MS };
	}
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return { grocyUrl: '', apiKey: '', timeoutMs: DEFAULT_TIMEOUT_MS };
		const parsed = JSON.parse(raw) as Partial<AppSettings>;
		return {
			grocyUrl: typeof parsed.grocyUrl === 'string' ? parsed.grocyUrl : '',
			apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
			timeoutMs:
				typeof parsed.timeoutMs === 'number' && parsed.timeoutMs > 0
					? parsed.timeoutMs
					: DEFAULT_TIMEOUT_MS
		};
	} catch {
		return { grocyUrl: '', apiKey: '', timeoutMs: DEFAULT_TIMEOUT_MS };
	}
}

class SettingsStore {
	grocyUrl = $state('');
	apiKey = $state('');
	timeoutMs = $state(DEFAULT_TIMEOUT_MS);

	constructor() {
		const stored = readStored();
		this.grocyUrl = stored.grocyUrl;
		this.apiKey = stored.apiKey;
		this.timeoutMs = stored.timeoutMs;
	}

	get configured(): boolean {
		return this.grocyUrl.trim() !== '' && this.apiKey.trim() !== '';
	}

	get mixedContentRisk(): boolean {
		if (!browser) return false;
		const pageHttps = window.location.protocol === 'https:';
		const apiHttp = this.grocyUrl.trim().toLowerCase().startsWith('http://');
		return pageHttps && apiHttp;
	}

	save(next: AppSettings) {
		this.grocyUrl = next.grocyUrl.trim().replace(/\/+$/, '');
		this.apiKey = next.apiKey.trim();
		this.timeoutMs = next.timeoutMs > 0 ? next.timeoutMs : DEFAULT_TIMEOUT_MS;
		if (!browser) return;
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				grocyUrl: this.grocyUrl,
				apiKey: this.apiKey,
				timeoutMs: this.timeoutMs
			} satisfies AppSettings)
		);
	}
}

export const settings = new SettingsStore();
