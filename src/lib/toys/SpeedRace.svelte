<script lang="ts">
	// Two lanes, one race: the animal against something a kid knows. Runners
	// move at their true relative speeds (see raceTimes); the faster wins.
	import { motion } from '#lib/settings.svelte.ts';
	import { t } from '#lib/strings/index.ts';
	import { RACERS, raceTimes, type Racer } from './racers';

	interface Props {
		icon: string;
		kmh: number;
		racers: Racer[];
		/** The race starts (the animal sprints along). */
		onstart: (racer: Racer) => void;
		/** The race is over. */
		onfinish: (racer: Racer) => void;
	}

	let { icon, kmh, racers, onstart, onfinish }: Props = $props();

	let racer = $state<Racer | null>(null);
	let positions = $state({ animal: 0, racer: 0 });
	let durations = $state({ animal: 0, racer: 0 });
	let racing = $state(false);

	function race(next: Racer) {
		if (racing) return;
		const times = raceTimes(kmh, RACERS[next].kmh);
		racer = next;
		racing = true;
		// Back to the start line with no transition, then let them run.
		durations = { animal: 0, racer: 0 };
		positions = { animal: 0, racer: 0 };
		onstart(next);
		requestAnimationFrame(() =>
			requestAnimationFrame(() => {
				const still = motion.reduced;
				durations = still ? { animal: 0, racer: 0 } : { animal: times.animal, racer: times.racer };
				positions = { animal: times.finish.animal, racer: times.finish.racer };
				setTimeout(
					() => {
						racing = false;
						onfinish(next);
					},
					still ? 0 : times.end * 1000
				);
			})
		);
	}
</script>

<div class="race" data-racing={racing || undefined}>
	<div class="track" aria-hidden="true">
		<div class="lane">
			<img
				class="runner"
				src={icon}
				alt=""
				style:left="{positions.animal * 100}%"
				style:transition-duration="{durations.animal}s"
			/>
			<span class="speed">{kmh} km/h</span>
		</div>
		{#if racer}
			<div class="lane">
				<span
					class="runner emoji"
					style:left="{positions.racer * 100}%"
					style:transition-duration="{durations.racer}s">{RACERS[racer].icon}</span
				>
				<span class="speed">{RACERS[racer].kmh} km/h</span>
			</div>
		{/if}
		<div class="finish">{t.race.finish}</div>
	</div>
	<div class="choices" role="group" aria-label={t.race.choose}>
		{#each racers as option (option)}
			<button
				class="round-button"
				disabled={racing}
				aria-pressed={racer === option}
				onclick={() => race(option)}
			>
				<span aria-hidden="true">{RACERS[option].icon}</span>
				{RACERS[option].label}
			</button>
		{/each}
	</div>
</div>

<style>
	.race {
		display: grid;
		gap: 10px;
		justify-items: center;
	}

	.track {
		position: relative;
		width: min(80vw, 560px);
		/* The right-hand column holds each lane's speed, past the finish line. */
		padding: 6px 84px 6px 24px;
		border-radius: 14px;
		background: repeating-linear-gradient(90deg, #8d6e63 0 20px, #a1887f 20px 40px);
	}

	.lane {
		position: relative;
		height: 44px;
		border-bottom: 2px dashed rgb(255 255 255 / 0.6);
	}

	.runner {
		position: absolute;
		top: 2px;
		width: 40px;
		height: 40px;
		translate: -50% 0;
		transition-property: left;
		transition-timing-function: linear;
	}

	.emoji {
		font-size: 34px;
		line-height: 40px;
		text-align: center;
	}

	.speed {
		position: absolute;
		left: calc(100% + 16px);
		top: 12px;
		white-space: nowrap;
		font-size: 0.5rem;
		font-weight: 700;
		color: #fff;
	}

	.finish {
		position: absolute;
		top: 0;
		right: 80px;
		bottom: 0;
		width: 8px;
		background: repeating-linear-gradient(#000 0 8px, #fff 8px 16px);
		font-size: 0;
	}

	.choices {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 10px;
	}

	.choices button {
		display: flex;
		gap: 8px;
		padding: 0 18px;
		font-size: 0.9rem;
	}

	.choices button[aria-pressed='true'] {
		background: #ffe082;
	}

	button:disabled {
		opacity: 0.6;
	}
</style>
