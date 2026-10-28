import { describe, expect, it } from 'vitest';
import { habitatOutline, habitatTriangles, type Polygon } from './habitat';

const square = (lng: number, lat: number, size: number): Polygon => [
	[
		[lng, lat],
		[lng + size, lat],
		[lng + size, lat + size],
		[lng, lat + size],
		[lng, lat]
	]
];

describe('habitatTriangles', () => {
	it('puts every vertex on the globe, just above the surface', () => {
		const positions = habitatTriangles([square(120, 5, 1)], 1.004);
		expect(positions.length % 9).toBe(0);
		for (let i = 0; i < positions.length; i += 3) {
			expect(Math.hypot(positions[i], positions[i + 1], positions[i + 2])).toBeCloseTo(1.004, 6);
		}
	});

	it('cuts big regions finer so they follow the curve', () => {
		const small = habitatTriangles([square(0, 0, 1)]).length / 9;
		const big = habitatTriangles([square(0, 0, 20)]).length / 9;
		expect(small).toBe(2);
		expect(big).toBeGreaterThan(100);
	});

	it('leaves holes empty', () => {
		const [outline] = square(0, 0, 10);
		const hole = [...square(3, 3, 4)[0]].reverse() as Polygon[number];
		const withHole = habitatTriangles([[outline, hole]], 1, 100).length / 9;
		const solid = habitatTriangles([[outline]], 1, 100).length / 9;
		expect(withHole).toBeGreaterThan(solid);
	});
});

describe('habitatOutline', () => {
	it('draws a strip along every edge of every ring, on the globe', () => {
		const positions = habitatOutline([square(120, 5, 1)], 0.3, 1.005, 10);
		// 4 edges, one 2-triangle quad each.
		expect(positions.length / 9).toBe(8);
		for (let i = 0; i < positions.length; i += 3) {
			expect(Math.hypot(positions[i], positions[i + 1], positions[i + 2])).toBeCloseTo(1.005, 6);
		}
	});

	it('splits long edges so the stroke follows the curve', () => {
		expect(habitatOutline([square(0, 0, 10)], 0.3, 1, 1).length / 9).toBe(4 * 10 * 2);
	});
});
