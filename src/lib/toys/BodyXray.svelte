<script lang="ts">
	// A magnifier the kid drags over the puppet. Inside the lens a live copy of
	// the puppet (an SVG <use>, so it keeps animating) is drawn magnified;
	// moving the lens over the feature reveals its fact.
	import { t } from '#lib/strings/index.ts';

	interface Props {
		/** Puppet part id the lens is looking for. */
		feature: string;
		onreveal: () => void;
	}

	let { feature, onreveal }: Props = $props();

	const RADIUS = 64;
	const ZOOM = 1.8;
	let box: HTMLDivElement;
	let width = $state(0);
	let height = $state(0);
	let pos = $state<{ x: number; y: number } | null>(null);
	let found = $state(false);
	let dragging = false;

	// Start in the lower right corner until the kid moves it.
	const lens = $derived(pos ?? { x: width * 0.8, y: height * 0.8 });
	// The lens centre in the puppet's 400×400 viewBox (the figure is square).
	const centre = $derived(width ? { x: (lens.x * 400) / width, y: (lens.y * 400) / height } : { x: 0, y: 0 });

	function moveTo(x: number, y: number) {
		pos = { x: Math.min(Math.max(x, 0), width), y: Math.min(Math.max(y, 0), height) };
		const target = document.getElementById(feature)?.getBoundingClientRect();
		const frame = box.getBoundingClientRect();
		if (!target || found) return;
		const cx = frame.left + pos.x;
		const cy = frame.top + pos.y;
		if (cx > target.left && cx < target.right && cy > target.top && cy < target.bottom) {
			found = true;
			onreveal();
		}
	}

	function pointerMove(e: PointerEvent) {
		if (!dragging) return;
		const frame = box.getBoundingClientRect();
		moveTo(e.clientX - frame.left, e.clientY - frame.top);
	}

	function keydown(e: KeyboardEvent) {
		const step = 24;
		const moves: Record<string, [number, number]> = {
			ArrowLeft: [-step, 0],
			ArrowRight: [step, 0],
			ArrowUp: [0, -step],
			ArrowDown: [0, step]
		};
		const move = moves[e.key];
		if (!move) return;
		e.preventDefault();
		moveTo(lens.x + move[0], lens.y + move[1]);
	}
</script>

<div class="xray" bind:this={box} bind:clientWidth={width} bind:clientHeight={height}>
	<svg
		viewBox="0 0 400 400"
		aria-hidden="true"
		style:clip-path="circle({RADIUS}px at {lens.x}px {lens.y}px)"
	>
		<circle cx={centre.x} cy={centre.y} r={(RADIUS * 400) / (width || 1)} fill="#e6f6fd" />
		<g
			transform="translate({centre.x} {centre.y}) scale({ZOOM}) translate({-centre.x} {-centre.y})"
		>
			<!-- Parts styled with var(--xray-hide), like eyelids, vanish under the lens. -->
			<use href="#animal" style="--xray-hide: 0" />
		</g>
	</svg>
	<button
		class="lens"
		class:found
		aria-label={t.bodyXray.hint}
		style:left="{lens.x}px"
		style:top="{lens.y}px"
		style:width="{RADIUS * 2}px"
		style:height="{RADIUS * 2}px"
		onpointerdown={(e) => {
			dragging = true;
			e.currentTarget.setPointerCapture(e.pointerId);
		}}
		onpointermove={pointerMove}
		onpointerup={() => (dragging = false)}
		onpointercancel={() => (dragging = false)}
		onkeydown={keydown}
	>
		<span class="handle" aria-hidden="true">🔍</span>
	</button>
</div>

<style>
	.xray {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
	}

	.lens {
		all: unset;
		position: absolute;
		box-sizing: border-box;
		translate: -50% -50%;
		border-radius: 50%;
		border: 8px solid #fffaf0;
		box-shadow: 0 0 0 4px rgb(0 0 0 / 0.2);
		pointer-events: auto;
		touch-action: none;
		cursor: grab;
	}

	.lens:focus-visible {
		outline: 4px solid #1565c0;
	}

	.lens.found {
		border-color: #ffd54f;
		box-shadow: 0 0 24px 8px #ffd54f;
	}

	.handle {
		position: absolute;
		right: -36px;
		bottom: -36px;
		font-size: 2.4rem;
	}
</style>
