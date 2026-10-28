import { describe, expect, it } from 'vitest';
import { densify, pointAlong } from './migration';

describe('migration routes', () => {
	const route = densify([
		[0, 0],
		[10, 0],
		[10, 10]
	]);

	it('cuts the route into short steps', () => {
		expect(route.points.length).toBe(41);
		expect(route.length).toBeCloseTo(20);
	});

	it('finds the start, the middle and the end', () => {
		expect(pointAlong(route, 0)).toEqual([0, 0]);
		const [lng, lat] = pointAlong(route, 0.5);
		expect(lng).toBeCloseTo(10);
		expect(lat).toBeCloseTo(0);
		const end = pointAlong(route, 1);
		expect(end[0]).toBeCloseTo(10);
		expect(end[1]).toBeCloseTo(10);
	});

	it('keeps going a quarter of the way along the second leg', () => {
		const [lng, lat] = pointAlong(route, 0.625);
		expect(lng).toBeCloseTo(10);
		expect(lat).toBeCloseTo(2.5);
	});
});
