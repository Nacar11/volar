// Renders the installable app's icons from the tarsier: npm run make:icons
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const root = join(import.meta.dirname, '..');
const tarsier = readFileSync(join(root, 'content/animals/philippine-tarsier/icon.svg'), 'utf8')
	.replace(/<svg[^>]*>/, '')
	.replace('</svg>', '');

// The tarsier on the night-sky blue of the globe screen. `inset` leaves the
// margin a maskable icon needs, since launchers crop it to many shapes.
const icon = (size: number, inset: number) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128">
<rect width="128" height="128" fill="#1b2a5e"/>
<g transform="translate(${inset} ${inset}) scale(${(128 - inset * 2) / 128})">${tarsier}</g>
</svg>`;

for (const [file, size, inset] of [
	['icon-192.png', 192, 10],
	['icon-512.png', 512, 10],
	['maskable-512.png', 512, 24],
	['apple-touch-icon.png', 180, 12]
] as const) {
	await sharp(Buffer.from(icon(size, inset))).png().toFile(join(root, 'static/icons', file));
	console.log(`static/icons/${file}`);
}
