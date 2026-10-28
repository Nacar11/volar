import { expect, test } from '@playwright/test';

const bubble = (page: import('@playwright/test').Page) => page.locator('.bubble p');

test('the jaguar’s mystery eggs crack open one surprising fact at a time', async ({ page }) => {
	await page.goto('/animal/jaguar');
	await expect(bubble(page)).toHaveText("Hello! I'm a jaguar!");
	await page.getByRole('button', { name: /Mystery/ }).click();
	await page.getByRole('button', { name: 'Tap the mystery egg!' }).click();
	await expect(bubble(page)).toHaveText("I bite so hard I can crack a turtle's shell!");
	await page.getByRole('button', { name: 'Another mystery egg' }).click();
	await expect(bubble(page)).toHaveText('Some jaguars are black, but their spots still show!');
	// After the last egg, they start again.
	await page.getByRole('button', { name: 'Another mystery egg' }).click();
	await expect(bubble(page)).toHaveText("I bite so hard I can crack a turtle's shell!");
});

test('the bison races ahead of a car in town and wins', async ({ page }) => {
	await page.goto('/animal/american-bison');
	await expect(bubble(page)).toHaveText("Hello! I'm an American bison!");
	await page.getByRole('button', { name: /Speed race/ }).click();
	await page.getByRole('button', { name: /A car in town/ }).click();
	await expect(bubble(page)).toHaveText('Go!');
	await page.waitForTimeout(900);
	// Mid-race, the faster bison is ahead.
	const bison = (await page.locator('.race img.runner').boundingBox())!;
	const car = (await page.locator('.race .runner.emoji').boundingBox())!;
	expect(bison.x).toBeGreaterThan(car.x);
	await expect(bubble(page)).toHaveText('I can outrun a car driving through town!');
	await expect(page.getByRole('button', { name: /A bike/ })).toBeEnabled();
});

test('with reduced motion the race jumps straight to the result', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/animal/american-bison');
	await page.getByRole('button', { name: /Speed race/ }).click();
	await page.getByRole('button', { name: /You/ }).click();
	await expect(bubble(page)).toHaveText("I'm about four times faster than you!");
});

test('the bison grazes on grass and turns down a burger', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/animal/american-bison');
	await page.getByRole('button', { name: /What's for dinner/ }).click();
	await page.getByRole('button', { name: 'Grass' }).click();
	await expect(bubble(page)).toHaveText('Mmm, grass! I graze all day long.');
	await expect(page.getByRole('button', { name: 'Burger' })).toBeEnabled();
	await page.getByRole('button', { name: 'Burger' }).click();
	await expect(bubble(page)).toHaveText('No thanks! Bison only eat plants.');
});
