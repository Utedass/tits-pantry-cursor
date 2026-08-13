import { grocy } from './client.js';
import type {
	Location,
	Product,
	ProductBarcode,
	ProductGroup,
	QuantityUnit,
	ShoppingListHeader,
	ShoppingListItem,
	UserSetting
} from './types.js';

class Catalog {
	products = $state.raw<Product[]>([]);
	barcodes = $state.raw<ProductBarcode[]>([]);
	locations = $state.raw<Location[]>([]);
	units = $state.raw<QuantityUnit[]>([]);
	groups = $state.raw<ProductGroup[]>([]);
	shoppingLists = $state.raw<ShoppingListHeader[]>([]);
	shoppingItems = $state.raw<ShoppingListItem[]>([]);
	userSettings = $state.raw<UserSetting[]>([]);
	loading = $state(false);
	error = $state<string | null>(null);
	loaded = $state(false);

	productById(id: number): Product | undefined {
		return this.products.find((p) => p.id === id);
	}

	async refresh() {
		this.loading = true;
		this.error = null;
		try {
			const [products, barcodes, locations, units, groups, shoppingLists, shoppingItems, userSettings] =
				await Promise.all([
					grocy.listProducts(),
					grocy.listBarcodes(),
					grocy.listLocations(),
					grocy.listQuantityUnits(),
					grocy.listProductGroups(),
					grocy.listShoppingLists(),
					grocy.listShoppingListItems(),
					grocy.listUserSettings()
				]);
			this.products = products;
			this.barcodes = barcodes;
			this.locations = locations;
			this.units = units;
			this.groups = groups;
			this.shoppingLists = shoppingLists;
			this.shoppingItems = shoppingItems;
			this.userSettings = userSettings;
			this.loaded = true;
		} catch (error) {
			this.error = error instanceof Error ? error.message : String(error);
			throw error;
		} finally {
			this.loading = false;
		}
	}
}

export const catalog = new Catalog();
