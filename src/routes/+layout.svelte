<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { beforeNavigate, goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { catalog } from '$lib/grocy/catalog.svelte.js';
	import { sv } from '$lib/i18n/sv.js';
	import { settings } from '$lib/settings.svelte.js';
	import { ModeWatcher } from 'mode-watcher';
	import { onMount } from 'svelte';

	let { children } = $props();

	const links = [
		{ href: '/', label: sv.nav.smart },
		{ href: '/packa-upp', label: sv.nav.unpack },
		{ href: '/inkopslista', label: sv.nav.list },
		{ href: '/massredigera', label: sv.nav.bulk },
		{ href: '/installningar', label: sv.nav.settings }
	];

	function guardSettings(pathname: string) {
		if (!settings.configured && pathname !== '/installningar') {
			void goto('/installningar');
			return true;
		}
		return false;
	}

	beforeNavigate(({ to, cancel }) => {
		if (!settings.configured && to?.url.pathname !== '/installningar') {
			cancel();
			void goto('/installningar');
		}
	});

	onMount(() => {
		guardSettings(page.url.pathname);
	});

	$effect(() => {
		if (settings.configured && !catalog.loaded && !catalog.loading) {
			void catalog.refresh().catch(() => {
				/* shown on settings / later toasts */
			});
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="manifest" href="/manifest.webmanifest" />
	<meta name="theme-color" content="#18181b" />
	<title>{sv.appName}</title>
</svelte:head>

<ModeWatcher />
<Toaster />

<div class="flex min-h-svh flex-col bg-background text-foreground">
	<header class="border-b">
		<div class="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-3">
			<p class="text-sm font-medium tracking-wide text-muted-foreground">{sv.appName}</p>
			<nav class="flex flex-wrap gap-1">
				{#each links as link (link.href)}
					<Button
						href={link.href}
						variant={page.url.pathname === link.href ? 'secondary' : 'ghost'}
						size="sm"
					>
						{link.label}
					</Button>
				{/each}
			</nav>
		</div>
	</header>
	<main class="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
		{@render children()}
	</main>
</div>
