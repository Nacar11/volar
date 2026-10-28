import { gsap } from 'gsap';
import { rigs } from '../rigs';
import { rigCore } from './core';
import { findParts, type Rig, type RigOptions } from './types';

// Pivot points in the puppet's 400×400 viewBox. Animals on this rig hang
// face-on from a branch along the top: their hands grip it at about (150, 62)
// and (250, 62), so the whole animal swings from (200, 62). Shoulders are near
// (166, 176) and (234, 176), hips near (184, 270) and (216, 270), the neck at
// (200, 188). The lower lip ("jaw") drops straight down to open the mouth.
const PIVOTS = {
	animal: '200 62',
	body: '200 290',
	head: '200 188',
	'arm-l': '166 176',
	'arm-r': '234 176',
	'leg-l': '184 270',
	'leg-r': '216 270'
} as const;

export function climber(svg: SVGSVGElement, opts: RigOptions): Rig {
	const p = findParts(svg, rigs.climber.parts);
	const legs = [p['leg-l'], p['leg-r']];

	for (const [part, origin] of Object.entries(PIVOTS)) gsap.set(p[part], { svgOrigin: origin });
	gsap.set(p.lid, { scaleY: 0, transformOrigin: '50% 0%' });

	const core = rigCore(opts, {
		// Hanging: a slow sway from the branch, breathing, legs dangling.
		loops: () => [
			gsap.to(p.animal, { rotation: 2.5, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 }),
			gsap.to(p.body, { scaleY: 1.02, duration: 1.5, ease: 'sine.inOut', yoyo: true, repeat: -1 }),
			gsap.to(legs, { rotation: -4, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0.3 })
		],
		settle: () => gsap.to([p.animal, p.body, ...legs], { rotation: 0, scaleY: 1, duration: 0.3 }),
		blink: () => {
			gsap.timeline()
				.to(p.lid, { scaleY: 1, duration: 0.08, ease: 'power1.in' })
				.to(p.lid, { scaleY: 0, duration: 0.12, ease: 'power1.out' });
			if (Math.random() < 0.35) {
				gsap.to(p.head, { rotation: gsap.utils.random([-8, 8]), duration: 0.4, yoyo: true, repeat: 1, repeatDelay: 0.6 });
			}
		}
	});
	const run = core.run;

	// A big pendulum swing from the branch; the legs trail a beat behind.
	function swing() {
		const arc = opts.reducedMotion() ? 6 : 18;
		return gsap
			.timeline()
			.to(p.animal, { rotation: arc, duration: 0.5, ease: 'sine.out' })
			.to(p.animal, { rotation: -arc, duration: 1, ease: 'sine.inOut' })
			.to(p.animal, { rotation: arc * 0.6, duration: 0.8, ease: 'sine.inOut' })
			.to(p.animal, { rotation: 0, duration: 0.6, ease: 'sine.inOut' })
			.to(legs, { rotation: -arc * 0.8, duration: 0.5, ease: 'sine.inOut', yoyo: true, repeat: 3 }, 0.2);
	}

	// One hand lets go of the branch and waves.
	function wave() {
		return gsap
			.timeline()
			.to(p.animal, { rotation: -4, duration: 0.3 })
			.to(p['arm-r'], { rotation: 110, duration: 0.4, ease: 'power2.out' }, '<')
			.to(p['arm-r'], { rotation: 135, duration: 0.2, ease: 'sine.inOut', yoyo: true, repeat: 5 })
			.to(p['arm-r'], { rotation: 0, duration: 0.45, ease: 'power2.inOut' })
			.to(p.animal, { rotation: 0, duration: 0.45 }, '<');
	}

	// Chewing: the lower lip drops and closes, the head nodding along.
	function munch() {
		return gsap
			.timeline()
			.to(p.jaw, { y: 5, duration: 0.14, ease: 'sine.inOut', yoyo: true, repeat: 9 })
			.to(p.head, { rotation: 3, duration: 0.28, ease: 'sine.inOut', yoyo: true, repeat: 4 }, 0)
			.to(p.head, { rotation: 0, duration: 0.2 });
	}

	// A polite "no thank you".
	function shake() {
		return gsap
			.timeline()
			.to(p.head, { rotation: -8, duration: 0.12 })
			.to(p.head, { rotation: 8, duration: 0.16, ease: 'sine.inOut', yoyo: true, repeat: 4 })
			.to(p.head, { rotation: 0, duration: 0.2 });
	}

	const actions: Record<string, () => gsap.core.Timeline> = { swing, wave, munch, shake };

	return {
		entrance() {
			if (opts.reducedMotion()) {
				gsap.set(p.animal, { opacity: 0 });
				return run(gsap.timeline().to(p.animal, { opacity: 1, duration: 0.6 }));
			}
			// Swings in from the right along the branch and settles.
			gsap.set(p.animal, { x: 320, rotation: -20 });
			return run(
				gsap
					.timeline()
					.to(p.animal, { x: 0, duration: 1.2, ease: 'power2.out' })
					.to(p.animal, { rotation: 14, duration: 0.6, ease: 'sine.out' }, 0)
					.to(p.animal, { rotation: 0, duration: 1, ease: 'elastic.out(1, 0.4)' }, 0.6)
			);
		},
		exit() {
			if (opts.reducedMotion()) {
				return run(gsap.timeline().to(p.animal, { opacity: 0, duration: 0.4 }));
			}
			return run(
				gsap
					.timeline()
					.to(p.animal, { rotation: 18, duration: 0.35, ease: 'sine.out' })
					.to(p.animal, { x: -380, rotation: -10, duration: 0.8, ease: 'power2.in' })
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
			if (core.asleep) {
				gsap.to(p.head, { rotation: 10, duration: 0.15, yoyo: true, repeat: 1 });
				return;
			}
			// A head tilt and a happy little kick.
			gsap.timeline()
				.to(p.head, { rotation: 10, duration: 0.15 })
				.to(legs, { rotation: (i) => (i ? -18 : 18), duration: 0.15 }, '<')
				.to([p.head, ...legs], { rotation: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
		},
		calm: core.calm,
		sleep(on) {
			core.asleep = on;
			gsap.to(p.lid, { scaleY: on ? 1 : 0, duration: 0.5 });
			gsap.to(p.head, { rotation: on ? 14 : 0, duration: 0.8, ease: 'sine.inOut' });
		},
		dilate() {},
		refreshMotion: core.retime,
		destroy() {
			core.destroy();
			gsap.killTweensOf(Object.values(p));
		}
	};
}
