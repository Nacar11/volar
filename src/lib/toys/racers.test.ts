import { describe, expect, it } from 'vitest';
import { FASTEST_S, LONGEST_S, raceTimes } from './racers';

describe('speed race timing', () => {
	it('lets the faster runner finish first, in true proportion', () => {
		// A 65 km/h bison against a 50 km/h car.
		const race = raceTimes(65, 50);
		expect(race.animal).toBeCloseTo(FASTEST_S);
		expect(race.racer).toBeCloseTo((FASTEST_S * 65) / 50);
		expect(race.finish).toEqual({ animal: 1, racer: 1 });
	});

	it('ends the race on screen before a much slower runner gets there', () => {
		// The bison against a running kid (16 km/h): the kid would take ~6.5 s.
		const race = raceTimes(65, 16);
		expect(race.end).toBe(LONGEST_S);
		expect(race.finish.animal).toBe(1);
		expect(race.finish.racer).toBeCloseTo(LONGEST_S / ((FASTEST_S * 65) / 16));
		expect(race.finish.racer).toBeLessThan(1);
	});

	it('works the other way round too: a sloth loses to nothing slower than a snail', () => {
		const race = raceTimes(0.24, 0.05);
		expect(race.animal).toBeCloseTo(FASTEST_S);
		expect(race.finish.racer).toBeLessThan(1);
	});
});
