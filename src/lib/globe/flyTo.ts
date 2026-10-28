import { gsap } from 'gsap';
import { Quaternion, Vector3, type PerspectiveCamera } from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Vec3 } from './geo';

/** Camera distances from the globe's centre (the globe's radius is 1). */
export const DISTANCE = { home: 3.6, min: 2, max: 5, visit: 1.45 } as const;

/**
 * Swings the camera along a great circle to look straight down at `target`
 * from `distance`, zooming as it goes. Resolves when the camera arrives.
 */
export function flyTo(
	camera: PerspectiveCamera,
	controls: OrbitControls,
	target: Vec3,
	distance: number,
	duration: number
): Promise<void> {
	const from = camera.position.clone();
	const startDistance = from.length();
	from.normalize();
	const turn = new Quaternion().setFromUnitVectors(from, new Vector3(...target).normalize());
	const step = new Quaternion();
	const progress = { t: 0 };
	return new Promise((resolve) =>
		gsap.to(progress, {
			t: 1,
			duration,
			ease: 'power2.inOut',
			onUpdate: () => {
				step.identity().slerp(turn, progress.t);
				camera.position
					.copy(from)
					.applyQuaternion(step)
					.multiplyScalar(gsap.utils.interpolate(startDistance, distance, progress.t));
				controls.update();
			},
			onComplete: resolve
		})
	);
}
