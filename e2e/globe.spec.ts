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
	await page.mouse.move(box.width / 2, box.height / 2);
	await page.mouse.down();
	await page.mouse.move(box.width / 2 - 120, box.height / 2, { steps: 8 });
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
