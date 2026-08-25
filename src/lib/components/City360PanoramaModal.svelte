<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import * as THREE from "three";
    import { brand } from "$lib/brand.svelte";

    interface PlaceInfo {
        title: string;
        url: string;
        tag: string;
    }

    interface CityPinData {
        id: string;
        name: string;
        country: string;
        description: string;
        placeholders: PlaceInfo[];
    }

    let { city, onclose }: { city: CityPinData; onclose: () => void } = $props();

    let activePlaceIndex = $state(0);
    let activePlace = $derived(city.placeholders[activePlaceIndex] || city.placeholders[0]);

    let containerEl = $state<HTMLElement | null>(null);
    let canvasEl = $state<HTMLCanvasElement | null>(null);

    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let sphereMaterial: THREE.MeshBasicMaterial | null = null;
    let animationFrameId: number | null = null;

    let autoRotate = $state(true);

    // 360 View Camera Controls (Initial wide FOV 135 lerps down to 75 for smooth entrance zoom-out)
    let yaw = Math.PI * 0.2;
    let pitch = 0;
    let targetYaw = Math.PI * 0.2;
    let targetPitch = 0;
    let fov = 135;
    let targetFov = 75;

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

    $effect(() => {
        if (activePlace?.url) {
            loadPanoramaTexture(activePlace.url);
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
        if (target.closest("button, input, a, select")) return;
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
        targetFov = Math.max(45, Math.min(90, targetFov + Math.sign(e.deltaY) * 4));
    }

    function resetView() {
        targetYaw = Math.PI * 0.2;
        targetPitch = 0;
        targetFov = 75;
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

            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
            camera.position.set(0, 0, 0);

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

            // Inverted 360° Sphere Geometry for Panorama
            const sphereGeo = new THREE.SphereGeometry(500, 60, 40);
            sphereGeo.scale(-1, 1, 1);

            sphereMaterial = new THREE.MeshBasicMaterial({
                color: new THREE.Color("#ffffff")
            });

            const sphereMesh = new THREE.Mesh(sphereGeo, sphereMaterial);
            scene.add(sphereMesh);

            // Load initial texture
            if (activePlace?.url) {
                loadPanoramaTexture(activePlace.url);
            }

            handleResize = () => {
                if (!containerEl || !camera || !renderer) return;
                const nw = containerEl.clientWidth;
                const nh = containerEl.clientHeight;
                camera.aspect = nw / nh;
                camera.updateProjectionMatrix();
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

                if (camera) {
                    camera.fov = fov;
                    camera.updateProjectionMatrix();

                    const cosPitch = Math.cos(pitch);
                    const lookX = Math.sin(yaw) * cosPitch;
                    const lookY = Math.sin(pitch);
                    const lookZ = Math.cos(yaw) * cosPitch;
                    camera.lookAt(lookX, lookY, lookZ);
                }

                if (renderer && scene && camera) {
                    renderer.render(scene, camera);
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
    <!-- 360° Interactive Canvas Container -->
    <div
        bind:this={containerEl}
        class="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing outline-none"
        onpointerdown={handlePointerDown}
        onpointermove={handlePointerMove}
        onpointerup={handlePointerUp}
        onwheel={handleWheel}
        role="region"
        aria-label="360 Panorama Viewport"
    >
        <canvas bind:this={canvasEl} class="w-full h-full block"></canvas>
    </div>

    <!-- TOP GLASS TOOLBAR (City Badge & Control Pill) -->
    <div class="relative z-10 p-4 sm:p-6 flex items-start justify-between pointer-events-none w-full">
        <!-- City Badge & Location Tag -->
        <div class="bg-black/75 backdrop-blur-xl border border-white/15 px-4 py-2.5 rounded-2xl shadow-2xl flex flex-col gap-1 pointer-events-auto max-w-md">
            <div class="flex items-center gap-2">
                <span class="size-2.5 rounded-full animate-ping shrink-0" style="background-color: {brand.primaryColor || '#009dd6'};"></span>
                <span class="text-xs font-mono font-bold text-white/70 uppercase tracking-wider">
                    360° VIRTUAL PANORAMA • {city.country.toUpperCase()}
                </span>
            </div>
            <h2 class="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>📍 {city.name}</span>
                <span class="text-sm font-semibold text-white/50 truncate">• {activePlace.title}</span>
            </h2>
        </div>

        <!-- Right Controls: Compass, Auto-Rotate & Close -->
        <div class="flex items-center gap-2 pointer-events-auto">
            <!-- Viewport Controls Pill -->
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

            <!-- Close Modal Button -->
            <button
                onclick={onclose}
                class="size-11 rounded-2xl bg-white/15 hover:bg-white/25 text-white border border-white/20 flex items-center justify-center transition cursor-pointer shadow-2xl"
                title="Return to Globe View (Esc)"
                aria-label="Close 360 Panorama"
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
            class="size-12 sm:size-14 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-xl border border-white/20 active:scale-95 text-white flex items-center justify-center cursor-pointer pointer-events-auto transition duration-200 shadow-2xl hover:border-white/40"
            title="Previous Location (Left Arrow)"
            aria-label="Previous Location"
        >
            <span class="material-symbols-rounded text-3xl sm:text-4xl">chevron_left</span>
        </button>

        <!-- Next Location Side Button -->
        <button
            onclick={nextPlace}
            class="size-12 sm:size-14 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-xl border border-white/20 active:scale-95 text-white flex items-center justify-center cursor-pointer pointer-events-auto transition duration-200 shadow-2xl hover:border-white/40"
            title="Next Location (Right Arrow)"
            aria-label="Next Location"
        >
            <span class="material-symbols-rounded text-3xl sm:text-4xl">chevron_right</span>
        </button>
    </div>

    <!-- BOTTOM FLOATING LOCATION SLIDER BAR -->
    <div class="relative z-20 p-4 sm:p-6 flex flex-col items-center justify-center pointer-events-none w-full">
        <div class="bg-black/85 backdrop-blur-2xl border border-white/20 p-2.5 sm:p-3 rounded-full shadow-2xl flex items-center gap-3 sm:gap-4 pointer-events-auto max-w-xl w-full justify-between">
            <!-- Left Slider Arrow Button -->
            <button
                onclick={prevPlace}
                class="size-9 sm:size-10 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition cursor-pointer shrink-0 border border-white/10"
                title="Previous Location"
                aria-label="Previous Location"
            >
                <span class="material-symbols-rounded text-xl sm:text-2xl">chevron_left</span>
            </button>

            <!-- Location Slider Card & Dot Indicators -->
            <div class="flex-1 flex flex-col items-center text-center px-2 min-w-0">
                <!-- Dot Pagination Indicators -->
                <div class="flex items-center gap-1.5 mb-1">
                    {#each city.placeholders as _, idx}
                        <button
                            onclick={() => (activePlaceIndex = idx)}
                            class="h-1.5 rounded-full transition-all duration-300 cursor-pointer {activePlaceIndex === idx ? 'w-6' : 'w-1.5 opacity-40 hover:opacity-75'}"
                            style="background-color: {activePlaceIndex === idx ? (brand.primaryColor || '#009dd6') : '#ffffff'};"
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
