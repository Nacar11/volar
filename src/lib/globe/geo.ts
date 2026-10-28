// Latitude/longitude → a point on the globe, matching how three.js wraps an
// equirectangular texture around SphereGeometry: texture u = 0 is longitude
// -180 and the top edge is the north pole (+y).

export type Vec3 = [number, number, number];

export function latLngToVector(lat: number, lng: number, radius = 1): Vec3 {
	const phi = ((lng + 180) * Math.PI) / 180;
	const theta = ((90 - lat) * Math.PI) / 180;
	return [
		-radius * Math.cos(phi) * Math.sin(theta),
		radius * Math.cos(theta),
		radius * Math.sin(phi) * Math.sin(theta)
	];
}

/** A small deterministic random generator, so clouds land in the same place every load. */
export function seeded(seed: number) {
	return () => {
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
