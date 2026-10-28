<script lang="ts">
	import { animals, iconUrl } from '#lib/content/animals.ts';
	import Globe from '#lib/globe/Globe.svelte';
	import { t } from '#lib/strings/index.ts';
</script>

<Globe />

<!-- Until icons sit on the globe (Task 3), animals are reached from this row. -->
<nav aria-label={t.home.tagline}>
	{#each animals as animal (animal.id)}
		<a href="/animal/{animal.id}" style:--theme={animal.themeColor}>
			<img src={iconUrl(animal)} alt="" />
			<span class="sr-only">{animal.name}</span>
		</a>
	{/each}
</nav>

<style>
	nav {
		position: fixed;
		left: 50%;
		bottom: max(16px, env(safe-area-inset-bottom));
		translate: -50% 0;
		display: flex;
		gap: 12px;
	}

	a {
		display: grid;
		place-items: center;
		width: 80px;
		height: 80px;
		border-radius: 50%;
		background: var(--paper);
		box-shadow: inset 0 -6px 0 var(--theme), var(--shadow);
	}

	img {
		width: 64px;
		height: 64px;
	}
</style>
