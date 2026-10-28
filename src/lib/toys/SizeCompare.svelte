<script lang="ts">
	// Draws familiar things beside the animal at true scale, standing on the
	// same ground, with guide lines at the animal's measured height (or at its
	// two ends, measuring length). Lives over the puppet in the stage, in the
	// puppet's own viewBox.
	import { groundOf, placeThings, THINGS, type Thing } from './sizes';

	interface Props {
		toy: { measure: 'height' | 'length'; meters: number; from: number; to: number; ground?: number };
		thing: Thing;
	}

	let { toy, thing }: Props = $props();

	const boxes = $derived(placeThings(toy, thing));
	const ground = $derived(groundOf(toy));
	const aspect = $derived(THINGS[thing].aspect);
</script>

<svg class="sizes" viewBox="0 0 400 400" aria-hidden="true">
	{#if toy.measure === 'height'}
		<line x1={boxes[0].x - 10} x2="390" y1={toy.to} y2={toy.to} />
	{:else}
		<line x1={toy.from} x2={toy.from} y1={ground - 210} y2={ground} />
		<line x1={toy.to} x2={toy.to} y1={ground - 210} y2={ground} />
	{/if}
	{#key thing}
		{#each boxes as box, i (i)}
			<!-- Placed by the outer group; the inner one only pops in (a CSS
			     transform-origin would also move an element's own transform). -->
			<g transform="translate({box.x} {box.y}) scale({box.height / 100})">
				<g class="thing" style:animation-delay="{i * 0.12}s">
					{#if thing === 'kid' || thing === 'grownup'}
						<!-- A person, head and body, 100 tall. -->
						<circle cx={50 * aspect} cy="10" r="9" />
						<rect x={50 * aspect - 13} y="21" width="26" height="44" rx="10" />
						<rect x={50 * aspect - 12} y="60" width="10" height="40" rx="5" />
						<rect x={50 * aspect + 2} y="60" width="10" height="40" rx="5" />
					{:else if thing === 'cat'}
						<!-- A sitting cat, side on, 100 tall and 150 wide. -->
						<ellipse cx="80" cy="66" rx="52" ry="30" />
						<circle cx="128" cy="38" r="22" />
						<path d="M112 22L118 0L128 18Z" /><path d="M132 18L144 0L146 22Z" />
						<path d="M30 70Q4 52 14 26" fill="none" stroke-width="9" stroke-linecap="round" />
						<rect x="50" y="80" width="12" height="20" rx="5" /><rect x="100" y="80" width="12" height="20" rx="5" />
					{:else}
						<!-- A vehicle, 100 tall, with a gap so a row of them reads as separate. -->
						<rect x="3" y="10" width={100 * aspect - 6} height="72" rx="14" />
						<circle cx="40" cy="84" r="16" /><circle cx={100 * aspect - 40} cy="84" r="16" />
					{/if}
				</g>
			</g>
		{/each}
	{/key}
</svg>

<style>
	.sizes {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
		pointer-events: none;
	}

	line {
		stroke: #ffffff;
		stroke-width: 3;
		stroke-dasharray: 8 8;
		opacity: 0.9;
	}

	.thing {
		fill: #3949ab;
		stroke: #3949ab;
		opacity: 0.85;
		animation: pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
		transform-box: fill-box;
		transform-origin: bottom;
	}

	@keyframes pop {
		from {
			scale: 1 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.thing {
			animation: none;
		}
	}
</style>
