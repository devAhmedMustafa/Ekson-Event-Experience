<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import * as THREE from "three";
    import { brand } from "$lib/brand.svelte";

    interface PlaceInfo {
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
        description?: string;
        placeholders: PlaceInfo[];
    }

    let { city, onclose }: { city: CityPinData; onclose: () => void } = $props();

    let activePlaceIndex = $state(0);
    let activePlace = $derived(city.placeholders[activePlaceIndex] || city.placeholders[0]);

    let containerEl = $state<HTMLElement | null>(null);
    let canvasEl = $state<HTMLCanvasElement | null>(null);

    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let perspCamera: THREE.PerspectiveCamera | null = null;
    let orthoCamera: THREE.OrthographicCamera | null = null;
    let sphereMaterial: THREE.MeshBasicMaterial | null = null;
    let animationFrameId: number | null = null;

    let autoRotate = $state(true);

    // 360 View Camera Controls
    let yaw = Math.PI * 0.2;
    let pitch = 0;
    let targetYaw = Math.PI * 0.2;
    let targetPitch = 0;
    let fov = 135;
    let targetFov = 75;
    let frustumSize = 2.0;
    let targetFrustumSize = 2.0;

    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

    const textureLoader = new THREE.TextureLoader();
    const textureCache = new Map<string, THREE.Texture>();

    function loadPanoramaTexture(url: string) {
        if (textureCache.has(url)) {
            const cachedTex = textureCache.get(url)!;
            if (sphereMaterial) {
                sphereMaterial.map = cachedTex;
                sphereMaterial.needsUpdate = true;
            }
            return;
        }

        textureLoader.load(
            url,
            (tex) => {
                tex.colorSpace = THREE.SRGBColorSpace;
                tex.minFilter = THREE.LinearFilter;
                textureCache.set(url, tex);
                if (sphereMaterial) {
                    sphereMaterial.map = tex;
                    sphereMaterial.needsUpdate = true;
                }
            },
            undefined,
            (err) => {
                console.error("Failed to load 360 panorama texture:", err);
            }
        );
    }

    function rebuildScene() {
        if (!containerEl || !canvasEl) return;
        const w = containerEl.clientWidth || window.innerWidth;
        const h = containerEl.clientHeight || window.innerHeight;
        const aspect = w / h;

        if (scene) {
            scene.traverse((obj) => {
                if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
            });
        }

        scene = new THREE.Scene();

        if (activePlace.type === "cubic") {
            // CUBIC SKYBOX VIEW: THREE.CubeTextureLoader set as scene.background
            perspCamera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
            perspCamera.position.set(0, 0, 0);

            let baseUrl = activePlace.url;
            if (baseUrl.endsWith(".jpg") || baseUrl.endsWith(".png") || baseUrl.endsWith(".webp")) {
                baseUrl = baseUrl.substring(0, baseUrl.lastIndexOf("/"));
            }
            baseUrl = baseUrl.replace(/\/$/, "");

            const cubeLoader = new THREE.CubeTextureLoader();
            const cubeTexture = cubeLoader.load(
                [
                    `${baseUrl}/mobile_r.jpg`, // px (Right)
                    `${baseUrl}/mobile_l.jpg`, // nx (Left)
                    `${baseUrl}/mobile_u.jpg`, // py (Top)
                    `${baseUrl}/mobile_d.jpg`, // ny (Bottom)
                    `${baseUrl}/mobile_f.jpg`, // pz (Front)
                    `${baseUrl}/mobile_b.jpg`  // nz (Back)
                ],
                () => {
                    if (renderer && scene && perspCamera) {
                        renderer.render(scene, perspCamera);
                    }
                },
                undefined,
                (err) => {
                    console.warn(`Could not load cube texture from ${baseUrl}:`, err);
                }
            );
            cubeTexture.colorSpace = THREE.SRGBColorSpace;
            scene.background = cubeTexture;
        } else {
            // PANORAMA SPHERE VIEW: Perspective Camera
            perspCamera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
            perspCamera.position.set(0, 0, 0);

            const sphereGeo = new THREE.SphereGeometry(500, 60, 40);
            sphereGeo.scale(-1, 1, 1);

            sphereMaterial = new THREE.MeshBasicMaterial({
                color: new THREE.Color("#ffffff")
            });

            const sphereMesh = new THREE.Mesh(sphereGeo, sphereMaterial);
            scene.add(sphereMesh);

            if (activePlace?.url && activePlace.type !== "embed") {
                loadPanoramaTexture(activePlace.url);
            }
        }
    }

    $effect(() => {
        // Rebuild scene when active place changes
        if (activePlaceIndex !== undefined && containerEl && canvasEl) {
            rebuildScene();
        }
    });

    function nextPlace() {
        activePlaceIndex = (activePlaceIndex + 1) % city.placeholders.length;
    }

    function prevPlace() {
        activePlaceIndex = (activePlaceIndex - 1 + city.placeholders.length) % city.placeholders.length;
    }

    function handlePointerDown(e: PointerEvent) {
        const target = e.target as HTMLElement;
        if (target.closest("button, input, a, select, iframe")) return;
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
    }

    function handlePointerMove(e: PointerEvent) {
        if (!isDragging) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;

        const speed = (fov / 75) * 0.0035;
        targetYaw -= dx * speed;
        targetPitch = Math.max(-1.1, Math.min(1.1, targetPitch - dy * speed));
    }

    function handlePointerUp() {
        isDragging = false;
    }

    function handleWheel(e: WheelEvent) {
        e.preventDefault();
        if (activePlace.type === "cubic") {
            targetFrustumSize = Math.max(30, Math.min(250, targetFrustumSize + Math.sign(e.deltaY) * 10));
        } else {
            targetFov = Math.max(45, Math.min(90, targetFov + Math.sign(e.deltaY) * 4));
        }
    }

    function resetView() {
        targetYaw = Math.PI * 0.2;
        targetPitch = 0;
        targetFov = 75;
        targetFrustumSize = 100;
    }

    function jumpDirection(radians: number) {
        targetYaw = radians;
        targetPitch = 0;
    }

    onMount(() => {
        if (!containerEl || !canvasEl) return;

        let handleResize: (() => void) | null = null;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") prevPlace();
            if (e.key === "ArrowRight") nextPlace();
            if (e.key === "Escape") onclose();
        };
        window.addEventListener("keydown", handleKeyDown);

        const init360 = () => {
            if (!containerEl || !canvasEl) return;

            const w = containerEl.clientWidth;
            const h = containerEl.clientHeight;

            renderer = new THREE.WebGLRenderer({
                canvas: canvasEl,
                antialias: true,
                powerPreference: "high-performance"
            });
            renderer.setSize(w, h);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.1;

            rebuildScene();

            handleResize = () => {
                if (!containerEl || !renderer) return;
                const nw = containerEl.clientWidth;
                const nh = containerEl.clientHeight;
                const aspect = nw / nh;

                if (perspCamera) {
                    perspCamera.aspect = aspect;
                    perspCamera.updateProjectionMatrix();
                }
                renderer.setSize(nw, nh);
            };
            window.addEventListener("resize", handleResize);

            // Animation Loop
            let clock = new THREE.Clock();
            const animate = () => {
                animationFrameId = requestAnimationFrame(animate);
                const dt = Math.min(0.05, clock.getDelta());

                if (autoRotate && !isDragging) {
                    targetYaw += dt * 0.1;
                }

                yaw += (targetYaw - yaw) * Math.min(1, dt * 10);
                pitch += (targetPitch - pitch) * Math.min(1, dt * 10);
                fov += (targetFov - fov) * Math.min(1, dt * 10);
                frustumSize += (targetFrustumSize - frustumSize) * Math.min(1, dt * 10);

                const cosPitch = Math.cos(pitch);
                const lookX = Math.sin(yaw) * cosPitch;
                const lookY = Math.sin(pitch);
                const lookZ = Math.cos(yaw) * cosPitch;

                if (perspCamera && renderer && scene) {
                    perspCamera.fov = fov;
                    perspCamera.updateProjectionMatrix();
                    perspCamera.lookAt(lookX, lookY, lookZ);
                    renderer.render(scene, perspCamera);
                }
            };

            animate();
        };

        init360();

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            if (handleResize) window.removeEventListener("resize", handleResize);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            renderer?.dispose();
            textureCache.clear();
        };
    });
</script>

<div
    class="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col justify-between overflow-hidden transition-all duration-700 ease-out animate-in zoom-in-125 fade-in-0 select-none"
>
    <!-- VIEWPORT: IFRAME EMBED OR THREE.JS CANVAS (EQUIRECTANGULAR / CUBIC ORTHO) -->
    {#if activePlace.type === "embed" || activePlace.embedUrl}
        <div class="absolute inset-0 w-full h-full z-0 bg-black">
            <iframe
                src={activePlace.embedUrl || activePlace.url}
                title={activePlace.title}
                class="w-full h-full border-0 pointer-events-auto"
                allowfullscreen
                scrolling="none"
                name="360Stories"
            ></iframe>
        </div>
    {:else}
        <!-- 360° Interactive WebGL Canvas Container -->
        <div
            bind:this={containerEl}
            class="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing outline-none"
            onpointerdown={handlePointerDown}
            onpointermove={handlePointerMove}
            onpointerup={handlePointerUp}
            onwheel={handleWheel}
            role="region"
            aria-label="360 Viewport"
        >
            <canvas bind:this={canvasEl} class="w-full h-full block"></canvas>
        </div>
    {/if}

    <!-- TOP GLASS TOOLBAR (City Badge & Control Pill) -->
    <div class="relative z-10 p-4 sm:p-6 flex items-start justify-between pointer-events-none w-full">
        <!-- City Badge & Location Tag -->
        <div class="bg-black/75 backdrop-blur-xl border border-white/15 px-4 py-2.5 rounded-2xl shadow-2xl flex flex-col gap-1 pointer-events-auto max-w-md">
            <div class="flex items-center gap-2">
                <span class="size-2.5 rounded-full animate-ping shrink-0" style="background-color: {brand.primaryColor || '#009dd6'};"></span>
                <span class="text-xs font-mono font-bold text-white/70 uppercase tracking-wider">
                    {#if activePlace.type === "cubic"}
                        360° CUBIC ORTHO VIEW • {city.country.toUpperCase()}
                    {:else if activePlace.type === "embed"}
                        360° INTERACTIVE TOUR • {city.country.toUpperCase()}
                    {:else}
                        360° PANORAMA • {city.country.toUpperCase()}
                    {/if}
                </span>
            </div>
            <h2 class="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>📍 {city.name}</span>
                <span class="text-sm font-semibold text-white/50 truncate">• {activePlace.title}</span>
            </h2>
        </div>

        <!-- Right Controls: Compass, Auto-Rotate & Close -->
        <div class="flex items-center gap-2 pointer-events-auto">
            <!-- Viewport Controls Pill (For WebGL Views) -->
            {#if activePlace.type !== "embed"}
                <div class="flex items-center gap-1.5 bg-black/75 backdrop-blur-xl p-1.5 rounded-2xl border border-white/15 shadow-2xl">
                    <!-- Compass Direction Dropdown -->
                    <div class="relative flex items-center px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer text-white">
                        <span class="material-symbols-rounded text-base text-white/80 mr-1 shrink-0">explore</span>
                        <select
                            onchange={(e) => jumpDirection(Number((e.target as HTMLSelectElement).value))}
                            class="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer pr-1"
                            aria-label="Jump Compass Direction"
                        >
                            <option value="0" class="bg-slate-900 text-white">North</option>
                            <option value={Math.PI / 2} class="bg-slate-900 text-white">East</option>
                            <option value={Math.PI} class="bg-slate-900 text-white">South</option>
                            <option value={-Math.PI / 2} class="bg-slate-900 text-white">West</option>
                        </select>
                    </div>

                    <!-- Auto-Rotate Toggle -->
                    <button
                        onclick={() => (autoRotate = !autoRotate)}
                        class="size-8 rounded-xl flex items-center justify-center transition cursor-pointer {autoRotate ? 'bg-white/25 text-white font-bold' : 'bg-white/10 text-white/60 hover:bg-white/20'}"
                        title={autoRotate ? "Pause Auto Rotation" : "Start Auto Rotation"}
                        aria-label="Toggle Auto Rotation"
                    >
                        <span class="material-symbols-rounded text-lg">
                            {autoRotate ? 'sync' : 'sync_disabled'}
                        </span>
                    </button>

                    <!-- Reset Camera Button -->
                    <button
                        onclick={resetView}
                        class="size-8 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 flex items-center justify-center transition cursor-pointer"
                        title="Reset Camera Angle"
                        aria-label="Reset Camera Angle"
                    >
                        <span class="material-symbols-rounded text-lg">refresh</span>
                    </button>
                </div>
            {/if}

            <!-- Close Modal Button -->
            <button
                onclick={onclose}
                class="size-11 rounded-2xl bg-white/80 hover:bg-white text-slate-950 border border-white/40 flex items-center justify-center transition cursor-pointer shadow-2xl font-bold"
                title="Return to Globe View (Esc)"
                aria-label="Close 360 View"
            >
                <span class="material-symbols-rounded text-2xl">close</span>
            </button>
        </div>
    </div>

    <!-- SIDE FLOATING SLIDER ARROW BUTTONS -->
    <div class="absolute inset-y-0 inset-x-4 flex items-center justify-between pointer-events-none z-20">
        <!-- Previous Location Side Button -->
        <button
            onclick={prevPlace}
            class="size-12 sm:size-14 rounded-full bg-black/75 hover:bg-black/90 backdrop-blur-xl border border-white/20 active:scale-95 text-white flex items-center justify-center cursor-pointer pointer-events-auto transition duration-200 shadow-2xl hover:border-white/40"
            title="Previous Location (Left Arrow)"
            aria-label="Previous Location"
        >
            <span class="material-symbols-rounded text-3xl sm:text-4xl">chevron_left</span>
        </button>

        <!-- Next Location Side Button -->
        <button
            onclick={nextPlace}
            class="size-12 sm:size-14 rounded-full bg-black/75 hover:bg-black/90 backdrop-blur-xl border border-white/20 active:scale-95 text-white flex items-center justify-center cursor-pointer pointer-events-auto transition duration-200 shadow-2xl hover:border-white/40"
            title="Next Location (Right Arrow)"
            aria-label="Next Location"
        >
            <span class="material-symbols-rounded text-3xl sm:text-4xl">chevron_right</span>
        </button>
    </div>

    <!-- BOTTOM FLOATING CONTROLS (Location Selector & Controls) -->
    <div class="relative z-10 p-4 sm:p-6 flex flex-col items-center pointer-events-none w-full mt-auto">
        <div class="bg-black/75 backdrop-blur-xl border border-white/15 p-3 rounded-2xl shadow-2xl flex items-center gap-3 pointer-events-auto max-w-xl w-full">
            <!-- Prev Location Button -->
            <button
                onclick={prevPlace}
                disabled={city.placeholders.length <= 1}
                class="size-9 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none text-white flex items-center justify-center transition cursor-pointer shrink-0"
                title="Previous Location"
            >
                <span class="material-symbols-rounded text-xl">chevron_left</span>
            </button>

            <!-- Location Slider Card & Dot Indicators -->
            <div class="flex-1 flex flex-col items-center text-center px-2 min-w-0">
                <!-- Dot Pagination Indicators -->
                <div class="flex items-center gap-1.5 mb-1">
                    {#each city.placeholders as _, idx}
                        <button
                            onclick={() => (activePlaceIndex = idx)}
                            class="h-1.5 rounded-full transition-all duration-300 cursor-pointer {activePlaceIndex === idx ? 'w-6 bg-primary' : 'w-1.5 bg-white opacity-40 hover:opacity-75'}"
                            title="Go to location {idx + 1}"
                            aria-label="Go to location {idx + 1}"
                        ></button>
                    {/each}
                </div>

                <!-- Active Location Title & Tag -->
                <div class="flex items-center justify-center gap-2 truncate max-w-full">
                    <span class="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                        {activePlaceIndex + 1}. {activePlace.title}
                    </span>
                    <span class="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-white/15 text-white/80 shrink-0 hidden sm:inline">
                        {activePlace.tag}
                    </span>
                </div>
            </div>

            <!-- Right Slider Arrow Button -->
            <button
                onclick={nextPlace}
                class="size-9 sm:size-10 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition cursor-pointer shrink-0 border border-white/10"
                title="Next Location"
                aria-label="Next Location"
            >
                <span class="material-symbols-rounded text-xl sm:text-2xl">chevron_right</span>
            </button>
        </div>
    </div>
</div>
