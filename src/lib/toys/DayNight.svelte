<script lang="ts">
	import { t } from '#lib/strings/index.ts';

	type Time = 'day' | 'night';

	interface Props {
		time: Time | null;
		onpick: (time: Time) => void;
	}

	let { time, onpick }: Props = $props();
</script>

<div class="day-night" role="group" aria-label={t.toys.dayNight}>
	<button class="round-button" aria-pressed={time === 'day'} onclick={() => onpick('day')}>
		<span aria-hidden="true">☀️</span>
		{t.dayNight.day}
	</button>
	<button class="round-button" aria-pressed={time === 'night'} onclick={() => onpick('night')}>
		<span aria-hidden="true">🌙</span>
		{t.dayNight.night}
	</button>
</div>

<style>
	.day-night {
		display: flex;
		gap: 16px;
		justify-content: center;
	}

	button {
		display: flex;
		gap: 8px;
		padding: 0 28px;
	}

	button[aria-pressed='true'] {
		background: #ffe082;
	}
</style>
