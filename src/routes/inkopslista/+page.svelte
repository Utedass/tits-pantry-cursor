<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { catalog } from '$lib/grocy/catalog.svelte.js';
	import { sv } from '$lib/i18n/sv.js';
	import ListIcon from '@lucide/svelte/icons/list';

	const items = $derived(catalog.shoppingItems);
</script>

<div class="flex flex-col gap-4">
	<h1 class="text-2xl font-semibold">{sv.list.title}</h1>

	{#if items.length === 0}
		<Empty.Root>
			<Empty.Header>
				<Empty.Media variant="icon"><ListIcon /></Empty.Media>
				<Empty.Title>{sv.list.empty}</Empty.Title>
				<Empty.Description>{sv.list.emptyHint}</Empty.Description>
			</Empty.Header>
		</Empty.Root>
	{:else}
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Produkt</Table.Head>
					<Table.Head>Mängd</Table.Head>
					<Table.Head>Status</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each items as item (item.id)}
					<Table.Row>
						<Table.Cell>
							{item.product_id
								? (catalog.productById(item.product_id)?.name ?? `#${item.product_id}`)
								: item.note}
						</Table.Cell>
						<Table.Cell>{item.amount}</Table.Cell>
						<Table.Cell>
							{#if item.done}
								<Badge variant="secondary">{sv.list.done}</Badge>
							{/if}
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	{/if}
</div>
