import { grocy, GrocyError } from '$lib/grocy/client.js';
import { catalog } from '$lib/grocy/catalog.svelte.js';
import {
	asNumber,
	asNumberOrNull,
	type ExternalBarcodeLookupResponse,
	type Product
} from '$lib/grocy/types.js';
import { settings } from '$lib/settings.svelte.js';
import { format, sv } from '$lib/i18n/sv.js';
import { toast } from 'svelte-sonner';
import { classifyInput } from './classify.js';
import {
	findBarcode,
	resolveFromNameMatches,
	resolveReady,
	searchProductsByName,
	type ReadyResolution,
	type Resolution,
	type SmartAction,
	type SmartMode
} from './resolve.js';

export type RecentAdd = { id: number; name: string; amount: number; at: number };

class SmartSession {
	query = $state('');
	resolution = $state.raw<Resolution | null>(null);
	lookup = $state.raw<ExternalBarcodeLookupResponse | null>(null);
	selectedAction = $state<SmartAction>('consume');
	amount = $state(1);
	locationId = $state<number | null>(null);
	updateDefaultLocation = $state(false);
	createOpen = $state(false);
	unknownBarcode = $state('');
	busy = $state(false);
	secondsLeft = $state(0);
	recentAdds = $state.raw<RecentAdd[]>([]);
	inputEl = $state<HTMLInputElement | null>(null);

	#timer: ReturnType<typeof setInterval> | null = null;
	#deadline = 0;

	get ready(): ReadyResolution | null {
		return this.resolution?.status === 'ready' ? this.resolution : null;
	}

	focus() {
		queueMicrotask(() => this.inputEl?.focus());
	}

	clearTimer() {
		if (this.#timer) {
			clearInterval(this.#timer);
			this.#timer = null;
		}
		this.secondsLeft = 0;
	}

	resetToIdle() {
		this.clearTimer();
		this.query = '';
		this.resolution = null;
		this.lookup = null;
		this.createOpen = false;
		this.unknownBarcode = '';
		this.updateDefaultLocation = false;
		this.busy = false;
		this.focus();
	}

	applyReady(ready: ReadyResolution) {
		this.resolution = ready;
		this.selectedAction = ready.primary;
		this.amount = ready.amount;
		this.locationId = ready.locationId;
		this.updateDefaultLocation = false;
		this.startTimeout(false);
	}

	startTimeout(cancelOnly: boolean) {
		this.clearTimer();
		this.#deadline = Date.now() + settings.timeoutMs;
		this.secondsLeft = Math.ceil(settings.timeoutMs / 1000);
		this.#timer = setInterval(() => {
			const left = this.#deadline - Date.now();
			this.secondsLeft = Math.max(0, Math.ceil(left / 1000));
			if (left > 0) return;
			this.clearTimer();
			if (cancelOnly) {
				this.resetToIdle();
				return;
			}
			void this.execute();
		}, 200);
	}

	async submit(mode: SmartMode) {
		const classified = classifyInput(this.query);
		if (!classified.value) return;
		this.clearTimer();
		this.busy = true;
		try {
			if (classified.kind === 'barcode') {
				await this.#fromBarcode(classified.value, mode);
			} else {
				const matches = searchProductsByName(classified.value, catalog.products);
				const resolution = resolveFromNameMatches(matches, {
					products: catalog.products,
					mode,
					userSettings: catalog.userSettings
				});
				this.#applyResolution(resolution, classified.value, mode);
			}
		} finally {
			this.busy = false;
		}
	}

	chooseProduct(product: Product, mode: SmartMode) {
		const ready = resolveReady({
			product,
			products: catalog.products,
			barcode: null,
			mode,
			userSettings: catalog.userSettings
		});
		this.#applyResolution(ready, '', mode);
	}

	async execute() {
		const ready = this.ready;
		if (!ready || this.busy) return;
		const action = this.selectedAction;
		if (action === 'inventory') {
			return;
		}
		this.busy = true;
		this.clearTimer();
		try {
			const id = ready.product.id;
			if (action === 'consume') {
				await grocy.consumeStock(id, {
					amount: this.amount,
					spoiled: false,
					location_id: this.locationId ?? undefined,
					allow_subproduct_substitution: true
				});
				toast.success(format(sv.smart.consumed, { amount: this.amount, name: ready.product.name }));
			} else if (action === 'add') {
				await grocy.addStock(id, {
					amount: this.amount,
					location_id: this.locationId ?? undefined,
					transaction_type: 'purchase'
				});
				if (this.updateDefaultLocation && this.locationId != null) {
					await grocy.updateProduct(id, { location_id: this.locationId });
				}
				this.recentAdds = [
					{ id, name: ready.product.name, amount: this.amount, at: Date.now() },
					...this.recentAdds
				].slice(0, 8);
				toast.success(format(sv.smart.added, { amount: this.amount, name: ready.product.name }));
			} else if (action === 'shopping') {
				await grocy.addToShoppingList(id, this.amount);
				toast.success(format(sv.smart.shopped, { name: ready.product.name }));
			}
			await catalog.refresh();
			this.resetToIdle();
		} catch (error) {
			this.busy = false;
			throw error;
		}
	}

	async saveNewProduct(input: {
		name: string;
		locationId: number;
		purchaseUnitId: number;
		stockUnitId: number;
	}) {
		const created = await grocy.createProduct({
			name: input.name,
			location_id: input.locationId,
			qu_id_purchase: input.purchaseUnitId,
			qu_id_stock: input.stockUnitId,
			qu_id_consume: input.stockUnitId,
			active: 1,
			quick_consume_amount: 1
		});
		const id = created.created_object_id;
		if (this.unknownBarcode) {
			await grocy.createBarcode({
				product_id: id,
				barcode: this.unknownBarcode,
				qu_id: input.stockUnitId
			});
		}
		await catalog.refresh();
		const product = catalog.productById(id);
		if (!product) return id;
		this.applyReady(
			resolveReady({
				product,
				products: catalog.products,
				barcode: findBarcode(this.unknownBarcode, catalog.barcodes) ?? null,
				mode: 'add',
				userSettings: catalog.userSettings
			}) as ReadyResolution
		);
		this.selectedAction = 'add';
		this.createOpen = false;
		return id;
	}

	async #fromBarcode(barcode: string, mode: SmartMode) {
		try {
			const details = await grocy.productByBarcode(barcode);
			const product = details.product;
			const match =
				details.product_barcodes?.find((b) => b.barcode === barcode) ??
				findBarcode(barcode, catalog.barcodes) ??
				null;
			const resolution = resolveReady({
				product,
				products: catalog.products,
				barcode: match,
				mode,
				userSettings: catalog.userSettings
			});
			if (resolution.status === 'ready') {
				resolution.stockAmount = asNumberOrNull(details.stock_amount);
			}
			this.#applyResolution(resolution, barcode, mode);
		} catch (error) {
			if (error instanceof GrocyError && (error.status === 400 || error.status === 404)) {
				const local = findBarcode(barcode, catalog.barcodes);
				if (local) {
					const product = catalog.productById(local.product_id);
					if (product) {
						this.#applyResolution(
							resolveReady({
								product,
								products: catalog.products,
								barcode: local,
								mode,
								userSettings: catalog.userSettings
							}),
							barcode,
							mode
						);
						return;
					}
				}
				let lookup: ExternalBarcodeLookupResponse | null = null;
				try {
					lookup = await grocy.externalLookup(barcode);
				} catch {
					lookup = null;
				}
				this.unknownBarcode = barcode;
				this.lookup = lookup;
				this.resolution = { status: 'unknown', barcode };
				this.createOpen = true;
				return;
			}
			throw error;
		}
	}

	#applyResolution(resolution: Resolution, scanned: string, mode: SmartMode) {
		if (resolution.status === 'ready') {
			this.applyReady(resolution);
			return;
		}
		if (resolution.status === 'ambiguous') {
			this.resolution = resolution;
			this.startTimeout(true);
			return;
		}
		if (resolution.status === 'empty' && scanned) {
			this.resolution = { status: 'empty' };
			this.startTimeout(true);
			return;
		}
		this.resolution = resolution;
		void mode;
	}
}

export const smartSession = new SmartSession();

export function unitName(id: number | null | undefined): string {
	if (id == null) return '';
	return catalog.units.find((u) => u.id === asNumber(id))?.name ?? '';
}

export function locationName(id: number | null | undefined): string {
	if (id == null) return '';
	return catalog.locations.find((l) => l.id === asNumber(id))?.name ?? '';
}
