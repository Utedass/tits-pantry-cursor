import type {
	Locations,
	ProductBarcodes,
	ProductGroups,
	Products,
	QuantityUnits,
	ShoppingList,
	ShoppingLists,
	ShoppingLocations,
	UserSettings
} from './types.generated.js';

export type Product = Products;
export type ProductBarcode = ProductBarcodes;
export type Location = Locations;
export type QuantityUnit = QuantityUnits;
export type ProductGroup = ProductGroups;
export type ShoppingListItem = ShoppingList;
export type ShoppingListHeader = ShoppingLists;
export type Store = ShoppingLocations;
export type UserSetting = UserSettings;

export type { ProductBarcodes, Products };

export interface SystemInfo {
	grocy_version?: {
		Version?: string;
		ReleaseDate?: string;
	};
	php_version?: string;
	sqlite_version?: string;
}

export interface ProductDetailsResponse {
	product: Product;
	product_barcodes?: ProductBarcode[];
	stock_amount?: number | string | null;
	stock_amount_opened?: number | string | null;
	next_due_date?: string | null;
	location?: Location | null;
	default_location?: Location | null;
	quantity_unit_stock?: QuantityUnit | null;
	default_quantity_unit_purchase?: QuantityUnit | null;
	default_quantity_unit_consume?: QuantityUnit | null;
	has_childs?: boolean | number | string;
	qu_conversion_factor_purchase_to_stock?: number | string | null;
}

export interface ExternalBarcodeLookupResponse {
	name?: string;
	location_id?: number | string | null;
	qu_id_purchase?: number | string | null;
	qu_id_stock?: number | string | null;
	qu_factor_purchase_to_stock?: number | string | null;
	barcode?: string;
	id?: number | string;
}

export interface StockAddBody {
	amount: number;
	best_before_date?: string;
	transaction_type?: string;
	price?: number;
	location_id?: number;
	shopping_location_id?: number;
	stock_label_type?: number;
	note?: string;
}

export interface StockConsumeBody {
	amount: number;
	spoiled?: boolean;
	transaction_type?: string;
	location_id?: number;
	exact?: boolean;
	allow_subproduct_substitution?: boolean;
}

export interface CreateProductBody {
	name: string;
	location_id: number;
	qu_id_purchase: number;
	qu_id_stock: number;
	qu_id_consume?: number;
	description?: string | null;
	parent_product_id?: number | null;
	no_own_stock?: number;
	active?: number;
	min_stock_amount?: number;
	default_best_before_days?: number;
	quick_consume_amount?: number;
}

export function asNumber(value: unknown, fallback = 0): number {
	const n = Number(value);
	return Number.isFinite(n) ? n : fallback;
}

export function asNumberOrNull(value: unknown): number | null {
	if (value === null || value === undefined || value === '') return null;
	const n = Number(value);
	return Number.isFinite(n) ? n : null;
}

export function isTruthyFlag(value: unknown): boolean {
	return value === true || value === 1 || value === '1';
}
