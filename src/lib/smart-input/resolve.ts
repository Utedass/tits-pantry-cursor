import {
	asNumber,
	isTruthyFlag,
	type Product,
	type ProductBarcode,
	type UserSetting
} from '$lib/grocy/types.js';
import type { InputKind } from './classify.js';

export type SmartMode = 'consume' | 'add';
export type SmartAction = 'consume' | 'add' | 'inventory' | 'shopping';

export type ReadyResolution = {
	status: 'ready';
	product: Product;
	barcode: ProductBarcode | null;
	primary: SmartAction;
	actions: SmartAction[];
	amount: number;
	locationId: number | null;
	stockAmount: number | null;
};

export type AmbiguousResolution = {
	status: 'ambiguous';
	reason: 'name' | 'parent';
	candidates: Product[];
};

export type UnknownResolution = {
	status: 'unknown';
	barcode: string;
};

export type EmptyResolution = {
	status: 'empty';
};

export type Resolution = ReadyResolution | AmbiguousResolution | UnknownResolution | EmptyResolution;

function settingMap(rows: UserSetting[]): Record<string, string> {
	const map: Record<string, string> = {};
	for (const row of rows) {
		if (row.key) map[row.key] = row.value ?? '';
	}
	return map;
}

export function pickConsumeAmount(
	product: Product,
	barcode: ProductBarcode | null,
	userSettings: UserSetting[]
): number {
	const barcodeAmount = asNumber(barcode?.amount, 0);
	if (barcodeAmount > 0) return barcodeAmount;
	const settings = settingMap(userSettings);
	if (settings.stock_default_consume_amount_use_quick_consume_amount === '1') {
		return asNumber(product.quick_consume_amount, 1) || 1;
	}
	const fallback = asNumber(settings.stock_default_consume_amount, 1);
	return fallback > 0 ? fallback : 1;
}

export function pickAddAmount(
	product: Product,
	barcode: ProductBarcode | null,
	userSettings: UserSetting[]
): number {
	const barcodeAmount = asNumber(barcode?.amount, 0);
	if (barcodeAmount > 0) return barcodeAmount;
	const settings = settingMap(userSettings);
	const fallback = asNumber(settings.stock_default_purchase_amount, 1);
	return fallback > 0 ? fallback : 1;
}

export function pickConsumeLocationId(product: Product): number | null {
	return product.default_consume_location_id ?? product.location_id ?? null;
}

export function pickAddLocationId(product: Product): number | null {
	return product.location_id ?? null;
}

export function childrenOf(parentId: number, products: Product[]): Product[] {
	return products.filter((p) => p.parent_product_id === parentId && p.active !== 0);
}

export function searchProductsByName(query: string, products: Product[]): Product[] {
	const needle = query.trim().toLowerCase();
	if (!needle) return [];
	return products.filter((p) => p.active !== 0 && p.name.toLowerCase().includes(needle));
}

export function findBarcode(code: string, barcodes: ProductBarcode[]): ProductBarcode | undefined {
	const needle = code.trim();
	return barcodes.find((b) => b.barcode === needle);
}

export function resolveReady(opts: {
	product: Product;
	products: Product[];
	barcode: ProductBarcode | null;
	mode: SmartMode;
	userSettings: UserSetting[];
}): ReadyResolution | AmbiguousResolution {
	const { product, products, barcode, mode, userSettings } = opts;
	if (isTruthyFlag(product.no_own_stock)) {
		const kids = childrenOf(product.id, products);
		if (kids.length > 1) {
			return { status: 'ambiguous', reason: 'parent', candidates: kids };
		}
		if (kids.length === 1) {
			return resolveReady({ ...opts, product: kids[0], barcode: null });
		}
	}

	const primary: SmartAction = mode === 'add' ? 'add' : 'consume';
	const amount =
		primary === 'add'
			? pickAddAmount(product, barcode, userSettings)
			: pickConsumeAmount(product, barcode, userSettings);
	const locationId = primary === 'add' ? pickAddLocationId(product) : pickConsumeLocationId(product);

	return {
		status: 'ready',
		product,
		barcode,
		primary,
		actions: ['consume', 'add', 'inventory', 'shopping'],
		amount,
		locationId,
		stockAmount: null
	};
}

export function resolveFromNameMatches(
	matches: Product[],
	opts: Omit<Parameters<typeof resolveReady>[0], 'product' | 'barcode'>
): Resolution {
	if (matches.length === 0) return { status: 'empty' };
	if (matches.length === 1) {
		return resolveReady({ ...opts, product: matches[0], barcode: null });
	}
	return { status: 'ambiguous', reason: 'name', candidates: matches };
}

export function resolveFromKind(kind: InputKind, value: string): { lookupBarcode: boolean } {
	return { lookupBarcode: kind === 'barcode' && value.length > 0 };
}
