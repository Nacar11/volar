import { error } from '@sveltejs/kit';
import { animalSchema, type Animal } from './schema';

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

export const iconUrl = (animal: Animal) => svgUrls[path(animal, animal.assets.icon)];

export interface Pack {
	puppet: string;
	background: string[];
}

export async function loadPack(animal: Animal): Promise<Pack> {
	return {
		puppet: await puppets[path(animal, animal.assets.puppet)](),
		background: animal.assets.background.map((file) => svgUrls[path(animal, file)])
	};
}

/** An animal and its pack, for a scene route; 404 when there is no such animal. */
export async function loadScene(id: string) {
	const animal = getAnimal(id);
	if (!animal) error(404, 'No animal here');
	return { animal, pack: await loadPack(animal) };
}
