<script lang="ts">
	import ActionPanel from '$lib/components/ActionPanel.svelte';
	import CommandBar from '$lib/components/CommandBar.svelte';
	import CreateProductDialog from '$lib/components/CreateProductDialog.svelte';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { sv } from '$lib/i18n/sv.js';
	import type { SmartMode } from '$lib/smart-input/resolve.js';
	import { smartSession } from '$lib/smart-input/session.svelte.js';
	import ScanBarcodeIcon from '@lucide/svelte/icons/scan-barcode';
	import { onMount } from 'svelte';

	let { mode }: { mode: SmartMode } = $props();

	const copy = $derived(mode === 'add' ? sv.unpack : sv.smart);

	onMount(() => {
		smartSession.focus();
	});
</script>

<svelte:window onkeydown={(event) => event.key === 'Escape' && smartSession.resetToIdle()} />

<div class="mx-auto flex w-full max-w-2xl flex-col gap-6">
	<div class="flex flex-col gap-2">
		<h1 class="text-2xl font-semibold">{copy.title}</h1>
		<p class="text-muted-foreground">{copy.lead}</p>
	</div>

	<CommandBar {mode} />

	{#if smartSession.resolution?.status === 'ambiguous'}
		<Card.Root>
			<Card.Header>
				<Card.Title>
					{smartSession.resolution.reason === 'parent' ? sv.smart.parentPick : sv.smart.ambiguous}
				</Card.Title>
				<Card.Description>
					{#if smartSession.secondsLeft > 0}
						{smartSession.secondsLeft}s
					{/if}
				</Card.Description>
			</Card.Header>
			<Card.Content class="flex flex-col gap-2">
				{#each smartSession.resolution.candidates as product (product.id)}
					<Button
						variant="outline"
						class="justify-start"
						onclick={() => smartSession.chooseProduct(product, mode)}
					>
						{product.name}
					</Button>
				{/each}
			</Card.Content>
		</Card.Root>
	{:else if smartSession.resolution?.status === 'empty'}
		<Alert.Root>
			<Alert.Title>{sv.errors.noProduct}</Alert.Title>
		</Alert.Root>
	{:else if smartSession.ready}
		<Card.Root>
			<Card.Header>
				<Card.Title>{smartSession.ready.product.name}</Card.Title>
			</Card.Header>
			<Card.Content>
				<ActionPanel {mode} />
			</Card.Content>
		</Card.Root>
	{:else}
		<Empty.Root>
			<Empty.Header>
				<Empty.Media variant="icon">
					<ScanBarcodeIcon />
				</Empty.Media>
				<Empty.Title>{copy.title}</Empty.Title>
				<Empty.Description>{sv.command.hint}</Empty.Description>
			</Empty.Header>
		</Empty.Root>
	{/if}

	{#if mode === 'add' && smartSession.recentAdds.length > 0}
		<Card.Root>
			<Card.Header>
				<Card.Title>{sv.unpack.recent}</Card.Title>
			</Card.Header>
			<Card.Content class="flex flex-col gap-2">
				{#each smartSession.recentAdds as item (item.at)}
					<div class="flex justify-between text-sm">
						<span>{item.name}</span>
						<span class="text-muted-foreground">{item.amount}</span>
					</div>
				{/each}
			</Card.Content>
		</Card.Root>
	{/if}
</div>

<CreateProductDialog />
