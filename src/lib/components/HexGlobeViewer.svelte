<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import * as THREE from "three";
    import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
    import { brand } from "$lib/brand.svelte";
    import City360PanoramaModal from "$lib/components/City360PanoramaModal.svelte";

    interface PlaceholderImage {
        title: string;
        url: string;
        tag: string;
    }

    interface CityPinData {
        id: string;
        name: string;
        country: string;
        lat: number;
        lon: number;
        description: string;
        placeholders: PlaceholderImage[];
    }

    interface ScreenPin {
        id: string;
        name: string;
        country: string;
        x: number;
        y: number;
        visible: boolean;
        cityData: CityPinData;
    }

    const CITIES: CityPinData[] = [
        {
            id: "cairo",
            name: "Cairo",
            country: "Egypt",
            lat: 30.0444,
            lon: 31.2357,
            description: "Experience Nile Spatial Tech & Giza Exhibition Pavilions.",
            placeholders: [
                {
                    title: "Giza Exhibition Hall",
                    url: "https://images.unsplash.com/photo-1572252821143-035a29f8f260?auto=format&fit=crop&w=600&q=80",
                    tag: "360° Main Stage"
                },
                {
                    title: "Nile Spatial Booth",
                    url: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=600&q=80",
                    tag: "Interactive Kiosk"
                },
                {
                    title: "Pyramids VR Panorama",
                    url: "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=600&q=80",
                    tag: "VIP Lounge"
                }
            ]
        },
        {
            id: "paris",
            name: "Paris",
            country: "France",
            lat: 48.8566,
            lon: 2.3522,
            description: "Explore Paris Grand Palais Spatial Arenas & Innovation Hubs.",
            placeholders: [
                {
                    title: "Grand Palais Stage",
                    url: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80",
                    tag: "Keynote Arena"
                },
                {
                    title: "Eiffel Exhibition Hub",
                    url: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=600&q=80",
                    tag: "360° Dome"
                },
                {
                    title: "Louvre Spatial Pavilion",
                    url: "https://images.unsplash.com/photo-1520939817895-060bdaf4fe1b?auto=format&fit=crop&w=600&q=80",
                    tag: "AR Gallery"
                }
            ]
        },
        {
            id: "london",
            name: "London",
            country: "United Kingdom",
            lat: 51.5074,
            lon: -0.1278,
            description: "Step into ExCeL London Virtual Arenas and Thames Domes.",
            placeholders: [
                {
                    title: "ExCeL Arena Stage",
                    url: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=600&q=80",
                    tag: "Exhibition Main Stage"
                },
                {
                    title: "Thames VR Dome",
                    url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80",
                    tag: "360° Booth"
                },
                {
                    title: "Westminster Tech Hub",
                    url: "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?auto=format&fit=crop&w=600&q=80",
                    tag: "Interactive Showcase"
                }
            ]
        },
        {
            id: "nyc",
            name: "New York",
            country: "USA",
            lat: 40.7128,
            lon: -74.0060,
            description: "Discover Manhattan Javits Center Virtual Booths & Galleries.",
            placeholders: [
                {
                    title: "Javits Center Stage",
                    url: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=600&q=80",
                    tag: "Keynote Arena"
                },
                {
                    title: "Manhattan AR Gallery",
                    url: "https://images.unsplash.com/photo-1518391846015-55a9cc003b25?auto=format&fit=crop&w=600&q=80",
                    tag: "AR Interactive"
                },
                {
                    title: "Times Square Booth",
                    url: "https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=600&q=80",
                    tag: "360° Panorama"
                }
            ]
        },
        {
            id: "tokyo",
            name: "Tokyo",
            country: "Japan",
            lat: 35.6762,
            lon: 139.6503,
            description: "Immerse in Tokyo Big Sight Futuristic Cyber Pavilions.",
            placeholders: [
                {
                    title: "Big Sight Expo Center",
                    url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80",
                    tag: "Main Exhibition"
                },
                {
                    title: "Shinjuku VR Studio",
                    url: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=600&q=80",
                    tag: "360° Cyber Stage"
                },
                {
                    title: "Tokyo Tech Dome",
                    url: "https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=600&q=80",
                    tag: "Interactive Lounge"
                }
            ]
        },
        {
            id: "dubai",
            name: "Dubai",
            country: "UAE",
            lat: 25.2048,
            lon: 55.2708,
            description: "Experience World Trade Center Dubai Innovation Pavilions.",
            placeholders: [
                {
                    title: "DWTC Innovation Hall",
                    url: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=600&q=80",
                    tag: "VIP Expo Stage"
                },
                {
                    title: "Burj Spatial Lounge",
                    url: "https://images.unsplash.com/photo-1546412414-8035e1786b9b?auto=format&fit=crop&w=600&q=80",
                    tag: "360° Panorama"
                },
                {
                    title: "Dubai Expo Pavilion",
                    url: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=600&q=80",
                    tag: "AR Kiosk"
                }
            ]
        },
        {
            id: "riyadh",
            name: "Riyadh",
            country: "Saudi Arabia",
            lat: 24.7136,
            lon: 46.6753,
            description: "Explore Riyadh Front Convention Center & Diriyah Domes.",
            placeholders: [
                {
                    title: "Riyadh Front Expo",
                    url: "https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?auto=format&fit=crop&w=600&q=80",
                    tag: "Keynote Arena"
                },
                {
                    title: "Kingdom Tech Stage",
                    url: "https://images.unsplash.com/photo-1578898835024-db011270a48a?auto=format&fit=crop&w=600&q=80",
                    tag: "360° VR Arena"
                },
                {
                    title: "Diriyah VR Pavilion",
                    url: "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=600&q=80",
                    tag: "Spatial Booth"
                }
            ]
        },
        {
            id: "sydney",
            name: "Sydney",
            country: "Australia",
            lat: -33.8688,
            lon: 151.2093,
            description: "Tour ICC Sydney Convention Arenas & Harbour Pavilions.",
            placeholders: [
                {
                    title: "ICC Sydney Arena",
                    url: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=600&q=80",
                    tag: "Exhibition Main Stage"
                },
                {
                    title: "Opera House Spatial Hub",
                    url: "https://images.unsplash.com/photo-1523428096881-5bd79d043006?auto=format&fit=crop&w=600&q=80",
                    tag: "360° Dome"
                },
                {
                    title: "Harbour VR Showcase",
                    url: "https://images.unsplash.com/photo-1549180030-48bf079fb38a?auto=format&fit=crop&w=600&q=80",
                    tag: "AR Pavilion"
                }
            ]
        },
        {
            id: "rio",
            name: "Rio de Janeiro",
            country: "Brazil",
            lat: -22.9068,
            lon: -43.1729,
            description: "Visit Riocentro Convention Domes and Copacabana Stages.",
            placeholders: [
                {
                    title: "Riocentro Convention Center",
                    url: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=600&q=80",
                    tag: "Main Stage"
                },
                {
                    title: "Copacabana Tech Lounge",
                    url: "https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?auto=format&fit=crop&w=600&q=80",
                    tag: "360° Panorama"
                },
                {
                    title: "Corcovado VR Dome",
                    url: "https://images.unsplash.com/photo-1473186578172-c141e6798cf4?auto=format&fit=crop&w=600&q=80",
                    tag: "Interactive Kiosk"
                }
            ]
        }
    ];

    let containerEl = $state<HTMLElement | null>(null);
    let canvasEl = $state<HTMLCanvasElement | null>(null);

    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let globeGroup: THREE.Object3D | null = null;
    let animationFrameId: number | null = null;

    let visibleScreenPins = $state<ScreenPin[]>([]);

    // Interactive Selection & Hover State
    let selectedCity = $state<CityPinData | null>(null);
    let hoveredPinId = $state<string | null>(null);
    let targetGroupX = $state(0); // 0 when centered, -0.68 when city is selected (moving Earth to the left)

    // Orbit & Drag interaction state
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let cameraTheta = 0.4;
    let cameraPhi = 1.3;
    let cameraDistance = 3.2;

    function updateCameraPosition() {
        if (!camera) return;
        camera.position.x = cameraDistance * Math.sin(cameraPhi) * Math.sin(cameraTheta);
        camera.position.y = cameraDistance * Math.cos(cameraPhi);
        camera.position.z = cameraDistance * Math.sin(cameraPhi) * Math.cos(cameraTheta);
        camera.lookAt(0, 0, 0);
    }

    function handlePointerDown(e: MouseEvent | TouchEvent) {
        isDragging = true;
        if ("touches" in e) {
            prevMouseX = e.touches[0].clientX;
            prevMouseY = e.touches[0].clientY;
        } else {
            prevMouseX = e.clientX;
            prevMouseY = e.clientY;
        }
    }

    function handlePointerMove(e: MouseEvent | TouchEvent) {
        if (!isDragging) return;
        let clientX = 0;
        let clientY = 0;
        if ("touches" in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const deltaX = clientX - prevMouseX;
        const deltaY = clientY - prevMouseY;

        cameraTheta -= deltaX * 0.008;
        cameraPhi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraPhi - deltaY * 0.008));
        updateCameraPosition();

        prevMouseX = clientX;
        prevMouseY = clientY;
    }

    function handlePointerUp() {
        isDragging = false;
    }

    /**
     * Converts spherical Latitude/Longitude to 3D Cartesian Vector3 on GLB sphere
     * (Model aligned so the X-axis crosses the UTC line / 0° Prime Meridian)
     */
    function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
        const radLat = lat * (Math.PI / 180);
        const radLon = lon * (Math.PI / 180);

        const cosLat = Math.cos(radLat);

        // 0° Longitude (UTC line / Prime Meridian) aligned along +X axis
        const x = radius * cosLat * Math.cos(radLon);
        const y = radius * Math.sin(radLat);
        const z = -radius * cosLat * Math.sin(radLon);

        return new THREE.Vector3(x, y, z);
    }

    let isDiving = $state(false);
    let divingCity = $state<CityPinData | null>(null);
    let targetDistance = 3.2;
    let flashOpacity = $state(0);

    /**
     * City Pin Click Handler - Initiates 3D dive zoom into the Earth model before opening 360° Panorama
     */
    function selectCity(city: CityPinData) {
        if (isDiving || selectedCity) return;
        hoveredPinId = null; // Clear hovered state
        divingCity = city;
        isDiving = true;
        targetDistance = 0.38; // Dive deep into the Earth sphere pin!
    }

    /**
     * Close City Tour Handler - Closes 360° Panorama View and zooms camera back out to globe
     */
    function closeCityTour() {
        selectedCity = null;
        divingCity = null;
        isDiving = false;
        hoveredPinId = null; // Clear hovered state so rotation resumes immediately
        targetDistance = 3.2;
        targetGroupX = 0;
    }

    onMount(() => {
        if (!containerEl || !canvasEl) return;

        let handleResize: (() => void) | null = null;
        const pinMeshes3D: Array<{ id: string; name: string; country: string; mesh: THREE.Group; cityData: CityPinData }> = [];

        const init = async () => {
            if (!containerEl || !canvasEl) return;

            scene = new THREE.Scene();
            scene.background = null;

            const w = containerEl.clientWidth;
            const h = containerEl.clientHeight;

            camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 50);
            updateCameraPosition();

            renderer = new THREE.WebGLRenderer({
                canvas: canvasEl,
                alpha: true,
                antialias: true,
                powerPreference: "high-performance"
            });
            renderer.setSize(w, h);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.0;

            // 1. SOFT NON-SPECULAR LIGHTING RIG
            const ambientLight = new THREE.AmbientLight("#ffffff", 1.8);
            scene.add(ambientLight);

            const softLight = new THREE.DirectionalLight("#ffffff", 0.6);
            softLight.position.set(2, 4, 3);
            scene.add(softLight);

            const backSoftLight = new THREE.DirectionalLight("#ffffff", 0.4);
            backSoftLight.position.set(-2, -3, -3);
            scene.add(backSoftLight);

            // 2. LOAD 3D PLANET MODEL
            const loader = new GLTFLoader();
            loader.load(
                "/world_earth_planet.glb",
                (gltf) => {
                    const model = gltf.scene;
                    model.updateMatrixWorld(true);

                    // Wrapper group centered exactly at (0, 0, 0)
                    const wrapper = new THREE.Group();

                    // Compute true bounding box & centroid offset
                    const box = new THREE.Box3().setFromObject(model);
                    const center = box.getCenter(new THREE.Vector3());
                    const size = box.getSize(new THREE.Vector3());

                    model.position.set(-center.x, -center.y, -center.z);
                    wrapper.add(model);

                    const maxDim = Math.max(size.x, size.y, size.z);
                    const desiredDiameter = 1.6;
                    const scaleFactor = desiredDiameter / maxDim;
                    wrapper.scale.set(scaleFactor, scaleFactor, scaleFactor);

                    const modelRadius = (maxDim / 2) * 1.02;

                    // Remove harsh specular reflection properties
                    model.traverse((child) => {
                        if ((child as THREE.Mesh).isMesh) {
                            const mesh = child as THREE.Mesh;
                            if (mesh.material) {
                                const origMat = mesh.material as THREE.MeshStandardMaterial;
                                origMat.roughness = Math.max(0.75, origMat.roughness || 0.75);
                                origMat.metalness = 0.0;
                                if ("clearcoat" in origMat) {
                                    (origMat as THREE.MeshPhysicalMaterial).clearcoat = 0.0;
                                }
                            }
                        }
                    });

                    // 3. ATTACH 3D PIN MARKERS FOR CITIES
                    const primaryColorHex = brand.primaryColor || "#009dd6";
                    const pinColor = new THREE.Color(primaryColorHex);

                    CITIES.forEach((city) => {
                        const pinGroup = new THREE.Group();
                        const localPos = latLonToVector3(city.lat, city.lon, modelRadius);
                        pinGroup.position.copy(localPos);

                        const normal = localPos.clone().normalize();
                        pinGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

                        // Stem Line
                        const stemGeo = new THREE.CylinderGeometry(0.08, 0.02, 1.2, 12);
                        stemGeo.translate(0, 0.6, 0);
                        const stemMat = new THREE.MeshBasicMaterial({
                            color: pinColor,
                            transparent: true,
                            opacity: 0.9
                        });
                        const stemMesh = new THREE.Mesh(stemGeo, stemMat);
                        pinGroup.add(stemMesh);

                        // Glowing Pin Head Sphere
                        const headGeo = new THREE.SphereGeometry(0.22, 16, 16);
                        headGeo.translate(0, 1.25, 0);
                        const headMat = new THREE.MeshBasicMaterial({
                            color: new THREE.Color("#ffffff")
                        });
                        const headMesh = new THREE.Mesh(headGeo, headMat);
                        pinGroup.add(headMesh);

                        // Pulsating Surface Ring Base
                        const ringGeo = new THREE.RingGeometry(0.15, 0.35, 24);
                        ringGeo.rotateX(-Math.PI / 2);
                        const ringMat = new THREE.MeshBasicMaterial({
                            color: pinColor,
                            side: THREE.DoubleSide,
                            transparent: true,
                            opacity: 0.8
                        });
                        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
                        pinGroup.add(ringMesh);

                        model.add(pinGroup);
                        pinMeshes3D.push({ id: city.id, name: city.name, country: city.country, mesh: pinGroup, cityData: city });
                    });

                    globeGroup = wrapper;
                    if (scene) scene.add(globeGroup);
                },
                undefined,
                (err) => {
                    console.error("Failed to load /world_earth_planet.glb:", err);
                }
            );

            handleResize = () => {
                if (!containerEl || !camera || !renderer) return;
                const nw = containerEl.clientWidth;
                const nh = containerEl.clientHeight;
                camera.aspect = nw / nh;
                camera.updateProjectionMatrix();
                renderer.setSize(nw, nh);
            };
            window.addEventListener("resize", handleResize);

            // 4. ANIMATION & SCREEN PROJECTION LOOP
            let clock = new THREE.Clock();
            const animate = () => {
                animationFrameId = requestAnimationFrame(animate);
                const delta = clock.getDelta();

                // Smoothly lerp Earth position X to targetGroupX
                if (globeGroup) {
                    globeGroup.position.x += (targetGroupX - globeGroup.position.x) * Math.min(1.0, delta * 6.0);

                    // ROTATION REQUIREMENT: STOP ROTATION when user is hovering over a pin, diving, or viewing 360 tour!
                    const shouldRotate = !isDragging && !hoveredPinId && !selectedCity && !isDiving;
                    if (shouldRotate) {
                        globeGroup.rotation.y += delta * 0.2;
                    }
                }

                // 3D DIVE ZOOM ANIMATION: When clicking a city pin, dive into the Earth model
                if (isDiving) {
                    cameraDistance += (targetDistance - cameraDistance) * Math.min(1.0, delta * 7.0);
                    updateCameraPosition();

                    if (cameraDistance < 1.4) {
                        flashOpacity = Math.min(1.0, (1.4 - cameraDistance) / 0.8);
                    }

                    if (cameraDistance <= 0.48 && divingCity) {
                        selectedCity = divingCity;
                        divingCity = null;
                        isDiving = false;
                        targetDistance = 3.2;
                        cameraDistance = 0.55;
                        updateCameraPosition();
                        setTimeout(() => {
                            flashOpacity = 0;
                        }, 120);
                    }
                } else if (selectedCity === null && cameraDistance < 3.2) {
                    // Smoothly zoom camera back out to normal 3.2 when returning from 360 tour to globe
                    cameraDistance += (3.2 - cameraDistance) * Math.min(1.0, delta * 5.0);
                    updateCameraPosition();
                    flashOpacity = 0;
                }

                // Project 3D Pins to 2D Screen Badges
                if (camera && containerEl && pinMeshes3D.length > 0) {
                    const width = containerEl.clientWidth;
                    const height = containerEl.clientHeight;
                    const tempVec = new THREE.Vector3();
                    const globeCenterPos = new THREE.Vector3();
                    if (globeGroup) {
                        globeGroup.getWorldPosition(globeCenterPos);
                    }
                    const cameraPos = camera.position;

                    const updatedPins: ScreenPin[] = [];

                    pinMeshes3D.forEach((item) => {
                        item.mesh.getWorldPosition(tempVec);

                        const sphereNormal = tempVec.clone().sub(globeCenterPos).normalize();
                        const cameraToPin = tempVec.clone().sub(cameraPos).normalize();
                        const isFacingCamera = cameraToPin.dot(sphereNormal) < -0.15;

                        if (isFacingCamera && camera) {
                            const projected = tempVec.clone().project(camera);
                            const sx = ((projected.x + 1) / 2) * width;
                            const sy = ((-projected.y + 1) / 2) * height;

                            updatedPins.push({
                                id: item.id,
                                name: item.name,
                                country: item.country,
                                x: Math.round(sx),
                                y: Math.round(sy),
                                visible: true,
                                cityData: item.cityData
                            });
                        }
                    });

                    visibleScreenPins = updatedPins;
                }

                if (renderer && scene && camera) {
                    renderer.render(scene, camera);
                }
            };

            animate();
        };

        init();

        return () => {
            if (handleResize) window.removeEventListener("resize", handleResize);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            renderer?.dispose();
        };
    });
</script>

<div
    bind:this={containerEl}
    class="relative w-full h-full min-h-dvh flex items-center justify-center select-none overflow-hidden"
>
    <!-- TOP CENTER TITLE -->
    <div class="absolute top-6 sm:top-10 inset-x-0 z-30 flex flex-col items-center justify-center pointer-events-none text-center px-4">
        
        <h2 class="text-3xl sm:text-4xl md:text-5xl font-black text-text tracking-tight drop-shadow-xs">
            Virtual Tours
        </h2>
        <p class="text-xs sm:text-sm font-medium text-text/60 mt-1 max-w-md">
            Click on any city pin to view 360° virtual tour.
        </p>
    </div>

    <!-- 3D Interactive Canvas -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
        class="absolute inset-0 w-full h-full z-10 cursor-grab active:cursor-grabbing"
        onmousedown={handlePointerDown}
        onmousemove={handlePointerMove}
        onmouseup={handlePointerUp}
        ontouchstart={handlePointerDown}
        ontouchmove={handlePointerMove}
        ontouchend={handlePointerUp}
        role="region"
        aria-label="3D Earth Model Viewer"
    >
        <canvas bind:this={canvasEl} class="w-full h-full block"></canvas>
    </div>

    <!-- Projected 2D Pin Point Labels -->
    <div class="absolute inset-0 z-20 pointer-events-none overflow-hidden">
        {#each visibleScreenPins as pin (pin.id)}
            <div
                class="absolute -translate-x-1/2 -translate-y-full transition-all duration-75 ease-out flex flex-col items-center group pointer-events-auto cursor-pointer"
                style="left: {pin.x}px; top: {pin.y - 12}px;"
                onmouseenter={() => { if (!selectedCity) hoveredPinId = pin.id; }}
                onmouseleave={() => (hoveredPinId = null)}
                onclick={() => selectCity(pin.cityData)}
                role="button"
                tabindex="0"
                onkeydown={(e) => e.key === "Enter" && selectCity(pin.cityData)}
            >
                <!-- Glassmorphic Pin Badge -->
                <div class="bg-black/85 hover:bg-black backdrop-blur-md border border-white/20 hover:border-white/40 px-3 py-1.5 rounded-full shadow-xl flex items-center gap-1.5 transform group-hover:scale-110 transition duration-200 {selectedCity?.id === pin.id ? 'ring-2 ring-white scale-110' : ''}">
                    <span class="size-2 rounded-full animate-ping shrink-0" style="background-color: {brand.primaryColor || '#009dd6'};"></span>
                    <span class="text-xs font-bold text-white tracking-wide font-sans truncate">
                        {pin.name}
                    </span>
                    <span class="text-[10px] text-white/50 font-mono font-normal hidden sm:inline">
                        • {pin.country}
                    </span>
                </div>

                <!-- Downward Arrow Pointer Stem -->
                <div class="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-black/85"></div>
            </div>
        {/each}
    </div>

    <!-- 360° PANORAMA FULL-SCREEN MODAL (Appears when a city pin is clicked) -->
    {#if selectedCity}
        <City360PanoramaModal city={selectedCity} onclose={closeCityTour} />
    {/if}

    <!-- Cinematic Jump/Dive Portal Flash Overlay -->
    {#if flashOpacity > 0}
        <div
            class="fixed inset-0 z-45 bg-white pointer-events-none transition-opacity duration-75"
            style="opacity: {flashOpacity}; backdrop-filter: blur(8px);"
        ></div>
    {/if}
</div>
