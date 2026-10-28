import { describe, expect, it } from 'vitest';
import { spreadApart } from './spread';

const gapBetween = (a: { x: number; y: number }, b: { x: number; y: number }) =>
	Math.hypot(a.x - b.x, a.y - b.y);

describe('spreadApart', () => {
	it('leaves pins that do not overlap where they are', () => {
		const discs = [
			{ x: 0, y: 0, r: 30 },
			{ x: 200, y: 0, r: 30 }
		];
		expect(spreadApart(discs)).toEqual([
			{ x: 0, y: 0 },
			{ x: 200, y: 0 }
		]);
	});

	it('pushes two overlapping pins apart until they clear, half each', () => {
		const [a, b] = spreadApart([
			{ x: 100, y: 100, r: 30 },
			{ x: 120, y: 100, r: 30 }
		]);
		expect(gapBetween(a, b)).toBeGreaterThanOrEqual(66 - 0.01);
		// Both move: the midpoint stays put.
		expect((a.x + b.x) / 2).toBeCloseTo(110);
		expect(a.y).toBeCloseTo(100);
	});

	it('separates pins that sit exactly on top of each other', () => {
		const [a, b] = spreadApart([
			{ x: 50, y: 50, r: 20 },
			{ x: 50, y: 50, r: 20 }
		]);
		expect(b.x).toBeGreaterThan(a.x);
		expect(gapBetween(a, b)).toBeGreaterThanOrEqual(46 - 0.01);
	});

	it('mostly untangles a cluster of four', () => {
		const out = spreadApart(
			[
				{ x: 0, y: 0, r: 26 },
				{ x: 10, y: 5, r: 26 },
				{ x: 5, y: 12, r: 26 },
				{ x: 14, y: 14, r: 26 }
			],
			6,
			8
		);
		for (let i = 0; i < out.length; i++) {
			for (let j = i + 1; j < out.length; j++) {
				expect(gapBetween(out[i], out[j])).toBeGreaterThan(50);
			}
		}
	});

	it('keeps every pin on a leash near its true spot', () => {
		const crowd = Array.from({ length: 6 }, () => ({ x: 100, y: 100, r: 20 }));
		const out = spreadApart(crowd, 6, 8, 1.2);
		for (const p of out) expect(gapBetween(p, { x: 100, y: 100 })).toBeLessThanOrEqual(24 + 0.01);
	});
});
