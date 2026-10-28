import { expect, test } from '@playwright/test';

const bubble = (page: import('@playwright/test').Page) => page.locator('.bubble p');

test.beforeEach(async ({ page }) => {
	// Reduced motion: the panda fades in instead of tumbling, so it holds still to aim at.
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/animal/giant-panda');
	await expect(bubble(page)).toHaveText("Hi! I'm a giant panda!");
	await page.getByRole('button', { name: /What's for dinner/ }).click();
});

test('tapping bamboo feeds the panda; a burger gets a polite no', async ({ page }) => {
	const bamboo = page.getByRole('button', { name: 'Bamboo' });
	await bamboo.click();
	await expect(bubble(page)).toHaveText('Yum! Bamboo is almost all I eat!');
	await expect(page.locator('.snack')).toHaveCount(1);
	await expect(bamboo).toBeDisabled();
	await expect(bamboo).toBeEnabled();
	await expect(page.locator('.snack')).toHaveCount(0);

	await page.getByRole('button', { name: 'Burger' }).click();
	await expect(bubble(page)).toHaveText("No thanks! Pandas don't eat burgers.");
	await expect(page.locator('.snack.refused')).toHaveCount(1);
});

test('dragging food onto the panda feeds it; dropping it elsewhere does not', async ({ page }) => {
	const pizza = (await page.getByRole('button', { name: 'Pizza' }).boundingBox())!;
	const figure = (await page.locator('.figure').boundingBox())!;

	// Dropped on the sky, away from the panda: nothing happens.
	await page.mouse.move(pizza.x + pizza.width / 2, pizza.y + pizza.height / 2);
	await page.mouse.down();
	await page.mouse.move(20, 300, { steps: 8 });
	await page.mouse.up();
	await expect(bubble(page)).toHaveText("Hi! I'm a giant panda!");

	// Dropped on the panda: offered.
	await page.mouse.move(pizza.x + pizza.width / 2, pizza.y + pizza.height / 2);
	await page.mouse.down();
	await page.mouse.move(figure.x + figure.width * 0.6, figure.y + figure.height * 0.6, { steps: 8 });
	await page.mouse.up();
	await expect(bubble(page)).toHaveText("Pizza? No thanks, I'll stick to bamboo!");
});

test('the x-ray lens finds the wrist bone that works like a thumb', async ({ page }) => {
	await page.getByRole('button', { name: /Body x-ray/ }).click();
	const lens = (await page.getByRole('button', { name: 'Drag the magnifier over me!' }).boundingBox())!;
	const thumb = (await page.locator('#thumb').boundingBox())!;
	await page.mouse.move(lens.x + lens.width / 2, lens.y + lens.height / 2);
	await page.mouse.down();
	await page.mouse.move(thumb.x + thumb.width / 2, thumb.y + thumb.height / 2, { steps: 8 });
	await page.mouse.up();
	await expect(bubble(page)).toHaveText('This wrist bone works like a thumb to hold bamboo!');
});

test('the panda tumbles, walks and munches', async ({ page }) => {
	await page.getByRole('button', { name: /Make it do it/ }).click();
	for (const name of ['Tumble', 'Walk', 'Munch']) {
		const button = page.getByRole('button', { name });
		await button.click();
		await expect(button).toBeDisabled();
		await expect(button).toBeEnabled();
	}
	// After a roll the panda is exactly back where it started.
	await expect(page.locator('#animal')).toHaveAttribute('transform', 'matrix(1,0,0,1,0,0)');
});
