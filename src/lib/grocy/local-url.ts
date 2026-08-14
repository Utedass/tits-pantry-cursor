export const DEV_PROXY_PREFIX = '/grocy-proxy';
export const GROCY_ORIGIN_HEADER = 'x-grocy-origin';

const LOOPBACK = new Set(['localhost', '127.0.0.1', '::1']);

export function grocyBaseUrl(raw: string): string {
	let base = raw.trim().replace(/\/+$/, '');
	if (base.toLowerCase().endsWith('/api')) {
		base = base.slice(0, -4);
	}
	return base;
}

export function isLoopbackGrocyUrl(raw: string): boolean {
	return loopbackProxyTarget(raw) != null;
}

/** Same-origin Vite target, always IPv4, so Windows does not try ::1. */
export function loopbackProxyTarget(raw: string): string | null {
	try {
		const url = new URL(grocyBaseUrl(raw));
		const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
		if (!LOOPBACK.has(host)) return null;
		if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
		const port = url.port ? `:${url.port}` : '';
		return `${url.protocol}//127.0.0.1${port}`;
	} catch {
		return null;
	}
}

export function usesDevProxy(raw: string, isDev: boolean): boolean {
	return isDev && isLoopbackGrocyUrl(raw);
}
