/** What a scene can ask a puppet to do. Every body-type template implements this. */
export interface Rig {
	entrance(): Promise<void>;
	exit(): Promise<void>;
	/** Plays one signature action; resolves when the puppet is back at rest. */
	play(action: string): Promise<void>;
	/** A quick reaction to being tapped. */
	react(): void;
	/** Settles any running action so a fact bubble has the focus. */
	calm(): void;
	sleep(on: boolean): void;
	/** Night-time eyes: bigger pupils. */
	dilate(on: boolean): void;
	/** Re-reads the reduced-motion setting. */
	refreshMotion(): void;
	destroy(): void;
}

export interface RigOptions {
	reducedMotion: () => boolean;
}

export type Parts = Record<string, SVGGraphicsElement>;

/** Finds each named part in an inlined puppet; a missing part is a content bug. */
export function findParts(svg: SVGSVGElement, ids: readonly string[]): Parts {
	const parts: Parts = {};
	for (const id of ids) {
		const el = svg.querySelector<SVGGraphicsElement>(`#${id}`);
		if (!el) throw new Error(`puppet part "${id}" not found`);
		parts[id] = el;
	}
	return parts;
}
