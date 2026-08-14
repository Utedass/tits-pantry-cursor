<script lang="ts">
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { catalog } from '$lib/grocy/catalog.svelte.js';
	import { grocy } from '$lib/grocy/client.js';
	import { isLoopbackGrocyUrl } from '$lib/grocy/local-url.js';
	import { format, sv } from '$lib/i18n/sv.js';
	import { settings } from '$lib/settings.svelte.js';
	import { toast } from 'svelte-sonner';
	import { dev } from '$app/environment';

	let grocyUrl = $state(settings.grocyUrl);
	let apiKey = $state(settings.apiKey);
	let timeoutSec = $state(settings.timeoutMs / 1000);
	let autoExecute = $state(settings.autoExecute);
	let testing = $state(false);
	let version = $state<string | null>(null);

	const mixed = $derived(
		typeof window !== 'undefined' &&
			window.location.protocol === 'https:' &&
			grocyUrl.trim().toLowerCase().startsWith('http://')
	);
	const localLoopback = $derived(isLoopbackGrocyUrl(grocyUrl));

	async function save() {
		settings.save({
			grocyUrl,
			apiKey,
			timeoutMs: Math.round(timeoutSec * 1000),
			autoExecute
		});
		toast.success(sv.settings.saved);
	}

	async function test() {
		await save();
		testing = true;
		version = null;
		try {
			const info = await grocy.getSystemInfo();
			version = info.grocy_version?.Version ?? 'ok';
			await catalog.refresh();
			toast.success(format(sv.settings.connected, { version }));
		} catch (error) {
			toast.error(error instanceof Error ? error.message : sv.settings.connectFailed);
		} finally {
			testing = false;
		}
	}
</script>

<div class="mx-auto flex w-full max-w-xl flex-col gap-6">
	<div class="flex flex-col gap-2">
		<h1 class="text-2xl font-semibold">{sv.settings.title}</h1>
		<p class="text-muted-foreground">{sv.settings.lead}</p>
	</div>

	{#if mixed}
		<Alert.Root variant="destructive">
			<Alert.Title>{sv.settings.mixedContent}</Alert.Title>
		</Alert.Root>
	{:else if localLoopback && grocyUrl.trim().toLowerCase().startsWith('http://')}
		<Alert.Root>
			<Alert.Title>{dev ? sv.settings.localProxy : sv.settings.localHttp}</Alert.Title>
		</Alert.Root>
	{/if}

	<Card.Root>
		<Card.Header>
			<Card.Title>{sv.settings.title}</Card.Title>
			<Card.Description>{sv.settings.lead}</Card.Description>
		</Card.Header>
		<Card.Content>
			<Field.FieldGroup>
				<Field.Field>
					<Field.FieldLabel for="grocy-url">{sv.settings.url}</Field.FieldLabel>
					<Input id="grocy-url" bind:value={grocyUrl} placeholder="http://127.0.0.1:9283" />
					<Field.FieldDescription>{sv.settings.urlHint}</Field.FieldDescription>
				</Field.Field>
				<Field.Field>
					<Field.FieldLabel for="api-key">{sv.settings.apiKey}</Field.FieldLabel>
					<Input id="api-key" type="password" bind:value={apiKey} autocomplete="off" />
					<Field.FieldDescription>{sv.settings.apiKeyHint}</Field.FieldDescription>
				</Field.Field>
				<Field.Field>
					<Field.FieldLabel for="timeout">{sv.settings.timeout}</Field.FieldLabel>
					<Input id="timeout" type="number" min="1" step="1" bind:value={timeoutSec} />
					<Field.FieldDescription>{sv.settings.timeoutHint}</Field.FieldDescription>
				</Field.Field>
				<Field.Field orientation="horizontal">
					<Switch id="auto-execute" bind:checked={autoExecute} />
					<Field.FieldContent>
						<Field.FieldLabel for="auto-execute">{sv.settings.autoExecute}</Field.FieldLabel>
						<Field.FieldDescription>{sv.settings.autoExecuteHint}</Field.FieldDescription>
					</Field.FieldContent>
				</Field.Field>
			</Field.FieldGroup>
		</Card.Content>
		<Card.Footer class="flex gap-2">
			<Button variant="outline" onclick={() => void save()}>{sv.actions.save}</Button>
			<Button onclick={() => void test()} disabled={testing}>
				{#if testing}
					<Spinner data-icon="inline-start" />
				{/if}
				{sv.actions.test}
			</Button>
		</Card.Footer>
	</Card.Root>
</div>
