<script lang="ts">
	// Stand-in home until the globe lands: one big tile per animal.
	import { animals, iconUrl } from '#lib/content/animals.ts';
	import { t } from '#lib/strings/index.ts';
</script>

<main>
	<h1>{t.appName}</h1>
	<p>{t.home.tagline}</p>
	<ul>
		{#each animals as animal (animal.id)}
			<li>
				<a href="/animal/{animal.id}" style:--theme={animal.themeColor}>
					<img src={iconUrl(animal)} alt="" />
					<span>{animal.name}</span>
				</a>
			</li>
		{/each}
	</ul>
	<small>{t.home.globeSoon}</small>
</main>

<style>
	main {
		min-height: 100%;
		display: grid;
		place-content: center;
		justify-items: center;
		gap: 16px;
		padding: 16px;
		text-align: center;
	}

	h1 {
		margin: 0;
		font-size: 3rem;
	}

	p {
		margin: 0;
	}

	ul {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 16px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	a {
		display: grid;
		justify-items: center;
		gap: 8px;
		padding: 16px 24px;
		border-radius: var(--radius);
		background: var(--paper);
		box-shadow: inset 0 -8px 0 var(--theme), var(--shadow);
		color: inherit;
		text-decoration: none;
		font-weight: 700;
	}

	img {
		width: 112px;
		height: 112px;
	}

	small {
		max-width: 28ch;
		opacity: 0.75;
	}
</style>
