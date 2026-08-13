<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
	import { catalog } from '$lib/grocy/catalog.svelte.js';
	import { grocy } from '$lib/grocy/client.js';
	import { asNumber, isTruthyFlag, type Product } from '$lib/grocy/types.js';
	import { format, sv } from '$lib/i18n/sv.js';
	import { toast } from 'svelte-sonner';

	type Filter = 'all' | 'orphans' | 'byParent';

	let filter = $state<Filter>('orphans');
	let search = $state('');
	let parentFilterId = $state<string | undefined>(undefined);
	let selected = $state<number[]>([]);
	let newParentId = $state<string | undefined>(undefined);
	let newNoOwnStock = $state(false);
	let saving = $state(false);

	const parents = $derived(
		catalog.products.filter(
			(p) =>
				p.active !== 0 &&
				(isTruthyFlag(p.no_own_stock) || catalog.products.some((c) => c.parent_product_id === p.id))
		)
	);

	const visible = $derived.by(() => {
		let rows = catalog.products.filter((p) => p.active !== 0);
		const needle = search.trim().toLowerCase();
		if (needle) rows = rows.filter((p) => p.name.toLowerCase().includes(needle));
		if (filter === 'orphans') {
			rows = rows.filter((p) => p.parent_product_id == null);
		} else if (filter === 'byParent' && parentFilterId) {
			const id = asNumber(parentFilterId);
			rows = rows.filter((p) => p.parent_product_id === id || p.id === id);
		}
		return rows;
	});

	function parentName(product: Product): string {
		if (product.parent_product_id == null) return sv.bulk.none;
		return catalog.productById(product.parent_product_id)?.name ?? String(product.parent_product_id);
	}

	function toggle(id: number, checked: boolean) {
		if (checked) selected = [...selected, id];
		else selected = selected.filter((x) => x !== id);
	}

	function toggleAll(checked: boolean) {
		selected = checked ? visible.map((p) => p.id) : [];
	}

	async function apply() {
		if (selected.length === 0) return;
		saving = true;
		try {
			for (const id of selected) {
				const body: Record<string, unknown> = {};
				if (newParentId !== undefined) {
					body.parent_product_id = newParentId === 'none' ? null : asNumber(newParentId);
				}
				body.no_own_stock = newNoOwnStock ? 1 : 0;
				await grocy.updateProduct(id, body);
			}
			await catalog.refresh();
			toast.success(format(sv.bulk.saved, { count: selected.length }));
			selected = [];
		} catch (error) {
			toast.error(error instanceof Error ? error.message : String(error));
		} finally {
			saving = false;
		}
	}
</script>

<div class="flex flex-col gap-6">
	<div class="flex flex-col gap-2">
		<h1 class="text-2xl font-semibold">{sv.bulk.title}</h1>
		<p class="text-muted-foreground">{sv.bulk.lead}</p>
	</div>

	<Field.FieldGroup>
		<Field.Field>
			<Field.FieldLabel>{sv.bulk.filter}</Field.FieldLabel>
			<ToggleGroup.Root type="single" bind:value={filter} variant="outline">
				<ToggleGroup.Item value="all">{sv.bulk.all}</ToggleGroup.Item>
				<ToggleGroup.Item value="orphans">{sv.bulk.orphans}</ToggleGroup.Item>
				<ToggleGroup.Item value="byParent">{sv.bulk.byParent}</ToggleGroup.Item>
			</ToggleGroup.Root>
		</Field.Field>
		<Field.Field>
			<Field.FieldLabel for="bulk-search">{sv.bulk.search}</Field.FieldLabel>
			<Input id="bulk-search" bind:value={search} />
		</Field.Field>
		{#if filter === 'byParent'}
			<Field.Field>
				<Field.FieldLabel>{sv.bulk.parent}</Field.FieldLabel>
				<Select.Root type="single" bind:value={parentFilterId}>
					<Select.Trigger>
						{parentFilterId
							? (catalog.productById(asNumber(parentFilterId))?.name ?? parentFilterId)
							: '—'}
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							{#each parents as parent (parent.id)}
								<Select.Item value={String(parent.id)}>{parent.name}</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
			</Field.Field>
		{/if}
	</Field.FieldGroup>

	<p class="text-sm text-muted-foreground">{format(sv.bulk.selected, { count: selected.length })}</p>

	<div class="flex flex-wrap items-end gap-4">
		<Field.Field class="min-w-56">
			<Field.FieldLabel>{sv.bulk.setParent}</Field.FieldLabel>
			<Select.Root type="single" bind:value={newParentId}>
				<Select.Trigger>
					{newParentId
						? newParentId === 'none'
							? sv.bulk.clearParent
							: (catalog.productById(asNumber(newParentId))?.name ?? newParentId)
						: '—'}
				</Select.Trigger>
				<Select.Content>
					<Select.Group>
						<Select.Item value="none">{sv.bulk.clearParent}</Select.Item>
						{#each catalog.products.filter((p) => p.active !== 0) as parent (parent.id)}
							<Select.Item value={String(parent.id)}>{parent.name}</Select.Item>
						{/each}
					</Select.Group>
				</Select.Content>
			</Select.Root>
		</Field.Field>
		<Field.Field orientation="horizontal">
			<Checkbox id="no-own-stock" bind:checked={newNoOwnStock} />
			<Field.FieldLabel for="no-own-stock">{sv.bulk.setNoOwnStock}</Field.FieldLabel>
		</Field.Field>
		<Button onclick={() => void apply()} disabled={saving || selected.length === 0}>
			{#if saving}
				<Spinner data-icon="inline-start" />
			{/if}
			{sv.actions.apply}
		</Button>
	</div>

	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>
					<Checkbox
						checked={visible.length > 0 && selected.length === visible.length}
						indeterminate={selected.length > 0 && selected.length < visible.length}
						onCheckedChange={(checked) => toggleAll(checked === true)}
					/>
				</Table.Head>
				<Table.Head>Namn</Table.Head>
				<Table.Head>{sv.bulk.parent}</Table.Head>
				<Table.Head>{sv.bulk.noOwnStock}</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each visible as product (product.id)}
				<Table.Row>
					<Table.Cell>
						<Checkbox
							checked={selected.includes(product.id)}
							onCheckedChange={(checked) => toggle(product.id, checked === true)}
						/>
					</Table.Cell>
					<Table.Cell>{product.name}</Table.Cell>
					<Table.Cell>{parentName(product)}</Table.Cell>
					<Table.Cell>{isTruthyFlag(product.no_own_stock) ? 'Ja' : 'Nej'}</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>
