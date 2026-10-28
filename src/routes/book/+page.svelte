<script lang="ts">
	// The Animal Book: a sticker for every animal the kid has visited. No
	// counts and no "3 of 34": unvisited animals are faded hints to go find.
	import { goto, preloadData } from '$app/navigation';
	import { book } from '#lib/db/book.svelte.ts';
	import { pins } from '#lib/globe/pins.ts';
	import { clouds } from '#lib/scene/clouds.ts';
	import { t } from '#lib/strings/index.ts';

	const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);
	// Animals you can visit come first; the ones still being made sit quietly below.
	const visitable = pins.filter((p) => p.animal).sort(byName);
	const soon = pins.filter((p) => !p.animal).sort(byName);

	async function open(id: string, event: MouseEvent) {
		event.preventDefault();
		const href = `/animal/${id}`;
		const loading = preloadData(href);
		await clouds.cover();
		await loading;
		await goto(href);
		await clouds.part();
	}
</script>

<svelte:head><title>{t.book.title} · Volar</title></svelte:head>

<main>
	<header>
		<a class="round-button" href="/" aria-label={t.book.back}>🌍</a>
		<h1>{t.book.title}</h1>
	</header>

	<ul>
		{#each visitable as pin (pin.id)}
			<li>
				{#if book.stickers.has(pin.id)}
					<a
						class="sticker"
						href="/animal/{pin.id}"
						style:--theme={pin.animal?.themeColor}
						onclick={(e) => open(pin.id, e)}
					>
						<img src={pin.icon} alt="" />
						<span>{pin.name}</span>
					</a>
				{:else}
					<div class="sticker unseen" role="img" aria-label={t.book.unseen}>
						<img src={pin.icon} alt="" />
						<span>?</span>
					</div>
				{/if}
			</li>
		{/each}
	</ul>

	<h2>{t.book.soon}</h2>
	<ul class="soon-list">
		{#each soon as pin (pin.id)}
			<li class="sticker soon" role="img" aria-label="{pin.name}, {t.book.soon}">
				<img src={pin.icon} alt="" />
			</li>
		{/each}
	</ul>
</main>

<style>
	main {
		position: fixed;
		inset: 0;
		z-index: 1;
		overflow-y: auto;
		padding: max(16px, env(safe-area-inset-top)) 16px 32px;
		background: #fff3d6;
	}

	header {
		display: flex;
		align-items: center;
		gap: 16px;
		margin-bottom: 24px;
	}

	header a {
		text-decoration: none;
	}

	h1 {
		margin: 0;
		font-size: 1.6rem;
	}

	ul {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 16px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.sticker {
		display: grid;
		justify-items: center;
		gap: 8px;
		padding: 16px 8px;
		border-radius: var(--radius);
		background: var(--paper);
		box-shadow: var(--shadow);
		color: inherit;
		text-align: center;
		text-decoration: none;
		font-size: 0.75rem;
		font-weight: 700;
	}

	a.sticker {
		box-shadow:
			inset 0 -6px 0 var(--theme),
			var(--shadow);
		rotate: -2deg;
	}

	li:nth-child(even) a.sticker {
		rotate: 2deg;
	}

	img {
		width: 88px;
		height: 88px;
	}

	/* Not found yet: a faded hint of the animal to go looking for. (Icons have a
	   filled disc behind the animal, so a black silhouette would be a plain circle.) */
	.unseen img {
		filter: grayscale(1) opacity(0.35);
	}

	h2 {
		margin: 40px 0 12px;
		font-size: 1rem;
		opacity: 0.6;
	}

	.soon-list {
		grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
		gap: 10px;
	}

	.soon {
		padding: 10px;
		opacity: 0.5;
		box-shadow: none;
	}

	.soon img {
		width: 44px;
		height: 44px;
		filter: grayscale(1);
	}
</style>
