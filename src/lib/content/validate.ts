import {
	animalSchema,
	audioSchema,
	creditsSchema,
	plannedSchema,
	regionPolygons,
	regionsSchema
} from './schema';
import { rigs } from '../scene/rigs';

export const PACK_BUDGET_BYTES = 800 * 1024;
/** How far (degrees) an animal's pin may sit outside its habitat's bounding box. */
export const PIN_SLACK_DEG = 3;
export const MAX_WORDS = 12;

/** Files that describe a pack rather than ship art or sound in it. */
const METADATA = ['animal.json', 'credits.json', 'audio.json'];

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
		...(animal.globe.regions ? [animal.globe.regions] : []),
		...animal.toys.flatMap((t) => (t.type === 'thenVsNow' ? [t.image] : []))
	];
	for (const name of referenced) if (!files[name]) problems.push(`${name} is referenced but missing`);

	for (const toy of animal.toys) {
		if (toy.type === 'sizeCompare' && toy.measure === 'length' && toy.ground === undefined) {
			problems.push('a "length" size compare needs a ground line for the things to stand on');
		}
	}

	const audioFile = animal.assets.audio;
	if (audioFile && files[audioFile]) {
		const audio = audioSchema.safeParse(readJson(audioFile));
		if (!audio.success) {
			problems.push(`${audioFile} does not match the audio schema`);
		} else {
			for (const name of audio.data.files) if (!files[name]) problems.push(`${name} is referenced but missing`);
			for (const toy of animal.toys) {
				if (toy.type === 'hearIt' && !audio.data.sprite[toy.sound]) {
					problems.push(`"Hear it" plays "${toy.sound}", which is not a clip in ${audioFile}`);
				}
			}
		}
	}
	if (animal.toys.some((t) => t.type === 'hearIt') && !audioFile) {
		problems.push('the "Hear it" toy needs a sound sprite (assets.audio)');
	}

	const regionsFile = animal.globe.regions;
	if (regionsFile && files[regionsFile]) {
		const regions = regionsSchema.safeParse(readJson(regionsFile));
		if (!regions.success) {
			for (const issue of regions.error.issues) {
				problems.push(`${regionsFile} ${issue.path.join('.')}: ${issue.message}`);
			}
		} else {
			// Catches a habitat drawn on the wrong continent, or a pin put in the wrong place.
			const points = regionPolygons(regions.data).flat(2);
			const lngs = points.map((p) => p[0]);
			const lats = points.map((p) => p[1]);
			const { lat, lng } = animal.globe;
			const inside =
				lng >= Math.min(...lngs) - PIN_SLACK_DEG &&
				lng <= Math.max(...lngs) + PIN_SLACK_DEG &&
				lat >= Math.min(...lats) - PIN_SLACK_DEG &&
				lat <= Math.max(...lats) + PIN_SLACK_DEG;
			if (!inside) problems.push(`the pin at ${lat}, ${lng} is far from its habitat in ${regionsFile}`);
		}
	}

	const credits = creditsSchema.safeParse(readJson('credits.json'));
	if (credits.success) {
		const credited = new Set(credits.data.map((c) => c.file));
		for (const name of Object.keys(files)) {
			// Metadata files describe the pack and need no credit of their own.
			if (!METADATA.includes(name) && !credited.has(name)) {
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
	const rigActions = rig.actions as readonly string[];
	if (animal.toys.some((t) => t.type === 'whatsForDinner') && !['munch', 'shake'].every((a) => rigActions.includes(a))) {
		problems.push(`"What's for dinner" needs a rig that can munch and shake its head; ${animal.rig} can't`);
	}
	for (const toy of animal.toys) {
		if (toy.type !== 'makeItDo') continue;
		for (const action of toy.actions) {
			if (!(rig.actions as readonly string[]).includes(action)) {
				problems.push(`action "${action}" is not in the ${animal.rig} rig`);
			}
		}
	}

	const toyLines: Record<string, (t: (typeof animal.toys)[number]) => string[]> = {
		dayNight: (t) => (t.type === 'dayNight' ? [t.day, t.night] : []),
		bodyXray: (t) => (t.type === 'bodyXray' ? [t.reveal] : []),
		hearIt: (t) => (t.type === 'hearIt' ? [t.caption] : []),
		sizeCompare: (t) => (t.type === 'sizeCompare' ? [t.caption] : []),
		thenVsNow: (t) => (t.type === 'thenVsNow' ? [t.then, t.now] : []),
		whatsForDinner: (t) => (t.type === 'whatsForDinner' ? t.foods.map((f) => f.caption) : []),
		speedRace: (t) => (t.type === 'speedRace' ? t.racers.map((r) => r.caption) : []),
		tapReveal: (t) => (t.type === 'tapReveal' ? t.cards : []),
		makeItDo: () => []
	};
	const lines = [
		animal.greeting,
		...animal.facts.map((f) => f.text),
		...animal.toys.flatMap((t) => toyLines[t.type](t))
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

/**
 * Checks content/planned: the list parses, ids are unique, every icon exists
 * and is credited, and no planned animal also has a pack.
 */
export function validatePlanned(
	planned: unknown,
	icons: PackFiles,
	credits: unknown,
	packIds: string[]
): string[] {
	const problems: string[] = [];
	const list = plannedSchema.safeParse(planned);
	if (!list.success) {
		return list.error.issues.map((i) => `planned.json ${i.path.join('.')}: ${i.message}`);
	}
	const ids = list.data.map((p) => p.id);
	if (new Set(ids).size !== ids.length) problems.push('planned.json has a duplicate id');
	for (const p of list.data) {
		if (packIds.includes(p.id)) problems.push(`${p.id} has a pack, so remove it from planned.json`);
		if (!icons[p.icon]) problems.push(`planned icon ${p.icon} is missing`);
	}
	const parsedCredits = creditsSchema.safeParse(credits);
	const credited = new Set(parsedCredits.success ? parsedCredits.data.map((c) => c.file) : []);
	for (const name of Object.keys(icons)) {
		if (name.endsWith('.svg') && !credited.has(name)) problems.push(`planned icon ${name} has no credit`);
	}
	return problems;
}
