// Things an animal can race in "Speed race", with everyday speeds a kid can
// picture. Kept modest and round on purpose: the animal's own speed comes from
// its sources; these are the familiar side of the comparison.

export const RACERS = {
	// An 8-year-old sprints at roughly 4–5 m/s.
	kid: { label: 'You', icon: '🏃', kmh: 16 },
	bike: { label: 'A bike', icon: '🚲', kmh: 20 },
	// A typical town speed limit.
	car: { label: 'A car in town', icon: '🚗', kmh: 50 },
	snail: { label: 'A snail', icon: '🐌', kmh: 0.05 }
} as const;

export type Racer = keyof typeof RACERS;
export const racerNames = Object.keys(RACERS) as [Racer, ...Racer[]];

/** The faster runner crosses the finish line in this many seconds on screen. */
export const FASTEST_S = 1.6;
/** However slow the other runner, the race ends on screen after this long. */
export const LONGEST_S = 6;

/**
 * How long each runner takes to cross the track on screen: times are in true
 * proportion to their speeds, scaled so the faster finishes in FASTEST_S. A
 * much slower runner is still on the track when the race ends at LONGEST_S;
 * `finish` says how far along (0–1) each one gets.
 */
export function raceTimes(animalKmh: number, racerKmh: number) {
	const fastest = Math.max(animalKmh, racerKmh);
	const time = (kmh: number) => (FASTEST_S * fastest) / kmh;
	const animal = time(animalKmh);
	const racer = time(racerKmh);
	const end = Math.min(Math.max(animal, racer), LONGEST_S);
	return {
		animal: Math.min(animal, end),
		racer: Math.min(racer, end),
		end,
		finish: { animal: Math.min(end / animal, 1), racer: Math.min(end / racer, 1) }
	};
}
