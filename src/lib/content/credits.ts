import appCredits from '../../../content/app-credits.json';
import { animals } from './animals';
import { creditsSchema } from './schema';

export type Credit = { file: string; source: string; author: string; license: string };

const packCredits = import.meta.glob('/content/animals/*/credits.json', { eager: true, import: 'default' });
const plannedCredits = import.meta.glob('/content/planned/icons/credits.json', {
	eager: true,
	import: 'default'
});

/** Every credit, grouped for the Credits page: each animal, the stand-in icons, then the app itself. */
export function creditGroups(): { title: string; credits: Credit[] }[] {
	return [
		...animals.map((animal) => ({
			title: animal.name,
			credits: creditsSchema.parse(packCredits[`/content/animals/${animal.id}/credits.json`])
		})),
		{
			title: 'Coming-soon icons',
			credits: creditsSchema.parse(Object.values(plannedCredits)[0])
		},
		{ title: 'Font, map and code', credits: appCredits }
	];
}
