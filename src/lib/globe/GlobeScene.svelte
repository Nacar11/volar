<script lang="ts">
	// Everything inside the <Canvas>: the cartoon earth, puffy clouds, a soft
	// glow, stars, and orbit controls that kids drag, pinch and let spin.
	import { T, useLoader, useTask, useThrelte } from '@threlte/core';
	import { OrbitControls, Stars } from '@threlte/extras';
	import { gsap } from 'gsap';
	import {
		AdditiveBlending,
		BackSide,
		BufferAttribute,
		DoubleSide,
		DataTexture,
		NearestFilter,
		RedFormat,
		SRGBColorSpace,
		TextureLoader,
		Vector3,
		type BufferGeometry,
		type NormalOrGLBufferAttributes,
		type Group,
		type MeshBasicMaterial,
		type PerspectiveCamera
	} from 'three';
	import type { OrbitControls as ThreeOrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
	import { motion } from '#lib/settings.svelte.ts';
	import { DISTANCE } from './flyTo';
	import { latLngToVector, markerOpacity, seeded, type Placement, type Vec3 } from './geo';

	interface Props {
		/** Where the camera starts and where Home returns it. */
		home: Vec3;
		texture: string;
		oncontrols: (controls: ThreeOrbitControls, camera: PerspectiveCamera) => void;
		/** Reports whether the globe is auto-spinning. */
		onspin: (spinning: boolean) => void;
		/** Points on the globe whose screen position is reported every frame. */
		markers: { id: string; at: Vec3 }[];
		/** Every marker's place this frame (same order as `markers`), and the globe's radius on screen in px. */
		onplace: (placements: Placement[], globeRadius: number) => void;
		/** Stops the frame loop entirely: nothing renders or runs while a scene is open. */
		paused: boolean;
		/** Holds the auto-spin off, e.g. while the camera flies to an animal. */
		still: boolean;
		/** Called once per rendered frame with its duration in seconds. */
		onframe: (dt: number) => void;
		/** Share of the cloud puffs to draw, 0–1. */
		cloudShare: number;
		stars: number;
		/** Habitat overlays: fill and outline triangles on the globe (see habitat.ts). */
		habitats: { id: string; color: string; fill: Float32Array; outline: Float32Array }[];
		/** The habitat to pulse, if any. */
		pulse: string | null;
	}

	let {
		home,
		texture,
		oncontrols,
		onspin,
		markers,
		onplace,
		paused,
		still,
		onframe,
		habitats,
		pulse,
		cloudShare,
		stars
	}: Props = $props();

	// Habitats glow softly at rest and pulse brighter when their animal is hovered or tapped.
	const GLOW = { fill: { rest: 0.45, peak: 0.9 }, outline: { rest: 0.6, peak: 1 } };
	const glows: Record<string, { fill: MeshBasicMaterial; outline: MeshBasicMaterial }> = {};

	$effect(() => {
		const active = pulse;
		for (const [id, materials] of Object.entries(glows)) {
			for (const part of ['fill', 'outline'] as const) {
				const material = materials[part];
				const { rest, peak } = GLOW[part];
				gsap.killTweensOf(material);
				if (id !== active) {
					gsap.to(material, { opacity: rest, duration: 0.4 });
				} else if (motion.reduced) {
					material.opacity = peak;
				} else {
					gsap.fromTo(
						material,
						{ opacity: rest },
						{ opacity: peak, duration: 0.5, ease: 'sine.inOut', yoyo: true, repeat: -1 }
					);
				}
			}
		}
	});

	function fillHabitat(geometry: BufferGeometry<NormalOrGLBufferAttributes>, positions: Float32Array) {
		geometry.setAttribute('position', new BufferAttribute(positions, 3));
		geometry.computeBoundingSphere();
	}

	const IDLE_MS = 6000;
	const FOV = 40;

	// The field of view is vertical, so on a portrait phone it is widened
	// until the globe fits across the screen as it does on a tablet.
	const { size, renderer, scheduler } = useThrelte();

	// Threlte runs everything from the renderer's animation loop. Clearing the
	// loop stops rendering and every task; restoring it puts back Threlte's own
	// loop body (with renderMode "always" there's no frame invalidation to reset).
	$effect(() => {
		renderer.setAnimationLoop(paused ? null : (time) => scheduler.run(time));
	});
	const fov = $derived.by(() => {
		const aspect = $size.width / $size.height;
		if (!aspect || aspect >= 1) return FOV;
		const half = (FOV / 2) * (Math.PI / 180);
		return (2 * Math.atan(Math.tan(half) / aspect) * 180) / Math.PI;
	});
	const loader = useLoader(TextureLoader);
	const map = $derived(
		loader.load(texture, {
			transform: (t) => {
				t.colorSpace = SRGBColorSpace;
				t.anisotropy = 4;
				return t;
			}
		})
	);

	// Two light bands: a gentle cartoon shade, so the texture keeps its colours.
	const toonSteps = new DataTexture(new Uint8Array([128, 255]), 2, 1, RedFormat);
	toonSteps.minFilter = toonSteps.magFilter = NearestFilter;
	toonSteps.needsUpdate = true;

	// A soft blue halo around the rim: the back faces of a slightly larger
	// sphere, brightest where they turn edge-on to the camera.
	const atmosphere = {
		vertexShader: `
			varying vec3 vNormal;
			void main() {
				vNormal = normalize(normalMatrix * normal);
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			}`,
		fragmentShader: `
			varying vec3 vNormal;
			void main() {
				float glow = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0);
				gl_FragColor = vec4(0.6, 0.86, 1.0, 1.0) * glow;
			}`
	};

	// Clouds spread evenly over the sphere (a Fibonacci spiral), jittered so
	// they don't look gridded, and kept off the ice caps.
	const random = seeded(2026);
	const CLOUD_SLOTS = 34;
	const spiral = Array.from({ length: CLOUD_SLOTS }, (_, i) => ({
		lat: (Math.asin(1 - (2 * (i + 0.5)) / CLOUD_SLOTS) * 180) / Math.PI,
		lng: ((i * 137.508) % 360) - 180
	})).filter((p) => p.lat > -60 && p.lat < 65);
	const clouds = spiral.map((p) => ({
		at: latLngToVector(p.lat + random() * 8 - 4, p.lng + random() * 16 - 8, 1.07),
		puffs: Array.from({ length: 3 }, (_, i) => ({
			x: (i - 1) * 0.06 + random() * 0.02,
			y: random() * 0.02,
			r: 0.04 + random() * 0.03
		}))
	}));

	// At low quality every other cloud is drawn.
	const shownClouds = $derived(clouds.filter((_, i) => i % Math.round(1 / cloudShare) === 0));

	let camera = $state.raw<PerspectiveCamera>();
	let controls = $state.raw<ThreeOrbitControls>();
	let cloudLayer = $state.raw<Group>();
	let spinning = $state(true);
	let idleTimer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		if (camera && controls) oncontrols(controls, camera);
	});

	$effect(() => {
		void fov;
		camera?.updateProjectionMatrix();
	});

	const autoRotate = $derived(spinning && !still && !motion.reduced);

	$effect(() => onspin(autoRotate));

	$effect(() => () => clearTimeout(idleTimer));

	useTask((delta) => {
		if (cloudLayer && !motion.reduced) cloudLayer.rotation.y += delta * 0.01;
		onframe(delta);
	});

	const point = new Vector3();
	const placements: Placement[] = [];
	useTask(() => {
		if (!camera) return;
		const distance = camera.position.length();
		const { width, height } = size.current;
		markers.forEach((marker, i) => {
			point.set(...marker.at);
			const facing = point.dot(camera!.position) / distance;
			point.project(camera!);
			placements[i] = {
				id: marker.id,
				x: ((point.x + 1) / 2) * width,
				y: ((1 - point.y) / 2) * height,
				opacity: markerOpacity(facing, distance),
				facing
			};
		});
		placements.length = markers.length;
		// The unit sphere's silhouette radius on screen, seen from `distance`.
		const halfFov = (camera.fov * Math.PI) / 360;
		const globeRadius = height / 2 / Math.tan(halfFov) / Math.sqrt(distance * distance - 1);
		onplace(placements, globeRadius);
	});

	function grabbed() {
		spinning = false;
		clearTimeout(idleTimer);
	}

	function released() {
		clearTimeout(idleTimer);
		idleTimer = setTimeout(() => (spinning = true), IDLE_MS);
	}
</script>

<T.PerspectiveCamera makeDefault position={home} {fov} bind:ref={camera}>
	<OrbitControls
		bind:ref={controls}
		enablePan={false}
		enableDamping
		dampingFactor={0.08}
		rotateSpeed={0.5}
		minDistance={DISTANCE.min}
		maxDistance={DISTANCE.max}
		minPolarAngle={Math.PI * 0.2}
		maxPolarAngle={Math.PI * 0.8}
		{autoRotate}
		autoRotateSpeed={0.6}
		onstart={grabbed}
		onend={released}
	/>
	<!-- The light rides with the camera: the face a kid looks at is always lit
	     from the upper left, and the shade band sits at the far rim. -->
	<T.DirectionalLight position={[-1, 1, 0]} intensity={0.3 * Math.PI} />
</T.PerspectiveCamera>

<!-- three.js divides diffuse light by π, so these are in units of "full
     brightness × π". Lit land comes out ~1.15× the texture, shaded land ~1×. -->
<T.AmbientLight intensity={0.85 * Math.PI} />

{#key stars}
	<Stars radius={60} depth={20} count={stars} factor={3} fade />
{/key}

{#await map then earth}
	<T.Mesh>
		<T.SphereGeometry args={[1, 96, 64]} />
		<T.MeshToonMaterial map={earth} gradientMap={toonSteps} />
	</T.Mesh>
{/await}

{#each habitats as habitat (habitat.id)}
	{@const materials = (glows[habitat.id] ??= {} as (typeof glows)[string])}
	<!-- The theme colour, edged in white so it reads on green land and blue sea alike. -->
	<T.Mesh renderOrder={1}>
		<T.BufferGeometry oncreate={(g) => fillHabitat(g, habitat.fill)} />
		<T.MeshBasicMaterial
			bind:ref={materials.fill}
			color={habitat.color}
			transparent
			opacity={GLOW.fill.rest}
			depthWrite={false}
			side={DoubleSide}
		/>
	</T.Mesh>
	<T.Mesh renderOrder={2}>
		<T.BufferGeometry oncreate={(g) => fillHabitat(g, habitat.outline)} />
		<T.MeshBasicMaterial
			bind:ref={materials.outline}
			color="#ffffff"
			transparent
			opacity={GLOW.outline.rest}
			depthWrite={false}
			side={DoubleSide}
		/>
	</T.Mesh>
{/each}

<T.Mesh scale={1.15}>
	<T.SphereGeometry args={[1, 64, 32]} />
	<T.ShaderMaterial
		{...atmosphere}
		side={BackSide}
		blending={AdditiveBlending}
		transparent
		depthWrite={false}
	/>
</T.Mesh>

<T.Group bind:ref={cloudLayer}>
	{#each shownClouds as cloud (cloud)}
		<T.Group position={cloud.at} oncreate={(g) => g.lookAt(0, 0, 0)}>
			{#each cloud.puffs as puff, j (j)}
				<T.Mesh position={[puff.x, puff.y, 0]} scale={[1, 1, 0.7]}>
					<T.SphereGeometry args={[puff.r, 16, 12]} />
					<T.MeshToonMaterial color="#ffffff" gradientMap={toonSteps} />
				</T.Mesh>
			{/each}
		</T.Group>
	{/each}
</T.Group>
