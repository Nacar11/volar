// The cloud curtain between the globe and a scene. CloudTransition.svelte,
// mounted once in the root layout, registers the animations; the globe and
// scenes then cover and part the clouds through `clouds`.

export interface Curtain {
	cover(): Promise<void>;
	part(): Promise<void>;
}

let curtain: Curtain | null = null;
let open: Promise<void> = Promise.resolve();
let opened = () => {};

export function registerCurtain(next: Curtain) {
	curtain = next;
	return () => {
		if (curtain === next) curtain = null;
	};
}

export const clouds = {
	cover(): Promise<void> {
		open = new Promise((resolve) => (opened = resolve));
		return curtain?.cover() ?? Promise.resolve();
	},
	part(): Promise<void> {
		const done = curtain?.part() ?? Promise.resolve();
		opened();
		return done;
	},
	/** Resolves once the clouds start to part (at once if they never closed). */
	whenOpen: () => open
};
