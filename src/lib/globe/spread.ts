/** A pin's icon on screen: its centre and radius, in CSS px. */
export interface Disc {
	x: number;
	y: number;
	r: number;
}

/**
 * Nudges overlapping discs apart so pins in crowded places (the Philippines,
 * East Africa) never cover each other. Each pass moves every overlapping pair
 * apart along the line between them, half each. It starts from the true
 * positions every frame, so pins never drift and settle back as the globe
 * turns or zooms.
 *
 * `leash` caps how far a disc may end up from where it started, as a multiple
 * of its radius, so a crowded view can overlap a little but no pin ever lands
 * on the wrong country.
 */
export function spreadApart(
	discs: Disc[],
	gap = 6,
	passes = 4,
	leash = Infinity
): { x: number; y: number }[] {
	const out = discs.map(({ x, y }) => ({ x, y }));
	for (let pass = 0; pass < passes; pass++) {
		for (let i = 0; i < out.length; i++) {
			for (let j = i + 1; j < out.length; j++) {
				let dx = out[j].x - out[i].x;
				let dy = out[j].y - out[i].y;
				let distance = Math.hypot(dx, dy);
				const needed = discs[i].r + discs[j].r + gap;
				if (distance >= needed) continue;
				// Exactly on top of each other: split sideways, the later pin to the right.
				if (distance < 0.01) [dx, dy, distance] = [1, 0, 1];
				const push = (needed - distance) / 2;
				const ux = (dx / distance) * push;
				const uy = (dy / distance) * push;
				out[i].x -= ux;
				out[i].y -= uy;
				out[j].x += ux;
				out[j].y += uy;
			}
		}
	}
	out.forEach((p, i) => {
		const dx = p.x - discs[i].x;
		const dy = p.y - discs[i].y;
		const moved = Math.hypot(dx, dy);
		const limit = discs[i].r * leash;
		if (moved > limit) {
			p.x = discs[i].x + (dx / moved) * limit;
			p.y = discs[i].y + (dy / moved) * limit;
		}
	});
	return out;
}
