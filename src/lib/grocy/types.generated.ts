/** Generated from local grocy.db — do not edit by hand. Run `npm run gen:types`. */

export interface Products {
	id: number;
	name: string;
	description: string | null;
	product_group_id: number | null;
	active: number;
	location_id: number;
	shopping_location_id: number | null;
	qu_id_purchase: number;
	qu_id_stock: number;
	min_stock_amount: number;
	default_best_before_days: number;
	default_best_before_days_after_open: number;
	default_best_before_days_after_freezing: number;
	default_best_before_days_after_thawing: number;
	picture_file_name: string | null;
	enable_tare_weight_handling: number;
	tare_weight: number;
	not_check_stock_fulfillment_for_recipes: number | null;
	parent_product_id: number | null;
	calories: number | null;
	cumulate_min_stock_amount_of_sub_products: number | null;
	due_type: number;
	quick_consume_amount: number;
	hide_on_stock_overview: number;
	default_stock_label_type: number;
	should_not_be_frozen: number;
	treat_opened_as_out_of_stock: number;
	no_own_stock: number;
	default_consume_location_id: number | null;
	move_on_open: number;
	row_created_timestamp: string | null;
	qu_id_consume: number | null;
	auto_reprint_stock_label: number;
	quick_open_amount: number;
	qu_id_price: number | null;
	disable_open: number;
	default_purchase_price_type: number;
}

export interface ProductBarcodes {
	id: number;
	product_id: number;
	barcode: string;
	qu_id: number | null;
	amount: number | null;
	shopping_location_id: number | null;
	last_price: number | null;
	row_created_timestamp: string | null;
	note: string | null;
}

export interface Stock {
	id: number;
	product_id: number;
	amount: number;
	best_before_date: string | null;
	purchased_date: string | null;
	stock_id: string;
	price: number | null;
	open: number;
	opened_date: string | null;
	row_created_timestamp: string | null;
	location_id: number | null;
	shopping_location_id: number | null;
	note: string | null;
}

export interface Locations {
	id: number;
	name: string;
	description: string | null;
	row_created_timestamp: string | null;
	is_freezer: number;
	active: number;
}

export interface QuantityUnits {
	id: number;
	name: string;
	description: string | null;
	row_created_timestamp: string | null;
	name_plural: string | null;
	plural_forms: string | null;
	active: number;
}

export interface QuantityUnitConversions {
	id: number;
	from_qu_id: number;
	to_qu_id: number;
	factor: number;
	product_id: number | null;
	row_created_timestamp: string | null;
}

export interface ShoppingList {
	id: number;
	product_id: number | null;
	note: string | null;
	amount: number;
	row_created_timestamp: string | null;
	shopping_list_id: number | null;
	done: number | null;
	qu_id: number | null;
}

export interface ShoppingLists {
	id: number;
	name: string;
	description: string | null;
	row_created_timestamp: string | null;
}

export interface ProductGroups {
	id: number;
	name: string;
	description: string | null;
	row_created_timestamp: string | null;
	active: number;
}

export interface ShoppingLocations {
	id: number;
	name: string;
	description: string | null;
	row_created_timestamp: string | null;
	active: number;
}

export interface UserSettings {
	id: number;
	user_id: number;
	key: string;
	value: string | null;
	row_created_timestamp: string | null;
	row_updated_timestamp: string | null;
}
