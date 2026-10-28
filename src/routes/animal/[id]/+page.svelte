<script lang="ts">
	import Scene from '#lib/scene/Scene.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>{data.animal.name} · Volar</title></svelte:head>

{#key data.animal.id}
	<Scene animal={data.animal} pack={data.pack} />
{/key}
