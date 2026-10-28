import { defineConfig, devices } from '@playwright/test';

// Runs against a production build, the same files a kid's device would get.
export default defineConfig({
	testDir: 'e2e',
	webServer: {
		command: 'npm run build && npx vite preview --port 4173 --strictPort',
		port: 4173,
		reuseExistingServer: !process.env.CI
	},
	use: {
		baseURL: 'http://localhost:4173',
		// Use the real GPU when there is one; headless Chromium otherwise falls
		// back to software WebGL, which says nothing about how the globe runs.
		launchOptions: {
			args: [
				'--enable-gpu',
				'--ignore-gpu-blocklist',
				...(process.platform === 'darwin' ? ['--use-angle=metal'] : [])
			]
		}
	},
	projects: [
		{ name: 'tablet', use: { ...devices['Desktop Chrome'], viewport: { width: 1024, height: 768 } } },
		{ name: 'phone', use: { ...devices['Pixel 7'] } }
	]
});
