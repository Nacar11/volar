// Publishes each animal pack at a fixed URL, /packs/<id>/<file>, so the
// service worker can cache one animal at a time and "Download all" can fetch
// them by name. Serves straight from content/animals in dev; copies into the
// build for production. Each pack gets a manifest.json (files and bytes), and
// /packs/index.json lists every pack.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import type { Plugin } from 'vite';

/** Files that ship with the app itself (the globe needs them at once), not in the pack. */
const IN_APP = new Set(['animal.json', 'credits.json', 'icon.svg', 'regions.geojson']);

const TYPES: Record<string, string> = {
	'.svg': 'image/svg+xml',
	'.webm': 'audio/webm',
	'.m4a': 'audio/mp4',
	'.json': 'application/json'
};

export interface PackManifest {
	id: string;
	/** Changes whenever any file in the pack does: the service worker keys its cache on it. */
	hash: string;
	files: { name: string; bytes: number }[];
	bytes: number;
}

function readPacks(dir: string): PackManifest[] {
	return readdirSync(dir)
		.filter((id) => statSync(join(dir, id)).isDirectory())
		.map((id) => {
			const files = readdirSync(join(dir, id))
				.filter((name) => !IN_APP.has(name))
				.sort()
				.map((name) => ({ name, bytes: statSync(join(dir, id, name)).size }));
			const hash = createHash('sha256');
			for (const { name } of files) hash.update(name).update(readFileSync(join(dir, id, name)));
			return {
				id,
				hash: hash.digest('hex').slice(0, 12),
				files,
				bytes: files.reduce((sum, f) => sum + f.bytes, 0)
			};
		});
}

export function packs(contentDir: string): Plugin {
	return {
		name: 'volar-packs',
		configureServer(server) {
			server.middlewares.use('/packs', (req, res, next) => {
				const all = readPacks(contentDir);
				const [, id, name] = (req.url ?? '').split('?')[0].split('/');
				const send = (type: string, body: string | Buffer) => {
					res.setHeader('Content-Type', type);
					res.end(body);
				};
				if (id === 'index.json') return send(TYPES['.json'], JSON.stringify(all));
				const pack = all.find((p) => p.id === id);
				if (!pack) return next();
				if (name === 'manifest.json') return send(TYPES['.json'], JSON.stringify(pack));
				if (!pack.files.some((f) => f.name === name)) return next();
				send(TYPES[extname(name)] ?? 'application/octet-stream', readFileSync(join(contentDir, id, name)));
			});
		},
		generateBundle() {
			// Only the browser build ships packs.
			if (this.environment.name !== 'client') return;
			const all = readPacks(contentDir);
			for (const pack of all) {
				for (const { name } of pack.files) {
					this.emitFile({
						type: 'asset',
						fileName: `packs/${pack.id}/${name}`,
						source: readFileSync(join(contentDir, pack.id, name))
					});
				}
				this.emitFile({
					type: 'asset',
					fileName: `packs/${pack.id}/manifest.json`,
					source: JSON.stringify(pack)
				});
			}
			this.emitFile({ type: 'asset', fileName: 'packs/index.json', source: JSON.stringify(all) });
		}
	};
}
