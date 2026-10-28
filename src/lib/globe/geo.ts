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

/**
 * How much a point on the unit globe faces a camera that looks at the centre:
 * 1 dead centre, 0 side-on, negative on the far side.
 */
export function facing(point: Vec3, camera: Vec3): number {
	const distance = Math.hypot(...camera);
	return (point[0] * camera[0] + point[1] * camera[1] + point[2] * camera[2]) / distance;
}

/**
 * A marker's opacity: 0 behind the horizon (seen from distance d, the unit
 * sphere's edge is where facing = 1/d), fading in just in front of it.
 */
export function markerOpacity(facingValue: number, cameraDistance: number): number {
	const horizon = 1 / cameraDistance;
	return Math.min(Math.max((facingValue - horizon - 0.02) / 0.15, 0), 1);
}
