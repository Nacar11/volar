<script lang="ts">
	import '@fontsource/andika/latin-400.css';
	import '@fontsource/andika/latin-700.css';
	import '../app.css';
	import { dev } from '$app/env';
	import { page } from '$app/state';
	import FlatMap from '#lib/globe/FlatMap.svelte';
	import Globe from '#lib/globe/Globe.svelte';
	import { hasWebGL } from '#lib/globe/support.ts';
	import CloudTransition from '#lib/scene/CloudTransition.svelte';
	import { book } from '#lib/db/book.svelte.ts';
	import UpdateToast from '#lib/offline/UpdateToast.svelte';
	import { updates } from '#lib/offline/updates.svelte.ts';
	import { settings } from '#lib/settings.svelte.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	book.load();
	settings.load();

	// Big text and high contrast apply to the whole app.
	$effect(() => {
		const root = document.documentElement;
		root.dataset.text = settings.bigText ? 'big' : 'normal';
		root.dataset.contrast = settings.highContrast ? 'high' : 'normal';
	});

	// Offline support: the service worker (production only, so dev never serves
	// stale caches), and a request that the browser keep downloaded animals.
	if (!dev && 'serviceWorker' in navigator) {
		navigator.serviceWorker.register('/service-worker.js').then((r) => updates.watch(r));
		navigator.storage?.persist?.();
	}

	// The globe lives here, not in the home page, so it survives a visit to a
	// scene: it pauses underneath and is still there, mid-dive, to zoom back out.
	const GLOBE_ROUTES = ['/', '/animal/[id]', '/book', '/grown-ups', '/grown-ups/credits'];
	const showGlobe = $derived(GLOBE_ROUTES.includes(page.route.id ?? ''));
	const webgl = hasWebGL();
</script>

{#if showGlobe}
	{#if webgl}
		<Globe paused={page.route.id !== '/'} />
	{:else}
		<FlatMap paused={page.route.id !== '/'} />
	{/if}
{/if}

{@render children()}

<UpdateToast />
<CloudTransition />
