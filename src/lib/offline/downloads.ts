// "Download all" in the grown-ups corner: fetch every animal pack so the whole
// app works offline (say, before a school day with no Wi-Fi). The service
// worker caches each file as it passes through.

export interface PackInfo {
	id: string;
	hash: string;
	files: { name: string; bytes: number }[];
	bytes: number;
}

export async function packIndex(get: typeof fetch = fetch): Promise<PackInfo[]> {
	const response = await get('/packs/index.json');
	if (!response.ok) throw new Error(`pack index failed to load (${response.status})`);
	return response.json();
}

export const totalBytes = (packs: PackInfo[]) => packs.reduce((sum, p) => sum + p.bytes, 0);

/** "1.2 MB", "340 KB": for grown-ups deciding whether to download now. */
export function formatBytes(bytes: number): string {
	if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
	return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Fetches every file of every pack, reporting bytes done after each file. */
export async function downloadAll(
	packs: PackInfo[],
	onProgress: (done: number, total: number) => void,
	get: typeof fetch = fetch
): Promise<void> {
	const total = totalBytes(packs);
	let done = 0;
	onProgress(done, total);
	for (const pack of packs) {
		for (const file of pack.files) {
			const response = await get(`/packs/${pack.id}/${file.name}`);
			if (!response.ok) throw new Error(`${pack.id}/${file.name} failed to download (${response.status})`);
			await response.arrayBuffer();
			done += file.bytes;
			onProgress(done, total);
		}
	}
}

/** The packs whose cache (named by the service worker, see src/service-worker) holds every file. */
export async function readyOffline(packs: PackInfo[]): Promise<Set<string>> {
	const ready = new Set<string>();
	if (typeof caches === 'undefined') return ready;
	for (const pack of packs) {
		const name = `pack-${pack.id}-${pack.hash}`;
		if (!(await caches.has(name))) continue;
		const cached = (await (await caches.open(name)).keys()).map((r) => new URL(r.url).pathname);
		if (pack.files.every((f) => cached.includes(`/packs/${pack.id}/${f.name}`))) ready.add(pack.id);
	}
	return ready;
}
