import { expect, test } from '@playwright/test';

const bubble = (page: import('@playwright/test').Page) => page.locator('.bubble p');

test.beforeEach(async ({ page }) => {
	await page.goto('/animal/blue-whale');
	await expect(bubble(page)).toHaveText("Hello! I'm a blue whale!");
});

test('"Size compare" lines up buses and cars along the whale', async ({ page }) => {
	await page.getByRole('button', { name: /Size compare/ }).click();
	await expect(bubble(page)).toHaveText("I'm almost as long as two school buses!");
	await expect(page.getByRole('button', { name: /School buses/ })).toHaveAttribute('aria-pressed', 'true');
	await expect(page.locator('svg.sizes .thing')).toHaveCount(2);
	await page.getByRole('button', { name: /Cars/ }).click();
	await expect(page.locator('svg.sizes .thing')).toHaveCount(5);
	// Two guide lines mark the whale's tail and nose.
	await expect(page.locator('svg.sizes line')).toHaveCount(2);
});

test('the x-ray lens finds the baleen a whale has instead of teeth', async ({ page }) => {
	// Reduced motion: the whale fades in instead of swimming across, so it holds still to aim at.
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.reload();
	await expect(bubble(page)).toHaveText("Hello! I'm a blue whale!");
	await page.getByRole('button', { name: /Body x-ray/ }).click();
	const lens = page.getByRole('button', { name: 'Drag the magnifier over me!' });
	const from = (await lens.boundingBox())!;
	const baleen = (await page.locator('#baleen').boundingBox())!;
	await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
	await page.mouse.down();
	await page.mouse.move(baleen.x + baleen.width / 2, baleen.y + baleen.height / 2, { steps: 8 });
	await page.mouse.up();
	await expect(bubble(page)).toHaveText('I have no teeth! I strain krill through my baleen.');
});

test('the whale spouts, dives and waves', async ({ page }) => {
	await page.getByRole('button', { name: /Make it do it/ }).click();
	for (const name of ['Spout!', 'Dive', 'Wave']) {
		const button = page.getByRole('button', { name });
		await button.click();
		await expect(button).toBeDisabled();
		await expect(button).toBeEnabled();
	}
});
