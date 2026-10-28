import { gsap } from 'gsap';
import type { RigOptions } from './types';

interface IdleMotion {
	/** Starts the loops that never stop while the puppet rests (breathing, a swaying tail). */
	loops: () => gsap.core.Animation[];
	/** Eases the parts the loops move back to rest when an action takes over. */
	settle: () => void;
	/** One blink, now and then while awake (and anything else that happens with it). */
	blink: () => void;
}

/**
 * What every rig shares: idle loops that never stop while the puppet rests,
 * a blink every few seconds, slower breathing asleep or with reduced motion,
 * and one action at a time, after which the idle picks up again.
 */
export function rigCore(opts: RigOptions, idle: IdleMotion) {
	let loops: gsap.core.Animation[] = [];
	let blinkTimer: gsap.core.Tween | null = null;
	let action: gsap.core.Timeline | null = null;
	let asleep = false;

	const pace = () => (opts.reducedMotion() ? 0.5 : 1) * (asleep ? 0.6 : 1);
	const retime = () => loops.forEach((loop) => loop.timeScale(pace()));

	function scheduleBlink() {
		blinkTimer = gsap.delayedCall(gsap.utils.random(2, 5), () => {
			if (!asleep && !action) idle.blink();
			scheduleBlink();
		});
	}

	function startIdle() {
		stopIdle();
		loops = idle.loops();
		retime();
		scheduleBlink();
	}

	function stopIdle() {
		for (const loop of loops) loop.kill();
		loops = [];
		blinkTimer?.kill();
		blinkTimer = null;
		idle.settle();
	}

	return {
		/** Plays an action: stops the idle, finishes any action still running, idles again after. */
		run(tl: gsap.core.Timeline): Promise<void> {
			action?.progress(1).kill();
			stopIdle();
			action = tl;
			return new Promise((resolve) => {
				tl.eventCallback('onComplete', () => {
					if (action === tl) action = null;
					startIdle();
					resolve();
				});
			});
		},
		get busy() {
			return action !== null;
		},
		get asleep() {
			return asleep;
		},
		set asleep(on: boolean) {
			asleep = on;
			retime();
		},
		/** Speeds up a running action so it settles quickly. */
		calm() {
			action?.timeScale(3);
		},
		retime,
		destroy() {
			stopIdle();
			action?.kill();
		}
	};
}
