import { describe, expect, it } from 'vitest';
import { classifyInput } from './classify.js';

describe('classifyInput', () => {
	it('treats EAN-13 as barcode', () => {
		expect(classifyInput('7310865004703')).toEqual({
			kind: 'barcode',
			value: '7310865004703'
		});
	});

	it('strips spaces in barcodes', () => {
		expect(classifyInput('  73108650 04703 ')).toEqual({
			kind: 'barcode',
			value: '7310865004703'
		});
	});

	it('treats grocycode as barcode', () => {
		expect(classifyInput('grcy:p:12')).toEqual({ kind: 'barcode', value: 'grcy:p:12' });
	});

	it('treats product names as name search', () => {
		expect(classifyInput('Lättmjölk')).toEqual({ kind: 'name', value: 'Lättmjölk' });
	});
});
