<script lang="ts">
	import { onMount } from 'svelte';

	import * as THREE from 'three';
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
	import { fetchLocations } from '$lib/fetchLocations';

	let locations = [];

	let renderer;
	let scene;
	let camera;
	let controls;
	let globeGeometry;
	let globeMaterial;
	let globe;
	let directionalLight;
	let ambientLight;
	let raycaster = new THREE.Raycaster();
	let mouse = new THREE.Vector2(1000, 1000);
	let mouseScreenPosition = { x: 0, y: 0 };
	let popupStyles = '';
	let popupInfo = {
		name: '',
		iata: '',
		status: '',
		statusColor: ''
	};

	const init = () => {
		// Create the Three.js Renderer.
		renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true
		});
		renderer.setSize(600, 600);

		// Create the scene.
		scene = new THREE.Scene();

		// Create the sphere.
		globeGeometry = new THREE.SphereGeometry(50, 64, 32);
		globeMaterial = new THREE.MeshStandardMaterial({
			map: new THREE.TextureLoader().load('/worldMap.png'),
			color: 0x0d1533,
			metalness: 0,
			roughness: 0.9
		});
		globe = new THREE.Mesh(globeGeometry, globeMaterial);
		globe.geometry.rotateY(-Math.PI * 0.5);
		scene.add(globe);

		// Create a camera.
		camera = new THREE.PerspectiveCamera(75, 1, 0.1, 500);
		camera.position.z = 100;
		scene.add(camera);

		// Attach orbit controls.
		controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.dampingFactor = 0.25;
		controls.zoomSpeed = 0.4;
		controls.minDistance = 60;
		controls.maxDistance = 120;

		// Create a directional light.
		directionalLight = new THREE.DirectionalLight(0xffffff, 1);
		directionalLight.position.set(200, 0, 0);
		scene.add(directionalLight);

		// Create an ambient light.
		ambientLight = new THREE.AmbientLight(0xffffff, 2);
		scene.add(ambientLight);

		// Append the renderer to the sphere-div.
		document.getElementById('three-div').appendChild(renderer.domElement);
	};
	const addLocations = async () => {
		const earthRadius = 50;

		locations = await fetchLocations();

		// Loop through the colos.
		for (const colo of locations) {
			// Create a new Three.js Spherical.
			const spherical = new THREE.Spherical(
				earthRadius,
				THREE.Math.degToRad(90 - colo.lat),
				THREE.Math.degToRad(colo.lon)
			);

			// Create a new SphereGeometry.
			const sphereGeometry = new THREE.SphereGeometry(0.8, 32, 32);

			// Set the material based on the status.
			const material = new THREE.MeshBasicMaterial({
				color:
					colo.status === 'operational'
						? '#37A34A'
						: colo.status === 'partial_outage'
						? '#FFCA28'
						: '#FF4500'
			});

			// Create the sphere.
			const sphere = new THREE.Mesh(sphereGeometry, material);
			sphere.userData = {
				iata: colo.iata
			};
			sphere.position.setFromSpherical(spherical);

			// Add it to the scene.
			scene.add(sphere);
		}
	};
	const onMouseMove = (event: MouseEvent) => {
		event.preventDefault();
		mouse.x =
			((event.clientX - renderer.domElement.offsetLeft) / renderer.domElement.width) * 2 - 1;
		mouse.y =
			-((event.clientY - renderer.domElement.offsetTop) / renderer.domElement.height) * 2 + 1;
		mouseScreenPosition.x = event.clientX;
		mouseScreenPosition.y = event.clientY;
	};
	const loop = () => {
		requestAnimationFrame(loop);
		controls.update();
		camera.updateMatrixWorld();

		raycaster.setFromCamera(mouse, camera);
		var intersects = raycaster.intersectObjects(scene.children, false);

		if (intersects.length > 0) {
			// Check if the object has a userData.
			if ('iata' in intersects[0].object.userData) {
				// Find the colo with this ID.
				const colo = locations.find((c) => c.iata === intersects[0].object.userData.iata);

				// Set the popup info.
				popupInfo = {
					name: colo.city,
					iata: colo.iata,
					status: colo.status.toUpperCase().replace('_', ' '),
					statusColor:
						colo.status === 'operational'
							? '#37A34A'
							: colo.status === 'partial_outage'
							? '#FFCA28'
							: '#FF4500'
				};

				// Set the popup to the mouse position.
				popupStyles = `top: ${mouseScreenPosition.y - 20}px; left: ${
					mouseScreenPosition.x + 20
				}px; opacity: 1;`;
			} else {
				popupStyles = '';
			}
		} else {
			popupStyles = '';
		}

		renderer.render(scene, camera);
	};
	onMount(async () => {
		init();
		await addLocations();
		loop();
	});
</script>

<svelte:window on:mousemove={onMouseMove} />

<div
	id="mouse-popup"
	class="absolute px-4 py-2 opacity-0 bg-white rounded-lg shadow-lg p-2 flex flex-col justify-center items-start"
	style={popupStyles}
>
	<span class="font-bold">{popupInfo.name}</span>
	<span class="font-light text-sm mb-2">{popupInfo.iata}</span>
	<span class="font-bold text-sm" style={`color: ${popupInfo.statusColor}`}>{popupInfo.status}</span
	>
</div>
<h1 class="text-4xl text-center font-bold mt-8">Cloudflare Status Globe</h1>
<div class="flex justify-center items-center">
	<div style="height: 600px; width: 600px;" id="three-div" />
</div>
