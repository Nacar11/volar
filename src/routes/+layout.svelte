<script lang="ts">
	import '@fontsource/andika/latin-400.css';
	import '@fontsource/andika/latin-700.css';
	import '../app.css';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

{@render children()}
