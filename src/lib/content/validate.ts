import { animalSchema, creditsSchema } from './schema';
import { rigs } from '../scene/rigs';

export const PACK_BUDGET_BYTES = 800 * 1024;
export const MAX_WORDS = 12;

/** Files in one animal folder, by name. */
export type PackFiles = Record<string, Uint8Array>;

const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

/** Checks one animal folder; returns human-readable problems, empty when the pack is good. */
export function validatePack(folder: string, files: PackFiles): string[] {
	const problems: string[] = [];
	const text = (name: string) => new TextDecoder().decode(files[name]);
	const readJson = (name: string): unknown => {
		if (!files[name]) {
			problems.push(`${name} is missing`);
			return undefined;
		}
		try {
			return JSON.parse(text(name));
		} catch {
			problems.push(`${name} is not valid JSON`);
			return undefined;
		}
	};

	const manifest = animalSchema.safeParse(readJson('animal.json'));
	if (!manifest.success) {
		for (const issue of manifest.error.issues) {
			problems.push(`animal.json ${issue.path.join('.') || '(root)'}: ${issue.message}`);
		}
		return problems.map((p) => `${folder}: ${p}`);
	}
	const animal = manifest.data;

	if (animal.id !== folder) problems.push(`id "${animal.id}" does not match its folder`);

	const referenced = [
		animal.assets.icon,
		animal.assets.puppet,
		...animal.assets.background,
		...(animal.assets.audio ? [animal.assets.audio] : []),
		...(animal.globe.regions ? [animal.globe.regions] : [])
	];
	for (const name of referenced) if (!files[name]) problems.push(`${name} is referenced but missing`);

	const credits = creditsSchema.safeParse(readJson('credits.json'));
	if (credits.success) {
		const credited = new Set(credits.data.map((c) => c.file));
		for (const name of Object.keys(files)) {
			if (name !== 'animal.json' && name !== 'credits.json' && !credited.has(name)) {
				problems.push(`${name} has no entry in credits.json`);
			}
		}
	} else if (files['credits.json']) {
		problems.push('credits.json does not match the credits schema');
	}

	const rig = rigs[animal.rig];
	if (files[animal.assets.puppet]) {
		const ids = new Set([...text(animal.assets.puppet).matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
		for (const part of rig.parts) if (!ids.has(part)) problems.push(`puppet is missing part "${part}"`);
		for (const toy of animal.toys) {
			if (toy.type === 'bodyXray' && !ids.has(toy.feature)) {
				problems.push(`x-ray feature "${toy.feature}" is not a puppet part`);
			}
		}
	}
	for (const toy of animal.toys) {
		if (toy.type !== 'makeItDo') continue;
		for (const action of toy.actions) {
			if (!(rig.actions as readonly string[]).includes(action)) {
				problems.push(`action "${action}" is not in the ${animal.rig} rig`);
			}
		}
	}

	const lines = [
		animal.greeting,
		...animal.facts.map((f) => f.text),
		...animal.toys.flatMap((t) =>
			t.type === 'dayNight' ? [t.day, t.night] : t.type === 'bodyXray' ? [t.reveal] : []
		)
	];
	for (const line of lines) {
		if (words(line) > MAX_WORDS) problems.push(`"${line}" is over ${MAX_WORDS} words`);
	}

	const factIds = animal.facts.map((f) => f.id);
	if (new Set(factIds).size !== factIds.length) problems.push('fact ids are not unique');
	if (new Set(animal.toys.map((t) => t.type)).size !== animal.toys.length) {
		problems.push('a toy type appears twice');
	}

	const bytes = Object.values(files).reduce((sum, f) => sum + f.byteLength, 0);
	if (bytes > PACK_BUDGET_BYTES) {
		problems.push(`pack is ${Math.round(bytes / 1024)} KB, over the ${PACK_BUDGET_BYTES / 1024} KB budget`);
	}

	return problems.map((p) => `${folder}: ${p}`);
}
