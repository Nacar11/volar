<script lang="ts">
	import { untrack } from 'svelte';
	import { motion } from '#lib/settings.svelte.ts';
	import { createRig, type Rig } from './motions';
	import type { RigName } from './rigs';

	interface Props {
		/** The pack's puppet.svg, inlined so GSAP can reach its parts. */
		svg: string;
		rig: RigName;
		label: string;
		onready: (rig: Rig) => void;
		ontap: () => void;
	}

	let { svg, rig: rigName, label, onready, ontap }: Props = $props();
	let host: HTMLButtonElement;
	let current: Rig | null = null;

	$effect(() => {
		const el = host.querySelector('svg');
		if (!el) throw new Error('puppet markup has no <svg>');
		const rig = createRig(rigName, el, { reducedMotion: () => motion.reduced });
		current = rig;
		untrack(() => onready(rig));
		return () => {
			rig.destroy();
			current = null;
		};
	});

	$effect(() => {
		void motion.reduced;
		current?.refreshMotion();
	});
</script>

<button bind:this={host} class="puppet" aria-label={label} onclick={ontap}>
	<!-- Trusted: puppets come from this repo's content folder, checked at build. -->
	{@html svg}
</button>

<style>
	.puppet {
		all: unset;
		display: block;
		width: 100%;
		height: 100%;
		cursor: pointer;
	}

	.puppet:focus-visible {
		outline: 4px solid #1565c0;
		border-radius: 24px;
	}

	.puppet :global(svg) {
		display: block;
		width: 100%;
		height: 100%;
		overflow: visible;
	}
</style>
