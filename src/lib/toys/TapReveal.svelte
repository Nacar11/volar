<script lang="ts">
	// A mystery egg: tap it, it wobbles and cracks open, and a surprising fact
	// comes out. Tap again for the next one.
	import { motion } from '#lib/settings.svelte.ts';
	import { t } from '#lib/strings/index.ts';

	interface Props {
		cards: string[];
		onreveal: (fact: string) => void;
	}

	let { cards, onreveal }: Props = $props();
	let next = $state(0);
	let cracking = $state(false);
	let opened = $state(false);

	function open() {
		if (cracking) return;
		cracking = true;
		setTimeout(
			() => {
				cracking = false;
				opened = true;
				onreveal(cards[next]);
				next = (next + 1) % cards.length;
			},
			motion.reduced ? 0 : 700
		);
	}
</script>

<button
	class="egg"
	class:cracking
	aria-label={opened ? t.reveal.next : t.reveal.card}
	disabled={cracking}
	onclick={open}
>
	<span aria-hidden="true">{cracking ? '🥚' : opened ? '🐣' : '🥚'}</span>
	{#if opened && !cracking}<span class="sparkle" aria-hidden="true">✨</span>{/if}
</button>

<style>
	.egg {
		position: relative;
		width: 96px;
		height: 96px;
		border: none;
		border-radius: 50%;
		background: var(--paper);
		box-shadow: var(--shadow);
		font-size: 3rem;
	}

	.cracking span {
		display: inline-block;
		animation: wobble 0.7s ease-in-out;
	}

	@keyframes wobble {
		0%,
		100% {
			rotate: 0deg;
		}
		20% {
			rotate: -14deg;
		}
		40% {
			rotate: 12deg;
		}
		60% {
			rotate: -10deg;
			scale: 1.1;
		}
		80% {
			rotate: 6deg;
			scale: 1.2;
		}
	}

	.sparkle {
		position: absolute;
		top: -10px;
		right: -10px;
		font-size: 1.6rem;
	}

	@media (prefers-reduced-motion: reduce) {
		.cracking span {
			animation: none;
		}
	}
</style>
