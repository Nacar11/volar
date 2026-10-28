<script lang="ts">
	import { t } from '#lib/strings/index.ts';
	import { downloadAll, formatBytes, packIndex, readyOffline, totalBytes, type PackInfo } from './downloads';

	const o = t.offline;
	let packs = $state.raw<PackInfo[]>([]);
	let ready = $state.raw(new Set<string>());
	let progress = $state<number | null>(null);
	let failed = $state(false);

	const allReady = $derived(packs.length > 0 && packs.every((p) => ready.has(p.id)));

	$effect(() => {
		packIndex()
			.then(async (index) => {
				packs = index;
				ready = await readyOffline(index);
			})
			.catch(() => (failed = true));
	});

	async function start() {
		failed = false;
		navigator.storage?.persist?.();
		try {
			await downloadAll(packs, (done, total) => (progress = total ? done / total : 1));
			ready = await readyOffline(packs);
		} catch {
			failed = true;
		} finally {
			progress = null;
		}
	}
</script>

<section aria-labelledby="offline-title">
	<h2 id="offline-title">{o.title}</h2>
	<p>{o.intro}</p>
	{#if packs.length}
		{#if progress !== null}
			<progress max="1" value={progress} aria-label={o.downloading}></progress>
		{:else if allReady}
			<p class="done" data-testid="all-ready">✅ {o.allReady}</p>
		{:else}
			<button class="round-button" onclick={start}>
				{o.download} ({formatBytes(totalBytes(packs))})
			</button>
		{/if}
		<ul>
			{#each packs as pack (pack.id)}
				<li>{ready.has(pack.id) ? '✅' : '⬜'} {pack.id.replaceAll('-', ' ')} · {formatBytes(pack.bytes)}</li>
			{/each}
		</ul>
	{/if}
	{#if failed}<p class="failed">{o.failed}</p>{/if}
</section>

<style>
	button {
		padding: 0 24px;
	}

	progress {
		width: 100%;
		height: 24px;
	}

	ul {
		padding-left: 0;
		list-style: none;
		opacity: 0.75;
		text-transform: capitalize;
	}

	.failed {
		color: #c62828;
	}
</style>
