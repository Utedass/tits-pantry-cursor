<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { catalog } from '$lib/grocy/catalog.svelte.js';
	import { asNumber } from '$lib/grocy/types.js';
	import { sv } from '$lib/i18n/sv.js';
	import { locationName, smartSession, unitName } from '$lib/smart-input/session.svelte.js';
	import { toast } from 'svelte-sonner';

	let name = $state('');
	let locationId = $state<string | undefined>(undefined);
	let purchaseUnitId = $state<string | undefined>(undefined);
	let stockUnitId = $state<string | undefined>(undefined);
	let saving = $state(false);

	const lookup = $derived(smartSession.lookup);

	function prefill() {
		const found = smartSession.lookup;
		name = found?.name ?? '';
		locationId =
			found?.location_id != null
				? String(found.location_id)
				: catalog.locations[0]
					? String(catalog.locations[0].id)
					: undefined;
		purchaseUnitId =
			found?.qu_id_purchase != null
				? String(found.qu_id_purchase)
				: catalog.units[0]
					? String(catalog.units[0].id)
					: undefined;
		stockUnitId =
			found?.qu_id_stock != null ? String(found.qu_id_stock) : purchaseUnitId;
	}

	function onOpenChange(isOpen: boolean) {
		smartSession.createOpen = isOpen;
		if (isOpen) {
			prefill();
			return;
		}
		if (smartSession.resolution?.status === 'unknown') {
			smartSession.resetToIdle();
		}
	}

	async function save() {
		if (!name.trim() || !locationId || !purchaseUnitId || !stockUnitId) return;
		saving = true;
		try {
			await smartSession.saveNewProduct({
				name: name.trim(),
				locationId: asNumber(locationId),
				purchaseUnitId: asNumber(purchaseUnitId),
				stockUnitId: asNumber(stockUnitId)
			});
			toast.success(sv.create.proposeAdd);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : String(error));
		} finally {
			saving = false;
		}
	}
</script>

<Dialog.Root open={smartSession.createOpen} {onOpenChange}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>{sv.create.title}</Dialog.Title>
			<Dialog.Description>
				{lookup?.name ? sv.create.fromLookup : sv.create.noLookup}
			</Dialog.Description>
		</Dialog.Header>

		<Field.FieldGroup>
			<Field.Field>
				<Field.FieldLabel for="product-name">{sv.create.name}</Field.FieldLabel>
				<Input id="product-name" bind:value={name} />
			</Field.Field>
			<Field.Field>
				<Field.FieldLabel>{sv.create.location}</Field.FieldLabel>
				<Select.Root type="single" bind:value={locationId}>
					<Select.Trigger>{locationName(asNumber(locationId, 0)) || '—'}</Select.Trigger>
					<Select.Content>
						<Select.Group>
							{#each catalog.locations.filter((l) => l.active !== 0) as location (location.id)}
								<Select.Item value={String(location.id)}>{location.name}</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
			</Field.Field>
			<Field.Field>
				<Field.FieldLabel>{sv.create.purchaseUnit}</Field.FieldLabel>
				<Select.Root type="single" bind:value={purchaseUnitId}>
					<Select.Trigger>{unitName(asNumber(purchaseUnitId, 0)) || '—'}</Select.Trigger>
					<Select.Content>
						<Select.Group>
							{#each catalog.units.filter((u) => u.active !== 0) as unit (unit.id)}
								<Select.Item value={String(unit.id)}>{unit.name}</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
			</Field.Field>
			<Field.Field>
				<Field.FieldLabel>{sv.create.stockUnit}</Field.FieldLabel>
				<Select.Root type="single" bind:value={stockUnitId}>
					<Select.Trigger>{unitName(asNumber(stockUnitId, 0)) || '—'}</Select.Trigger>
					<Select.Content>
						<Select.Group>
							{#each catalog.units.filter((u) => u.active !== 0) as unit (unit.id)}
								<Select.Item value={String(unit.id)}>{unit.name}</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
			</Field.Field>
		</Field.FieldGroup>

		<Dialog.Footer>
			<Button variant="outline" onclick={() => onOpenChange(false)}>{sv.actions.cancel}</Button>
			<Button onclick={() => void save()} disabled={saving}>
				{#if saving}
					<Spinner data-icon="inline-start" />
				{/if}
				{sv.actions.save}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
