<script lang="ts">
	// The home screen without WebGL: the globe's own texture laid flat as a
	// map that scrolls sideways, with the same pins and habitats. The texture
	// is equirectangular, so longitude and latitude map straight to x and y.
	import { goto, preloadData } from '$app/navigation';
	import type { Animal } from '#lib/content/schema.ts';
	import { clouds } from '#lib/scene/clouds.ts';
	import { motion } from '#lib/settings.svelte.ts';
	import { book } from '#lib/db/book.svelte.ts';
	import { t } from '#lib/strings/index.ts';
	import HoldGate from '#lib/grownups/HoldGate.svelte';
	import Pin from './Pin.svelte';
	import { habitats, PIN, pins } from './pins';
	import { spreadApart } from './spread';

	interface Props {
		/** True while a scene is open on top: the map can't be reached. */
		paused: boolean;
	}

	let { paused }: Props = $props();

	const HOME_LNG = 122;
	// Coming-soon pins shrink a little on short screens.
	const SOON_PER_MAP_PX = 0.034;

	let scroller: HTMLDivElement;
	let height = $state(0);
	const width = $derived(height * 2);
	const icons: Record<string, HTMLElement> = $state({});
	let hovered = $state<string | null>(null);
	let visiting = $state<string | null>(null);
	const pulse = $derived(visiting ?? hovered);

	const x = (lng: number) => ((lng + 180) / 360) * width;
	const y = (lat: number) => ((90 - lat) / 180) * height;
	const ringPath = (ring: [number, number][]) => `M${ring.map(([lng, lat]) => `${lng},${-lat}`).join('L')}Z`;

	// The map only changes size, so pins are placed (and spread) once per size.
	$effect(() => {
		if (!height) return;
		const soon = Math.min(Math.max(height * SOON_PER_MAP_PX, PIN.soonMin), PIN.soon);
		const scale = pins.map((p) => (p.animal ? 1 : soon / PIN.soon));
		const radii = pins.map((p, i) => (p.animal ? PIN.ready : PIN.soon) * scale[i]);
		const lift = radii.map((r, i) => PIN.tail * scale[i] + r);
		const spread = spreadApart(
			pins.map((p, i) => ({ x: x(p.lng), y: y(p.lat) - lift[i], r: radii[i] })),
			6,
			4,
			PIN.leash
		);
		pins.forEach((p, i) => {
			const icon = icons[p.id];
			if (!icon) return;
			icon.style.translate = `${spread[i].x}px ${spread[i].y + lift[i]}px`;
			icon.style.scale = String(scale[i]);
			icon.style.zIndex = p.animal ? '2' : '1';
			icon.style.visibility = 'visible';
		});
	});

	// As on the globe, a pulsing habitat fades the other pins so it shows through.
	$effect(() => {
		for (const p of pins) {
			const icon = icons[p.id];
			if (icon) icon.style.opacity = pulse !== null && p.id !== pulse ? '0.25' : '1';
		}
	});

	function goHome(smooth = true) {
		scroller.scrollTo({
			left: x(HOME_LNG) - scroller.clientWidth / 2,
			behavior: smooth && !motion.reduced ? 'smooth' : 'instant'
		});
	}

	$effect(() => {
		if (width) goHome(false);
	});

	async function visit(animal: Animal, event: MouseEvent) {
		event.preventDefault();
		if (visiting) return;
		visiting = animal.id;
		const href = `/animal/${animal.id}`;
		const loading = preloadData(href);
		await clouds.cover();
		await loading;
		await goto(href);
		visiting = null;
		await clouds.part();
	}
</script>

<div class="flat" data-testid="flat-map" data-pulse={pulse} inert={paused} aria-hidden={paused}>
	<div class="scroller" bind:this={scroller} bind:clientHeight={height}>
		<div class="map" style:width="{width}px">
			<img src="/globe/earth-2048.png" alt="" draggable="false" />
			<svg viewBox="-180 -90 360 180" preserveAspectRatio="none" aria-hidden="true">
				{#each habitats as habitat (habitat.id)}
					<g class="habitat" class:pulse={pulse === habitat.id} fill={habitat.color}>
						{#each habitat.polygons as polygon, i (i)}
							<path d={polygon.map(ringPath).join('')} fill-rule="evenodd" />
						{/each}
					</g>
				{/each}
			</svg>
			{#each pins as pin (pin.id)}
				<Pin
				{pin}
				bind:element={icons[pin.id]}
				onvisit={visit}
				onhover={(id) => (hovered = id)}
				visited={book.stickers.has(pin.id)}
			/>
			{/each}
		</div>
	</div>
	<a class="round-button book" href="/book" aria-label={t.book.open}>📖</a>
	<HoldGate />
	<button class="round-button home" aria-label={t.globe.home} onclick={() => goHome()}>🏠</button>
</div>

<style>
	.flat {
		position: fixed;
		inset: 0;
		background: #4fb6ec;
	}

	.scroller {
		position: absolute;
		inset: 0;
		overflow-x: auto;
		overflow-y: hidden;
		overscroll-behavior: contain;
	}

	.map {
		position: relative;
		height: 100%;
	}

	img,
	svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		user-select: none;
	}

	.habitat path {
		stroke: #ffffff;
		stroke-width: 2px;
		vector-effect: non-scaling-stroke;
	}

	.habitat {
		opacity: 0.6;
		transition: opacity 0.4s;
	}

	.habitat.pulse {
		animation: pulse 1s ease-in-out infinite alternate;
	}

	@keyframes pulse {
		from {
			opacity: 0.6;
		}
		to {
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.habitat.pulse {
			animation: none;
			opacity: 1;
		}
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
