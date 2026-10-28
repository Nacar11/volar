<script lang="ts">
	// Everything inside the <Canvas>: the cartoon earth, puffy clouds, a soft
	// glow, stars, and orbit controls that kids drag, pinch and let spin.
	import { T, useLoader, useTask, useThrelte } from '@threlte/core';
	import { OrbitControls, Stars } from '@threlte/extras';
	import {
		AdditiveBlending,
		BackSide,
		DataTexture,
		NearestFilter,
		RedFormat,
		SRGBColorSpace,
		TextureLoader,
		Vector3,
		type Group,
		type PerspectiveCamera
	} from 'three';
	import type { OrbitControls as ThreeOrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
	import { motion } from '#lib/settings.svelte.ts';
	import { latLngToVector, markerOpacity, seeded, type Vec3 } from './geo';

	interface Props {
		/** Where the camera starts and where Home returns it. */
		home: Vec3;
		texture: string;
		oncontrols: (controls: ThreeOrbitControls, camera: PerspectiveCamera) => void;
		/** Reports whether the globe is auto-spinning. */
		onspin: (spinning: boolean) => void;
		/** Points on the globe whose screen position is reported every frame. */
		markers: { id: string; at: Vec3 }[];
		/** Where a marker lands on screen (CSS px), how visible it is, and how squarely it faces the camera. */
		onplace: (id: string, x: number, y: number, opacity: number, facing: number) => void;
	}

	let { home, texture, oncontrols, onspin, markers, onplace }: Props = $props();

	const IDLE_MS = 6000;
	const FOV = 40;

	// The field of view is vertical, so on a portrait phone it is widened
	// until the globe fits across the screen as it does on a tablet.
	const { size } = useThrelte();
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

	const autoRotate = $derived(spinning && !motion.reduced);

	$effect(() => onspin(autoRotate));

	$effect(() => () => clearTimeout(idleTimer));

	useTask((delta) => {
		if (cloudLayer && !motion.reduced) cloudLayer.rotation.y += delta * 0.01;
	});

	const point = new Vector3();
	useTask(() => {
		if (!camera) return;
		const distance = camera.position.length();
		const { width, height } = size.current;
		for (const marker of markers) {
			point.set(...marker.at);
			const facing = point.dot(camera.position) / distance;
			point.project(camera);
			onplace(
				marker.id,
				((point.x + 1) / 2) * width,
				((1 - point.y) / 2) * height,
				markerOpacity(facing, distance),
				facing
			);
		}
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
		minDistance={2}
		maxDistance={5}
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

<Stars radius={60} depth={20} count={1500} factor={3} fade />

{#await map then earth}
	<T.Mesh>
		<T.SphereGeometry args={[1, 96, 64]} />
		<T.MeshToonMaterial map={earth} gradientMap={toonSteps} />
	</T.Mesh>
{/await}

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
	{#each clouds as cloud, i (i)}
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
