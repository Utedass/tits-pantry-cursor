<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
	import { catalog } from '$lib/grocy/catalog.svelte.js';
	import { asNumber } from '$lib/grocy/types.js';
	import { format, sv } from '$lib/i18n/sv.js';
	import type { SmartAction, SmartMode } from '$lib/smart-input/resolve.js';
	import { locationName, smartSession, unitName } from '$lib/smart-input/session.svelte.js';
	import { toast } from 'svelte-sonner';

	let { mode }: { mode: SmartMode } = $props();

	const ready = $derived(smartSession.ready);

	function actionLabel(action: SmartAction): string {
		if (action === 'consume') return sv.actions.consume;
		if (action === 'add') return sv.actions.add;
		if (action === 'inventory') return sv.actions.inventory;
		return sv.actions.shopping;
	}

	async function run() {
		const action = smartSession.selectedAction;
		if (action === 'inventory') {
			toast.info(sv.smart.inventoryStub);
			smartSession.resetToIdle();
			return;
		}
		try {
			await smartSession.execute();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : String(error));
		}
	}
</script>

{#if ready}
	<div class="flex flex-col gap-4">
		<div class="flex flex-wrap items-center gap-2">
			<h2 class="text-lg font-medium">{ready.product.name}</h2>
			<Badge variant="secondary">
				{ready.stockAmount != null
					? format(sv.smart.stock, { amount: String(ready.stockAmount) })
					: sv.smart.noStock}
			</Badge>
			{#if smartSession.secondsLeft > 0}
				<Badge variant="outline">{smartSession.secondsLeft}s</Badge>
			{/if}
		</div>

		<ToggleGroup.Root type="single" bind:value={smartSession.selectedAction} variant="outline">
			<ToggleGroup.Item value="consume">{sv.actions.consume}</ToggleGroup.Item>
			<ToggleGroup.Item value="add">{sv.actions.add}</ToggleGroup.Item>
			<ToggleGroup.Item value="inventory">{sv.actions.inventory}</ToggleGroup.Item>
			<ToggleGroup.Item value="shopping">{sv.actions.shopping}</ToggleGroup.Item>
		</ToggleGroup.Root>

		<Field.FieldGroup>
			<Field.Field orientation="horizontal">
				<Field.FieldLabel for="amount">Mängd</Field.FieldLabel>
				<Input id="amount" type="number" min="0" step="any" bind:value={smartSession.amount} />
				{#if unitName(ready.product.qu_id_stock)}
					<span class="text-sm text-muted-foreground">{unitName(ready.product.qu_id_stock)}</span>
				{/if}
			</Field.Field>

			<Field.Field>
				<Field.FieldLabel>Plats</Field.FieldLabel>
				<Select.Root
					type="single"
					bind:value={
						() => (smartSession.locationId != null ? String(smartSession.locationId) : undefined),
						(value) => {
							smartSession.locationId = value ? asNumber(value) : null;
						}
					}
				>
					<Select.Trigger>
						{locationName(smartSession.locationId) || '—'}
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							{#each catalog.locations.filter((l) => l.active !== 0) as location (location.id)}
								<Select.Item value={String(location.id)}>{location.name}</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
			</Field.Field>

			{#if (mode === 'add' || smartSession.selectedAction === 'add') && smartSession.locationId !== ready.product.location_id}
				<Field.Field orientation="horizontal">
					<Checkbox id="update-default-location" bind:checked={smartSession.updateDefaultLocation} />
					<Field.FieldLabel for="update-default-location">
						{sv.unpack.updateDefaultLocation}
					</Field.FieldLabel>
				</Field.Field>
			{/if}
		</Field.FieldGroup>

		<Button onclick={() => void run()} disabled={smartSession.busy}>
			{#if smartSession.busy}
				<Spinner data-icon="inline-start" />
			{/if}
			{actionLabel(smartSession.selectedAction)}
		</Button>
	</div>
{/if}
