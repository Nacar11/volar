import { describe, expect, it } from 'vitest';
import { toastAllowed } from './updates.svelte';

describe('the update toast', () => {
	it('never shows in the middle of a scene', () => {
		expect(toastAllowed('/animal/[id]')).toBe(false);
	});

	it('shows on the globe, the book and the grown-ups corner', () => {
		for (const route of ['/', '/book', '/grown-ups']) expect(toastAllowed(route)).toBe(true);
	});
});

describe('updates.watch', () => {
	const fakeWorker = () => ({ postMessage: () => {} }) as unknown as ServiceWorker;

	function setup(controller: object | null) {
		Object.defineProperty(globalThis, 'navigator', {
			value: { serviceWorker: { controller, addEventListener: () => {} } },
			configurable: true
		});
		const registration = Object.assign(new EventTarget(), { waiting: null, installing: null }) as unknown as {
			waiting: ServiceWorker | null;
			installing: (EventTarget & ServiceWorker) | null;
		} & ServiceWorkerRegistration;
		return registration;
	}

	it('notices a worker already waiting when the app opens', async () => {
		const { updates } = await import('./updates.svelte');
		const registration = setup({});
		registration.waiting = fakeWorker();
		updates.watch(registration);
		expect(updates.waiting).toBe(registration.waiting);
	});

	it('ignores the very first install, when nothing was running before', async () => {
		const { updates } = await import('./updates.svelte');
		updates.waiting = null;
		const registration = setup(null);
		registration.waiting = fakeWorker();
		updates.watch(registration);
		expect(updates.waiting).toBeNull();
	});

	it('notices an update that finishes installing later', async () => {
		const { updates } = await import('./updates.svelte');
		updates.waiting = null;
		const registration = setup({});
		updates.watch(registration);
		const installing = Object.assign(new EventTarget(), fakeWorker());
		registration.installing = installing as EventTarget & ServiceWorker;
		registration.dispatchEvent(new Event('updatefound'));
		registration.waiting = installing as unknown as ServiceWorker;
		installing.dispatchEvent(new Event('statechange'));
		expect(updates.waiting).toBe(installing);
	});
});
