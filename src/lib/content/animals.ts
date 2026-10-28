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

// The globe needs every animal's manifest, icon and habitat at once, so those
// ship with the app. The rest of a pack (puppet, backgrounds, sound) is fetched
// from /packs/<id>/ when its scene opens, so it can be cached per animal.
const manifests = import.meta.glob('/content/animals/*/animal.json', {
	eager: true,
	import: 'default'
});
const iconUrls = import.meta.glob<string>('/content/animals/*/icon.svg', {
	eager: true,
	query: '?url',
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

export const iconUrl = (animal: Animal) => iconUrls[path(animal, animal.assets.icon)];

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

export interface Pack {
	puppet: string;
	background: string[];
	sound: SoundSprite | null;
}

/** Where a pack file is published (see scripts/vite-plugin-packs.ts). */
export const packUrl = (animal: Animal, file: string) => `/packs/${animal.id}/${file}`;

async function fetchPack(animal: Animal, file: string): Promise<Response> {
	const response = await fetch(packUrl(animal, file));
	if (!response.ok) throw new Error(`${animal.id}: ${file} failed to load (${response.status})`);
	return response;
}

export async function loadPack(animal: Animal): Promise<Pack> {
	const audioFile = animal.assets.audio;
	const [puppet, audio] = await Promise.all([
		fetchPack(animal, animal.assets.puppet).then((r) => r.text()),
		audioFile ? fetchPack(animal, audioFile).then(async (r) => audioSchema.parse(await r.json())) : null
	]);
	return {
		puppet,
		background: animal.assets.background.map((file) => packUrl(animal, file)),
		sound: audio && { src: audio.files.map((file) => packUrl(animal, file)), sprite: audio.sprite }
	};
}

/** An animal and its pack, for a scene route; 404 when there is no such animal. */
export async function loadScene(id: string) {
	const animal = getAnimal(id);
	if (!animal) error(404, 'No animal here');
	return { animal, pack: await loadPack(animal) };
}
