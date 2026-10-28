import { error } from '@sveltejs/kit';
import type { SoundSprite } from '../audio/sound';
import {
	animalSchema,
	audioSchema,
	plannedSchema,
	regionPolygons,
	regionsSchema,
	type Animal,
	type Planned,
	type RegionPolygon
} from './schema';
import plannedList from '../../../content/planned/planned.json';

// Manifests and icons are small and load with the app; each pack's puppet and
// backgrounds load only when its scene opens.
const manifests = import.meta.glob('/content/animals/*/animal.json', {
	eager: true,
	import: 'default'
});
// Puppets are inlined as markup (below), so they never need a URL.
const svgUrls = import.meta.glob<string>(['/content/animals/*/*.svg', '!**/puppet.svg'], {
	eager: true,
	query: '?url',
	import: 'default'
});
const puppets = import.meta.glob<string>('/content/animals/*/puppet.svg', {
	query: '?raw',
	import: 'default'
});

const path = (animal: Animal, file: string) => `/content/animals/${animal.id}/${file}`;

export const animals: Animal[] = Object.values(manifests)
	.map((m) => animalSchema.parse(m))
	.sort((a, b) => a.name.localeCompare(b.name));

export const getAnimal = (id: string) => animals.find((a) => a.id === id);

/** Animals without a pack yet: greyed "coming soon" pins on the globe. */
export const planned: Planned[] = plannedSchema.parse(plannedList);

const plannedIcons = import.meta.glob<string>('/content/planned/icons/*.svg', {
	eager: true,
	query: '?url',
	import: 'default'
});

export const plannedIconUrl = (p: Planned) => plannedIcons[`/content/planned/icons/${p.icon}`];

export const iconUrl = (animal: Animal) => svgUrls[path(animal, animal.assets.icon)];

// Habitat regions are small and the globe draws them all, so they load with the app.
const regionFiles = import.meta.glob<string>('/content/animals/*/*.geojson', {
	eager: true,
	query: '?raw',
	import: 'default'
});

/** The animal's habitat polygons, or none if it has no regions file. */
export function habitatOf(animal: Animal): RegionPolygon[] {
	const file = animal.globe.regions;
	if (!file) return [];
	return regionPolygons(regionsSchema.parse(JSON.parse(regionFiles[path(animal, file)])));
}

// Sound: the encoded files are fetched by URL; the sprite map loads with the pack.
const soundUrls = import.meta.glob<string>('/content/animals/*/*.{webm,m4a}', {
	eager: true,
	query: '?url',
	import: 'default'
});
const soundMaps = import.meta.glob('/content/animals/*/audio.json', { import: 'default' });

export interface Pack {
	puppet: string;
	background: string[];
	sound: SoundSprite | null;
}

export async function loadPack(animal: Animal): Promise<Pack> {
	const audioFile = animal.assets.audio;
	const audio = audioFile ? audioSchema.parse(await soundMaps[path(animal, audioFile)]()) : null;
	return {
		puppet: await puppets[path(animal, animal.assets.puppet)](),
		background: animal.assets.background.map((file) => svgUrls[path(animal, file)]),
		sound: audio && {
			src: audio.files.map((file) => soundUrls[path(animal, file)]),
			sprite: audio.sprite
		}
	};
}

/** An animal and its pack, for a scene route; 404 when there is no such animal. */
export async function loadScene(id: string) {
	const animal = getAnimal(id);
	if (!animal) error(404, 'No animal here');
	return { animal, pack: await loadPack(animal) };
}
