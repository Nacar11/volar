<script lang="ts">
	import Choice from '#lib/grownups/Choice.svelte';
	import DownloadAll from '#lib/offline/DownloadAll.svelte';
	import { motion, settings } from '#lib/settings.svelte.ts';
	import { t } from '#lib/strings/index.ts';

	const g = t.grownups;
</script>

<svelte:head><title>{g.title} · Volar</title></svelte:head>

<main>
	<header>
		<a class="round-button" href="/" aria-label={g.back}>🌍</a>
		<h1>{g.title}</h1>
	</header>

	<section>
		<h2>{g.settings}</h2>
		<Choice
			label={g.sound}
			options={[
				{ label: g.on, value: true },
				{ label: g.off, value: false }
			]}
			value={settings.sound}
			onchange={(v) => settings.set('sound', v)}
		/>
		<Choice
			label={g.motion}
			options={[
				{ label: g.motionDevice, value: null },
				{ label: g.motionLess, value: true },
				{ label: g.motionFull, value: false }
			]}
			value={motion.override}
			onchange={(v) => settings.set('reducedMotion', v)}
		/>
		<Choice
			label={g.text}
			options={[
				{ label: g.normal, value: false },
				{ label: g.big, value: true }
			]}
			value={settings.bigText}
			onchange={(v) => settings.set('bigText', v)}
		/>
		<Choice
			label={g.contrast}
			options={[
				{ label: g.normal, value: false },
				{ label: g.high, value: true }
			]}
			value={settings.highContrast}
			onchange={(v) => settings.set('highContrast', v)}
		/>
	</section>

	<DownloadAll />

	<section>
		<a class="link" href="/grown-ups/credits">{g.credits} →</a>
		<p class="privacy">{g.privacy}</p>
	</section>
</main>

<style>
	main {
		position: fixed;
		inset: 0;
		z-index: 1;
		overflow-y: auto;
		padding: max(16px, env(safe-area-inset-top)) 16px 32px;
		background: #f3f6fa;
		font-size: 0.8rem;
	}

	header {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	header a {
		text-decoration: none;
	}

	h1 {
		margin: 0;
		font-size: 1.4rem;
	}

	section,
	main :global(section) {
		max-width: 720px;
		margin: 24px auto 0;
	}

	h2 {
		font-size: 1rem;
	}

	.link {
		color: #1565c0;
		font-weight: 700;
	}

	.privacy {
		opacity: 0.7;
	}
</style>
