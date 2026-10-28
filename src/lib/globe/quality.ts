// How hard the globe works. It starts high (pixel density capped lower on
// low-end devices) and steps down once if the frame rate can't keep up.

export interface Quality {
	tier: 'high' | 'low';
	/** Highest device pixel ratio the canvas renders at. */
	maxDpr: number;
	texture: string;
	/** Share of the cloud puffs drawn, 0–1. */
	clouds: number;
	stars: number;
}

export const HIGH: Quality = {
	tier: 'high',
	maxDpr: 2,
	texture: '/globe/earth-2048.png',
	clouds: 1,
	stars: 1500
};

export const LOW: Quality = {
	tier: 'low',
	maxDpr: 1,
	texture: '/globe/earth-1024.png',
	clouds: 0.5,
	stars: 500
};

/** Few cores or little memory: a budget phone or an old school PC. */
export const isLowEnd = (cores?: number, memoryGb?: number) => (cores ?? 8) <= 4 || (memoryGb ?? 8) <= 4;

export function startingQuality(cores?: number, memoryGb?: number): Quality {
	return isLowEnd(cores, memoryGb) ? { ...HIGH, maxDpr: 1.5 } : HIGH;
}

/**
 * Watches frame times and trips once when the frame rate has averaged under
 * `minFps` over a `windowS`-second stretch. Skips a warm-up after each reset
 * (loading, resuming) and ignores long gaps (a hidden tab, a paused globe).
 */
export class FpsGuard {
	private frames = 0;
	private elapsed = 0;
	private warmup = 0;
	tripped = false;

	constructor(
		private minFps = 30,
		private windowS = 3,
		private warmupS = 1
	) {
		this.reset();
	}

	reset() {
		this.frames = 0;
		this.elapsed = 0;
		this.warmup = this.warmupS;
	}

	/** Feed one frame's duration in seconds; returns true on the frame the guard trips. */
	feed(dt: number): boolean {
		if (this.tripped || dt <= 0 || dt > 0.5) return false;
		if (this.warmup > 0) {
			this.warmup -= dt;
			return false;
		}
		this.frames++;
		this.elapsed += dt;
		if (this.elapsed < this.windowS) return false;
		const fps = this.frames / this.elapsed;
		this.frames = 0;
		this.elapsed = 0;
		if (fps >= this.minFps) return false;
		this.tripped = true;
		return true;
	}
}
