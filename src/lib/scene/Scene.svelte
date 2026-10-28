<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Howl } from 'howler';
	import { loadSound } from '#lib/audio/sound.ts';
	import { book } from '#lib/db/book.svelte.ts';
	import type { Animal, Toy } from '#lib/content/schema.ts';
	import { packUrl, type Pack } from '#lib/content/animals.ts';
	import { motion, settings } from '#lib/settings.svelte.ts';
	import { fill, t } from '#lib/strings/index.ts';
	import BodyXray from '#lib/toys/BodyXray.svelte';
	import DayNight from '#lib/toys/DayNight.svelte';
	import HearIt from '#lib/toys/HearIt.svelte';
	import SizeCompare from '#lib/toys/SizeCompare.svelte';
	import WhatsForDinner from '#lib/toys/WhatsForDinner.svelte';
	import { FOODS, type Food } from '#lib/toys/foods.ts';
	import { THINGS, type Thing } from '#lib/toys/sizes.ts';
	import MakeItDo from '#lib/toys/MakeItDo.svelte';
	import type { Rig } from './motions';
	import { clouds } from './clouds';
	import { rigs } from './rigs';
	import Puppet from './Puppet.svelte';

	interface Props {
		animal: Animal;
		pack: Pack;
		/** Hands the rig out, for the dev previewer's controls. */
		onrig?: (rig: Rig) => void;
	}

	let { animal, pack, onrig }: Props = $props();

	const TOY_ICONS: Record<Toy['type'], string> = {
		dayNight: '🌗',
		bodyXray: '🔍',
		makeItDo: '🎬',
		hearIt: '🔊',
		sizeCompare: '📏',
		thenVsNow: '🐣',
		whatsForDinner: '🍽️'
	};
	// Far, middle and near layers drift by different amounts as the pointer moves.
	const DEPTHS = [8, 18, 32];

	let rig = $state.raw<Rig | null>(null);
	let factIndex = $state(-1);
	let line = $state('');
	let activeToy = $state<Toy['type'] | null>(null);
	let time = $state<'day' | 'night' | null>(null);
	let asleep = $state(false);
	let pointer = $state({ x: 0, y: 0 });
	let sound = $state.raw<Howl | null>(null);
	let sizeThing = $state<Thing | null>(null);

	// Opening "Size compare" stands the first thing (usually you) beside the animal.
	$effect(() => {
		if (toy?.type !== 'sizeCompare') return;
		// Measuring height, start with you; measuring length, with the first thing listed.
		sizeThing = toy.measure === 'height' && toy.compare.includes('kid') ? 'kid' : toy.compare[0];
		line = toy.caption;
	});

	// The pack's sounds load in the background; "Hear it" waits for them.
	$effect(() => {
		if (!pack.sound) return;
		let howl: Howl | null = null;
		loadSound(pack.sound)
			.then((loaded) => (sound = howl = loaded))
			.catch((error) => console.warn(error));
		return () => howl?.unload();
	});

	const lastFact = $derived(factIndex >= animal.facts.length - 1);
	const toy = $derived(animal.toys.find((x) => x.type === activeToy));

	// "Then and now": 0 shows the baby, 1 the grown-up animal.
	let grownUp = $state(1);
	const showingBaby = $derived(toy?.type === 'thenVsNow' && grownUp < 0.5);

	$effect(() => {
		if (toy?.type !== 'thenVsNow') {
			grownUp = 1;
			return;
		}
		line = showingBaby ? toy.then : toy.now;
	});

	$effect.pre(() => {
		line = animal.greeting;
	});

	// Visiting an animal earns its sticker for the Animal Book.
	let stickerSaved = $state(false);
	$effect(() => {
		book.collect(animal.id).then(() => (stickerSaved = true));
	});

	async function ready(r: Rig) {
		rig = r;
		onrig?.(r);
		// Arriving from the globe, wait for the clouds so the kid sees the whole entrance.
		await clouds.whenOpen();
		await r.entrance();
	}

	function next() {
		factIndex = lastFact ? 0 : factIndex + 1;
		line = animal.facts[factIndex].text;
		rig?.calm();
	}

	function setTime(next: 'day' | 'night') {
		time = next;
		asleep = (next === 'day') === animal.nocturnal;
		rig?.sleep(asleep);
		rig?.dilate(next === 'night' && animal.nocturnal);
		if (toy?.type === 'dayNight') line = next === 'day' ? toy.day : toy.night;
	}

	// Doing an action wakes a sleeping animal up.
	function play(action: string) {
		asleep = false;
		return rig?.play(action) ?? Promise.resolve();
	}

	// "What's for dinner": the food pops up at the animal's mouth; it munches
	// what it eats, and shakes its head while the rest drops away. No wrong answers.
	let snack = $state<{ food: Food; eaten: boolean } | null>(null);
	const mouth = $derived.by((): readonly [number, number] => {
		const rig = rigs[animal.rig];
		return 'mouth' in rig ? rig.mouth : [300, 200];
	});

	async function feed(food: Food) {
		if (toy?.type !== 'whatsForDinner') return;
		const choice = toy.foods.find((f) => f.food === food)!;
		line = choice.caption;
		snack = { food, eaten: choice.eats };
		await play(choice.eats ? 'munch' : 'shake');
		snack = null;
	}

	// Plays a clip; if the rig has an action of the same name (a squawk, a roar),
	// the animal does it along with the sound.
	function hear(clip: string, caption: string) {
		line = caption;
		if (settings.sound) sound?.play(clip);
		const along = (rigs[animal.rig].actions as readonly string[]).includes(clip);
		return along ? play(clip) : Promise.resolve();
	}

	async function leave() {
		await rig?.exit();
		await clouds.cover();
		await goto('/');
		await clouds.part();
	}

	function track(e: PointerEvent) {
		if (motion.reduced || e.pointerType === 'touch') return;
		pointer = {
			x: (e.clientX / innerWidth) * 2 - 1,
			y: (e.clientY / innerHeight) * 2 - 1
		};
	}
</script>

<div class="scene" data-sticker={stickerSaved ? 'saved' : undefined} class:day={time === 'day'} class:night={time === 'night'} style:--theme={animal.themeColor} onpointermove={track} role="presentation">
	{#snippet layer(src: string, i: number)}
		<img
			class="layer"
			class:near={i === pack.background.length - 1}
			{src}
			alt=""
			style:translate="{-pointer.x * DEPTHS[i]}px {-pointer.y * DEPTHS[i] * 0.4}px"
		/>
	{/snippet}
	{#each pack.background.slice(0, -1) as src, i (src)}
		{@render layer(src, i)}
	{/each}
	<!-- Tints the far layers and the animal, under the near layer, which dims itself. -->
	<div class="sky" aria-hidden="true">
		<span class="sun">☀️</span>
		<span class="moon">🌙</span>
		<span class="stars">✨ ✦ ✨ ✦ ✨</span>
	</div>
	{@render layer(pack.background[pack.background.length - 1], pack.background.length - 1)}

	<header>
		<button class="round-button" aria-label={t.scene.back} onclick={leave}>🌍</button>
		<div class="banner">
			<h1>{animal.name}</h1>
			<p>{fill(t.scene.livesIn, { place: animal.livesIn })}</p>
		</div>
	</header>

	<div class="bubble" aria-live="polite">
		<p>{line}</p>
		<button class="round-button" onclick={next} aria-label={lastFact ? t.scene.again : t.scene.next}>
			{lastFact ? '↺' : '▶'}
		</button>
	</div>

	<div class="stage">
		<div class="figure">
			<div class="puppet-layer" style:--grown={toy?.type === 'thenVsNow' ? grownUp : 1}>
			<Puppet
				svg={pack.puppet}
				rig={animal.rig}
				options={animal.rigOptions}
				label={fill(t.scene.tapAnimal, { name: animal.name })}
				onready={ready}
				ontap={() => rig?.react()}
			/>
			</div>
			{#if snack}
				<span
					class="snack"
					class:refused={!snack.eaten}
					style:left="{(mouth[0] / 400) * 100}%"
					style:top="{(mouth[1] / 400) * 100}%"
					aria-hidden="true">{FOODS[snack.food].icon}</span
				>
			{/if}
			{#if toy?.type === 'thenVsNow'}
				<img
					class="baby"
					src={packUrl(animal, toy.image)}
					alt=""
					style:opacity={1 - grownUp}
					style:scale={0.85 + 0.15 * (1 - grownUp)}
				/>
			{/if}
			{#if asleep}
				<span class="zzz" aria-hidden="true">z z z</span>
			{/if}
			{#if toy?.type === 'sizeCompare' && sizeThing}
				<SizeCompare {toy} thing={sizeThing} />
			{/if}
			{#if toy?.type === 'bodyXray'}
				{@const reveal = toy.reveal}
				<BodyXray feature={toy.feature} onreveal={() => (line = reveal)} />
			{/if}
		</div>
	</div>

	<footer>
		{#if toy}
			<div class="panel">
				{#if toy.type === 'dayNight'}
					<DayNight {time} onpick={setTime} />
				{:else if toy.type === 'makeItDo'}
					<MakeItDo actions={toy.actions} onplay={play} />
				{:else if toy.type === 'sizeCompare'}
					<div class="things" role="group" aria-label={t.toys.sizeCompare}>
						{#each toy.compare as thing (thing)}
							<button
								class="round-button"
								aria-pressed={sizeThing === thing}
								onclick={() => (sizeThing = thing)}
							>
								<span aria-hidden="true">{THINGS[thing].icon}</span>
								{THINGS[thing].label}
							</button>
						{/each}
					</div>
				{:else if toy.type === 'whatsForDinner'}
					<WhatsForDinner foods={toy.foods.map((f) => f.food)} onfeed={feed} />
				{:else if toy.type === 'thenVsNow'}
					<label class="then-now">
						<span aria-hidden="true">🐣 {t.thenVsNow.baby}</span>
						<input
							type="range"
							min="0"
							max="1"
							step="0.01"
							aria-label={t.thenVsNow.slider}
							bind:value={grownUp}
						/>
						<span aria-hidden="true">{t.thenVsNow.grown}</span>
					</label>
				{:else if toy.type === 'hearIt'}
					{@const { sound: clip, caption } = toy}
					<HearIt ready={sound !== null} onhear={() => hear(clip, caption)} />
				{:else}
					<p class="hint">{t.bodyXray.hint}</p>
				{/if}
			</div>
		{/if}
		<nav class="shelf" aria-label="Toys">
			{#each animal.toys as item (item.type)}
				<button
					class="round-button toy"
					aria-pressed={activeToy === item.type}
					onclick={() => (activeToy = activeToy === item.type ? null : item.type)}
				>
					<span aria-hidden="true">{TOY_ICONS[item.type]}</span>
					<small>{t.toys[item.type]}</small>
				</button>
			{/each}
		</nav>
	</footer>
</div>

<style>
	.scene {
		position: fixed;
		inset: 0;
		overflow: hidden;
		display: grid;
		grid-template-rows: auto auto minmax(0, 1fr) auto;
		gap: 8px;
		padding: max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom));
		background: #bfe6f5;
	}

	.layer {
		position: absolute;
		inset: -40px;
		width: calc(100% + 80px);
		height: calc(100% + 80px);
		object-fit: cover;
		object-position: center bottom;
		pointer-events: none;
		transition: translate 0.3s ease-out;
	}

	.layer.near {
		z-index: 2;
		transition:
			translate 0.3s ease-out,
			filter 0.8s;
	}

	.night .layer.near {
		filter: brightness(0.55) saturate(0.8);
	}

	.sky {
		position: absolute;
		z-index: 1;
		inset: 0;
		pointer-events: none;
		transition: background-color 0.8s;
	}

	.night .sky {
		background-color: rgb(20 30 90 / 0.55);
	}

	.sun,
	.moon,
	.stars {
		position: absolute;
		top: 12%;
		right: 8%;
		font-size: 4rem;
		opacity: 0;
		transition: opacity 0.8s;
	}

	.stars {
		left: 10%;
		right: auto;
		font-size: 1.6rem;
		letter-spacing: 1.5em;
		color: #fff8c4;
	}

	.day .sun,
	.night .moon,
	.night .stars {
		opacity: 1;
	}

	header,
	.bubble,
	.stage,
	footer {
		position: relative;
		z-index: 1;
	}

	.stage {
		z-index: 0;
	}

	header {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.banner {
		flex: 1;
		max-width: 520px;
		margin-inline: auto;
		padding: 8px 24px;
		border-radius: var(--radius);
		background: var(--paper);
		box-shadow: inset 0 -8px 0 var(--theme), var(--shadow);
		text-align: center;
	}

	h1 {
		margin: 0;
		font-size: 1.4rem;
	}

	.banner p {
		margin: 0;
		font-size: 0.8rem;
	}

	.bubble {
		justify-self: center;
		display: flex;
		align-items: center;
		gap: 16px;
		max-width: min(100%, 640px);
		padding: 12px 12px 12px 24px;
		border-radius: var(--radius);
		background: var(--paper);
		box-shadow: var(--shadow);
	}

	.bubble p {
		margin: 0;
		line-height: 1.3;
	}

	.bubble::after {
		content: '';
		position: absolute;
		left: 50%;
		bottom: -14px;
		border: 14px solid transparent;
		border-bottom: none;
		border-top-color: var(--paper);
		translate: -50% 0;
	}

	.stage {
		container-type: size;
		display: grid;
		place-items: end center;
	}

	.figure {
		position: relative;
		width: min(100cqw, 100cqh);
		height: min(100cqw, 100cqh);
	}

	.zzz {
		position: absolute;
		top: 4%;
		right: 18%;
		font-weight: 700;
		font-size: 1.4rem;
		color: #fffaf0;
		text-shadow: 0 2px 4px rgb(0 0 0 / 0.4);
		animation: float 2.4s ease-in-out infinite;
	}

	@keyframes float {
		50% {
			translate: 6px -12px;
		}
	}

	footer {
		z-index: 3;
		display: grid;
		gap: 12px;
	}

	.panel {
		justify-self: center;
		padding: 12px;
		border-radius: var(--radius);
		background: rgb(255 250 240 / 0.85);
	}

	.puppet-layer {
		width: 100%;
		height: 100%;
	}

	.snack {
		position: absolute;
		translate: -50% -50%;
		font-size: 2.4rem;
		pointer-events: none;
		animation: eaten 1.4s ease-in forwards;
	}

	/* Eaten: pops in at the mouth and is nibbled away. */
	@keyframes eaten {
		0% {
			scale: 0;
		}
		15% {
			scale: 1.2;
		}
		25% {
			scale: 1;
		}
		100% {
			scale: 0;
			opacity: 0;
		}
	}

	/* Refused: drops gently to the ground and fades. */
	.snack.refused {
		animation-name: refused;
	}

	@keyframes refused {
		0% {
			scale: 0;
		}
		15% {
			scale: 1.1;
			translate: -50% -50%;
		}
		100% {
			translate: -150% 120%;
			rotate: -40deg;
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.snack,
		.snack.refused {
			animation: none;
		}
	}

	/* "Then and now" fades only the animal, so the baby stands on the same perch.
	   A filter, not opacity: GSAP animates the animal's opacity on reduced-motion entrances. */
	.puppet-layer :global(#animal) {
		filter: opacity(var(--grown, 1));
	}

	.baby {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		transform-origin: bottom;
	}

	.then-now {
		display: flex;
		align-items: center;
		gap: 12px;
		font-weight: 700;
		font-size: 0.8rem;
	}

	.then-now input {
		width: min(50vw, 320px);
		height: 48px;
		accent-color: var(--theme);
	}

	.things {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 12px;
	}

	.things button {
		display: flex;
		gap: 8px;
		padding: 0 20px;
		font-size: 1rem;
	}

	.things button[aria-pressed='true'] {
		background: #ffe082;
	}

	.hint {
		margin: 0;
		padding: 0 12px;
	}

	.shelf {
		display: flex;
		justify-content: center;
		gap: 16px;
	}

	.toy {
		flex-direction: column;
		display: flex;
		justify-content: center;
		align-items: center;
		width: 112px;
		padding: 8px;
		border-radius: 24px;
		font-size: 1.6rem;
	}

	.toy small {
		font-size: 0.55rem;
		font-weight: 700;
	}

	.toy[aria-pressed='true'] {
		background: #ffe082;
	}

	@media (prefers-reduced-motion: reduce) {
		.zzz {
			animation: none;
		}
	}
</style>
