// Familiar things a kid knows the size of, for the "Size compare" toy.
// `meters` is height; `length` (for things that can line up end to end) is
// front to back. Each is drawn as a flat silhouette in a 100-unit-tall box
// that is `aspect` times as wide as it is tall.

export const THINGS = {
	cat: { label: 'House cat', icon: '🐈', meters: 0.25, aspect: 1.5 },
	kid: { label: 'You', icon: '🧒', meters: 1.2, aspect: 0.42 },
	grownup: { label: 'A grown-up', icon: '🧑', meters: 1.7, aspect: 0.36 },
	car: { label: 'Cars', icon: '🚗', meters: 1.5, aspect: 3, length: 4.5 },
	bus: { label: 'School buses', icon: '🚌', meters: 3.2, aspect: 3.75, length: 12 }
} as const;

export type Thing = keyof typeof THINGS;

interface Measured {
	measure: 'height' | 'length';
	meters: number;
	from: number;
	to: number;
	ground?: number;
}

export interface Box {
	x: number;
	y: number;
	width: number;
	height: number;
}

/** Puppet viewBox units per real meter, from the animal's own measurement. */
export const unitsPerMeter = (toy: Measured) => Math.abs(toy.from - toy.to) / toy.meters;

/** Where the things stand on the ground (their bottom edge), in the puppet's viewBox. */
export const groundOf = (toy: Measured) => toy.ground ?? (toy.measure === 'height' ? toy.from : 0);

/**
 * Where to draw the thing(s) beside the animal, at true scale. Measuring
 * height, one thing stands just behind the animal (its right edge at `behind`).
 * Measuring length, things that have a length line up end to end from the
 * animal's tail, as many as it takes to match it (two buses for a 22 m whale);
 * anything else stands alone at the tail.
 */
export function placeThings(toy: Measured, thing: Thing, behind = 108): Box[] {
	const u = unitsPerMeter(toy);
	const spec = THINGS[thing];
	const height = spec.meters * u;
	const width = height * spec.aspect;
	const ground = groundOf(toy);
	if (toy.measure === 'height') return [{ x: behind - width, y: ground - height, width, height }];
	const start = Math.min(toy.from, toy.to);
	const count = 'length' in spec ? Math.max(1, Math.round(toy.meters / spec.length)) : 1;
	return Array.from({ length: count }, (_, i) => ({ x: start + i * width, y: ground - height, width, height }));
}
