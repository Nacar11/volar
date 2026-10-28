import { describe, expect, it } from 'vitest';
import { facing, latLngToVector, markerOpacity, seeded } from './geo';

const close = (actual: number[], expected: number[]) =>
	actual.forEach((v, i) => expect(v).toBeCloseTo(expected[i], 6));

describe('latLngToVector', () => {
	it('puts the north pole on +y', () => {
		close(latLngToVector(90, 0), [0, 1, 0]);
	});

	it('puts 0°, 0° (Gulf of Guinea) on +x', () => {
		close(latLngToVector(0, 0), [1, 0, 0]);
	});

	it('puts longitude -90 (the Americas) facing +z', () => {
		close(latLngToVector(0, -90), [0, 0, 1]);
	});

	it('scales by the radius', () => {
		close(latLngToVector(0, 0, 3), [3, 0, 0]);
	});
});

describe('seeded', () => {
	it('repeats for the same seed and stays in [0, 1)', () => {
		const a = seeded(7);
		const b = seeded(7);
		for (let i = 0; i < 100; i++) {
			const x = a();
			expect(x).toBe(b());
			expect(x).toBeGreaterThanOrEqual(0);
			expect(x).toBeLessThan(1);
		}
	});
});

describe('markers', () => {
	const camera: [number, number, number] = [0, 0, 4];

	it('a point dead centre faces the camera fully', () => {
		expect(facing([0, 0, 1], camera)).toBeCloseTo(1);
		expect(markerOpacity(1, 4)).toBe(1);
	});

	it('a point on the far side is hidden', () => {
		expect(facing([0, 0, -1], camera)).toBeCloseTo(-1);
		expect(markerOpacity(-1, 4)).toBe(0);
	});

	it('a point just past the horizon is hidden, even though it faces a little forward', () => {
		// From 4 units away the edge of the globe is at facing = 0.25.
		expect(markerOpacity(0.2, 4)).toBe(0);
		expect(markerOpacity(0.3, 4)).toBeGreaterThan(0);
		expect(markerOpacity(0.3, 4)).toBeLessThan(1);
	});
});
