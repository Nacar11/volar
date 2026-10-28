<script lang="ts">
	import { creditGroups } from '#lib/content/credits.ts';
	import { t } from '#lib/strings/index.ts';

	const groups = creditGroups();
</script>

<svelte:head><title>{t.grownups.credits} · Volar</title></svelte:head>

<main>
	<header>
		<a class="round-button" href="/grown-ups" aria-label={t.grownups.title}>←</a>
		<h1>{t.grownups.credits}</h1>
	</header>
	<p>{t.grownups.creditsIntro}</p>

	{#each groups as group (group.title)}
		<section>
			<h2>{group.title}</h2>
			<table>
				<tbody>
					{#each group.credits as credit (credit.file)}
						<tr>
							<th scope="row">{credit.file}</th>
							<td>{credit.source}<br /><small>{credit.author} · {credit.license}</small></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</section>
	{/each}
</main>

<style>
	main {
		position: fixed;
		inset: 0;
		z-index: 1;
		overflow-y: auto;
		padding: max(16px, env(safe-area-inset-top)) 16px 32px;
		background: #f3f6fa;
		font-size: 0.65rem;
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
	p {
		max-width: 820px;
		margin-inline: auto;
	}

	h2 {
		margin-top: 28px;
		font-size: 0.9rem;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th,
	td {
		padding: 8px 6px;
		border-bottom: 1px solid rgb(0 0 0 / 0.08);
		text-align: left;
		vertical-align: top;
		overflow-wrap: anywhere;
	}

	th {
		width: 32%;
	}
</style>
