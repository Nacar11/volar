// What the content folders hold, so tests keep passing as animals are added.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const content = join(import.meta.dirname, '../content');

/** Animals with a pack: tappable pins and book pages. */
export const playable = readdirSync(join(content, 'animals'));

/** Animals still to come: greyed pins. */
export const planned: { id: string; name: string }[] = JSON.parse(
	readFileSync(join(content, 'planned/planned.json'), 'utf8')
);
