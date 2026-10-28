import { describe, expect, it } from 'vitest';
import { latLngToVector, seeded } from './geo';

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
