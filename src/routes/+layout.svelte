<script lang="ts">
	import '@fontsource/andika/latin-400.css';
	import '@fontsource/andika/latin-700.css';
	import '../app.css';
	import { page } from '$app/state';
	import FlatMap from '#lib/globe/FlatMap.svelte';
	import Globe from '#lib/globe/Globe.svelte';
	import { hasWebGL } from '#lib/globe/support.ts';
	import CloudTransition from '#lib/scene/CloudTransition.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	// The globe lives here, not in the home page, so it survives a visit to a
	// scene: it pauses underneath and is still there, mid-dive, to zoom back out.
	const GLOBE_ROUTES = ['/', '/animal/[id]'];
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

<CloudTransition />
