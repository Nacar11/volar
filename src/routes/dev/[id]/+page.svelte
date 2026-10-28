<script lang="ts">
	// Dev-only scene previewer: drive the puppet's states directly and watch
	// the frame rate, without clicking through the app.
	import { onMount } from 'svelte';
	import { rigs } from '#lib/scene/rigs.ts';
	import type { Rig } from '#lib/scene/motions/index.ts';
	import Scene from '#lib/scene/Scene.svelte';
	import { motion } from '#lib/settings.svelte.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let rig = $state.raw<Rig | null>(null);
	let fps = $state(0);
	let minFps = $state(Infinity);
	let asleep = $state(false);
	let dilated = $state(false);

	onMount(() => {
		let frames = 0;
		let last = performance.now();
		let raf = requestAnimationFrame(function tick(now) {
			frames++;
			if (now - last >= 1000) {
				fps = Math.round((frames * 1000) / (now - last));
				minFps = Math.min(minFps, fps);
				frames = 0;
				last = now;
			}
			raf = requestAnimationFrame(tick);
		});
		return () => cancelAnimationFrame(raf);
	});
</script>

{#key data.animal.id}
	<Scene animal={data.animal} pack={data.pack} onrig={(r) => (rig = r)} />
{/key}

<aside>
	<strong>{fps} fps</strong> <small>(min {minFps === Infinity ? '–' : minFps})</small>
	<button onclick={() => rig?.entrance()}>entrance</button>
	{#each rigs[data.animal.rig].actions as action (action)}
		<button onclick={() => rig?.play(action)}>{action}</button>
	{/each}
	<button onclick={() => rig?.react()}>react</button>
	<button onclick={() => rig?.sleep((asleep = !asleep))}>sleep: {asleep}</button>
	<button onclick={() => rig?.dilate((dilated = !dilated))}>dilate: {dilated}</button>
	<button onclick={() => rig?.exit()}>exit</button>
	<label>
		<input
			type="checkbox"
			checked={motion.reduced}
			onchange={(e) => (motion.override = e.currentTarget.checked)}
		/>
		reduced motion
	</label>
</aside>

<style>
	aside {
		position: fixed;
		top: 50%;
		right: 8px;
		z-index: 10;
		translate: 0 -50%;
		display: grid;
		gap: 4px;
		padding: 8px;
		border-radius: 8px;
		background: rgb(0 0 0 / 0.75);
		color: #fff;
		font: 13px/1.3 ui-monospace, monospace;
	}

	button {
		font: inherit;
		color: #000;
	}
</style>
