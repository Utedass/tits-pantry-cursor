/** Grocy 4.5.0 API paths used by Tit's Pantry. */
export const endpoints = {
	systemInfo: 'system/info',
	products: 'objects/products',
	barcodes: 'objects/product_barcodes',
	locations: 'objects/locations',
	quantityUnits: 'objects/quantity_units',
	productGroups: 'objects/product_groups',
	stores: 'objects/shopping_locations',
	shoppingLists: 'objects/shopping_lists',
	shoppingList: 'objects/shopping_list',
	userSettings: 'user/settings',
	byBarcode: (barcode: string) => `stock/products/by-barcode/${encodeURIComponent(barcode)}`,
	externalLookup: (barcode: string) =>
		`stock/barcodes/external-lookup/${encodeURIComponent(barcode)}`,
	addStock: (id: number) => `stock/products/${id}/add`,
	consumeStock: (id: number) => `stock/products/${id}/consume`,
	addShopping: 'stock/shoppinglist/add-product'
} as const;
