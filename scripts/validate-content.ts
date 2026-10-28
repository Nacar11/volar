// Checks every animal pack under content/animals and the planned list in
// content/planned; exits non-zero on any problem. Runs before every build.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { validatePack, validatePlanned, type PackFiles } from '../src/lib/content/validate.ts';

const root = join(import.meta.dirname, '..', 'content', 'animals');
const folders = readdirSync(root).filter((name) => statSync(join(root, name)).isDirectory());

const problems: string[] = [];
for (const folder of folders) {
	const dir = join(root, folder);
	const files: PackFiles = {};
	for (const name of readdirSync(dir)) files[name] = readFileSync(join(dir, name));
	const found = validatePack(folder, files);
	const kb = Object.values(files).reduce((sum, f) => sum + f.byteLength, 0) / 1024;
	console.log(`${found.length ? '✗' : '✓'} ${folder} (${kb.toFixed(1)} KB)`);
	problems.push(...found);
}

const plannedDir = join(root, '..', 'planned');
const plannedIcons: PackFiles = {};
for (const name of readdirSync(join(plannedDir, 'icons'))) {
	plannedIcons[name] = readFileSync(join(plannedDir, 'icons', name));
}
const readJson = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const plannedProblems = validatePlanned(
	readJson(join(plannedDir, 'planned.json')),
	plannedIcons,
	readJson(join(plannedDir, 'icons', 'credits.json')),
	folders
);
console.log(`${plannedProblems.length ? '✗' : '✓'} planned animals`);
problems.push(...plannedProblems);

if (problems.length) {
	console.error(`\n${problems.length} problem(s):\n${problems.map((p) => `  - ${p}`).join('\n')}`);
	process.exit(1);
}
console.log(`\n${folders.length} animal pack(s) valid.`);
