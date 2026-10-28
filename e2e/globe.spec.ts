import { expect, test } from '@playwright/test';

test('the globe renders and spins on its own', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', (e) => errors.push(String(e)));
	await page.goto('/');
	const globe = page.getByTestId('globe');
	await expect(globe.locator('canvas')).toBeVisible();
	await expect(globe).toHaveAttribute('data-spinning', 'true');
	expect(errors).toEqual([]);
});

test('dragging stops the spin, which comes back after 6 s idle', async ({ page }) => {
	test.setTimeout(20_000);
	await page.goto('/');
	const globe = page.getByTestId('globe');
	await expect(globe).toHaveAttribute('data-spinning', 'true');
	const box = (await globe.boundingBox())!;
	// Start off-centre: the middle of the screen is the tarsier's icon, not the globe.
	await page.mouse.move(box.width * 0.75, box.height * 0.6);
	await page.mouse.down();
	await page.mouse.move(box.width * 0.75 - 120, box.height * 0.6, { steps: 8 });
	await expect(globe).toHaveAttribute('data-spinning', 'false');
	await page.mouse.up();
	await page.waitForTimeout(3000);
	await expect(globe).toHaveAttribute('data-spinning', 'false');
	await expect(globe).toHaveAttribute('data-spinning', 'true', { timeout: 5000 });
});

test('reduced motion turns off the auto-spin', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/');
	await expect(page.getByTestId('globe').locator('canvas')).toBeVisible();
	await expect(page.getByTestId('globe')).toHaveAttribute('data-spinning', 'false');
});

test('the home button is there for kids who get lost', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'Spin back home' }).click();
	await expect(page.getByTestId('globe').locator('canvas')).toBeVisible();
});

test('the globe holds 30 fps on a throttled CPU', async ({ page }, info) => {
	test.skip(info.project.name !== 'tablet', 'CDP throttling: one project is enough');
	const cdp = await page.context().newCDPSession(page);
	await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
	await page.goto('/');
	await expect(page.getByTestId('globe').locator('canvas')).toBeVisible();
	await page.waitForTimeout(1000);
	const fps = await page.evaluate(
		() =>
			new Promise<number>((resolve) => {
				let frames = 0;
				const start = performance.now();
				requestAnimationFrame(function tick(now) {
					frames++;
					if (now - start < 3000) requestAnimationFrame(tick);
					else resolve((frames * 1000) / (now - start));
				});
			})
	);
	console.log(`globe fps at 4x CPU throttle: ${fps.toFixed(1)}`);
	expect(fps).toBeGreaterThanOrEqual(30);
});

test('tapping the tarsier on the globe opens its scene, and the globe button comes back', async ({
	page
}) => {
	await page.goto('/');
	// The link is a 0×0 anchor on the globe; the icon is drawn above it.
	const icon = page.getByRole('link', { name: 'Philippine Tarsier' }).locator('img');
	await expect(icon).toBeVisible();
	// The globe keeps spinning slowly, so the icon never holds still for Playwright.
	await icon.click({ force: true });
	await expect(page).toHaveURL('/animal/philippine-tarsier');
	await expect(page.locator('.bubble p')).toHaveText("Hi! I'm a tarsier!");
	await page.getByRole('button', { name: 'Back to the globe' }).click();
	await expect(page).toHaveURL('/');
	await expect(icon).toBeVisible();
});

test('an animal on the far side of the globe is hidden and cannot be tapped', async ({ page }) => {
	await page.goto('/');
	const icon = page.getByRole('link', { name: 'Philippine Tarsier' }).locator('img');
	await expect(icon).toBeVisible();
	const box = (await page.getByTestId('globe').boundingBox())!;
	// Drag sideways until the Philippines turn away (about half a turn).
	for (let i = 0; i < 6 && (await icon.isVisible()); i++) {
		await page.mouse.move(box.width * 0.9, box.height / 2);
		await page.mouse.down();
		await page.mouse.move(box.width * 0.1, box.height / 2, { steps: 10 });
		await page.mouse.up();
		await page.waitForTimeout(400);
	}
	await expect(icon).toBeHidden();
	// Hidden links drop out of the accessibility tree too, so find it by href.
	const link = page.locator('a[href="/animal/philippine-tarsier"]');
	await expect(link).toHaveCSS('visibility', 'hidden');
	await expect(page.getByRole('link', { name: 'Philippine Tarsier' })).toHaveCount(0);
});
