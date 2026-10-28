import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PACK_BUDGET_BYTES, validatePack, validatePlanned, type PackFiles } from './validate';

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

describe('validatePlanned', () => {
	const icon = { 'lion.svg': encode('<svg/>') };
	const credits = [{ file: 'lion.svg', source: 'Fluent', author: 'Microsoft', license: 'MIT' }];
	const lion = { id: 'lion', name: 'Lion', lat: -2.3, lng: 34.8, icon: 'lion.svg' };

	it('accepts a planned animal with a credited icon', () => {
		expect(validatePlanned([lion], icon, credits, ['philippine-tarsier'])).toEqual([]);
	});

	it('rejects an animal that is planned and also has a pack', () => {
		expect(validatePlanned([lion], icon, credits, ['lion']).join()).toMatch(/lion has a pack/);
	});

	it('rejects a missing or uncredited icon', () => {
		expect(validatePlanned([lion], {}, credits, []).join()).toMatch(/lion.svg is missing/);
		expect(validatePlanned([lion], icon, [], []).join()).toMatch(/lion.svg has no credit/);
	});

	it('rejects duplicate ids and bad coordinates', () => {
		expect(validatePlanned([lion, lion], icon, credits, []).join()).toMatch(/duplicate id/);
		expect(validatePlanned([{ ...lion, lat: 120 }], icon, credits, []).join()).toMatch(/lat/);
	});
});

describe('validatePack: habitat regions', () => {
	const withRegions = (change: (regions: any) => void) => {
		const files = tarsier();
		const regions = JSON.parse(new TextDecoder().decode(files['regions.geojson']));
		change(regions);
		files['regions.geojson'] = encode(JSON.stringify(regions));
		return validatePack('philippine-tarsier', files).join('\n');
	};

	it('rejects a file that is not valid GeoJSON', () => {
		const files = tarsier();
		files['regions.geojson'] = encode('{ "type": "Feature" }');
		expect(validatePack('philippine-tarsier', files).join()).toMatch(/regions.geojson/);
	});

	it('rejects coordinates out of range', () => {
		expect(withRegions((r) => (r.features[0].geometry.coordinates[0][1] = [200, 9.6]))).toMatch(
			/regions.geojson features.0.geometry.coordinates/
		);
	});

	it('rejects a ring that is not closed', () => {
		expect(withRegions((r) => r.features[0].geometry.coordinates[0].pop())).toMatch(
			/must end where it starts/
		);
	});

	it('rejects a ring that crosses the date line', () => {
		const wide = [
			[170, 0],
			[-170, 0],
			[-170, 5],
			[170, 5],
			[170, 0]
		];
		expect(withRegions((r) => (r.features[0].geometry.coordinates = [wide]))).toMatch(/date line/);
	});

	it('rejects a habitat drawn far from the pin, e.g. on the wrong continent', () => {
		const africa = [
			[30, 0],
			[35, 0],
			[35, 5],
			[30, 5],
			[30, 0]
		];
		expect(
			withRegions((r) => {
				r.features = [{ type: 'Feature', geometry: { type: 'Polygon', coordinates: [africa] } }];
			})
		).toMatch(/far from its habitat/);
	});
});

describe('validatePack: sound', () => {
	const macawDir = join(import.meta.dirname, '../../../content/animals/scarlet-macaw');
	const macaw = (): PackFiles => {
		const files: PackFiles = {};
		for (const name of readdirSync(macawDir)) files[name] = readFileSync(join(macawDir, name));
		return files;
	};
	const edit = (files: PackFiles, name: string, change: (json: any) => void) => {
		const json = JSON.parse(new TextDecoder().decode(files[name]));
		change(json);
		files[name] = encode(JSON.stringify(json));
		return files;
	};

	it('accepts the macaw pack, sound and all', () => {
		expect(validatePack('scarlet-macaw', macaw())).toEqual([]);
	});

	it('rejects a "Hear it" clip that is not in the sprite', () => {
		const files = edit(macaw(), 'animal.json', (a) => (a.toys[0].sound = 'roar'));
		expect(validatePack('scarlet-macaw', files).join()).toMatch(/plays "roar", which is not a clip/);
	});

	it('rejects a "Hear it" toy with no sound sprite', () => {
		const files = edit(macaw(), 'animal.json', (a) => delete a.assets.audio);
		expect(validatePack('scarlet-macaw', files).join()).toMatch(/needs a sound sprite/);
	});

	it('rejects a missing encoded file and an uncredited one', () => {
		const files = macaw();
		delete files['audio.m4a'];
		expect(validatePack('scarlet-macaw', files).join()).toMatch(/audio.m4a is referenced but missing/);
		const uncredited = edit(macaw(), 'credits.json', (c) => c.pop());
		expect(validatePack('scarlet-macaw', uncredited).join()).toMatch(/audio.m4a has no entry in credits/);
	});
});
