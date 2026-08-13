import { describe, expect, it } from 'vitest';
import type { Product, ProductBarcode, UserSetting } from '$lib/grocy/types.js';
import {
	pickAddAmount,
	pickConsumeAmount,
	resolveFromNameMatches,
	resolveReady
} from './resolve.js';

function product(partial: Partial<Product> & Pick<Product, 'id' | 'name'>): Product {
	return {
		description: null,
		product_group_id: null,
		active: 1,
		location_id: 4,
		shopping_location_id: null,
		qu_id_purchase: 3,
		qu_id_stock: 3,
		min_stock_amount: 0,
		default_best_before_days: 0,
		default_best_before_days_after_open: 0,
		default_best_before_days_after_freezing: 0,
		default_best_before_days_after_thawing: 0,
		picture_file_name: null,
		enable_tare_weight_handling: 0,
		tare_weight: 0,
		not_check_stock_fulfillment_for_recipes: 0,
		parent_product_id: null,
		calories: null,
		cumulate_min_stock_amount_of_sub_products: 0,
		due_type: 1,
		quick_consume_amount: 1,
		hide_on_stock_overview: 0,
		default_stock_label_type: 0,
		should_not_be_frozen: 0,
		treat_opened_as_out_of_stock: 1,
		no_own_stock: 0,
		default_consume_location_id: null,
		move_on_open: 0,
		row_created_timestamp: null,
		qu_id_consume: 3,
		auto_reprint_stock_label: 0,
		quick_open_amount: 1,
		qu_id_price: 3,
		disable_open: 0,
		default_purchase_price_type: 1,
		...partial
	};
}

describe('amounts', () => {
	it('prefers barcode pack amount', () => {
		const barcode = { amount: 6 } as ProductBarcode;
		const p = product({ id: 1, name: 'Mjölk', quick_consume_amount: 1 });
		expect(pickConsumeAmount(p, barcode, [])).toBe(6);
		expect(pickAddAmount(p, barcode, [])).toBe(6);
	});

	it('uses quick consume when the user setting is on', () => {
		const p = product({ id: 1, name: 'Mjölk', quick_consume_amount: 2 });
		const settings = [
			{ key: 'stock_default_consume_amount_use_quick_consume_amount', value: '1' }
		] as UserSetting[];
		expect(pickConsumeAmount(p, null, settings)).toBe(2);
	});
});

describe('resolveReady', () => {
	it('asks for a child when parent has no own stock', () => {
		const parent = product({ id: 1, name: 'Lättmjölk', no_own_stock: 1 });
		const a = product({ id: 2, name: 'Arla', parent_product_id: 1 });
		const b = product({ id: 3, name: 'Garant', parent_product_id: 1 });
		const result = resolveReady({
			product: parent,
			products: [parent, a, b],
			barcode: null,
			mode: 'consume',
			userSettings: []
		});
		expect(result.status).toBe('ambiguous');
		if (result.status === 'ambiguous') {
			expect(result.reason).toBe('parent');
			expect(result.candidates).toHaveLength(2);
		}
	});

	it('defaults to consume on smart mode', () => {
		const p = product({ id: 1, name: 'Mjölk' });
		const result = resolveReady({
			product: p,
			products: [p],
			barcode: null,
			mode: 'consume',
			userSettings: []
		});
		expect(result.status).toBe('ready');
		if (result.status === 'ready') expect(result.primary).toBe('consume');
	});
});

describe('resolveFromNameMatches', () => {
	it('is empty when nothing matches', () => {
		expect(
			resolveFromNameMatches([], {
				products: [],
				mode: 'consume',
				userSettings: []
			})
		).toEqual({ status: 'empty' });
	});

	it('is ambiguous for several names', () => {
		const result = resolveFromNameMatches(
			[product({ id: 1, name: 'A' }), product({ id: 2, name: 'B' })],
			{ products: [], mode: 'consume', userSettings: [] }
		);
		expect(result.status).toBe('ambiguous');
	});
});
