import { ShapeUtils, Vector2 } from 'three';
import { latLngToVector } from './geo';

/** A GeoJSON ring, [lng, lat] pairs, closed (the last point repeats the first). */
export type Ring = [number, number][];
/** A GeoJSON polygon: the outline first, then any holes. */
export type Polygon = Ring[];

type Point = [number, number];

/** Halves the longest edge until no edge is longer than `maxEdge` degrees. */
function subdivide(tri: [Point, Point, Point], maxEdge: number, out: Point[]) {
	const edges = [0, 1, 2].map((i) => {
		const [a, b] = [tri[i], tri[(i + 1) % 3]];
		return Math.hypot(b[0] - a[0], b[1] - a[1]);
	});
	const longest = edges.indexOf(Math.max(...edges));
	if (edges[longest] <= maxEdge) {
		out.push(...tri);
		return;
	}
	const a = tri[longest];
	const b = tri[(longest + 1) % 3];
	const c = tri[(longest + 2) % 3];
	const mid: Point = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
	subdivide([a, mid, c], maxEdge, out);
	subdivide([mid, b, c], maxEdge, out);
}

/**
 * Turns habitat polygons into triangles lying on the globe, as a flat list
 * of xyz positions (three per triangle). Polygons are triangulated in
 * lng/lat, then cut finer so the overlay follows the globe's curve instead of
 * cutting through it.
 */
export function habitatTriangles(polygons: Polygon[], radius = 1.004, maxEdge = 2): Float32Array {
	const flat: Point[] = [];
	for (const [outline, ...holes] of polygons) {
		const open = (ring: Ring) => ring.slice(0, -1).map(([lng, lat]) => new Vector2(lng, lat));
		const contour = open(outline);
		const holeRings = holes.map(open);
		const points = [...contour, ...holeRings.flat()];
		for (const [a, b, c] of ShapeUtils.triangulateShape(contour, holeRings)) {
			const corner = (i: number): Point => [points[i].x, points[i].y];
			subdivide([corner(a), corner(b), corner(c)], maxEdge, flat);
		}
	}
	return new Float32Array(flat.flatMap(([lng, lat]) => latLngToVector(lat, lng, radius)));
}

/**
 * A stroke around every ring, as triangles on the globe: each edge becomes a
 * thin strip `width` degrees wide (corrected for longitude squeezing toward
 * the poles), stretched a little past its ends so the corners join up.
 */
export function habitatOutline(
	polygons: Polygon[],
	width = 0.5,
	radius = 1.005,
	maxStep = 1
): Float32Array {
	const flat: Point[] = [];
	const half = width / 2;
	for (const ring of polygons.flat()) {
		for (let i = 0; i < ring.length - 1; i++) {
			const [a, b] = [ring[i], ring[i + 1]];
			const squeeze = Math.cos((((a[1] + b[1]) / 2) * Math.PI) / 180);
			// Work in a plane where a degree of longitude is as wide as a degree of latitude.
			const ax = a[0] * squeeze;
			const bx = b[0] * squeeze;
			const length = Math.hypot(bx - ax, b[1] - a[1]);
			if (length === 0) continue;
			const [dx, dy] = [(bx - ax) / length, (b[1] - a[1]) / length];
			const [nx, ny] = [-dy * half, dx * half];
			const steps = Math.max(1, Math.ceil(length / maxStep));
			for (let s = 0; s < steps; s++) {
				const t0 = (s / steps) * length - (s === 0 ? half : 0);
				const t1 = ((s + 1) / steps) * length + (s === steps - 1 ? half : 0);
				const at = (t: number, side: number): Point => [
					(ax + dx * t + nx * side) / squeeze,
					a[1] + dy * t + ny * side
				];
				flat.push(at(t0, -1), at(t1, -1), at(t1, 1), at(t0, -1), at(t1, 1), at(t0, 1));
			}
		}
	}
	return new Float32Array(flat.flatMap(([lng, lat]) => latLngToVector(lat, lng, radius)));
}
