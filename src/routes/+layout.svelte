<script lang="ts">
	import '@fontsource/andika/latin-400.css';
	import '@fontsource/andika/latin-700.css';
	import '../app.css';
	import { page } from '$app/state';
	import Globe from '#lib/globe/Globe.svelte';
	import CloudTransition from '#lib/scene/CloudTransition.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	// The globe lives here, not in the home page, so it survives a visit to a
	// scene: it pauses underneath and is still there, mid-dive, to zoom back out.
	const GLOBE_ROUTES = ['/', '/animal/[id]'];
	const showGlobe = $derived(GLOBE_ROUTES.includes(page.route.id ?? ''));
</script>

{#if showGlobe}
	<Globe paused={page.route.id !== '/'} />
{/if}

{@render children()}

<CloudTransition />
