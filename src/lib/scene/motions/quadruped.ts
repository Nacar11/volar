import { gsap } from 'gsap';
import { rigs } from '../rigs';
import { rigCore } from './core';
import { findParts, type Rig, type RigOptions } from './types';

// Pivot points in the puppet's 400×400 viewBox. Animals on this rig stand
// side-on facing right with their paws on y≈330: hips near x 125–150, shoulders
// near x 265–285, the neck at (290, 230) and the lower jaw hinged at (324, 214).
const PIVOTS = {
	animal: '205 330',
	body: '192 290',
	head: '290 230',
	tail: '96 222',
	'leg-bl': '125 240',
	'leg-br': '148 244',
	'leg-fl': '264 244',
	'leg-fr': '285 248',
	jaw: '324 214',
	eye: '327 179'
} as const;

/** The middle of the body, for rolls. */
const ROLL_PIVOT = '205 255';

export function quadruped(svg: SVGSVGElement, opts: RigOptions): Rig {
	const p = findParts(svg, rigs.quadruped.parts);
	const legs = [p['leg-fl'], p['leg-fr'], p['leg-bl'], p['leg-br']];

	for (const [part, origin] of Object.entries(PIVOTS)) gsap.set(p[part], { svgOrigin: origin });
	gsap.set(p.lid, { scaleY: 0, transformOrigin: '50% 0%' });

	const core = rigCore(opts, {
		// Breathing and a lazily swinging tail.
		loops: () => [
			gsap.to(p.body, { scaleY: 1.025, duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1 }),
			gsap.to(p.tail, { rotation: 10, duration: 2.4, ease: 'sine.inOut', yoyo: true, repeat: -1 })
		],
		settle: () => gsap.to([p.body, p.tail], { scaleY: 1, rotation: 0, duration: 0.2 }),
		blink: () => {
			gsap.timeline()
				.to(p.lid, { scaleY: 1, duration: 0.08, ease: 'power1.in' })
				.to(p.lid, { scaleY: 0, duration: 0.12, ease: 'power1.out' });
			// Now and then a look around.
			if (Math.random() < 0.35) {
				gsap.to(p.head, { rotation: gsap.utils.random([-6, 5]), duration: 0.4, yoyo: true, repeat: 1, repeatDelay: 0.8 });
			}
		}
	});
	const run = core.run;

	/**
	 * A walk cycle on the spot: diagonal legs swing together (front-near with
	 * back-far, then the other pair), the body bobs once per step.
	 */
	const steps = (count: number, stepS = 0.32) => {
		const swing = opts.reducedMotion() ? 8 : 18;
		const tl = gsap.timeline();
		for (let i = 0; i < count; i++) {
			const sign = i % 2 ? -1 : 1;
			tl.to([p['leg-fr'], p['leg-bl']], { rotation: swing * sign, duration: stepS, ease: 'sine.inOut' }, i * stepS)
				.to([p['leg-fl'], p['leg-br']], { rotation: -swing * sign, duration: stepS, ease: 'sine.inOut' }, i * stepS)
				.to(p.animal, { y: -5, duration: stepS / 2, ease: 'sine.out', yoyo: true, repeat: 1 }, i * stepS)
				.to(p.head, { rotation: 2 * sign, duration: stepS, ease: 'sine.inOut' }, i * stepS);
		}
		return tl.to([...legs, p.head], { rotation: 0, duration: 0.2 });
	};

	// A big cat stretch: front paws forward and down, rump up, then a yawn.
	function stretch() {
		const lean = opts.reducedMotion() ? -3 : -8;
		return gsap
			.timeline()
			.to(p.animal, { rotation: lean, duration: 0.6, ease: 'power2.inOut' })
			.to([p['leg-fl'], p['leg-fr']], { rotation: -28, duration: 0.6, ease: 'power2.inOut' }, '<')
			.to(p.head, { rotation: 14, duration: 0.6, ease: 'power2.inOut' }, '<')
			.to(p.jaw, { rotation: 32, duration: 0.4, ease: 'power2.out' }, '+=0.15')
			.to(p.lid, { scaleY: 0.7, duration: 0.3 }, '<')
			.to(p.jaw, { rotation: 0, duration: 0.3, ease: 'power2.in' }, '+=0.5')
			.to(p.lid, { scaleY: 0, duration: 0.3 }, '<')
			.to([p.animal, p['leg-fl'], p['leg-fr'], p.head], { rotation: 0, duration: 0.6, ease: 'power2.inOut' });
	}

	// One big roar, timed to the "roar" clip (about 1.8 s): head up, jaw wide.
	function roar() {
		return gsap
			.timeline()
			.to(p.head, { rotation: -10, duration: 0.25, ease: 'power2.out' })
			.to(p.jaw, { rotation: 44, duration: 0.2, ease: 'power2.out' }, '<0.05')
			.to(p.body, { scaleY: 1.05, duration: 0.25 }, '<')
			.to(p.head, { rotation: -4, duration: 1.1, ease: 'sine.inOut' })
			.to(p.jaw, { rotation: 32, duration: 1.1, ease: 'sine.inOut' }, '<')
			.to(p.jaw, { rotation: 0, duration: 0.25, ease: 'power2.in' })
			.to([p.head, p.body], { rotation: 0, scaleY: 1, duration: 0.3 }, '<');
	}

	// Chewing: the jaw works up and down, the head nodding along.
	function munch() {
		return gsap
			.timeline()
			.to(p.jaw, { rotation: 16, duration: 0.14, ease: 'sine.inOut', yoyo: true, repeat: 9 })
			.to(p.head, { rotation: 4, duration: 0.28, ease: 'sine.inOut', yoyo: true, repeat: 4 }, 0)
			.to(p.head, { rotation: 0, duration: 0.2 });
	}

	// A polite "no thank you": the head turns away and shakes.
	function shake() {
		return gsap
			.timeline()
			.to(p.head, { rotation: -6, duration: 0.12 })
			.to(p.head, { rotation: 6, duration: 0.16, ease: 'sine.inOut', yoyo: true, repeat: 4 })
			.to(p.head, { rotation: 0, duration: 0.2 });
	}

	/**
	 * A forward roll. It turns about the middle of the body, not the paws, so
	 * the pivot moves there first, while the animal is at rest: changing an SVG
	 * pivot mid-turn makes GSAP shift the animal to compensate.
	 */
	const roll = (from: number, turns: number, duration: number) => {
		gsap.set(p.animal, { svgOrigin: ROLL_PIVOT });
		gsap.set(p.animal, { x: from, rotation: -360 * turns });
		return gsap
			.timeline()
			.to(p.animal, { x: 0, rotation: 0, duration, ease: 'power2.out' })
			.to(p.animal, { y: -24, duration: duration / (turns * 2), ease: 'sine.out', yoyo: true, repeat: turns * 2 - 1 }, 0)
			.set(p.animal, { svgOrigin: PIVOTS.animal });
	};

	const actions: Record<string, () => gsap.core.Timeline> = {
		walk: () => steps(6),
		// A sprint on the spot: quick, long strides and a forward lean.
		run: () =>
			gsap
				.timeline()
				.to(p.animal, { rotation: -3, duration: 0.2 })
				.add(steps(10, 0.15), 0)
				.to(p.animal, { rotation: 0, duration: 0.3 }),
		stretch,
		roar,
		munch,
		shake,
		tumble: () => roll(-60, 1, 0.9)
	};

	return {
		entrance() {
			if (opts.reducedMotion()) {
				gsap.set(p.animal, { opacity: 0 });
				return run(gsap.timeline().to(p.animal, { opacity: 1, duration: 0.6 }));
			}
			if (opts.entrance === 'tumble') return run(roll(-380, 2, 1.5));
			// Walks in from the left.
			gsap.set(p.animal, { x: -380 });
			return run(
				gsap.timeline().to(p.animal, { x: 0, duration: 1.6, ease: 'power1.out' }).add(steps(5), 0)
			);
		},
		exit() {
			if (opts.reducedMotion()) {
				return run(gsap.timeline().to(p.animal, { opacity: 0, duration: 0.4 }));
			}
			return run(
				gsap.timeline().to(p.animal, { x: 420, duration: 1.1, ease: 'power1.in' }).add(steps(3, 0.28), 0)
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
				gsap.to(p.tail, { rotation: 25, duration: 0.15, yoyo: true, repeat: 1 });
				return;
			}
			// Looks round at you and flicks its tail.
			gsap.timeline()
				.to(p.head, { rotation: -8, duration: 0.15, ease: 'power2.out' })
				.to(p.tail, { rotation: 30, duration: 0.15 }, '<')
				.to(p.animal, { y: -10, duration: 0.12, ease: 'power2.out' }, '<')
				.to(p.animal, { y: 0, duration: 0.3, ease: 'bounce.out' })
				.to([p.head, p.tail], { rotation: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' }, '<');
		},
		calm: core.calm,
		sleep(on) {
			core.asleep = on;
			gsap.to(p.lid, { scaleY: on ? 1 : 0, duration: 0.5 });
			// Head down on its paws, body low.
			gsap.to(p.head, { rotation: on ? 16 : 0, y: on ? 26 : 0, duration: 0.9, ease: 'sine.inOut' });
			gsap.to(p.body, { scaleY: on ? 0.94 : 1, duration: 0.9, ease: 'sine.inOut' });
		},
		dilate() {},
		refreshMotion: core.retime,
		destroy() {
			core.destroy();
			gsap.killTweensOf(Object.values(p));
		}
	};
}
