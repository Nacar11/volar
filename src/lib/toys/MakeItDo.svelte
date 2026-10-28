<script lang="ts">
	import { t } from '#lib/strings/index.ts';

	interface Props {
		actions: string[];
		onplay: (action: string) => Promise<void>;
	}

	let { actions, onplay }: Props = $props();
	let busy = $state(false);

	const label = (action: string) => (t.actions as Record<string, string>)[action] ?? action;

	async function play(action: string) {
		busy = true;
		try {
			await onplay(action);
		} finally {
			busy = false;
		}
	}
</script>

<div class="make-it-do" role="group" aria-label={t.toys.makeItDo}>
	{#each actions as action (action)}
		<button class="round-button" disabled={busy} onclick={() => play(action)}>
			{label(action)}
		</button>
	{/each}
</div>

<style>
	.make-it-do {
		display: flex;
		gap: 16px;
		justify-content: center;
		flex-wrap: wrap;
	}

	button {
		padding: 0 28px;
	}

	button:disabled {
		opacity: 0.6;
	}
</style>
