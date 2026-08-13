<script lang="ts">
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import { sv } from '$lib/i18n/sv.js';
	import type { SmartMode } from '$lib/smart-input/resolve.js';
	import { smartSession } from '$lib/smart-input/session.svelte.js';
	import ScanBarcodeIcon from '@lucide/svelte/icons/scan-barcode';
	import { toast } from 'svelte-sonner';

	let { mode }: { mode: SmartMode } = $props();

	async function onsubmit(event: SubmitEvent) {
		event.preventDefault();
		try {
			await smartSession.submit(mode);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : String(error));
		}
	}
</script>

<form {onsubmit} class="w-full">
	<InputGroup.Root class="h-12 w-full">
		<InputGroup.Addon>
			<ScanBarcodeIcon />
		</InputGroup.Addon>
		<InputGroup.Input
			bind:ref={smartSession.inputEl}
			bind:value={smartSession.query}
			placeholder={sv.command.placeholder}
			autocomplete="off"
			autocapitalize="off"
			enterkeyhint="go"
			aria-label={sv.command.placeholder}
			disabled={smartSession.busy}
		/>
	</InputGroup.Root>
	<p class="mt-2 text-sm text-muted-foreground">{sv.command.hint}</p>
</form>
