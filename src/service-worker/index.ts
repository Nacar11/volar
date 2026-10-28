// Volar's service worker: the app shell is cached on install, each animal
// pack is cached the first time it's opened (or by "Download all"), and the
// app keeps working with no network at all.
import { version } from '$app/env';
import { assets, immutable } from '$app/manifest';
import { self } from '$app/service-worker';

/** The page, its code, the globe textures and fonts, for this version of the app. */
const SHELL = `shell-${version}`;
const SHELL_FILES = ['/', '/packs/index.json', ...immutable.map((f) => f.path), ...assets.map((f) => f.path)];

interface PackManifest {
	id: string;
	hash: string;
}

// Servers may send "Vary: Origin". Scripts, styles and textures are requested
// with an Origin header that the install-time requests didn't have, so a strict
// match would miss everything. These are all our own same-origin files.
const MATCH = { ignoreVary: true };

/** Each pack has its own cache, named by its content hash, so it updates on its own. */
const packCache = (pack: PackManifest) => `pack-${pack.id}-${pack.hash}`;

async function packIndex(): Promise<PackManifest[]> {
	const response = await caches.match('/packs/index.json', { ...MATCH, cacheName: SHELL });
	return response ? response.json() : [];
}

self.addEventListener('install', (event) => {
	event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(SHELL_FILES)));
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			// Drop old shells, and any pack whose files have changed since it was cached.
			const keep = new Set([SHELL, ...(await packIndex()).map(packCache)]);
			for (const name of await caches.keys()) if (!keep.has(name)) await caches.delete(name);
			await self.clients.claim();
		})()
	);
});

// The update toast asks a waiting worker to take over.
self.addEventListener('message', (event) => {
	if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

async function fromPack(request: Request, id: string): Promise<Response> {
	const pack = (await packIndex()).find((p) => p.id === id);
	if (!pack) return fetch(request);
	const cache = await caches.open(packCache(pack));
	const cached = await cache.match(request, MATCH);
	if (cached) return cached;
	const response = await fetch(request);
	if (response.ok) await cache.put(request, response.clone());
	return response;
}

async function fromShell(request: Request): Promise<Response> {
	const cached = await caches.match(request, { ...MATCH, cacheName: SHELL });
	return cached ?? fetch(request);
}

// Pages: the network first, so a fresh deploy shows up; offline, the cached shell.
async function page(request: Request): Promise<Response> {
	try {
		return await fetch(request);
	} catch {
		return (await caches.match('/', { ...MATCH, cacheName: SHELL })) ?? Response.error();
	}
}

self.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);
	if (request.method !== 'GET' || url.origin !== self.location.origin) return;

	const pack = url.pathname.match(/^\/packs\/([^/]+)\/[^/]+$/);
	if (pack && pack[1] !== 'index.json') event.respondWith(fromPack(request, pack[1]));
	else if (request.mode === 'navigate') event.respondWith(page(request));
	else event.respondWith(fromShell(request));
});
