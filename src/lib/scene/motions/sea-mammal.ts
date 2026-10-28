import { gsap } from 'gsap';
import { rigs } from '../rigs';
import { rigCore } from './core';
import { findParts, type Rig, type RigOptions } from './types';

// Pivot points in the puppet's 400×400 viewBox. Whales on this rig swim
// side-on facing right, centred near (210, 200): the fluke joins the body at
// (66, 200), the flipper at (290, 232), and the blowhole is at (300, 148).
const PIVOTS = {
	animal: '210 200',
	fluke: '66 200',
	flipper: '286 230',
	spout: '300 148',
	eye: '334 212'
} as const;

export function seaMammal(svg: SVGSVGElement, opts: RigOptions): Rig {
	const p = findParts(svg, rigs['sea-mammal'].parts);

	for (const [part, origin] of Object.entries(PIVOTS)) gsap.set(p[part], { svgOrigin: origin });
	gsap.set(p.lid, { scaleY: 0, transformOrigin: '50% 0%' });
	gsap.set(p.spout, { opacity: 0, scaleY: 0 });

	const core = rigCore(opts, {
		// Floating: a slow rise and fall, and the fluke beating gently.
		loops: () => [
			gsap.to(p.animal, { y: -5, duration: 2.4, ease: 'sine.inOut', yoyo: true, repeat: -1 }),
			gsap.to(p.fluke, { rotation: 9, duration: 1.4, ease: 'sine.inOut', yoyo: true, repeat: -1 })
		],
		settle: () => gsap.to([p.animal, p.fluke], { y: 0, rotation: 0, duration: 0.3 }),
		blink: () => {
			gsap.timeline()
				.to(p.lid, { scaleY: 1, duration: 0.1, ease: 'power1.in' })
				.to(p.lid, { scaleY: 0, duration: 0.14, ease: 'power1.out' });
		}
	});
	const run = core.run;

	/** Fluke beats while the timeline it's added to plays. */
	const beats = (count: number) =>
		gsap.to(p.fluke, {
			rotation: opts.reducedMotion() ? 10 : 22,
			duration: 0.3,
			ease: 'sine.inOut',
			yoyo: true,
			repeat: count * 2 - 1
		});

	// A tall spray from the blowhole that rises and drifts away.
	function spout() {
		return gsap
			.timeline()
			.to(p.animal, { y: -10, duration: 0.25, ease: 'power2.out' })
			.to(p.spout, { opacity: 1, scaleY: 1.2, duration: 0.3, ease: 'power3.out' }, '<')
			.to(p.spout, { scaleY: 1, scaleX: 1.3, duration: 0.6, ease: 'sine.out' })
			.to(p.spout, { opacity: 0, y: -20, duration: 0.5, ease: 'power1.in' })
			.set(p.spout, { y: 0, scaleX: 1, scaleY: 0 })
			.to(p.animal, { y: 0, duration: 0.4, ease: 'sine.inOut' }, '<');
	}

	// Nose down into a dive, fluke up, then back to the surface.
	function dive() {
		const depth = opts.reducedMotion() ? 40 : 130;
		return gsap
			.timeline()
			.to(p.animal, { rotation: 16, y: depth, duration: 0.9, ease: 'power2.in' })
			.add(beats(2), 0)
			.to(p.animal, { rotation: -10, y: 0, duration: 1, ease: 'power2.out' })
			.to(p.animal, { rotation: 0, duration: 0.5, ease: 'sine.inOut' });
	}

	// A flipper wave, rolling a little toward you.
	function wave() {
		return gsap
			.timeline()
			.to(p.flipper, { rotation: -55, duration: 0.25, ease: 'power2.out', yoyo: true, repeat: 3 })
			.to(p.animal, { rotation: -4, duration: 0.5, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 0)
			.to(p.flipper, { rotation: 0, duration: 0.2 });
	}

	const actions: Record<string, () => gsap.core.Timeline> = { spout, dive, wave };

	return {
		entrance() {
			if (opts.reducedMotion()) {
				gsap.set(p.animal, { opacity: 0 });
				return run(gsap.timeline().to(p.animal, { opacity: 1, duration: 0.6 }));
			}
			// Glides in from the right with slow fluke beats.
			gsap.set(p.animal, { x: 440 });
			return run(gsap.timeline().to(p.animal, { x: 0, duration: 1.6, ease: 'power2.out' }).add(beats(3), 0));
		},
		exit() {
			if (opts.reducedMotion()) {
				return run(gsap.timeline().to(p.animal, { opacity: 0, duration: 0.4 }));
			}
			return run(
				gsap
					.timeline()
					.to(p.animal, { x: -460, y: 60, rotation: 8, duration: 1.1, ease: 'power2.in' })
					.add(beats(2), 0)
			);
		},
		play(name) {
			const build = actions[name];
			if (!build) return Promise.reject(new Error(`unknown action "${name}"`));
			if (core.asleep) this.sleep(false);
			return run(build());
		},
		react() {
			if (core.busy) return;
			gsap.timeline()
				.to(p.flipper, { rotation: -40, duration: 0.2, ease: 'power2.out', yoyo: true, repeat: 1 })
				.to(p.animal, { rotation: -5, duration: 0.2, yoyo: true, repeat: 1 }, '<');
		},
		calm: core.calm,
		sleep(on) {
			core.asleep = on;
			gsap.to(p.lid, { scaleY: on ? 1 : 0, duration: 0.6 });
		},
		dilate() {},
		refreshMotion: core.retime,
		destroy() {
			core.destroy();
			gsap.killTweensOf(Object.values(p));
		}
	};
}
