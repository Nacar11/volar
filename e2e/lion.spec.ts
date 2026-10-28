import { expect, test } from '@playwright/test';

const bubble = (page: import('@playwright/test').Page) => page.locator('.bubble p');

/** The shown thing's box, once its pop-in animation has finished. */
async function thingBox(page: import('@playwright/test').Page) {
	const thing = page.locator('svg.sizes .thing');
	await thing.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
	return (await thing.boundingBox())!;
}

test.beforeEach(async ({ page }) => {
	await page.goto('/animal/lion');
	await expect(bubble(page)).toHaveText("Hello! I'm a lion!");
});

test('"Size compare" stands you beside the lion, then a cat and a grown-up', async ({ page }) => {
	await page.getByRole('button', { name: /Size compare/ }).click();
	await expect(bubble(page)).toHaveText('My shoulder is about as tall as you!');
	const you = page.getByRole('button', { name: /You/ });
	await expect(you).toHaveAttribute('aria-pressed', 'true');
	await expect(page.locator('svg.sizes .thing')).toHaveCount(1);

	// At true scale: a 1.2 m kid reaches the lion's 1.2 m shoulder line.
	const line = (await page.locator('svg.sizes line').boundingBox())!;
	const kid = await thingBox(page);
	expect(Math.abs(kid.y - line.y)).toBeLessThan(4);

	await page.getByRole('button', { name: /House cat/ }).click();
	const cat = await thingBox(page);
	expect(cat.height).toBeLessThan(kid.height / 3);
	// It stands on the same ground as the kid did.
	expect(Math.abs(cat.y + cat.height - (kid.y + kid.height))).toBeLessThan(4);
});

test('the lion roars, walks and stretches', async ({ page }) => {
	await page.getByRole('button', { name: /Hear it/ }).click();
	const hear = page.getByRole('button', { name: /Hear me/ });
	await expect(hear).toBeEnabled();
	await hear.click();
	await expect(bubble(page)).toHaveText('ROAR! You could hear me from far away!');
	await expect(hear).toBeEnabled();

	await page.getByRole('button', { name: /Make it do it/ }).click();
	for (const name of ['Walk', 'Stretch']) {
		const button = page.getByRole('button', { name });
		await button.click();
		await expect(button).toBeDisabled();
		await expect(button).toBeEnabled();
	}
});
