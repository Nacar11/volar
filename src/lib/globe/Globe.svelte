<script lang="ts">
	import { goto, preloadData } from '$app/navigation';
	import { Canvas } from '@threlte/core';
	import { untrack } from 'svelte';
	import { NoToneMapping, type PerspectiveCamera } from 'three';
	import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
	import { animals, iconUrl } from '#lib/content/animals.ts';
	import type { Animal } from '#lib/content/schema.ts';
	import { clouds } from '#lib/scene/clouds.ts';
	import { motion } from '#lib/settings.svelte.ts';
	import { t } from '#lib/strings/index.ts';
	import { DISTANCE, flyTo } from './flyTo';
	import { latLngToVector } from './geo';
	import GlobeScene from './GlobeScene.svelte';

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

	const markers = animals.map((a) => ({ id: a.id, at: latLngToVector(a.globe.lat, a.globe.lng) }));
	const icons: Record<string, HTMLAnchorElement> = {};

	let rig = $state.raw<{ controls: OrbitControls; camera: PerspectiveCamera } | null>(null);
	let spinning = $state(false);
	let flying = $state(false);
	let root: HTMLDivElement;
	let frames = 0;

	// Called every frame, so it writes styles directly instead of going through state.
	function place(id: string, x: number, y: number, opacity: number, facing: number) {
		const icon = icons[id];
		if (!icon) return;
		icon.style.translate = `${x}px ${y}px`;
		icon.style.opacity = String(opacity);
		// Icons grow as they turn to face the kid.
		icon.style.scale = String(0.8 + 0.3 * Math.max(facing, 0));
		// Hidden icons can't be tapped, tabbed to or read out.
		icon.style.visibility = opacity > 0 ? 'visible' : 'hidden';
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

	{#each animals as animal (animal.id)}
		<a
			bind:this={icons[animal.id]}
			class="icon"
			href="/animal/{animal.id}"
			aria-label={animal.name}
			style:--theme={animal.themeColor}
			onclick={(event) => visit(animal, event)}
		>
			<span class="bob"><img src={iconUrl(animal)} alt="" /></span>
		</a>
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

	/* The link's own box is the 0×0 anchor on the globe; the icon sits above it like a pin. */
	.icon {
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

	.icon:focus-visible .bob {
		outline: 4px solid #ffd54f;
		outline-offset: 3px;
	}

	img {
		width: 58px;
		height: 58px;
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
