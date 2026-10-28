import { expect, test } from '@playwright/test';

// A browser with no WebGL gets the flat map instead of the globe.
test.use({ launchOptions: { args: ['--disable-webgl', '--disable-3d-apis'] } });

const tarsierIcon = (page: import('@playwright/test').Page) =>
	page.getByRole('link', { name: 'Philippine Tarsier' }).locator('img');

test('without WebGL the flat map stands in for the globe', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', (e) => errors.push(String(e)));
	await page.goto('/');
	await expect(page.getByTestId('flat-map')).toBeVisible();
	await expect(page.getByTestId('globe')).toHaveCount(0);
	await expect(page.getByTestId('flat-map').locator('.pin')).toHaveCount(34);
	await expect(tarsierIcon(page)).toBeVisible();
	expect(errors).toEqual([]);
});

test('tapping the tarsier on the flat map opens its scene, and back returns to the map', async ({
	page
}) => {
	await page.goto('/');
	await tarsierIcon(page).click({ force: true });
	await expect(page).toHaveURL('/animal/philippine-tarsier');
	await expect(page.getByTestId('clouds')).toHaveAttribute('data-state', 'clear');
	await expect(page.locator('.bubble p')).toHaveText("Hi! I'm a tarsier!");
	await page.getByRole('button', { name: 'Back to the globe' }).click();
	await expect(page).toHaveURL('/');
	await expect(page.getByTestId('flat-map')).toBeVisible();
});

test('hovering a pin on the flat map pulses its habitat', async ({ page }) => {
	await page.goto('/');
	const map = page.getByTestId('flat-map');
	await tarsierIcon(page).hover({ force: true });
	await expect(map).toHaveAttribute('data-pulse', 'philippine-tarsier');
	await expect(map.locator('.habitat.pulse')).toHaveCount(1);
});
