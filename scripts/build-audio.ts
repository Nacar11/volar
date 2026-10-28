// Builds each animal's sound sprite from art-source/audio/<id>/clips.json:
// npm run build:audio
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import ffmpeg from 'ffmpeg-static';

const root = join(import.meta.dirname, '..');
const sourceRoot = join(root, 'art-source/audio');
const GAP_S = 0.3;
const FADE_S = 0.02;

interface Clips {
	clips: Record<string, { file: string; start: number; end: number }>;
}

for (const id of readdirSync(sourceRoot)) {
	const clipsFile = join(sourceRoot, id, 'clips.json');
	if (!existsSync(clipsFile)) continue;
	const { clips }: Clips = JSON.parse(readFileSync(clipsFile, 'utf8'));
	const names = Object.keys(clips);
	const out = join(root, 'content/animals', id);
	if (!existsSync(out)) throw new Error(`${id}: no pack at content/animals/${id}`);

	// One input per clip, cut at its start and end, plus a silent gap.
	const inputs = names.flatMap((name) => {
		const { file, start, end } = clips[name];
		return ['-ss', String(start), '-t', String(end - start), '-i', join(sourceRoot, id, file)];
	});
	inputs.push('-f', 'lavfi', '-t', String(GAP_S), '-i', 'anullsrc=r=48000:cl=mono');

	// Each clip: mono 48 kHz, short fades so it doesn't click, even loudness.
	const filters = names.map((name, i) => {
		const length = clips[name].end - clips[name].start;
		return (
			`[${i}:a]aresample=48000,pan=mono|c0=0.5*c0+0.5*c1,` +
			`afade=t=in:d=${FADE_S},afade=t=out:st=${(length - FADE_S).toFixed(3)}:d=${FADE_S},` +
			`loudnorm=I=-16:TP=-1.5,aresample=48000[c${i}]`
		);
	});
	const gaps = names.length - 1;
	const order = names.flatMap((_, i) => (i < gaps ? [`[c${i}]`, `[g${i}]`] : [`[c${i}]`]));
	if (gaps > 0) {
		filters.push(`[${names.length}:a]asplit=${gaps}${names.slice(1).map((_, i) => `[g${i}]`).join('')}`);
	}
	filters.push(`${order.join('')}concat=n=${order.length}:v=0:a=1[out]`);

	const encode = (file: string, codec: string[]) =>
		execFileSync(ffmpeg!, [
			'-y',
			'-loglevel',
			'error',
			...inputs,
			'-filter_complex',
			filters.join(';'),
			'-map',
			'[out]',
			...codec,
			join(out, file)
		]);
	encode('audio.webm', ['-c:a', 'libopus', '-b:a', '48k']);
	encode('audio.m4a', ['-c:a', 'aac', '-b:a', '64k']);

	// Each clip's place in the sprite, in ms.
	const sprite: Record<string, [number, number]> = {};
	let at = 0;
	for (const name of names) {
		const length = (clips[name].end - clips[name].start) * 1000;
		sprite[name] = [Math.round(at), Math.round(length)];
		at += length + GAP_S * 1000;
	}
	writeFileSync(
		join(out, 'audio.json'),
		JSON.stringify({ files: ['audio.webm', 'audio.m4a'], sprite }, null, '\t') + '\n'
	);
	const kb = (f: string) => (readFileSync(join(out, f)).byteLength / 1024).toFixed(1);
	console.log(`${id}: ${names.join(', ')} → audio.webm ${kb('audio.webm')} KB, audio.m4a ${kb('audio.m4a')} KB`);
}
