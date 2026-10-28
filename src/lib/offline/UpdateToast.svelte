<script lang="ts">
	import { page } from '$app/state';
	import { t } from '#lib/strings/index.ts';
	import { toastAllowed, updates } from './updates.svelte';
</script>

{#if updates.waiting && toastAllowed(page.route.id)}
	<div class="toast" role="status">
		<span>✨ {t.offline.update}</span>
		<button class="round-button" onclick={() => updates.apply()}>{t.offline.refresh}</button>
	</div>
{/if}

<style>
	.toast {
		position: fixed;
		left: 50%;
		bottom: max(96px, env(safe-area-inset-bottom));
		z-index: 50;
		translate: -50% 0;
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 8px 8px 8px 24px;
		border-radius: 999px;
		background: var(--paper);
		box-shadow: var(--shadow);
		font-weight: 700;
		white-space: nowrap;
	}

	button {
		padding: 0 24px;
		background: #ffe082;
	}
</style>
