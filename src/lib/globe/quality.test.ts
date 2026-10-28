import { describe, expect, it } from 'vitest';
import { FpsGuard, HIGH, isLowEnd, startingQuality } from './quality';

const run = (guard: FpsGuard, fps: number, seconds: number) => {
	let trippedAt = -1;
	for (let i = 0; i < fps * seconds; i++) if (guard.feed(1 / fps)) trippedAt = i;
	return trippedAt;
};

describe('FpsGuard', () => {
	it('stays quiet at a healthy frame rate', () => {
		expect(run(new FpsGuard(), 60, 10)).toBe(-1);
	});

	it('trips once after 3 s under 30 fps (plus the 1 s warm-up)', () => {
		const guard = new FpsGuard();
		const at = run(guard, 20, 10);
		expect(at).toBeGreaterThan(0);
		// 1 s warm-up + a 3 s window at 20 fps ≈ frame 80.
		expect(at).toBeGreaterThanOrEqual(75);
		expect(at).toBeLessThanOrEqual(85);
		expect(run(guard, 20, 10)).toBe(-1);
	});

	it('does not trip on a short stutter', () => {
		const guard = new FpsGuard();
		run(guard, 60, 2);
		run(guard, 15, 0.5);
		expect(run(guard, 60, 5)).toBe(-1);
	});

	it('ignores long gaps like a hidden tab or a paused globe', () => {
		const guard = new FpsGuard();
		for (let i = 0; i < 20; i++) expect(guard.feed(2)).toBe(false);
		expect(guard.tripped).toBe(false);
	});
});

describe('starting quality', () => {
	it('caps pixel density at 1.5 on low-end devices', () => {
		expect(isLowEnd(4, 8)).toBe(true);
		expect(isLowEnd(8, 2)).toBe(true);
		expect(startingQuality(4, 2).maxDpr).toBe(1.5);
		expect(startingQuality(8, 8)).toEqual(HIGH);
		expect(startingQuality(undefined, undefined)).toEqual(HIGH);
	});
});
