// Draws the cartoon globe texture as an equirectangular SVG: longitude maps
// straight to x and latitude to y, which is the layout three.js expects for
// a sphere's texture. Pure, so it can be tested without rendering.

export type Ring = [number, number][];
export interface LandCollection {
	features: { geometry: { type: 'Polygon'; coordinates: Ring[] } }[];
}

export const PALETTE = {
	ocean: '#4fb6ec',
	shallows: '#8ed8f8',
	land: '#8cc152',
	outline: '#5e9a35',
	snow: '#f4faff',
	seaIce: '#e3f3fb'
} as const;

/** Latitudes past which land is drawn as snow (the northern line is wavy). */
export const SNOW_NORTH = 71;
export const SNOW_SOUTH = -60;

// The viewBox is in degrees: x = longitude, y = -latitude (north is up).
const point = ([lng, lat]: [number, number]) => `${+lng.toFixed(2)},${+(-lat).toFixed(2)}`;

export const ringPath = (ring: Ring) => `M${ring.map(point).join('L')}Z`;

export function landPath(land: LandCollection): string {
	return land.features.flatMap((f) => f.geometry.coordinates.map(ringPath)).join('');
}

/**
 * A closed band from the pole to a soft wavy edge at `lat`, spanning
 * `[from, to]` in longitude. y is -latitude, as everywhere in this SVG.
 */
export function wavyBand(lat: number, amplitude: number, from = -180, to = 180): string {
	const pole = lat > 0 ? -90 : 90;
	const y = -lat;
	const step = 8;
	let d = `M${from},${pole}L${from},${y}`;
	for (let x = from; x < to; x += step) {
		const dip = (x - from) / step % 2 ? amplitude : -amplitude;
		d += `Q${x + step / 2},${y + dip} ${x + step},${y}`;
	}
	return `${d}L${to},${pole}Z`;
}

export function globeSvg(land: LandCollection, width: number, height: number): string {
	const p = PALETTE;
	return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="-180 -90 360 180" preserveAspectRatio="none">
<defs>
<path id="land" fill-rule="evenodd" d="${landPath(land)}"/>
<clipPath id="snow"><path d="${wavyBand(SNOW_NORTH, 1.5, -540, 540)}"/><rect x="-540" y="${-SNOW_SOUTH}" width="1080" height="${90 + SNOW_SOUTH}"/></clipPath>
<g id="world">
<use xlink:href="#land" fill="${p.shallows}" stroke="${p.shallows}" stroke-width="2.2" stroke-linejoin="round"/>
<use xlink:href="#land" fill="${p.land}" stroke="${p.outline}" stroke-width="0.35" stroke-linejoin="round"/>
<use xlink:href="#land" fill="${p.snow}" stroke="${p.snow}" stroke-width="0.35" clip-path="url(#snow)"/>
</g>
</defs>
<rect x="-180" y="-90" width="360" height="180" fill="${p.ocean}"/>
<use xlink:href="#world" x="-360"/><use xlink:href="#world"/><use xlink:href="#world" x="360"/>
<path fill="${p.seaIce}" d="${wavyBand(84, 1, -180, 180)}"/>
<path fill="${p.snow}" d="${wavyBand(-85, 0.8, -180, 180)}"/>
</svg>`;
}
