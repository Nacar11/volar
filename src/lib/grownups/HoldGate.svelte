<script lang="ts">
	// The way into the grown-ups corner: press and hold for 3 seconds while a
	// ring fills. A tap, or letting go early, does nothing, so kids don't
	// wander in. This is the app's one deliberate long-press.
	import { goto } from '$app/navigation';
	import { t } from '#lib/strings/index.ts';

	const HOLD_MS = 3000;
	let progress = $state(0);
	let started: number | null = null;
	let frame = 0;

	function begin() {
		if (started !== null) return;
		started = performance.now();
		frame = requestAnimationFrame(tick);
	}

	function tick(now: number) {
		if (started === null) return;
		progress = Math.min((now - started) / HOLD_MS, 1);
		if (progress < 1) {
			frame = requestAnimationFrame(tick);
			return;
		}
		cancel();
		goto('/grown-ups');
	}

	function cancel() {
		started = null;
		cancelAnimationFrame(frame);
		progress = 0;
	}

	const holdKey = (e: KeyboardEvent) => e.key === ' ' || e.key === 'Enter';
</script>

<button
	class="gate"
	aria-label={t.grownups.gate}
	style:--progress={progress}
	data-progress={progress > 0 ? 'holding' : undefined}
	onpointerdown={begin}
	onpointerup={cancel}
	onpointerleave={cancel}
	onpointercancel={cancel}
	onkeydown={(e) => {
		if (!holdKey(e)) return;
		e.preventDefault();
		begin();
	}}
	onkeyup={(e) => holdKey(e) && cancel()}
	oncontextmenu={(e) => e.preventDefault()}
>
	<span aria-hidden="true">⚙️</span>
</button>

<style>
	.gate {
		position: absolute;
		right: 16px;
		bottom: max(16px, env(safe-area-inset-bottom));
		width: 64px;
		height: 64px;
		border: none;
		border-radius: 50%;
		background:
			radial-gradient(circle, var(--paper) 58%, transparent 60%),
			conic-gradient(#ffd54f calc(var(--progress) * 360deg), rgb(255 255 255 / 0.25) 0);
		font-size: 1.2rem;
		touch-action: none;
		user-select: none;
		-webkit-touch-callout: none;
	}
</style>
