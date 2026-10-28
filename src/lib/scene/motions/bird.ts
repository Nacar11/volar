import { gsap } from 'gsap';
import { rigs } from '../rigs';
import { rigCore } from './core';
import { findParts, type Rig, type RigOptions } from './types';

// Pivot points in the puppet's 400×400 viewBox. Birds on this rig perch side-on,
// facing right, with their feet on y≈304, the shoulder near (226, 156) and the
// lower beak hinged at (274, 120).
const PIVOTS = {
	animal: '216 304',
	body: '216 290',
	head: '240 150',
	tail: '194 248',
	wing: '226 156',
	'beak-bottom': '274 120',
	eye: '263 103'
} as const;

export function bird(svg: SVGSVGElement, opts: RigOptions): Rig {
	const p = findParts(svg, rigs.bird.parts);

	for (const [part, origin] of Object.entries(PIVOTS)) gsap.set(p[part], { svgOrigin: origin });
	gsap.set(p.lid, { scaleY: 0, transformOrigin: '50% 0%' });

	const core = rigCore(opts, {
		// Breathing and a slowly swaying tail.
		loops: () => [
			gsap.to(p.body, { scaleY: 1.02, duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: -1 }),
			gsap.to(p.tail, { rotation: 3, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 })
		],
		settle: () => gsap.to([p.body, p.tail], { scaleY: 1, rotation: 0, duration: 0.2 }),
		blink: () => {
			gsap.timeline()
				.to(p.lid, { scaleY: 1, duration: 0.07, ease: 'power1.in' })
				.to(p.lid, { scaleY: 0, duration: 0.1, ease: 'power1.out' });
			// Parrots tilt their heads to look at you.
			if (Math.random() < 0.4) {
				gsap.to(p.head, {
					rotation: gsap.utils.random([-10, 10]),
					duration: 0.25,
					yoyo: true,
					repeat: 1,
					repeatDelay: 0.6,
					ease: 'power2.out'
				});
			}
		}
	});
	const run = core.run;

	/** Wing beats while the timeline it's added to plays. Positive rotation lifts
	 *  the wing up over the back (the bird faces right; SVG turns clockwise). */
	const beats = (count: number, lift = 115) =>
		gsap.to(p.wing, {
			rotation: opts.reducedMotion() ? lift / 2 : lift,
			duration: 0.16,
			ease: 'sine.inOut',
			yoyo: true,
			repeat: count * 2 - 1
		});

	function flap() {
		const rise = opts.reducedMotion() ? -10 : -36;
		return gsap
			.timeline()
			.to(p.animal, { y: rise, duration: 0.4, ease: 'power2.out' })
			.add(beats(4), 0)
			.to(p.tail, { rotation: -10, duration: 0.32, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 0)
			.to(p.animal, { y: 0, duration: 0.45, ease: 'bounce.out' }, 0.95);
	}

	// Macaws bob their heads and sway when they're excited.
	function dance() {
		return gsap
			.timeline()
			.to(p.head, { y: 12, rotation: -8, duration: 0.16, ease: 'power1.inOut', yoyo: true, repeat: 7 })
			.to(p.animal, { rotation: 4, duration: 0.32, ease: 'sine.inOut', yoyo: true, repeat: 3 }, 0)
			.to(p.wing, { rotation: -20, duration: 0.32, ease: 'sine.inOut', yoyo: true, repeat: 3 }, 0)
			.to([p.head, p.animal, p.wing], { rotation: 0, y: 0, duration: 0.2 });
	}

	// Two squawks with the beak wide open, timed to the "squawk" clip.
	function squawk() {
		const open = (at: number, hold: number) => (tl: gsap.core.Timeline) =>
			tl
				.to(p['beak-bottom'], { rotation: 28, duration: 0.07, ease: 'power2.out' }, at)
				.to(p.head, { rotation: -10, duration: 0.07 }, at)
				.to(p.body, { scale: 1.04, duration: 0.07 }, at)
				.to(p['beak-bottom'], { rotation: 0, duration: 0.1, ease: 'power2.in' }, at + hold)
				.to(p.head, { rotation: 0, duration: 0.12 }, at + hold)
				.to(p.body, { scale: 1, duration: 0.12 }, at + hold);
		const tl = gsap.timeline();
		open(0, 0.42)(tl);
		open(0.86, 0.4)(tl);
		return tl;
	}

	const actions: Record<string, () => gsap.core.Timeline> = { flap, dance, squawk };

	return {
		entrance() {
			if (opts.reducedMotion()) {
				gsap.set(p.animal, { opacity: 0 });
				return run(gsap.timeline().to(p.animal, { opacity: 1, duration: 0.6 }));
			}
			// Flies in from the upper right and lands on the perch.
			gsap.set(p.animal, { x: 300, y: -280, rotation: -15 });
			return run(
				gsap
					.timeline()
					.to(p.animal, { x: 0, y: 0, rotation: 0, duration: 1, ease: 'power2.out' })
					.add(beats(3), 0)
					.to(p.animal, { scaleY: 0.92, duration: 0.1 })
					.to(p.animal, { scaleY: 1, duration: 0.4, ease: 'elastic.out(1, 0.4)' })
			);
		},
		exit() {
			if (opts.reducedMotion()) {
				return run(gsap.timeline().to(p.animal, { opacity: 0, duration: 0.4 }));
			}
			return run(
				gsap
					.timeline()
					.to(p.animal, { x: -420, y: -300, rotation: -12, duration: 0.7, ease: 'power2.in' })
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
			if (core.asleep) {
				gsap.to(p.head, { rotation: 30, duration: 0.15, yoyo: true, repeat: 1 });
				return;
			}
			// Feathers puff up, the head cocks, a little hop.
			gsap.timeline()
				.to(p.body, { scale: 1.08, duration: 0.12 })
				.to(p.head, { rotation: 12, duration: 0.12 }, '<')
				.to(p.animal, { y: -18, duration: 0.14, ease: 'power2.out' }, '<')
				.to(p.animal, { y: 0, duration: 0.35, ease: 'bounce.out' })
				.to(p.body, { scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.5)' }, '<')
				.to(p.head, { rotation: 0, duration: 0.4 }, '<');
		},
		calm: core.calm,
		sleep(on) {
			core.asleep = on;
			gsap.to(p.lid, { scaleY: on ? 1 : 0, duration: 0.5 });
			// Head tucked down against the chest.
			gsap.to(p.head, { rotation: on ? 24 : 0, y: on ? 10 : 0, duration: 0.8, ease: 'sine.inOut' });
		},
		// A bird's eyes don't change by night.
		dilate() {},
		refreshMotion: core.retime,
		destroy() {
			core.destroy();
			gsap.killTweensOf(Object.values(p));
		}
	};
}
