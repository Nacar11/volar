<script lang="ts">
	import { goto, preloadData } from '$app/navigation';
	import { Canvas } from '@threlte/core';
	import { untrack } from 'svelte';
	import { NoToneMapping, type PerspectiveCamera } from 'three';
	import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
	import { animals, iconUrl, planned, plannedIconUrl } from '#lib/content/animals.ts';
	import type { Animal } from '#lib/content/schema.ts';
	import { clouds } from '#lib/scene/clouds.ts';
	import { motion } from '#lib/settings.svelte.ts';
	import { fill, t } from '#lib/strings/index.ts';
	import { DISTANCE, flyTo } from './flyTo';
	import { latLngToVector, type Placement } from './geo';
	import GlobeScene from './GlobeScene.svelte';
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

	// Pin icon radii (px) and the gap between the icon and the point it marks.
	// Tappable pins keep a thumb-sized 72 px; coming-soon pins can't be tapped,
	// so they shrink with the globe (on a phone the globe is ~400 px across).
	const RADIUS = { ready: 36, soon: 26 };
	const SOON_PER_GLOBE_PX = 0.085;
	const SOON_MIN = 12;
	const TAIL = 10;
	// How far a crowded pin may be nudged from its spot, in icon radii.
	const LEASH = 1.2;

	// Animals with a scene are tappable pins; planned ones are greyed "coming soon" pins.
	const pins = [
		...animals.map((animal) => ({
			id: animal.id,
			name: animal.name,
			at: latLngToVector(animal.globe.lat, animal.globe.lng),
			icon: iconUrl(animal),
			animal
		})),
		...planned.map((p) => ({
			id: p.id,
			name: p.name,
			at: latLngToVector(p.lat, p.lng),
			icon: plannedIconUrl(p),
			animal: null
		}))
	];
	const markers = pins.map(({ id, at }) => ({ id, at }));
	const ready = new Set(pins.filter((p) => p.animal).map((p) => p.id));
	const icons: Record<string, HTMLElement> = {};

	let rig = $state.raw<{ controls: OrbitControls; camera: PerspectiveCamera } | null>(null);
	let spinning = $state(false);
	let flying = $state(false);
	let root: HTMLDivElement;
	let frames = 0;

	// Called every frame, so it writes styles directly instead of going through state.
	function place(placements: Placement[], globeRadius: number) {
		const shown = placements.filter((p) => p.opacity > 0);
		const soonSize = Math.min(Math.max(globeRadius * SOON_PER_GLOBE_PX, SOON_MIN), RADIUS.soon);
		// Icons grow as they turn to face the kid; coming-soon icons also shrink with the globe.
		const scales = shown.map(
			(p) => (0.8 + 0.3 * Math.max(p.facing, 0)) * (ready.has(p.id) ? 1 : soonSize / RADIUS.soon)
		);
		const radii = shown.map((p, i) => (ready.has(p.id) ? RADIUS.ready : RADIUS.soon) * scales[i]);
		// Spread the icon discs (which sit above their points), then hang each pin under its disc.
		const lift = shown.map((_, i) => TAIL * scales[i] + radii[i]);
		const spread = spreadApart(
			shown.map((p, i) => ({ x: p.x, y: p.y - lift[i], r: radii[i] })),
			6,
			4,
			LEASH
		);
		shown.forEach((p, i) => {
			const icon = icons[p.id];
			icon.style.translate = `${spread[i].x}px ${spread[i].y + lift[i]}px`;
			icon.style.opacity = String(p.opacity);
			icon.style.scale = String(scales[i]);
			// Nearer pins on top, and tappable animals above the coming-soon ones.
			icon.style.zIndex = String(Math.round(p.facing * 100) + (ready.has(p.id) ? 200 : 0));
			icon.style.visibility = 'visible';
		});
		// Hidden icons can't be tapped, tabbed to or read out.
		for (const p of placements) if (p.opacity === 0) icons[p.id].style.visibility = 'hidden';
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
	inert={paused}
	aria-hidden={paused}
>
	<!-- No tone mapping: flat cartoon colours should come out exactly as drawn. -->
	<Canvas dpr={[1, 2]} toneMapping={NoToneMapping} renderMode="always">
		<GlobeScene
			home={HOME}
			texture="/globe/earth-2048.png"
			{markers}
			oncontrols={(controls, camera) => (rig = { controls, camera })}
			onspin={(value) => (spinning = value)}
			onplace={place}
			{paused}
			still={flying}
			onframe={() => (root.dataset.frames = String(++frames))}
		/>
	</Canvas>

	{#each pins as pin (pin.id)}
		{#if pin.animal}
			{@const animal = pin.animal}
			<a
				bind:this={icons[pin.id]}
				class="pin"
				href="/animal/{animal.id}"
				aria-label={animal.name}
				style:--theme={animal.themeColor}
				onclick={(event) => visit(animal, event)}
			>
				<span class="bob"><img src={pin.icon} alt="" /></span>
			</a>
		{:else}
			<span
				bind:this={icons[pin.id]}
				class="pin soon"
				role="img"
				aria-label={fill(t.globe.comingSoon, { name: pin.name })}
			>
				<span class="bob"><img src={pin.icon} alt="" /></span>
			</span>
		{/if}
	{/each}

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

	/* The pin's own box is the 0×0 anchor on the globe; the icon sits above it. */
	.pin {
		position: absolute;
		top: 0;
		left: 0;
		width: 0;
		height: 0;
		visibility: hidden;
	}

	.bob {
		position: absolute;
		left: -36px;
		bottom: 10px;
		display: grid;
		place-items: center;
		width: 72px;
		height: 72px;
		border-radius: 50%;
		background: var(--paper);
		box-shadow:
			inset 0 -5px 0 var(--theme),
			0 4px 10px rgb(0 0 0 / 0.35);
		animation:
			bob 2.4s ease-in-out infinite,
			wiggle 7s ease-in-out infinite;
	}

	/* The pin's tail, pointing at the animal's home. */
	.bob::after {
		content: '';
		position: absolute;
		bottom: -10px;
		border: 10px solid transparent;
		border-bottom: none;
		border-top-color: var(--paper);
	}

	.pin:focus-visible .bob {
		outline: 4px solid #ffd54f;
		outline-offset: 3px;
	}

	img {
		width: 58px;
		height: 58px;
	}

	/* Coming soon: smaller, grey, still, and not tappable, so drags pass to the globe. */
	.soon {
		pointer-events: none;
	}

	.soon .bob {
		left: -26px;
		width: 52px;
		height: 52px;
		box-shadow: 0 3px 8px rgb(0 0 0 / 0.3);
		filter: grayscale(1) brightness(1.05);
		opacity: 0.8;
		animation: none;
	}

	.soon img {
		width: 34px;
		height: 34px;
	}

	@keyframes bob {
		50% {
			translate: 0 -6px;
		}
	}

	/* A small wiggle now and then, to invite a tap. */
	@keyframes wiggle {
		0%,
		90%,
		100% {
			rotate: 0deg;
		}
		93% {
			rotate: -8deg;
		}
		96% {
			rotate: 8deg;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.bob {
			animation: none;
		}
	}

	.home {
		position: absolute;
		top: max(16px, env(safe-area-inset-top));
		left: 16px;
	}
</style>
