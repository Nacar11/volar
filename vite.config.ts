import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { packs } from './scripts/vite-plugin-packs.ts';

export default defineConfig({
	plugins: [
		packs(fileURLToPath(new URL('content/animals', import.meta.url))),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// SPA: every route falls back to one shell; content loads client-side.
			adapter: adapter({ fallback: 'index.html' })
		})
	],
	// Animal packs live outside src/ so writers and artists never touch app code.
	server: { fs: { allow: ['content'] } },
	// Keep pack files as separate assets, never inlined, so each animal's pack
	// can be cached on its own.
	build: {
		assetsInlineLimit: (file) => (file.includes('/content/animals/') ? false : undefined)
	},
	test: {
		include: ['src/**/*.test.ts', 'scripts/**/*.test.ts']
	}
});
