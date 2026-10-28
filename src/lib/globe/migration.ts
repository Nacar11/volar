// A migration route drawn on the globe as dots flowing the way the animals
// travel. The route is a list of [lng, lat] points; it's cut into short steps
// so it follows the globe's curve, and dots are placed by how far along it
// they are.

export type RoutePoint = [lng: number, lat: number];

export interface Route {
	points: RoutePoint[];
	/** Distance (in degrees) from the start to each point. */
	along: number[];
	length: number;
}

/** Cuts every leg of the route into steps of at most `maxStep` degrees. */
export function densify(route: RoutePoint[], maxStep = 0.5): Route {
	const points: RoutePoint[] = [route[0]];
	for (let i = 1; i < route.length; i++) {
		const [a, b] = [route[i - 1], route[i]];
		const steps = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / maxStep));
		for (let s = 1; s <= steps; s++) {
			points.push([a[0] + ((b[0] - a[0]) * s) / steps, a[1] + ((b[1] - a[1]) * s) / steps]);
		}
	}
	const along = [0];
	for (let i = 1; i < points.length; i++) {
		along.push(along[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
	}
	return { points, along, length: along[along.length - 1] };
}

/** The point a fraction `f` (0–1) of the way along the route. */
export function pointAlong(route: Route, f: number): RoutePoint {
	const target = Math.min(Math.max(f, 0), 1) * route.length;
	let lo = 0;
	let hi = route.along.length - 1;
	while (hi - lo > 1) {
		const mid = (lo + hi) >> 1;
		if (route.along[mid] <= target) lo = mid;
		else hi = mid;
	}
	const span = route.along[hi] - route.along[lo] || 1;
	const t = (target - route.along[lo]) / span;
	const [a, b] = [route.points[lo], route.points[hi]];
	return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}
