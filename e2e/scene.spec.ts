import { expect, test, type Page } from '@playwright/test';

const bubble = (page: Page) => page.locator('.bubble p');

// Scene tests open the scene directly; e2e/globe.spec.ts covers getting there from the globe.
async function openTarsier(page: Page) {
	await page.goto('/animal/philippine-tarsier');
	await expect(bubble(page)).toHaveText("Hi! I'm a tarsier!");
}

test('walks every fact, then offers them again', async ({ page }) => {
	await openTarsier(page);
	for (let i = 0; i < 8; i++) await page.getByRole('button', { name: 'Next' }).click();
	await expect(bubble(page)).toHaveText('People in Bohol keep a safe forest home for me.');
	await page.getByRole('button', { name: 'Hear my facts again' }).click();
	await expect(bubble(page)).toHaveText('I live in forests in the Philippines, like on Bohol!');
});

test('sleeps by day and wakes at night', async ({ page }) => {
	await openTarsier(page);
	await page.getByRole('button', { name: /Day or night/ }).click();
	await page.getByRole('button', { name: /^.*Day$/ }).click();
	await expect(bubble(page)).toHaveText("Shh... I'm sleeping.");
	await expect(page.getByText('z z z')).toBeVisible();
	await page.getByRole('button', { name: /^.*Night$/ }).click();
	await expect(bubble(page)).toHaveText("I'm awake! Time to catch bugs.");
	await expect(page.getByText('z z z')).toBeHidden();
});

test('the x-ray lens finds the eyes', async ({ page }) => {
	await openTarsier(page);
	await page.getByRole('button', { name: /Body x-ray/ }).click();
	const lens = page.getByRole('button', { name: 'Drag the magnifier over me!' });
	const from = (await lens.boundingBox())!;
	const eye = (await page.locator('#eye-l').boundingBox())!;
	await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
	await page.mouse.down();
	await page.mouse.move(eye.x + eye.width / 2, eye.y + eye.height / 2, { steps: 8 });
	await page.mouse.up();
	await expect(bubble(page)).toHaveText("My eyes can't move, so I turn my head instead.");
});

test('action buttons wait for the action to finish', async ({ page }) => {
	await openTarsier(page);
	await page.getByRole('button', { name: /Make it do it/ }).click();
	const leap = page.getByRole('button', { name: 'Leap!' });
	await leap.click();
	await expect(leap).toBeDisabled();
	await expect(leap).toBeEnabled();
});

test('the globe button goes back home', async ({ page }) => {
	await openTarsier(page);
	await page.getByRole('button', { name: 'Back to the globe' }).click();
	await expect(page).toHaveURL('/');
});

test('reduced motion still shows the animal', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await openTarsier(page);
	await expect(page.locator('#animal')).toHaveCSS('opacity', '1');
});

test('holds 30 fps on a throttled CPU', async ({ page, browserName }, info) => {
	test.skip(browserName !== 'chromium' || info.project.name !== 'tablet', 'CDP throttling is Chromium-only');
	const cdp = await page.context().newCDPSession(page);
	await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
	await openTarsier(page);
	await page.getByRole('button', { name: /Make it do it/ }).click();
	await page.getByRole('button', { name: 'Leap!' }).click();
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
	console.log(`fps at 4x CPU throttle: ${fps.toFixed(1)}`);
	expect(fps).toBeGreaterThanOrEqual(30);
});
