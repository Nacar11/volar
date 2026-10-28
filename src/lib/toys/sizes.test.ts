import { describe, expect, it } from 'vitest';
import { placeThing, unitsPerMeter } from './sizes';

// The lion: 1.2 m at the shoulder, from the ground (y 328) to the shoulder (y 190).
const lion = { meters: 1.2, from: 328, to: 190 };

describe('size compare', () => {
	it('scales from the animal’s own measurement', () => {
		expect(unitsPerMeter(lion)).toBeCloseTo(115);
	});

	it('draws a 1.2 m kid exactly as tall as a lion’s shoulder, standing on the same ground', () => {
		const kid = placeThing(lion, 'kid', 100);
		expect(kid.height).toBeCloseTo(138);
		expect(kid.y).toBeCloseTo(190);
		expect(kid.y + kid.height).toBeCloseTo(328);
		expect(kid.x + kid.width).toBeCloseTo(100);
	});

	it('draws a house cat much smaller and a grown-up taller', () => {
		expect(placeThing(lion, 'cat', 100).height).toBeCloseTo(0.25 * 115);
		expect(placeThing(lion, 'grownup', 100).height).toBeGreaterThan(138);
	});
});
