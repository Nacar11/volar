// Bakes the globe textures from Natural Earth: npm run bake:globe
import { mkdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { globeSvg, type LandCollection } from './globe-svg.ts';

const root = join(import.meta.dirname, '..');
const land: LandCollection = JSON.parse(
	readFileSync(join(root, 'art-source/natural-earth/ne_110m_land.geojson'), 'utf8')
);
const outDir = join(root, 'static/globe');
mkdirSync(outDir, { recursive: true });

for (const width of [2048, 1024]) {
	const file = join(outDir, `earth-${width}.png`);
	await sharp(Buffer.from(globeSvg(land, width, width / 2)))
		.png({ palette: true, colours: 64, compressionLevel: 9 })
		.toFile(file);
	console.log(`${file.slice(root.length + 1)}  ${(statSync(file).size / 1024).toFixed(1)} KB`);
}
