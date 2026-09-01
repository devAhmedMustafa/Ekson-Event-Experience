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
        type?: "embed" | "image" | "cubic";
        embedUrl?: string;
    }

    interface CityPinData {
        id: string;
        name: string;
        country: string;
        lat: number;
        lon: number;
        description?: string;
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
            id: "paris",
            name: "Paris",
            country: "France",
            lat: 48.8566,
            lon: 2.3522,
            placeholders: [
                {
                    title: "Eiffel Tower",
                    url: "/cubic_views/Paris Eiffel Tower",
                    tag: "Cubic View",
                    type: "cubic"
                },
                {
                    title: "Louvre Museum 360°",
                    url: "https://360stories.com/paris/place/louvre-museum?mode=2&playerMode=2",
                    tag: "360° View",
                    type: "embed",
                    embedUrl: "https://360stories.com/paris/place/louvre-museum?mode=2&playerMode=2"
                }
            ]
        },
        // {
        //     id: "london",
        //     name: "London",
        //     country: "United Kingdom",
        //     lat: 51.5074,
        //     lon: -0.1278,
        //     placeholders: [
        //         {
        //             title: "Tower Bridge 360°",
        //             url: "https://360stories.com/London/place/London-Tower-Bridge?mode=2&playerMode=2",
        //             tag: "Interactive Tour",
        //             type: "embed",
        //             embedUrl: "https://360stories.com/London/place/London-Tower-Bridge?mode=2&playerMode=2"
        //         },
        //         {
        //             title: "Big Ben Cubic View",
        //             url: "/cubic_views/Big Ben/mobile_f.jpg",
        //             tag: "Cubic View",
        //             type: "cubic"
        //         },
        //         {
        //             title: "Big Ben 360°",
        //             url: "https://360stories.com/London/place/Big-Ben?mode=2&playerMode=2",
        //             tag: "360° View",
        //             type: "embed",
        //             embedUrl: "https://360stories.com/London/place/Big-Ben?mode=2&playerMode=2"
        //         }
        //     ]
        // },
        {
            id: "nyc",
            name: "New York",
            country: "USA",
            lat: 40.7128,
            lon: -74.0060,
            placeholders: [
                {
                    title: "NY Public Library",
                    url: "/cubic_views/New York Public Library",
                    tag: "Cubic View",
                    type: "cubic"
                },
            ]
        },
        // {
        //     id: "tokyo",
        //     name: "Tokyo",
        //     country: "Japan",
        //     lat: 35.6762,
        //     lon: 139.6503,
        //     placeholders: [
        //         {
        //             title: "Tokyo Skytree 360°",
        //             url: "https://360stories.com/tokyo/place/Tokyo-Skytree?mode=2&playerMode=2",
        //             tag: "Interactive Tour",
        //             type: "embed",
        //             embedUrl: "https://360stories.com/tokyo/place/Tokyo-Skytree?mode=2&playerMode=2"
        //         },
        //         {
        //             title: "Tokyo Shinjuku Cubic",
        //             url: "/cubic_views/Tokyo Shinjuku/mobile_f.jpg",
        //             tag: "Cubic View",
        //             type: "cubic"
        //         },
        //         {
        //             title: "Tokyo Tower 360°",
        //             url: "https://360stories.com/tokyo/place/Tokyo-Tower?mode=2&playerMode=2",
        //             tag: "360° View",
        //             type: "embed",
        //             embedUrl: "https://360stories.com/tokyo/place/Tokyo-Tower?mode=2&playerMode=2"
        //         }
        //     ]
        // },
        // {
        //     id: "dubai",
        //     name: "Dubai",
        //     country: "UAE",
        //     lat: 25.2048,
        //     lon: 55.2708,
        //     placeholders: [
        //         {
        //             title: "Burj Khalifa 360°",
        //             url: "https://360stories.com/dubai/place/burj-khalifa?mode=2&playerMode=2",
        //             tag: "Interactive Tour",
        //             type: "embed",
        //             embedUrl: "https://360stories.com/dubai/place/burj-khalifa?mode=2&playerMode=2"
        //         },
        //         {
        //             title: "Dubai Burj Khalifa Cubic",
        //             url: "/cubic_views/Dubai Burj Khalifa/mobile_f.jpg",
        //             tag: "Cubic View",
        //             type: "cubic"
        //         },
        //         {
        //             title: "Dubai Marina 360°",
        //             url: "https://360stories.com/dubai/place/dubai-marina?mode=2&playerMode=2",
        //             tag: "360° View",
        //             type: "embed",
        //             embedUrl: "https://360stories.com/dubai/place/dubai-marina?mode=2&playerMode=2"
        //         }
        //     ]
        // },
        // {
        //     id: "riyadh",
        //     name: "Riyadh",
        //     country: "Saudi Arabia",
        //     lat: 24.7136,
        //     lon: 46.6753,
        //     placeholders: [
        //         {
        //             title: "Kingdom Centre 360°",
        //             url: "https://360stories.com/riyadh/place/kingdom-centre?mode=2&playerMode=2",
        //             tag: "Interactive Tour",
        //             type: "embed",
        //             embedUrl: "https://360stories.com/riyadh/place/kingdom-centre?mode=2&playerMode=2"
        //         },
        //         {
        //             title: "Riyadh Kingdom Centre Cubic",
        //             url: "/cubic_views/Riyadh Kingdom Centre/mobile_f.jpg",
        //             tag: "Cubic View",
        //             type: "cubic"
        //         },
        //         {
        //             title: "Al Faisaliyah Tower 360°",
        //             url: "https://360stories.com/riyadh/place/al-faisaliyah-tower?mode=2&playerMode=2",
        //             tag: "360° View",
        //             type: "embed",
        //             embedUrl: "https://360stories.com/riyadh/place/al-faisaliyah-tower?mode=2&playerMode=2"
        //         }
        //     ]
        // },
        // {
        //     id: "sydney",
        //     name: "Sydney",
        //     country: "Australia",
        //     lat: -33.8688,
        //     lon: 151.2093,
        //     placeholders: [
        //         {
        //             title: "Sydney Opera House 360°",
        //             url: "https://360stories.com/sydney/place/opera-house?mode=2&playerMode=2",
        //             tag: "Interactive Tour",
        //             type: "embed",
        //             embedUrl: "https://360stories.com/sydney/place/opera-house?mode=2&playerMode=2"
        //         },
        //         {
        //             title: "Sydney Opera House Cubic",
        //             url: "/cubic_views/Sydney Opera House/mobile_f.jpg",
        //             tag: "Cubic View",
        //             type: "cubic"
        //         },
        //         {
        //             title: "Harbour Bridge 360°",
        //             url: "https://360stories.com/sydney/place/harbour-bridge?mode=2&playerMode=2",
        //             tag: "360° View",
        //             type: "embed",
        //             embedUrl: "https://360stories.com/sydney/place/harbour-bridge?mode=2&playerMode=2"
        //         }
        //     ]
        // }
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
                    const primaryColorHex = brand.primaryColor || "#4abbff";
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

<div class="w-full h-full min-h-dvh md:h-screen max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-8 flex flex-col justify-between select-none overflow-visible md:overflow-hidden">
    <!-- Header Area -->
    <div class="w-full shrink-0 mb-3 sm:mb-4 pb-3 border-b border-black/5">
        <h2 class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-text tracking-tight">
            Virtual Tours
        </h2>
        <p class="text-xs sm:text-sm text-text/70 mt-1 max-w-xl leading-relaxed">
            Step into breathtaking places and unforgettable moments with immersive VR tours.
        </p>
    </div>

    <!-- 2 Column Split Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-auto w-full flex-1 max-h-none md:max-h-[78vh] overflow-hidden items-center">
        <!-- LEFT COLUMN: Content & Features -->
        <div class="flex flex-col justify-center space-y-5">
            <!-- SubTitle & Description -->
            <div>
                <h3 class="text-xl sm:text-2xl md:text-3xl font-extrabold text-text tracking-tight">
                    Explore, Discover, Experience.
                </h3>
                <p class="text-xs sm:text-sm text-text/75 leading-relaxed mt-3 max-w-lg font-medium">
                    Step into breathtaking places and unforgettable moments with immersive VR tours. Experience iconic destinations and world landmarks with photorealistic spatial realism.
                </p>
            </div>

            <!-- 4 Features Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <!-- Feature 1: 360 Experience -->
                <div class="bg-white/70 backdrop-blur-xl border border-black/5 rounded-2xl p-3.5 flex items-center gap-3 shadow-2xs">
                    <div class="size-9 rounded-xl flex items-center justify-center shrink-0" style="color: {brand.primaryColor}">
                        <span class="material-symbols-rounded text-xl">360</span>
                    </div>
                    <div>
                        <h4 class="text-xs font-extrabold text-text">360 Experience</h4>
                        <p class="text-[10px] text-text/60">Panoramic exploration</p>
                    </div>
                </div>

                <!-- Feature 2: Iconic Destinations -->
                <div class="bg-white/70 backdrop-blur-xl border border-black/5 rounded-2xl p-3.5 flex items-center gap-3 shadow-2xs">
                    <div class="size-9 rounded-xl flex items-center justify-center shrink-0" style="color: {brand.primaryColor}">
                        <span class="material-symbols-rounded text-xl">map</span>
                    </div>
                    <div>
                        <h4 class="text-xs font-extrabold text-text">Iconic Destinations</h4>
                        <p class="text-[10px] text-text/60">World landmarks</p>
                    </div>
                </div>

                <!-- Feature 3: Realistic Immersion -->
                <div class="bg-white/70 backdrop-blur-xl border border-black/5 rounded-2xl p-3.5 flex items-center gap-3 shadow-2xs">
                    <div class="size-9 rounded-xl flex items-center justify-center shrink-0" style="color: {brand.primaryColor}">
                        <span class="material-symbols-rounded text-xl">view_in_ar</span>
                    </div>
                    <div>
                        <h4 class="text-xs font-extrabold text-text">Realistic Immersion</h4>
                        <p class="text-[10px] text-text/60">Photorealistic VR</p>
                    </div>
                </div>

                <!-- Feature 4: Unforgettable Memories -->
                <div class="bg-white/70 backdrop-blur-xl border border-black/5 rounded-2xl p-3.5 flex items-center gap-3 shadow-2xs">
                    <div class="size-9 rounded-xl flex items-center justify-center shrink-0" style="color: {brand.primaryColor}">
                        <span class="material-symbols-rounded text-xl">auto_awesome</span>
                    </div>
                    <div>
                        <h4 class="text-xs font-extrabold text-text">Unforgettable Memories</h4>
                        <p class="text-[10px] text-text/60">Memorable activation</p>
                    </div>
                </div>
            </div>

            <!-- Helper Badge Pill -->
            <div class="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/80 backdrop-blur-md border border-black/5 text-xs text-text/70 shadow-2xs w-fit">
                <span class="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Click city pins on the globe to launch 360° virtual tours</span>
            </div>
        </div>

        <!-- RIGHT COLUMN: 3D Interactive Earth Globe Model -->
        <div
            bind:this={containerEl}
            class="relative w-full h-[40vh] sm:h-[52vh] md:h-full min-h-64 sm:min-h-87.5 rounded-3xl overflow-hidden flex items-center justify-center"
        >
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

            <!-- Projected 2D Pin Point Labels over Globe -->
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
                        <div class="backdrop-blur-md border border-white/20 hover:border-white/40 px-3 py-1.5 rounded-full shadow-xl flex items-center gap-1.5 transform group-hover:scale-110 transition duration-200 {selectedCity?.id === pin.id ? 'ring-2 ring-white scale-110' : ''}">
                            <span class="size-2 rounded-full animate-ping shrink-0 bg-primary"></span>
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
        </div>
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
