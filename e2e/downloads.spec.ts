import { expect, test, type Page } from '@playwright/test';

async function untilControlled(page: Page) {
	await page.evaluate(() => navigator.serviceWorker.ready);
	await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
}

test('"Download all" makes an animal never opened work offline, sound and all', async ({
	page,
	context
}) => {
	await page.goto('/');
	await untilControlled(page);
	await page.goto('/grown-ups');
	const download = page.getByRole('button', { name: /Download all animals \(\d+ KB\)/ });
	await download.click();
	await expect(page.getByTestId('all-ready')).toBeVisible();

	await context.setOffline(true);
	await page.goto('/animal/scarlet-macaw');
	await expect(page.locator('.bubble p')).toHaveText("Hello! I'm a scarlet macaw!");
	await page.getByRole('button', { name: /Hear it/ }).click();
	await expect(page.getByRole('button', { name: /Hear me/ })).toBeEnabled();
	await context.setOffline(false);
});

test('the update toast offers a new version on the globe, never in a scene, and refreshes into it', async ({
	page
}, info) => {
	test.skip(info.project.name !== 'tablet', 'one project is enough');
	await page.goto('/');
	await untilControlled(page);
	// A new deploy. (Playwright can't intercept the browser's own update check,
	// so re-register the same scope with a new script URL: the browser installs
	// it as an update, and it waits for the toast.)
	await page.evaluate(() => navigator.serviceWorker.register('/service-worker.js?deploy=2'));

	const toast = page.getByRole('status').filter({ hasText: 'New animals arrived!' });
	await expect(toast).toBeVisible({ timeout: 10_000 });
	await page.goto('/animal/philippine-tarsier');
	await expect(page.locator('.bubble p')).toHaveText("Hi! I'm a tarsier!");
	await expect(toast).toBeHidden();

	await page.getByRole('button', { name: 'Back to the globe' }).click();
	await expect(toast).toBeVisible();
	await Promise.all([page.waitForEvent('load'), toast.getByRole('button', { name: 'Refresh' }).click()]);
	await expect(page.getByTestId('globe').locator('canvas')).toBeVisible();
	await expect(toast).toBeHidden();
});
