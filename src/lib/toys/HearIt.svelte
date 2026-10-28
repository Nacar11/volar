<script lang="ts">
	import { t } from '#lib/strings/index.ts';

	interface Props {
		/** Plays the sound; resolves when the animal has finished. */
		onhear: () => Promise<void>;
		/** False until the sound has loaded. */
		ready: boolean;
	}

	let { onhear, ready }: Props = $props();
	let busy = $state(false);

	async function hear() {
		busy = true;
		try {
			await onhear();
		} finally {
			busy = false;
		}
	}
</script>

<button class="round-button" disabled={busy || !ready} onclick={hear}>
	<span aria-hidden="true">🔊</span>
	{t.hearIt.button}
</button>

<style>
	button {
		display: flex;
		gap: 8px;
		padding: 0 32px;
	}

	button:disabled {
		opacity: 0.6;
	}
</style>
