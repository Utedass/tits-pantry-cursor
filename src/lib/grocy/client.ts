import { settings } from '$lib/settings.svelte.js';
import { format, sv } from '$lib/i18n/sv.js';
import { endpoints } from './endpoints.js';
import type {
	CreateProductBody,
	ExternalBarcodeLookupResponse,
	Location,
	Product,
	ProductBarcode,
	ProductDetailsResponse,
	ProductGroup,
	QuantityUnit,
	ShoppingListHeader,
	ShoppingListItem,
	StockAddBody,
	StockConsumeBody,
	Store,
	SystemInfo,
	UserSetting
} from './types.js';

export class GrocyError extends Error {
	status: number;
	body: unknown;
	corsLikely: boolean;

	constructor(message: string, status: number, body: unknown, corsLikely = false) {
		super(message);
		this.name = 'GrocyError';
		this.status = status;
		this.body = body;
		this.corsLikely = corsLikely;
	}
}

function apiBase(): string {
	let base = settings.grocyUrl.trim().replace(/\/+$/, '');
	if (base.toLowerCase().endsWith('/api')) {
		base = base.slice(0, -4);
	}
	return base;
}

function buildUrl(path: string, query?: Record<string, string | string[] | undefined>): string {
	const url = new URL(`${apiBase()}/api/${path.replace(/^\//, '')}`);
	if (query) {
		for (const [key, value] of Object.entries(query)) {
			if (value === undefined) continue;
			if (Array.isArray(value)) {
				for (const item of value) url.searchParams.append(key, item);
			} else {
				url.searchParams.set(key, value);
			}
		}
	}
	return url.toString();
}

async function request<T>(
	path: string,
	init: RequestInit & { query?: Record<string, string | string[] | undefined> } = {}
): Promise<T> {
	const { query, ...rest } = init;
	const headers = new Headers(rest.headers);
	headers.set('GROCY-API-KEY', settings.apiKey);
	headers.set('Accept', 'application/json');
	if (rest.body && !headers.has('Content-Type')) {
		headers.set('Content-Type', 'application/json');
	}

	let response: Response;
	try {
		response = await fetch(buildUrl(path, query), {
			...rest,
			headers,
			credentials: 'omit'
		});
	} catch (error) {
		throw new GrocyError(sv.errors.cors, 0, error, true);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	const text = await response.text();
	const json = text ? JSON.parse(text) : null;

	if (!response.ok) {
		throw new GrocyError(
			format(sv.errors.requestFailed, { status: response.status }),
			response.status,
			json
		);
	}

	return json as T;
}

export const grocy = {
	getSystemInfo() {
		return request<SystemInfo>(endpoints.systemInfo);
	},

	listProducts() {
		return request<Product[]>(endpoints.products);
	},

	listBarcodes() {
		return request<ProductBarcode[]>(endpoints.barcodes);
	},

	listLocations() {
		return request<Location[]>(endpoints.locations);
	},

	listQuantityUnits() {
		return request<QuantityUnit[]>(endpoints.quantityUnits);
	},

	listProductGroups() {
		return request<ProductGroup[]>(endpoints.productGroups);
	},

	listStores() {
		return request<Store[]>(endpoints.stores);
	},

	listShoppingLists() {
		return request<ShoppingListHeader[]>(endpoints.shoppingLists);
	},

	listShoppingListItems() {
		return request<ShoppingListItem[]>(endpoints.shoppingList);
	},

	async listUserSettings() {
		const raw = await request<UserSetting[] | Record<string, string>>(endpoints.userSettings);
		if (Array.isArray(raw)) return raw;
		return Object.entries(raw ?? {}).map(([key, value], index) => ({
			id: index,
			user_id: 0,
			key,
			value: value ?? null,
			row_created_timestamp: null,
			row_updated_timestamp: null
		}));
	},

	getProduct(id: number) {
		return request<Product>(`${endpoints.products}/${id}`);
	},

	createProduct(body: CreateProductBody) {
		return request<{ created_object_id: number }>(endpoints.products, {
			method: 'POST',
			body: JSON.stringify(body)
		});
	},

	updateProduct(id: number, body: Record<string, unknown>) {
		return request<void>(`${endpoints.products}/${id}`, {
			method: 'PUT',
			body: JSON.stringify(body)
		});
	},

	createBarcode(body: { product_id: number; barcode: string; amount?: number; qu_id?: number }) {
		return request<{ created_object_id: number }>(endpoints.barcodes, {
			method: 'POST',
			body: JSON.stringify(body)
		});
	},

	productByBarcode(barcode: string) {
		return request<ProductDetailsResponse>(endpoints.byBarcode(barcode));
	},

	externalLookup(barcode: string) {
		return request<ExternalBarcodeLookupResponse | null>(endpoints.externalLookup(barcode));
	},

	addStock(productId: number, body: StockAddBody) {
		return request<unknown>(endpoints.addStock(productId), {
			method: 'POST',
			body: JSON.stringify(body)
		});
	},

	consumeStock(productId: number, body: StockConsumeBody) {
		return request<unknown>(endpoints.consumeStock(productId), {
			method: 'POST',
			body: JSON.stringify(body)
		});
	},

	addToShoppingList(productId: number, amount = 1) {
		return request<void>(endpoints.addShopping, {
			method: 'POST',
			body: JSON.stringify({ product_id: productId, product_amount: amount })
		});
	}
};
