import { expect, test } from '@playwright/test';

const bubble = (page: import('@playwright/test').Page) => page.locator('.bubble p');

test.beforeEach(async ({ page }) => {
	await page.goto('/animal/scarlet-macaw');
	await expect(bubble(page)).toHaveText("Hello! I'm a scarlet macaw!");
});

test('"Hear it" loads the squawk and plays it', async ({ page }) => {
	await page.getByRole('button', { name: /Hear it/ }).click();
	const hear = page.getByRole('button', { name: /Hear me/ });
	// Disabled until the sound has loaded.
	await expect(hear).toBeEnabled();
	await hear.click();
	await expect(bubble(page)).toHaveText('SQUAWK! I can be very loud!');
	await expect(hear).toBeDisabled();
	// Howler puts itself on window; one sound loaded and playing.
	const playing = await page.evaluate(() => {
		const howler = (window as unknown as { Howler: { _howls: { playing(): boolean }[] } }).Howler;
		return howler._howls.some((h) => h.playing());
	});
	expect(playing).toBe(true);
	await expect(hear).toBeEnabled();
});

test('the macaw flaps and dances', async ({ page }) => {
	await page.getByRole('button', { name: /Make it do it/ }).click();
	for (const name of ['Flap!', 'Dance']) {
		const button = page.getByRole('button', { name });
		await button.click();
		await expect(button).toBeDisabled();
		await expect(button).toBeEnabled();
	}
});

test('a macaw is awake by day and asleep at night', async ({ page }) => {
	await page.getByRole('button', { name: /Day or night/ }).click();
	await page.getByRole('button', { name: /Night$/ }).click();
	await expect(bubble(page)).toHaveText('Shh... I sleep high up in the trees.');
	await expect(page.getByText('z z z')).toBeVisible();
	await page.getByRole('button', { name: /Day$/ }).click();
	await expect(bubble(page)).toHaveText('Good morning! Time to fly and find food.');
	await expect(page.getByText('z z z')).toBeHidden();
});
