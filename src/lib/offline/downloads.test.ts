import { describe, expect, it } from 'vitest';
import { downloadAll, formatBytes, packIndex, totalBytes, type PackInfo } from './downloads';

const packs: PackInfo[] = [
	{ id: 'a', hash: 'x', bytes: 300, files: [{ name: 'puppet.svg', bytes: 100 }, { name: 'bg.svg', bytes: 200 }] },
	{ id: 'b', hash: 'y', bytes: 50, files: [{ name: 'puppet.svg', bytes: 50 }] }
];

const fakeFetch = (fail?: string) =>
	(async (url: string) => {
		if (url === fail) return new Response('', { status: 404 });
		if (url === '/packs/index.json') return Response.json(packs);
		return new Response('data');
	}) as typeof fetch;

describe('downloadAll', () => {
	it('fetches every file and reports progress up to the total', async () => {
		const progress: [number, number][] = [];
		await downloadAll(packs, (done, total) => progress.push([done, total]), fakeFetch());
		expect(progress).toEqual([
			[0, 350],
			[100, 350],
			[300, 350],
			[350, 350]
		]);
	});

	it('stops with a clear error when a file is missing', async () => {
		await expect(downloadAll(packs, () => {}, fakeFetch('/packs/b/puppet.svg'))).rejects.toThrow(
			'b/puppet.svg failed to download (404)'
		);
	});

	it('reads the pack index and totals its size', async () => {
		const index = await packIndex(fakeFetch());
		expect(totalBytes(index)).toBe(350);
	});
});

describe('formatBytes', () => {
	it('shows KB under a megabyte and MB above', () => {
		expect(formatBytes(33 * 1024)).toBe('33 KB');
		expect(formatBytes(12)).toBe('1 KB');
		expect(formatBytes(3.5 * 1024 * 1024)).toBe('3.5 MB');
	});
});
