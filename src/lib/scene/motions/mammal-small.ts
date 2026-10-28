import { gsap } from 'gsap';
import { rigs } from '../rigs';
import { rigCore } from './core';
import { findParts, type Rig, type RigOptions } from './types';

// Pivot points in the puppet's 400×400 viewBox. Puppets on this rig sit with
// their feet on y≈332 and the neck near y≈232.
const PIVOTS = {
	animal: '200 332',
	body: '200 330',
	head: '200 232',
	face: '200 184',
	eyes: '200 168',
	tail: '212 304',
	'ear-l': '150 140',
	'ear-r': '250 140',
	'arm-l': '168 240',
	'arm-r': '232 240',
	'pupil-l': '166 170',
	'pupil-r': '234 170'
} as const;

export function mammalSmall(svg: SVGSVGElement, opts: RigOptions): Rig {
	const p = findParts(svg, rigs['mammal-small'].parts);
	const lids = [p['lid-l'], p['lid-r']];
	const ears = [p['ear-l'], p['ear-r']];
	const arms = [p['arm-l'], p['arm-r']];
	const pupils = [p['pupil-l'], p['pupil-r']];

	for (const [part, origin] of Object.entries(PIVOTS)) gsap.set(p[part], { svgOrigin: origin });
	gsap.set(lids, { scaleY: 0, transformOrigin: '50% 0%' });

	const core = rigCore(opts, {
		// Breathing and a swaying tail.
		loops: () => [
			gsap.to(p.body, {
				scaleY: 1.03,
				scaleX: 0.99,
				duration: 1.4,
				ease: 'sine.inOut',
				yoyo: true,
				repeat: -1
			}),
			gsap.to(p.tail, { rotation: 6, duration: 2.2, ease: 'sine.inOut', yoyo: true, repeat: -1 })
		],
		settle: () => gsap.to([p.body, p.tail], { scaleY: 1, scaleX: 1, rotation: 0, duration: 0.2 }),
		blink: () => {
			gsap.timeline()
				.to(lids, { scaleY: 1, duration: 0.08, ease: 'power1.in' })
				.to(lids, { scaleY: 0, duration: 0.12, ease: 'power1.out' });
			if (Math.random() < 0.4) {
				gsap.to(gsap.utils.random(ears), {
					rotation: gsap.utils.random([-8, 8]),
					duration: 0.1,
					yoyo: true,
					repeat: 1
				});
			}
		}
	});
	const run = core.run;

	function leap() {
		const height = opts.reducedMotion() ? 40 : 110;
		return gsap
			.timeline()
			.to(p.animal, { scaleY: 0.86, scaleX: 1.08, duration: 0.18, ease: 'power2.in' })
			.to(p.animal, { y: -height, scaleY: 1.08, scaleX: 0.94, duration: 0.38, ease: 'power2.out' })
			.to(arms, { rotation: (i) => (i ? -40 : 40), duration: 0.3 }, '<')
			.to(p.tail, { rotation: -25, duration: 0.38 }, '<')
			.to(p.animal, { y: 0, scaleY: 1, scaleX: 1, duration: 0.34, ease: 'power2.in' })
			.to(arms, { rotation: 0, duration: 0.34 }, '<')
			.to(p.tail, { rotation: 0, duration: 0.34 }, '<')
			.to(p.animal, { scaleY: 0.9, scaleX: 1.06, duration: 0.1 })
			.to(p.animal, { scaleY: 1, scaleX: 1, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
	}

	// A flat puppet can't spin in 3D, so the face slides off one side of the
	// head (clipped to its outline), the back of the head shows, and the face
	// comes round from the other side.
	function turnHead() {
		return gsap
			.timeline()
			.to(p.head, { rotation: -6, duration: 0.2 })
			.to(p.face, { x: 80, scaleX: 0.3, duration: 0.4, ease: 'power2.in' })
			.to(ears, { x: 18, duration: 0.4 }, '<')
			.to({}, { duration: 0.6 })
			.set(p.face, { x: -80 })
			.set(ears, { x: -18 })
			.to(p.face, { x: 0, scaleX: 1, duration: 0.45, ease: 'power2.out' })
			.to(ears, { x: 0, duration: 0.45 }, '<')
			.to(p.head, { rotation: 0, duration: 0.4, ease: 'back.out(2)' }, '<');
	}

	const actions: Record<string, () => gsap.core.Timeline> = { leap, turnHead };

	return {
		entrance() {
			if (opts.reducedMotion()) {
				gsap.set(p.animal, { opacity: 0 });
				return run(gsap.timeline().to(p.animal, { opacity: 1, duration: 0.6 }));
			}
			// One set() then to() tweens: stacked from() tweens on one SVG
			// element corrupt GSAP's svgOrigin and leave the puppet offset.
			gsap.set(p.animal, { x: 260, y: -260, rotation: 25 });
			return run(
				gsap
					.timeline()
					.to(p.animal, { x: 0, duration: 0.8, ease: 'power2.out' })
					.to(p.animal, { y: 0, duration: 0.8, ease: 'bounce.out' }, 0)
					.to(p.animal, { rotation: 0, duration: 0.6, ease: 'back.out(2)' }, 0)
			);
		},
		exit() {
			if (opts.reducedMotion()) {
				return run(gsap.timeline().to(p.animal, { opacity: 0, duration: 0.4 }));
			}
			return run(
				gsap
					.timeline()
					.to(p.animal, { scaleY: 0.86, scaleX: 1.08, duration: 0.15 })
					.to(p.animal, { x: -420, scaleY: 1, scaleX: 1, duration: 0.6, ease: 'power2.in' })
					.to(p.animal, { y: -180, duration: 0.3, ease: 'power2.out', yoyo: true, repeat: 1 }, '<')
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
				gsap.to(p.head, { rotation: 14, duration: 0.15, yoyo: true, repeat: 1 });
				return;
			}
			gsap.timeline()
				.to(p.eyes, { scale: 1.12, duration: 0.12 })
				.to(p.animal, { y: -24, duration: 0.15, ease: 'power2.out' }, '<')
				.to(ears, { rotation: (i) => (i ? 12 : -12), duration: 0.12 }, '<')
				.to(p.animal, { y: 0, duration: 0.35, ease: 'bounce.out' })
				.to(p.eyes, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)' }, '<')
				.to(ears, { rotation: 0, duration: 0.4 }, '<');
		},
		calm: core.calm,
		sleep(on) {
			core.asleep = on;
			gsap.to(lids, { scaleY: on ? 1 : 0, duration: 0.5 });
			gsap.to(p.head, { rotation: on ? 10 : 0, y: on ? 10 : 0, duration: 0.8, ease: 'sine.inOut' });
		},
		dilate(on) {
			gsap.to(pupils, { scale: on ? 1.35 : 1, duration: 0.6, ease: 'sine.inOut' });
		},
		refreshMotion: core.retime,
		destroy() {
			core.destroy();
			gsap.killTweensOf(Object.values(p));
		}
	};
}
