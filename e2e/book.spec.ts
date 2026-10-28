import { expect, test, type Page } from '@playwright/test';

// Opens a scene and waits until its sticker is saved, so leaving can't cut the write short.
async function visit(page: Page, id: string) {
	await page.goto(`/animal/${id}`);
	await expect(page.locator('.scene[data-sticker="saved"]')).toHaveCount(1);
}

test('a new book has no stickers: built animals are silhouettes to find', async ({ page }) => {
	await page.goto('/book');
	await expect(page.getByRole('heading', { name: 'My Animal Book' })).toBeVisible();
	await expect(page.getByRole('img', { name: 'Find me on the globe!' })).toHaveCount(2);
	await expect(page.locator('main a.sticker')).toHaveCount(0);
	await expect(page.getByRole('img', { name: 'Lion, Coming soon' })).toHaveCount(1);
});

test('visiting an animal gives its sticker, which survives a reload', async ({ page }) => {
	await visit(page, 'philippine-tarsier');
	await page.reload();
	await page.goto('/book');
	const sticker = page.getByRole('link', { name: 'Philippine Tarsier' });
	await expect(sticker).toBeVisible();
	await expect(page.getByRole('img', { name: 'Find me on the globe!' })).toHaveCount(1);

	// A sticker opens its animal's scene, through the clouds.
	await sticker.click();
	await expect(page).toHaveURL('/animal/philippine-tarsier');
	await expect(page.getByTestId('clouds')).toHaveAttribute('data-state', 'clear');
});

test('a visited animal wears a star on the globe', async ({ page }) => {
	await visit(page, 'scarlet-macaw');
	await page.goto('/');
	await expect(page.locator('a.pin[aria-label="Scarlet Macaw, visited"]')).toHaveCount(1);
	await expect(page.locator('a.pin[aria-label="Philippine Tarsier"]')).toHaveCount(1);
});

test('the book never counts', async ({ page }) => {
	await visit(page, 'philippine-tarsier');
	await page.goto('/book');
	await expect(page.locator('main')).not.toContainText(/\d/);
});

test('the globe has a button to the book, and the book one back', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: 'My Animal Book' }).click();
	await expect(page).toHaveURL('/book');
	await page.getByRole('link', { name: 'Back to the globe' }).click();
	await expect(page).toHaveURL('/');
	await expect(page.getByTestId('globe').locator('canvas')).toBeVisible();
});
