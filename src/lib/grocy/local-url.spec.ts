import { describe, expect, it } from 'vitest';
import {
	grocyBaseUrl,
	isLoopbackGrocyUrl,
	loopbackProxyTarget,
	usesDevProxy
} from './local-url.js';

describe('grocyBaseUrl', () => {
	it('strips trailing slash and /api', () => {
		expect(grocyBaseUrl('http://127.0.0.1:9283/api/')).toBe('http://127.0.0.1:9283');
	});
});

describe('loopbackProxyTarget', () => {
	it('rewrites localhost to 127.0.0.1', () => {
		expect(loopbackProxyTarget('http://localhost:9283')).toBe('http://127.0.0.1:9283');
	});

	it('rejects non-loopback hosts', () => {
		expect(loopbackProxyTarget('http://192.168.1.10:9283')).toBeNull();
		expect(loopbackProxyTarget('https://grocy.example')).toBeNull();
	});

	it('accepts 127.0.0.1', () => {
		expect(isLoopbackGrocyUrl('http://127.0.0.1:9283')).toBe(true);
	});
});

describe('usesDevProxy', () => {
	it('is only for loopback during dev', () => {
		expect(usesDevProxy('http://localhost:9283', true)).toBe(true);
		expect(usesDevProxy('http://localhost:9283', false)).toBe(false);
		expect(usesDevProxy('https://grocy.example', true)).toBe(false);
	});
});
