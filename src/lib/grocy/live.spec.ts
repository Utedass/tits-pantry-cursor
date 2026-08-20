import { describe, expect, it } from 'vitest';
import { grocyConfigured, grocyRequest } from '../../../scripts/grocy.mjs';

const live = grocyConfigured();

describe.skipIf(!live)('Grocy live API', () => {
	it('returns Grocy 4.x system info', async () => {
		const info = await grocyRequest('GET', 'system/info');
		expect(info).toBeTruthy();
		expect(String((info as { grocy_version?: { Version?: string } }).grocy_version?.Version)).toMatch(
			/^4\./
		);
	});

	it('lists locations', async () => {
		const locations = await grocyRequest('GET', 'objects/locations');
		expect(Array.isArray(locations)).toBe(true);
		expect((locations as unknown[]).length).toBeGreaterThan(0);
	});
});
