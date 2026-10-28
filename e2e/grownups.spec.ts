import { expect, test } from '@playwright/test';

/** Waits until a setting is stored, so a reload or navigation can't cut the write short. */
async function stored(page: import('@playwright/test').Page, key: string, value: unknown) {
	await expect
		.poll(() =>
			page.evaluate(
				(key) =>
					new Promise((resolve) => {
						const open = indexedDB.open('volar');
						open.onsuccess = () => {
							const req = open.result.transaction('settings').objectStore('settings').get(key);
							req.onsuccess = () => resolve(req.result?.value);
						};
					}),
				key
			)
		)
		.toEqual(value);
}

const gate = (page: import('@playwright/test').Page) =>
	page.getByRole('button', { name: 'Grown-ups: press and hold for 3 seconds' });

test('a tap on the gate does nothing; holding it for 3 s opens the corner', async ({ page }) => {
	await page.goto('/');
	await gate(page).click();
	await page.waitForTimeout(600);
	await expect(page).toHaveURL('/');

	const box = (await gate(page).boundingBox())!;
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
	await page.mouse.down();
	await page.waitForTimeout(1500);
	await expect(page).toHaveURL('/');
	await expect(gate(page)).toHaveAttribute('data-progress', 'holding');
	await page.waitForTimeout(1800);
	await page.mouse.up();
	await expect(page).toHaveURL('/grown-ups');
});

test('letting go early resets the gate', async ({ page }) => {
	await page.goto('/');
	const box = (await gate(page).boundingBox())!;
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
	await page.mouse.down();
	await page.waitForTimeout(2000);
	await page.mouse.up();
	await expect(gate(page)).not.toHaveAttribute('data-progress');
	await page.mouse.down();
	await page.waitForTimeout(2000);
	await page.mouse.up();
	await expect(page).toHaveURL('/');
});

test('the gate also opens by holding Enter', async ({ page }) => {
	await page.goto('/');
	await gate(page).focus();
	await page.keyboard.down('Enter');
	await page.waitForTimeout(3300);
	await page.keyboard.up('Enter');
	await expect(page).toHaveURL('/grown-ups');
});

test('settings apply at once and survive a reload', async ({ page }) => {
	await page.goto('/grown-ups');
	const html = page.locator('html');
	await page.getByRole('group', { name: 'Text size' }).getByText('Big').click();
	await page.getByRole('group', { name: 'Contrast' }).getByText('High').click();
	await expect(html).toHaveAttribute('data-text', 'big');
	await expect(html).toHaveAttribute('data-contrast', 'high');
	await stored(page, 'bigText', true);
	await stored(page, 'highContrast', true);
	await page.reload();
	await expect(html).toHaveAttribute('data-text', 'big');
	await expect(html).toHaveAttribute('data-contrast', 'high');
	await expect(page.getByRole('group', { name: 'Text size' }).getByRole('radio', { name: 'Big' })).toBeChecked();
});

test('with sound off, "Hear it" stays quiet', async ({ page }) => {
	await page.goto('/grown-ups');
	await page.getByRole('group', { name: 'Sound' }).getByText('Off').click();
	await stored(page, 'sound', false);
	await page.goto('/animal/scarlet-macaw');
	await page.getByRole('button', { name: /Hear it/ }).click();
	const hear = page.getByRole('button', { name: /Hear me/ });
	await expect(hear).toBeEnabled();
	await hear.click();
	await expect(page.locator('.bubble p')).toHaveText('SQUAWK! I can be very loud!');
	const playing = await page.evaluate(() => {
		const howler = (window as unknown as { Howler: { _howls: { playing(): boolean }[] } }).Howler;
		return howler._howls.some((h) => h.playing());
	});
	expect(playing).toBe(false);
});

test('the credits name every animal file, the sound and the libraries', async ({ page }) => {
	await page.goto('/grown-ups');
	await page.getByRole('link', { name: /Credits/ }).click();
	await expect(page).toHaveURL('/grown-ups/credits');
	await expect(page.getByRole('heading', { name: 'Philippine Tarsier' })).toBeVisible();
	await expect(page.getByRole('row', { name: /audio\.webm.*Macaw Squawks/ })).toBeVisible();
	await expect(page.getByRole('row', { name: /Andika font/ })).toBeVisible();
	await expect(page.getByRole('row', { name: /lion\.svg/ })).toHaveCount(1);
});
