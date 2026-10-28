import { animals, habitatOf, iconUrl, planned, plannedIconUrl } from '#lib/content/animals.ts';
import type { Animal, RegionPolygon } from '#lib/content/schema.ts';

/** One pin on the globe or the flat map. */
export interface MapPin {
	id: string;
	name: string;
	lat: number;
	lng: number;
	icon: string;
	/** The animal to visit, or null for a greyed "coming soon" pin. */
	animal: Animal | null;
}

// Animals with a scene are tappable pins; planned ones are greyed "coming soon" pins.
export const pins: MapPin[] = [
	...animals.map((animal) => ({
		id: animal.id,
		name: animal.name,
		lat: animal.globe.lat,
		lng: animal.globe.lng,
		icon: iconUrl(animal),
		animal
	})),
	...planned.map((p) => ({ id: p.id, name: p.name, lat: p.lat, lng: p.lng, icon: plannedIconUrl(p), animal: null }))
];

/** Every animal that has drawn its habitat. */
export const habitats: { id: string; color: string; polygons: RegionPolygon[] }[] = animals
	.map((a) => ({ id: a.id, color: a.themeColor, polygons: habitatOf(a) }))
	.filter((h) => h.polygons.length > 0);

/** Every migratory animal's route, [lng, lat] points in travel order. */
export const migrations: { id: string; route: [number, number][] }[] = animals.flatMap((a) =>
	a.globe.migration ? [{ id: a.id, route: a.globe.migration }] : []
);

/**
 * Pin sizes (px). Tappable pins keep a thumb-sized 72 px; coming-soon pins
 * can't be tapped, so they may shrink to fit a small map. The icon sits
 * `tail` px above the point it marks, and a crowded pin may be nudged at
 * most `leash` icon radii from its spot.
 */
export const PIN = { ready: 36, soon: 26, soonMin: 12, tail: 10, leash: 1.2 } as const;
