<script lang="ts">
	// Foods to offer: drag one onto the animal, or just tap it. Dropping it
	// anywhere else puts it back.
	import { t } from '#lib/strings/index.ts';
	import { FOODS, type Food } from './foods';

	interface Props {
		foods: Food[];
		/** Feeds the animal; resolves when it has finished munching (or shaking its head). */
		onfeed: (food: Food) => Promise<void>;
	}

	let { foods, onfeed }: Props = $props();
	let busy = $state(false);
	let dragging = $state<{ food: Food; x: number; y: number } | null>(null);
	let start = { x: 0, y: 0 };
	let moved = false;

	async function feed(food: Food) {
		if (busy) return;
		busy = true;
		try {
			await onfeed(food);
		} finally {
			busy = false;
		}
	}

	function down(food: Food, e: PointerEvent) {
		if (busy) return;
		start = { x: e.clientX, y: e.clientY };
		moved = false;
		dragging = { food, x: e.clientX, y: e.clientY };
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}

	function move(e: PointerEvent) {
		if (!dragging) return;
		if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 10) moved = true;
		dragging = { ...dragging, x: e.clientX, y: e.clientY };
	}

	function up(e: PointerEvent) {
		if (!dragging) return;
		const { food } = dragging;
		dragging = null;
		// A tap feeds straight away; a drag feeds only if it ends on the animal.
		const onAnimal = document.elementsFromPoint(e.clientX, e.clientY).some((el) => el.closest('.figure'));
		if (!moved || onAnimal) feed(food);
	}
</script>

<div class="dinner" role="group" aria-label={t.toys.whatsForDinner}>
	<p class="hint">{t.dinner.hint}</p>
	<div class="foods">
		{#each foods as food (food)}
			<button
				class="round-button"
				aria-label={FOODS[food].label}
				disabled={busy}
				onpointerdown={(e) => down(food, e)}
				onpointermove={move}
				onpointerup={up}
				onpointercancel={() => (dragging = null)}
				onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), feed(food))}
			>
				{FOODS[food].icon}
			</button>
		{/each}
	</div>
</div>

{#if dragging}
	<span class="ghost" style:left="{dragging.x}px" style:top="{dragging.y}px" aria-hidden="true">
		{FOODS[dragging.food].icon}
	</span>
{/if}

<style>
	.dinner {
		display: grid;
		justify-items: center;
		gap: 4px;
	}

	.hint {
		margin: 0;
		font-size: 0.7rem;
		font-weight: 700;
	}

	.foods {
		display: flex;
		gap: 12px;
	}

	button {
		width: 80px;
		height: 80px;
		font-size: 2.2rem;
		touch-action: none;
	}

	button:disabled {
		opacity: 0.6;
	}

	.ghost {
		position: fixed;
		z-index: 60;
		translate: -50% -50%;
		font-size: 3rem;
		pointer-events: none;
		filter: drop-shadow(0 4px 6px rgb(0 0 0 / 0.3));
	}
</style>
