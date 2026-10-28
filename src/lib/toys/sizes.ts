// Familiar things a kid knows the size of, for the "Size compare" toy. Heights
// in meters; each is drawn as a flat silhouette in a 100-unit-tall box that
// is `aspect` times as wide as it is tall.

export const THINGS = {
	cat: { label: 'House cat', icon: '🐈', meters: 0.25, aspect: 1.5 },
	kid: { label: 'You', icon: '🧒', meters: 1.2, aspect: 0.42 },
	grownup: { label: 'A grown-up', icon: '🧑', meters: 1.7, aspect: 0.36 },
	car: { label: 'A car', icon: '🚗', meters: 1.5, aspect: 2.8 },
	bus: { label: 'A school bus', icon: '🚌', meters: 3.2, aspect: 3.6 }
} as const;

export type Thing = keyof typeof THINGS;

/** Puppet viewBox units per real meter, from the animal's own measurement. */
export const unitsPerMeter = (toy: { meters: number; from: number; to: number }) =>
	Math.abs(toy.from - toy.to) / toy.meters;

/** Where to draw a thing beside the animal: standing on the ground, its right edge at `right`. */
export function placeThing(
	toy: { meters: number; from: number; to: number },
	thing: Thing,
	right: number
): { x: number; y: number; width: number; height: number } {
	const height = THINGS[thing].meters * unitsPerMeter(toy);
	const width = height * THINGS[thing].aspect;
	return { x: right - width, y: toy.from - height, width, height };
}
