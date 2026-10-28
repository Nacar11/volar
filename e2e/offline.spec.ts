import { expect, test, type Page } from '@playwright/test';

async function untilControlled(page: Page) {
	await page.evaluate(() => navigator.serviceWorker.ready);
	await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
}

test('after one visit online, the globe and that animal work with no network', async ({
	page,
	context
}) => {
	await page.goto('/');
	await untilControlled(page);
	await page.goto('/animal/philippine-tarsier');
	await expect(page.locator('.scene[data-sticker="saved"]')).toHaveCount(1);
	await expect(page.locator('#animal')).toHaveCount(1);

	await context.setOffline(true);
	const errors: string[] = [];
	page.on('pageerror', (e) => errors.push(String(e)));
	await page.goto('/');
	await expect(page.getByTestId('globe').locator('canvas')).toBeVisible();
	await expect(page.locator('a.pin[aria-label="Philippine Tarsier, visited"]')).toHaveCount(1);

	await page.goto('/animal/philippine-tarsier');
	await expect(page.locator('.bubble p')).toHaveText("Hi! I'm a tarsier!");
	await expect(page.locator('#animal')).toHaveCount(1);
	expect(errors).toEqual([]);
	await context.setOffline(false);
});

test('each opened animal gets its own cache, named by its content', async ({ page }) => {
	await page.goto('/');
	await untilControlled(page);
	await page.goto('/animal/scarlet-macaw');
	await expect(page.locator('.scene[data-sticker="saved"]')).toHaveCount(1);
	const names = await page.evaluate(() => caches.keys());
	expect(names.some((n) => n.startsWith('shell-'))).toBe(true);
	expect(names.filter((n) => /^pack-scarlet-macaw-[0-9a-f]{12}$/.test(n))).toHaveLength(1);
	// The tarsier was never opened, so it isn't cached.
	expect(names.some((n) => n.startsWith('pack-philippine-tarsier'))).toBe(false);
});

test('the app can be installed: manifest and icons are served', async ({ page, request }) => {
	await page.goto('/');
	const href = await page.locator('link[rel="manifest"]').getAttribute('href');
	const manifest = await (await request.get(href!)).json();
	expect(manifest).toMatchObject({ name: 'Volar', display: 'standalone', start_url: '/' });
	for (const icon of manifest.icons) {
		expect((await request.get(icon.src)).status()).toBe(200);
	}
	expect(manifest.icons.some((i: { purpose?: string }) => i.purpose === 'maskable')).toBe(true);
});
