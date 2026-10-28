<script lang="ts">
	import { gsap } from 'gsap';
	import { motion } from '#lib/settings.svelte.ts';
	import { registerCurtain } from './clouds';

	// Puffs centred on a loose 4×4 grid (in % of the screen). Each is 75vmax
	// across, so together they cover any screen shape with room to spare.
	const PUFFS = [0, 33, 66, 100].flatMap((y, row) =>
		[0, 33, 66, 100].map((x, col) => ({ x: x + (row % 2 ? 4 : -4), y: y + (col % 2 ? 4 : -4) }))
	);

	let root: HTMLDivElement;
	type Phase = 'clear' | 'covering' | 'covered' | 'parting';
	let phase = $state<Phase>('clear');
	let mode = $state<'burst' | 'fade'>('burst');

	function play(build: (done: () => void) => void, during: Phase, after: Phase) {
		phase = during;
		return new Promise<void>((resolve) =>
			build(() => {
				phase = after;
				resolve();
			})
		);
	}

	$effect(() => {
		const puffs = root.querySelectorAll('.puff');
		return registerCurtain({
			cover: () =>
				play(
					(done) => {
						mode = motion.reduced ? 'fade' : 'burst';
						if (motion.reduced) {
							gsap.set(puffs, { scale: 1 });
							gsap.fromTo(root, { opacity: 0 }, { opacity: 1, duration: 0.3, onComplete: done });
						} else {
							gsap.set(root, { opacity: 1 });
							gsap.fromTo(
								puffs,
								{ scale: 0 },
								{
									scale: 1,
									duration: 0.35,
									ease: 'back.out(1.4)',
									stagger: { each: 0.008, from: 'random' },
									onComplete: done
								}
							);
						}
					},
					'covering',
					'covered'
				),
			part: () =>
				play(
					(done) => {
						if (mode === 'fade') {
							gsap.to(root, { opacity: 0, duration: 0.3, onComplete: done });
						} else {
							gsap.to(puffs, {
								scale: 0,
								duration: 0.45,
								ease: 'power2.in',
								stagger: { each: 0.015, from: 'center', grid: [4, 4] },
								onComplete: done
							});
						}
					},
					'parting',
					'clear'
				)
		});
	});
</script>

<div class="curtain" bind:this={root} data-testid="clouds" data-state={phase} data-mode={mode} aria-hidden="true">
	{#each PUFFS as puff, i (i)}
		<span class="puff" style:left="{puff.x}%" style:top="{puff.y}%"></span>
	{/each}
</div>

<style>
	.curtain {
		position: fixed;
		inset: 0;
		z-index: 100;
		overflow: hidden;
		pointer-events: none;
	}

	/* While the clouds are up, taps don't reach whatever is underneath. */
	.curtain:not([data-state='clear']) {
		pointer-events: auto;
	}

	.puff {
		position: absolute;
		width: 75vmax;
		height: 75vmax;
		margin: -37.5vmax 0 0 -37.5vmax;
		border-radius: 50%;
		background: #ffffff;
		box-shadow: inset -2vmax -3vmax 0 #dceffa;
		transform: scale(0);
	}
</style>
