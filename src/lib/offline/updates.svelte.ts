// Updates arrive quietly: a new service worker installs in the background
// and waits. The toast offers to switch over, but never in the middle of a scene.

class Updates {
	/** A new version has installed and is waiting to take over. */
	waiting = $state.raw<ServiceWorker | null>(null);

	watch(registration: ServiceWorkerRegistration) {
		const check = () => {
			// Only an update counts: on the very first install nothing was running before.
			if (registration.waiting && navigator.serviceWorker.controller) this.waiting = registration.waiting;
		};
		check();
		registration.addEventListener('updatefound', () => {
			registration.installing?.addEventListener('statechange', check);
		});
	}

	/** Lets the new version take over, then reloads into it. */
	apply() {
		if (!this.waiting) return;
		navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
		this.waiting.postMessage({ type: 'SKIP_WAITING' });
	}
}

export const updates = new Updates();

/** Never interrupt a scene: the toast shows on the globe, the book and the grown-ups corner. */
export const toastAllowed = (routeId: string | null) => routeId !== '/animal/[id]';
