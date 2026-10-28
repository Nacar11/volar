import { expect, test } from '@playwright/test';

const bubble = (page: import('@playwright/test').Page) => page.locator('.bubble p');

test.beforeEach(async ({ page }) => {
	await page.goto('/animal/emperor-penguin');
	await expect(bubble(page)).toHaveText("Hello! I'm an emperor penguin!");
});

test('"Then and now" slides from the fluffy chick to the grown-up', async ({ page }) => {
	await page.getByRole('button', { name: /Then and now/ }).click();
	await expect(bubble(page)).toHaveText("Grown up, I'm black, white and yellow.");
	const slider = page.getByRole('slider', { name: 'Slide from baby to grown-up' });
	const baby = page.locator('img.baby');
	await expect(baby).toHaveCSS('opacity', '0');

	await slider.fill('0');
	await expect(bubble(page)).toHaveText('As a chick, I was fluffy and grey!');
	await expect(baby).toHaveCSS('opacity', '1');
	// The perch stays: only the grown-up animal fades.
	await expect(page.locator('#perch')).toBeVisible();

	await slider.fill('0.8');
	await expect(bubble(page)).toHaveText("Grown up, I'm black, white and yellow.");
});

test('the penguin is almost as tall as you', async ({ page }) => {
	await page.getByRole('button', { name: /Size compare/ }).click();
	await expect(bubble(page)).toHaveText("I'm almost as tall as you!");
	await expect(page.locator('svg.sizes .thing')).toHaveCount(1);
});

test('the penguin slides, flaps and dances', async ({ page }) => {
	await page.getByRole('button', { name: /Make it do it/ }).click();
	for (const name of ['Slide', 'Flap!', 'Dance']) {
		const button = page.getByRole('button', { name });
		await button.click();
		await expect(button).toBeDisabled();
		await expect(button).toBeEnabled();
	}
});
