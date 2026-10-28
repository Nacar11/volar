<script lang="ts">
	import { Canvas } from '@threlte/core';
	import { gsap } from 'gsap';
	import { NoToneMapping, type PerspectiveCamera } from 'three';
	import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
	import { motion } from '#lib/settings.svelte.ts';
	import { t } from '#lib/strings/index.ts';
	import { latLngToVector } from './geo';
	import GlobeScene from './GlobeScene.svelte';

	// Start facing the Philippines, so local kids see home first.
	const HOME = latLngToVector(12, 122, 3.6);

	let rig: { controls: OrbitControls; camera: PerspectiveCamera } | null = null;
	let spinning = $state(false);

	function goHome() {
		if (!rig) return;
		const { controls, camera } = rig;
		gsap.to(camera.position, {
			x: HOME[0],
			y: HOME[1],
			z: HOME[2],
			duration: motion.reduced ? 0 : 1,
			ease: 'power2.inOut',
			onUpdate: () => controls.update()
		});
	}
</script>

<div class="globe" data-testid="globe" data-spinning={spinning}>
	<!-- No tone mapping: flat cartoon colours should come out exactly as drawn. -->
	<Canvas dpr={[1, 2]} toneMapping={NoToneMapping}>
		<GlobeScene
			home={HOME}
			texture="/globe/earth-2048.png"
			oncontrols={(controls, camera) => (rig = { controls, camera })}
			onspin={(value) => (spinning = value)}
		/>
	</Canvas>
	<button class="round-button home" aria-label={t.globe.home} onclick={goHome}>🏠</button>
</div>

<style>
	.globe {
		position: fixed;
		inset: 0;
		background: radial-gradient(circle at 50% 45%, #2b3f86, #121a3d 70%);
		touch-action: none;
	}

	.home {
		position: absolute;
		top: max(16px, env(safe-area-inset-top));
		left: 16px;
	}
</style>
