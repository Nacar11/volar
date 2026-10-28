<script lang="ts">
	// A pin on the globe or the flat map. Its own box is a 0×0 anchor that the
	// parent positions by writing styles to `element`; the icon sits above it.
	import type { Animal } from '#lib/content/schema.ts';
	import { fill, t } from '#lib/strings/index.ts';
	import type { MapPin } from './pins';

	interface Props {
		pin: MapPin;
		element?: HTMLElement;
		onvisit: (animal: Animal, event: MouseEvent) => void;
		/** The pin's id while it is hovered or focused, null when it isn't. */
		onhover: (id: string | null) => void;
		/** The kid has this animal's sticker: the pin wears a star. */
		visited?: boolean;
	}

	let { pin, element = $bindable(), onvisit, onhover, visited = false }: Props = $props();
</script>

{#if pin.animal}
	{@const animal = pin.animal}
	<a
		bind:this={element}
		class="pin"
		href="/animal/{animal.id}"
		aria-label={visited ? `${animal.name}, ${t.book.visited}` : animal.name}
		style:--theme={animal.themeColor}
		onclick={(event) => onvisit(animal, event)}
		onpointerenter={() => onhover(animal.id)}
		onpointerleave={() => onhover(null)}
		onfocus={() => onhover(animal.id)}
		onblur={() => onhover(null)}
	>
		<span class="bob">
			<img src={pin.icon} alt="" />
			{#if visited}<span class="star" aria-hidden="true">⭐</span>{/if}
		</span>
	</a>
{:else}
	<span
		bind:this={element}
		class="pin soon"
		role="img"
		aria-label={fill(t.globe.comingSoon, { name: pin.name })}
	>
		<span class="bob"><img src={pin.icon} alt="" /></span>
	</span>
{/if}

<style>
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

	.star {
		position: absolute;
		top: -8px;
		right: -8px;
		font-size: 26px;
		filter: drop-shadow(0 2px 2px rgb(0 0 0 / 0.3));
	}

	.pin:focus-visible .bob {
		outline: 4px solid #ffd54f;
		outline-offset: 3px;
	}

	img {
		width: 58px;
		height: 58px;
	}

	/* Coming soon: smaller, grey, still, and not tappable, so drags pass through. */
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
</style>
