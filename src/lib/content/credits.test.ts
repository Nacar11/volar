import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { animals } from './animals';
import { creditGroups } from './credits';

const root = join(import.meta.dirname, '../../../content');
const METADATA = ['animal.json', 'credits.json', 'audio.json'];

describe('the Credits page', () => {
	const groups = creditGroups();

	it('credits every shipped file of every animal', () => {
		for (const animal of animals) {
			const group = groups.find((g) => g.title === animal.name)!;
			const credited = new Set(group.credits.map((c) => c.file));
			const shipped = readdirSync(join(root, 'animals', animal.id)).filter((f) => !METADATA.includes(f));
			for (const file of shipped) expect(credited, `${animal.id}/${file}`).toContain(file);
		}
	});

	it('credits every coming-soon icon', () => {
		const credited = new Set(groups.find((g) => g.title === 'Coming-soon icons')!.credits.map((c) => c.file));
		for (const file of readdirSync(join(root, 'planned/icons')).filter((f) => f.endsWith('.svg'))) {
			expect(credited).toContain(file);
		}
	});

	it('names a licence for every credit', () => {
		for (const credit of groups.flatMap((g) => g.credits)) expect(credit.license.length).toBeGreaterThan(0);
	});
});
