import { describe, expect, it } from 'vitest';
import { placeThings, unitsPerMeter } from './sizes';

// The lion: 1.2 m at the shoulder, from the ground (y 328) to the shoulder (y 190).
const lion = { measure: 'height' as const, meters: 1.2, from: 328, to: 190 };
// The blue whale: 22 m from tail (x 8) to nose (x 384), things on the ground at y 345.
const whale = { measure: 'length' as const, meters: 22, from: 8, to: 384, ground: 345 };

describe('size compare by height', () => {
	it('scales from the animal’s own measurement', () => {
		expect(unitsPerMeter(lion)).toBeCloseTo(115);
	});

	it('draws a 1.2 m kid exactly as tall as a lion’s shoulder, standing on the same ground', () => {
		const [kid] = placeThings(lion, 'kid', 100);
		expect(kid.height).toBeCloseTo(138);
		expect(kid.y).toBeCloseTo(190);
		expect(kid.y + kid.height).toBeCloseTo(328);
		expect(kid.x + kid.width).toBeCloseTo(100);
	});

	it('draws a house cat much smaller and a grown-up taller', () => {
		expect(placeThings(lion, 'cat')[0].height).toBeCloseTo(0.25 * 115);
		expect(placeThings(lion, 'grownup')[0].height).toBeGreaterThan(138);
	});
});

describe('size compare by length', () => {
	it('lines up two 12 m buses against a 22 m whale, end to end from its tail', () => {
		const buses = placeThings(whale, 'bus');
		expect(buses).toHaveLength(2);
		const u = unitsPerMeter(whale);
		expect(buses[0].width).toBeCloseTo(12 * u);
		expect(buses[0].x).toBeCloseTo(8);
		expect(buses[1].x).toBeCloseTo(8 + 12 * u);
		// Two buses (24 m) run a little past the whale (22 m): "almost as long as two buses".
		expect(buses[1].x + buses[1].width).toBeGreaterThan(384);
		for (const bus of buses) expect(bus.y + bus.height).toBeCloseTo(345);
	});

	it('lines up five cars, and stands a kid alone at the tail', () => {
		expect(placeThings(whale, 'car')).toHaveLength(5);
		const kids = placeThings(whale, 'kid');
		expect(kids).toHaveLength(1);
		expect(kids[0].height).toBeCloseTo(1.2 * unitsPerMeter(whale));
	});
});
