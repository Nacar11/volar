<script lang="ts">
	import { dev } from '$app/env';
	import { goto, preloadData } from '$app/navigation';
	import { Canvas } from '@threlte/core';
	import { untrack } from 'svelte';
	import { NoToneMapping, type PerspectiveCamera } from 'three';
	import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
	import type { Animal } from '#lib/content/schema.ts';
	import { clouds } from '#lib/scene/clouds.ts';
	import { motion } from '#lib/settings.svelte.ts';
	import { book } from '#lib/db/book.svelte.ts';
	import { t } from '#lib/strings/index.ts';
	import { DISTANCE, flyTo } from './flyTo';
	import { latLngToVector, type Placement } from './geo';
	import GlobeScene from './GlobeScene.svelte';
	import { habitatOutline, habitatTriangles } from './habitat';
	import HoldGate from '#lib/grownups/HoldGate.svelte';
	import Pin from './Pin.svelte';
	import { habitats as habitatList, PIN, pins } from './pins';
	import { FpsGuard, LOW, startingQuality } from './quality';
	import { spreadApart } from './spread';

	interface Props {
		/** True while a scene is open on top: the globe stops rendering and can't be reached. */
		paused: boolean;
	}

	let { paused }: Props = $props();

	// Start facing the Philippines, so local kids see home first.
	const HOME = latLngToVector(12, 122, DISTANCE.home);
	const FLIGHT_S = 0.95;
	// The burst takes ~0.45 s, so starting it here closes the clouds as the dive ends.
	const CLOUDS_AT_S = 0.5;

	// On a phone the globe is ~400 px across, so coming-soon pins shrink with it.
	const SOON_PER_GLOBE_PX = 0.085;

	const markers = pins.map((p) => ({ id: p.id, at: latLngToVector(p.lat, p.lng) }));
	const ready = new Set(pins.filter((p) => p.animal).map((p) => p.id));
	const habitats = habitatList.map((h) => ({
		id: h.id,
		color: h.color,
		fill: habitatTriangles(h.polygons),
		outline: habitatOutline(h.polygons)
	}));
	const icons: Record<string, HTMLElement> = $state({});

	let rig = $state.raw<{ controls: OrbitControls; camera: PerspectiveCamera } | null>(null);
	let spinning = $state(false);
	let flying = $state(false);
	let hovered = $state<string | null>(null);
	let visiting = $state<string | null>(null);
	// A habitat pulses while its pin is hovered or focused, and through the dive after a tap.
	const pulse = $derived(visiting ?? hovered);
	let root: HTMLDivElement;
	let frames = 0;

	const nav = navigator as Navigator & { deviceMemory?: number };
	let quality = $state(startingQuality(nav.hardwareConcurrency, nav.deviceMemory));
	const guard = new FpsGuard();

	function frame(dt: number) {
		root.dataset.frames = String(++frames);
		if (guard.feed(dt)) {
			quality = LOW;
			if (dev) console.info('[volar] globe under 30 fps for 3 s: dropping to low quality');
		}
	}

	// A resumed globe gets a fresh warm-up, so the first frames back don't count.
	$effect(() => {
		if (!paused) guard.reset();
	});

	// Called every frame, so it writes styles directly instead of going through state.
	function place(placements: Placement[], globeRadius: number) {
		const shown = placements.filter((p) => p.opacity > 0);
		const soonSize = Math.min(Math.max(globeRadius * SOON_PER_GLOBE_PX, PIN.soonMin), PIN.soon);
		// Icons grow as they turn to face the kid; coming-soon icons also shrink with the globe.
		const scales = shown.map(
			(p) => (0.8 + 0.3 * Math.max(p.facing, 0)) * (ready.has(p.id) ? 1 : soonSize / PIN.soon)
		);
		const radii = shown.map((p, i) => (ready.has(p.id) ? PIN.ready : PIN.soon) * scales[i]);
		// Spread the icon discs (which sit above their points), then hang each pin under its disc.
		const lift = shown.map((_, i) => PIN.tail * scales[i] + radii[i]);
		const spread = spreadApart(
			shown.map((p, i) => ({ x: p.x, y: p.y - lift[i], r: radii[i] })),
			6,
			4,
			PIN.leash
		);
		shown.forEach((p, i) => {
			const icon = icons[p.id];
			if (!icon) return;
			icon.style.translate = `${spread[i].x}px ${spread[i].y + lift[i]}px`;
			// While a habitat pulses, the other pins fade back so the region shows through;
			// on the dive after a tap every pin goes, so the kid watches the habitat close in.
			const faded = visiting !== null || (pulse !== null && p.id !== pulse);
			icon.style.opacity = String(faded ? p.opacity * (visiting ? 0 : 0.25) : p.opacity);
			icon.style.scale = String(scales[i]);
			// Nearer pins on top, and tappable animals above the coming-soon ones.
			icon.style.zIndex = String(Math.round(p.facing * 100) + (ready.has(p.id) ? 200 : 0));
			icon.style.visibility = 'visible';
		});
		// Hidden icons can't be tapped, tabbed to or read out.
		for (const p of placements) {
			if (p.opacity === 0 && icons[p.id]) icons[p.id].style.visibility = 'hidden';
		}
	}

	const wait = (seconds: number) => new Promise((r) => setTimeout(r, seconds * 1000));

	function goHome() {
		if (!rig) return;
		flyTo(rig.camera, rig.controls, HOME, DISTANCE.home, motion.reduced ? 0 : 1);
	}

	// Tap → the camera swings to the animal and dives in, the clouds burst
	// shut on the way down, the scene loads behind them, and they part.
	async function visit(animal: Animal, event: MouseEvent) {
		event.preventDefault();
		if (flying || !rig) return;
		flying = true;
		visiting = animal.id;
		const href = `/animal/${animal.id}`;
		const loading = preloadData(href);
		const { camera, controls } = rig;
		if (motion.reduced) {
			await clouds.cover();
		} else {
			controls.minDistance = DISTANCE.visit;
			const target = latLngToVector(animal.globe.lat, animal.globe.lng);
			await Promise.all([
				flyTo(camera, controls, target, DISTANCE.visit, FLIGHT_S),
				wait(CLOUDS_AT_S).then(() => clouds.cover())
			]);
		}
		await loading;
		await goto(href);
		visiting = null;
		await clouds.part();
		flying = false;
	}

	// Back from a scene: once the clouds start to part, zoom out to where the
	// kid was before the dive.
	$effect(() => {
		if (paused || !rig) return;
		untrack(async () => {
			const { camera, controls } = rig!;
			if (camera.position.length() >= DISTANCE.min) return;
			await clouds.whenOpen();
			const away = camera.position.toArray() as [number, number, number];
			await flyTo(camera, controls, away, DISTANCE.home, motion.reduced ? 0 : 0.9);
			controls.minDistance = DISTANCE.min;
		});
	});
</script>

<div
	bind:this={root}
	class="globe"
	data-testid="globe"
	data-spinning={spinning}
	data-pulse={pulse}
	data-quality={quality.tier}
	inert={paused}
	aria-hidden={paused}
>
	<!-- No tone mapping: flat cartoon colours should come out exactly as drawn. -->
	<Canvas dpr={[1, quality.maxDpr]} toneMapping={NoToneMapping} renderMode="always">
		<GlobeScene
			home={HOME}
			texture={quality.texture}
			cloudShare={quality.clouds}
			stars={quality.stars}
			{markers}
			oncontrols={(controls, camera) => (rig = { controls, camera })}
			onspin={(value) => (spinning = value)}
			onplace={place}
			{paused}
			still={flying}
			onframe={frame}
			{habitats}
			{pulse}
		/>
	</Canvas>

	{#each pins as pin (pin.id)}
		<Pin
			{pin}
			bind:element={icons[pin.id]}
			onvisit={visit}
			onhover={(id) => (hovered = id)}
			visited={book.stickers.has(pin.id)}
		/>
	{/each}

	<a class="round-button book" href="/book" aria-label={t.book.open}>📖</a>
	<HoldGate />
	<button class="round-button home" aria-label={t.globe.home} onclick={goHome}>🏠</button>
</div>

<style>
	.globe {
		position: fixed;
		inset: 0;
		overflow: hidden;
		background: radial-gradient(circle at 50% 45%, #2b3f86, #121a3d 70%);
		touch-action: none;
	}

	.home,
	.book {
		position: absolute;
		top: max(16px, env(safe-area-inset-top));
		left: 16px;
	}

	.book {
		left: auto;
		right: 16px;
		text-decoration: none;
	}
</style>
