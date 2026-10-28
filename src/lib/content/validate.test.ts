import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PACK_BUDGET_BYTES, validatePack, type PackFiles } from './validate';

const dir = join(import.meta.dirname, '../../../content/animals/philippine-tarsier');
const encode = (text: string) => new TextEncoder().encode(text);

function tarsier(): PackFiles {
	const files: PackFiles = {};
	for (const name of readdirSync(dir)) files[name] = readFileSync(join(dir, name));
	return files;
}

function withManifest(change: (animal: Record<string, any>) => void): PackFiles {
	const files = tarsier();
	const animal = JSON.parse(new TextDecoder().decode(files['animal.json']));
	change(animal);
	files['animal.json'] = encode(JSON.stringify(animal));
	return files;
}

describe('validatePack', () => {
	it('accepts the tarsier pack', () => {
		expect(validatePack('philippine-tarsier', tarsier())).toEqual([]);
	});

	it('rejects an id that does not match its folder', () => {
		expect(validatePack('tarsier', tarsier())).toContainEqual(
			'tarsier: id "philippine-tarsier" does not match its folder'
		);
	});

	it('rejects a fact longer than twelve words', () => {
		const files = withManifest((a) => {
			a.facts[0].text = 'one two three four five six seven eight nine ten eleven twelve thirteen';
		});
		expect(validatePack('philippine-tarsier', files).join()).toMatch(/over 12 words/);
	});

	it('rejects an action the rig cannot play', () => {
		const files = withManifest((a) => {
			a.toys[2].actions.push('moonwalk');
		});
		expect(validatePack('philippine-tarsier', files).join()).toMatch(/action "moonwalk"/);
	});

	it('rejects a puppet missing a rig part', () => {
		const files = tarsier();
		const svg = new TextDecoder().decode(files['puppet.svg']).replace('id="tail"', 'id="tale"');
		files['puppet.svg'] = encode(svg);
		expect(validatePack('philippine-tarsier', files).join()).toMatch(/missing part "tail"/);
	});

	it('rejects a referenced file that is not in the folder', () => {
		const files = tarsier();
		delete files['bg-mid.svg'];
		expect(validatePack('philippine-tarsier', files).join()).toMatch(/bg-mid.svg is referenced but missing/);
	});

	it('rejects a file with no credit', () => {
		const files = tarsier();
		files['extra.svg'] = encode('<svg/>');
		expect(validatePack('philippine-tarsier', files).join()).toMatch(/extra.svg has no entry/);
	});

	it('rejects a pack over the size budget', () => {
		const files = tarsier();
		files['bg-far.svg'] = new Uint8Array(PACK_BUDGET_BYTES);
		expect(validatePack('philippine-tarsier', files).join()).toMatch(/over the 800 KB budget/);
	});

	it('rejects a manifest that fails the schema', () => {
		const files = withManifest((a) => {
			a.sources = [];
		});
		expect(validatePack('philippine-tarsier', files).join()).toMatch(/sources/);
	});
});
