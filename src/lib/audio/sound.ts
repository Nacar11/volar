import type { Howl } from 'howler';

/** A pack's sound sprite, ready to load: encoded files (best first) and each clip's [start, length] in ms. */
export interface SoundSprite {
	src: string[];
	sprite: Record<string, [number, number]>;
}

/**
 * Loads a sound sprite with Howler. Howler itself loads only here, so scenes
 * without sound never download it. Resolves once the sound can play.
 */
export async function loadSound({ src, sprite }: SoundSprite): Promise<Howl> {
	const { Howl } = await import('howler');
	return new Promise((resolve, reject) => {
		const howl: Howl = new Howl({
			src,
			sprite,
			onload: () => resolve(howl),
			onloaderror: (_, error) => reject(new Error(`sound failed to load: ${error}`))
		});
	});
}
