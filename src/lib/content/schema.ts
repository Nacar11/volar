import { z } from 'zod';
import { rigNames } from '../scene/rigs';

const file = z.string().regex(/^[\w-]+\.(svg|webm|json|geojson)$/, 'a file name in the pack folder');

const toy = z.discriminatedUnion('type', [
	z.object({ type: z.literal('dayNight'), day: z.string(), night: z.string() }),
	z.object({ type: z.literal('bodyXray'), feature: z.string(), reveal: z.string() }),
	z.object({ type: z.literal('makeItDo'), actions: z.array(z.string()).min(1) })
]);

export const animalSchema = z.object({
	id: z.string().regex(/^[a-z0-9-]+$/),
	name: z.string(),
	continent: z.enum([
		'africa',
		'antarctica',
		'asia',
		'australia',
		'europe',
		'north-america',
		'south-america',
		'ocean'
	]),
	livesIn: z.string(),
	habitats: z.array(z.enum(['ocean', 'jungle', 'desert', 'polar', 'grassland', 'forest'])).min(1),
	nocturnal: z.boolean(),
	rig: z.enum(rigNames),
	themeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
	globe: z.object({
		lat: z.number().min(-90).max(90),
		lng: z.number().min(-180).max(180),
		regions: file.optional()
	}),
	assets: z.object({
		icon: file,
		puppet: z.literal('puppet.svg'),
		background: z.array(file).min(1),
		audio: file.optional()
	}),
	greeting: z.string(),
	facts: z.array(z.object({ id: z.string(), text: z.string() })).min(5).max(8),
	toys: z.array(toy).min(2).max(3),
	sources: z.array(z.url()).min(1)
});

export type Animal = z.infer<typeof animalSchema>;
export type Toy = Animal['toys'][number];

export const creditsSchema = z.array(
	z.object({ file, source: z.string(), author: z.string(), license: z.string() })
);

/** An animal on the globe that has no pack yet: a greyed "coming soon" pin. */
export const plannedSchema = z.array(
	z.object({
		id: z.string().regex(/^[a-z0-9-]+$/),
		name: z.string(),
		lat: z.number().min(-90).max(90),
		lng: z.number().min(-180).max(180),
		icon: file
	})
);

export type Planned = z.infer<typeof plannedSchema>[number];

// Habitat regions: hand-drawn GeoJSON, kid-readable blobs rather than range maps.
const position = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]);
const ring = z
	.array(position)
	.min(4)
	.refine((r) => r[0][0] === r.at(-1)![0] && r[0][1] === r.at(-1)![1], 'a ring must end where it starts')
	.refine((r) => {
		const lngs = r.map((p) => p[0]);
		return Math.max(...lngs) - Math.min(...lngs) < 180;
	}, 'a ring must not cross the date line; split it in two');
const polygon = z.array(ring).min(1);
const geometry = z.discriminatedUnion('type', [
	z.object({ type: z.literal('Polygon'), coordinates: polygon }),
	z.object({ type: z.literal('MultiPolygon'), coordinates: z.array(polygon).min(1) })
]);

export const regionsSchema = z.object({
	type: z.literal('FeatureCollection'),
	features: z
		.array(z.object({ type: z.literal('Feature'), geometry, properties: z.unknown().optional() }))
		.min(1)
});

export type Regions = z.infer<typeof regionsSchema>;
export type RegionPolygon = z.infer<typeof polygon>;

/** Every polygon in a regions file, flattened. */
export const regionPolygons = (regions: Regions): RegionPolygon[] =>
	regions.features.flatMap(({ geometry: g }) => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates));
