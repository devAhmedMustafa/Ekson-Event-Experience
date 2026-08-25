<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import * as THREE from "three";
    import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
    import { brand } from "$lib/brand.svelte";
    import { createBooth } from "$lib/three/booth";
    import { buildBoothTextures, invalidateBoothTextures } from "$lib/three/booth-textures";
    import { envFor, studioLights, backdropGradient, disposeObject } from "$lib/three/env";
    import { mat, disposeMaterialCache } from "$lib/three/materials";
    import { QUALITY } from "$lib/three/quality";
    import { createRenderPath } from "$lib/three/render-path";

    let renderPath: any = null;

    interface CameraPreset {
        id: string;
        label: string;
        title: string;
        pos: [number, number, number];
        look: [number, number, number];
    }

    const presets: CameraPreset[] = [
        { id: "iso", label: "01 ISO", title: "Isometric Overview", pos: [7.2, 4.8, 7.6], look: [0, 1.1, 0] },
        { id: "front", label: "02 FRONT", title: "Main Entrance", pos: [0.0, 2.2, 5.6], look: [0, 1.2, 0] },
        { id: "reception", label: "03 DESK", title: "Reception Counter", pos: [3.8, 1.9, 2.8], look: [2.2, 0.9, 1.3] },
        { id: "lounge", label: "04 LOUNGE", title: "Seating Corner", pos: [-3.8, 2.1, 3.2], look: [-1.9, 0.8, 1.4] },
        { id: "lightbox", label: "05 BANNER", title: "Hero Lightbox", pos: [0.0, 2.4, 1.8], look: [0.0, 2.1, -2.8] },
        { id: "top", label: "06 TOP", title: "Top-Down Floorplan", pos: [0.1, 10.2, 0.1], look: [0, 0, 0] }
    ];

    const HOME = {
        pos: new THREE.Vector3(7.2, 4.8, 7.6),
        target: new THREE.Vector3(0, 1.1, 0)
    };

    const SLOT_LABELS: Record<string, string> = {
        logo_slot_backwall: "Backwall Lightbox",
        logo_slot_counter: "Counter Fascia",
        logo_slot_rollup: "Roll-Up Banner",
        logo_slot_hanging: "Hanging Ring Sign",
        logo_slot_floor: "Floor Entrance Decal",
        logo_slot_plinth: "Product Plinth",
        logo_slot_screen: "Interactive Stand Screen"
    };

    let { imageSrc = "" } = $props();

    let containerEl = $state<HTMLElement | null>(null);
    let canvasEl = $state<HTMLCanvasElement | null>(null);
    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let controls: OrbitControls | null = null;
    let boothGroup: THREE.Group | null = null;
    let markersGroup: THREE.Group | null = null;
    let studioRig: { key: THREE.DirectionalLight; fill: THREE.DirectionalLight; rim: THREE.DirectionalLight; bounce: THREE.HemisphereLight } | null = null;
    let animationFrameId: number | null = null;

    let activePreset = $state<string>("iso");
    let autoRotate = $state(true);
    let showLogoSlots = $state(false);
    let lightingMode = $state<"studio" | "night" | "tech">("studio");
    let isLoading = $state(true);
    let isLive = $state(false);

    function handleTryLive() {
        if (!brand.isCustom) {
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("ekson_open_brand_modal"));
            }
            return;
        }
        startLive();
    }

    function startLive() {
        isLive = true;
        isLoading = true;
    }

    function stopLive() {
        isLive = false;
        isInitialized = false;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        renderPath?.dispose();
        renderPath = null;
        controls?.dispose();
        renderer?.dispose();
        disposeMaterialCache();
        if (scene) disposeObject(scene);
        scene = null;
        renderer = null;
        camera = null;
        controls = null;
        boothGroup = null;
        markersGroup = null;
    }

    // Smooth Camera Transition State
    let isTransitioning = false;
    let camStartPos = new THREE.Vector3();
    let camEndPos = new THREE.Vector3();
    let targetStart = new THREE.Vector3();
    let targetEnd = new THREE.Vector3();
    let transitionProgress = 0;
    const transitionDuration = 1000;
    let transitionStartTime = 0;

    function applyPreset(presetId: string) {
        activePreset = presetId;
        const p = presets.find((pr) => pr.id === presetId);
        if (!p || !camera || !controls) return;

        autoRotate = false;
        isTransitioning = true;
        transitionProgress = 0;
        transitionStartTime = performance.now();

        camStartPos.copy(camera.position);
        camEndPos.set(...p.pos);

        targetStart.copy(controls.target);
        targetEnd.set(...p.look);
    }

    function toggleLogoSlots() {
        showLogoSlots = !showLogoSlots;
        if (markersGroup) {
            markersGroup.visible = showLogoSlots;
        }
    }

    function resetView() {
        applyPreset("iso");
    }

    function setLighting(mode: "studio" | "night" | "tech") {
        lightingMode = mode;
        if (!studioRig || !scene) return;

        if (mode === "studio") {
            scene.background = backdropGradient("#eef1f6", "#ccd2de");
            studioRig.key.color.setHex(0xfff4e6);
            studioRig.key.intensity = 1.35;
            studioRig.fill.color.setHex(0xd6e4ff);
            studioRig.fill.intensity = 0.35;
            studioRig.rim.color.setHex(0xffe9cc);
            studioRig.rim.intensity = 0.5;
            studioRig.bounce.color.setHex(0xeef2fb);
            studioRig.bounce.groundColor.setHex(0xbdb8ad);
            studioRig.bounce.intensity = 0.28;
        } else if (mode === "night") {
            scene.background = new THREE.Color("#0b0e14");
            studioRig.key.color.setHex(0x38bdf8);
            studioRig.key.intensity = 0.45;
            studioRig.fill.color.setHex(0x1e293b);
            studioRig.fill.intensity = 0.25;
            studioRig.rim.color.setHex(0x6366f1);
            studioRig.rim.intensity = 0.8;
            studioRig.bounce.color.setHex(0x1e1b4b);
            studioRig.bounce.groundColor.setHex(0x020617);
            studioRig.bounce.intensity = 0.15;
        } else if (mode === "tech") {
            scene.background = new THREE.Color("#080c18");
            const brandColor = new THREE.Color(brand.primaryColor || "#009dd6");
            studioRig.key.color.copy(brandColor);
            studioRig.key.intensity = 1.2;
            studioRig.fill.color.setHex(0x0284c7);
            studioRig.fill.intensity = 0.4;
            studioRig.rim.color.setHex(0xffffff);
            studioRig.rim.intensity = 0.9;
            studioRig.bounce.color.copy(brandColor);
            studioRig.bounce.groundColor.setHex(0x0f172a);
            studioRig.bounce.intensity = 0.25;
        }
    }

    function cycleLighting() {
        const modes: ("studio" | "night" | "tech")[] = ["studio", "night", "tech"];
        const nextIdx = (modes.indexOf(lightingMode) + 1) % modes.length;
        setLighting(modes[nextIdx]);
    }

    function makeSlotMarkers(booth: THREE.Group, accent: string) {
        const group = new THREE.Group();
        group.name = "logo_slot_markers";
        const color = new THREE.Color(accent);
        const bbox = new THREE.Box3();
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();

        const seen = new Set<string>();
        const logoSlots = (booth.userData.logoSlots || []) as THREE.Object3D[];

        for (const slot of logoSlots) {
            if (seen.has(slot.name)) continue;
            seen.add(slot.name);

            slot.updateWorldMatrix(true, true);
            bbox.setFromObject(slot);
            if (!isFinite(bbox.min.x)) continue;
            bbox.getSize(size);
            bbox.getCenter(center);

            const marker = new THREE.Group();

            const geo = new THREE.BoxGeometry(
                Math.max(size.x, 0.08) * 1.14,
                Math.max(size.y, 0.08) * 1.14,
                Math.max(size.z, 0.06) * 1.6
            );
            const edges = new THREE.LineSegments(
                new THREE.EdgesGeometry(geo),
                new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95, depthTest: false })
            );
            edges.position.copy(center);
            edges.renderOrder = 999;
            marker.add(edges);
            marker.userData.ring = edges;

            const sprite = labelSprite(SLOT_LABELS[slot.name] || slot.name, accent);
            sprite.position.copy(center);
            sprite.position.y += Math.max(size.y, 0.2) * 0.72 + 0.22;
            sprite.renderOrder = 1000;
            marker.add(sprite);
            marker.userData.sprite = sprite;

            group.add(marker);
            geo.dispose();
        }
        return group;
    }

    function labelSprite(text: string, accent: string) {
        const pad = 24;
        const measure = document.createElement("canvas").getContext("2d")!;
        measure.font = "700 32px 'Montserrat', sans-serif";
        const w = Math.ceil(measure.measureText(text).width) + pad * 2;
        const h = 68;

        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const ctx = c.getContext("2d")!;

        ctx.fillStyle = accent;
        ctx.beginPath();
        const r = 16;
        ctx.moveTo(r, 0);
        ctx.arcTo(w, 0, w, h, r);
        ctx.arcTo(w, h, 0, h, r);
        ctx.arcTo(0, h, 0, 0, r);
        ctx.arcTo(0, 0, w, 0, r);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "700 32px 'Montserrat', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, w / 2, h / 2 + 1);

        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        const sprite = new THREE.Mesh(
            new THREE.PlaneGeometry((w / h) * 0.38, 0.38),
            new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, toneMapped: false })
        );
        return sprite;
    }

    async function assembleBoothScene() {
        if (!scene || !renderer) return;

        if (boothGroup) {
            scene.remove(boothGroup);
            disposeObject(boothGroup);
            boothGroup = null;
        }
        if (markersGroup) {
            scene.remove(markersGroup);
            disposeObject(markersGroup);
            markersGroup = null;
        }

        invalidateBoothTextures();
        const tex = await buildBoothTextures();
        boothGroup = createBooth(tex, {
            accent: brand.primaryColor || "#009dd6",
            darkAccent: brand.darkColor || "#04547c",
            lightAccent: brand.lightTint || "rgba(0,157,214,0.12)",
            palette: brand.palette || [brand.primaryColor, brand.darkColor],
            detail: "high"
        });
        boothGroup.updateMatrixWorld(true);
        boothGroup.traverse((o) => {
            o.matrixAutoUpdate = false;
        });
        scene.add(boothGroup);

        markersGroup = makeSlotMarkers(boothGroup, brand.primaryColor || "#009dd6");
        markersGroup.visible = showLogoSlots;
        scene.add(markersGroup);
    }

    $effect(() => {
        // Track reactive brand changes
        const _color = brand.primaryColor;
        const _dark = brand.darkColor;
        const _logo = brand.logo;
        const _name = brand.name;
        if (scene && renderer) {
            assembleBoothScene();
        }
    });

    $effect(() => {
        if (isLive && containerEl && canvasEl && !isInitialized) {
            isLoading = true;
            const timer = setTimeout(() => {
                init();
            }, 50);
            return () => clearTimeout(timer);
        }
    });

    let isInitialized = false;
    let animateFn: (() => void) | null = null;
    let handleResize: (() => void) | null = null;
    let onBrandUpdated: (() => void) | null = null;

    const init = async () => {
        if (!containerEl || !canvasEl || isInitialized) return;
        isInitialized = true;

        try {
            isLoading = true;

            await new Promise((r) => setTimeout(r, 20));

            scene = new THREE.Scene();
            scene.background = backdropGradient("#eef1f6", "#ccd2de");

            const w = containerEl.clientWidth;
            const h = containerEl.clientHeight;

            camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 60);
            camera.position.copy(HOME.pos);

            renderer = new THREE.WebGLRenderer({
                canvas: canvasEl,
                antialias: true,
                powerPreference: "high-performance"
            });
            renderer.setSize(w, h);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, QUALITY.maxPixelRatio));
            renderer.shadowMap.enabled = QUALITY.shadows;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.05;

            controls = new OrbitControls(camera, canvasEl);
            controls.target.copy(HOME.target);
            controls.enableDamping = true;
            controls.dampingFactor = 0.06;
            controls.enablePan = false;
            controls.minDistance = 5.5;
            controls.maxDistance = 20;
            controls.minPolarAngle = 0.25;
            controls.maxPolarAngle = Math.PI / 2.08;
            controls.autoRotate = autoRotate;
            controls.autoRotateSpeed = 0.42;

            controls.addEventListener("start", () => {
                autoRotate = false;
            });

            // Lighting & Environment
            const envPromise = envFor(renderer);
            envPromise.then((env) => {
                if (scene) {
                    scene.environment = env;
                    scene.environmentIntensity = QUALITY.envMapIntensity * 0.7;
                }
            });

            studioRig = studioLights(scene, { intensity: 0.95, shadowRadius: 12 });

            // Concrete Ground Plinth
            const ground = new THREE.Mesh(new THREE.CircleGeometry(28, 72), mat.concrete(0xbfc4cf, 26));
            ground.rotation.x = -Math.PI / 2;
            ground.position.y = -0.002;
            ground.receiveShadow = true;
            scene.add(ground);

            await new Promise((r) => setTimeout(r, 20));

            // Assemble Procedural Kubix Stand
            await assembleBoothScene();

            await new Promise((r) => setTimeout(r, 20));

            renderPath = createRenderPath(renderer, scene, camera, {
                aoRadius: 0.35,
                aoIntensity: 1.0,
                bloomStrength: 0.1,
                bloomThreshold: 0.95,
                vignetteDarkness: 1.0,
                vignetteOffset: 1.15
            });

            handleResize = () => {
                if (!containerEl || !camera || !renderer) return;
                const nw = containerEl.clientWidth;
                const nh = containerEl.clientHeight;
                camera.aspect = nw / nh;
                camera.updateProjectionMatrix();
                renderer.setSize(nw, nh);
                renderPath?.setSize(nw, nh);
            };
            window.addEventListener("resize", handleResize);

            // Game Loop
            let clock = new THREE.Clock();
            let markerT = 0;

            const animate = () => {
                animationFrameId = requestAnimationFrame(animate);
                const dt = clock.getDelta();

                if (isTransitioning && camera && controls) {
                    const elapsed = performance.now() - transitionStartTime;
                    const t = Math.min(elapsed / transitionDuration, 1);
                    // Smooth easeOutCubic
                    const ease = 1 - Math.pow(1 - t, 3);

                    camera.position.lerpVectors(camStartPos, camEndPos, ease);
                    controls.target.lerpVectors(targetStart, targetEnd, ease);

                    if (t >= 1) {
                        isTransitioning = false;
                    }
                }

                if (controls) {
                    controls.autoRotate = autoRotate && !isTransitioning;
                    controls.update();
                }

                if (showLogoSlots && markersGroup && camera) {
                    markerT += dt;
                    const pulse = 0.6 + Math.sin(markerT * 3.5) * 0.4;
                    for (const m of markersGroup.children) {
                        const ring = m.userData.ring as THREE.LineSegments | undefined;
                        if (ring?.material && "opacity" in (ring.material as any)) {
                            (ring.material as any).opacity = pulse;
                        }
                        const sprite = m.userData.sprite as THREE.Mesh | undefined;
                        if (sprite?.material && "opacity" in (sprite.material as any)) {
                            (sprite.material as any).opacity = 0.8 + pulse * 0.2;
                            sprite.quaternion.copy(camera.quaternion);
                        }
                    }
                }

                if (renderPath) {
                    renderPath.render();
                } else if (renderer && scene && camera) {
                    renderer.render(scene, camera);
                }
            };

            animateFn = animate;
            animate();

            onBrandUpdated = async () => {
                isLoading = true;
                await new Promise((r) => setTimeout(r, 20));
                await assembleBoothScene();
                isLoading = false;
            };
            window.addEventListener("ekson_brand_updated", onBrandUpdated);

            await new Promise((r) => setTimeout(r, 60));
        } catch (err) {
            console.error("TrueScaleDemo init error:", err);
        } finally {
            isLoading = false;
        }
    };

    onDestroy(() => {
        if (handleResize) window.removeEventListener("resize", handleResize);
        if (onBrandUpdated) window.removeEventListener("ekson_brand_updated", onBrandUpdated);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        renderPath?.dispose();
        renderPath = null;
        controls?.dispose();
        renderer?.dispose();
        disposeMaterialCache();
        if (scene) disposeObject(scene);
    });
</script>

<div class="relative w-full h-full min-h-90 overflow-hidden select-none group/canvas" bind:this={containerEl}>
    {#if !isLive}
        <div class="relative w-full h-full min-h-[38vh] flex items-center justify-center bg-slate-900 overflow-hidden group/image">
            {#if imageSrc}
                <img src={imageSrc} alt="{brand.name} True Scale Demo" class="w-full h-full object-cover" />
            {:else}
                <div class="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
                    <div class="size-16 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-4 border border-white/10 shadow-xl">
                        <span class="material-symbols-rounded text-4xl text-primary" style="color: {brand.primaryColor || '#009dd6'};">view_in_ar</span>
                    </div>
                    <h3 class="text-xl font-bold tracking-tight mb-1">{brand.name} Exhibition Island</h3>
                    <p class="text-xs text-white/60 max-w-xs">1:1 Scale 3D Architectural Model</p>
                </div>
            {/if}

            <!-- Hover Overlay with 'Try it live' button -->
            <div class="absolute inset-0 bg-slate-950/40 backdrop-blur-xs opacity-0 hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center p-4">
                <button
                    onclick={handleTryLive}
                    class="px-6 py-3 rounded-full font-semibold text-xs text-white shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer border border-white/20"
                    style="background-color: {brand.primaryColor || '#009dd6'};"
                >
                    <span class="material-symbols-rounded text-base">
                        {!brand.isCustom ? 'auto_awesome' : 'play_arrow'}
                    </span>
                    <span>{!brand.isCustom ? 'Try for your brand' : 'Try it live'}</span>
                </button>
            </div>
        </div>
    {:else}
        <canvas bind:this={canvasEl} class="w-full h-full block cursor-grab active:cursor-grabbing outline-none"></canvas>

        <!-- Floating Glass Toolbar Header (Minimized & Auto-adapts to small & large screens) -->
        <div class="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
            <!-- Stand Title (Hidden on tiny screens to save space) -->
            <div class="hidden sm:flex bg-white/80 backdrop-blur-xl px-3.5 py-1.5 rounded-full border border-black/5 shadow-sm pointer-events-auto">
                <span class="text-xs font-bold text-text tracking-tight">
                    {brand.name} Stand
                </span>
            </div>

            <!-- Single Consolidated Floating Control Pill -->
            <div class="flex items-center gap-1 bg-white/85 backdrop-blur-xl p-1.5 rounded-full border border-black/5 shadow-md pointer-events-auto ml-auto">
                <!-- Camera Preset Select Dropdown -->
                <div class="relative flex items-center px-2.5 py-1 rounded-full bg-black/5 hover:bg-black/10 transition cursor-pointer">
                    <span class="material-symbols-rounded text-base text-text/70 mr-1 shrink-0">videocam</span>
                    <select
                        bind:value={activePreset}
                        onchange={(e) => applyPreset((e.target as HTMLSelectElement).value)}
                        class="bg-transparent text-xs font-semibold text-text focus:outline-none cursor-pointer pr-1"
                        aria-label="Camera Angle Preset"
                    >
                        {#each presets as preset}
                            <option value={preset.id}>{preset.title}</option>
                        {/each}
                    </select>
                </div>

                <!-- Lighting Mode Cycle Button -->
                <button
                    onclick={cycleLighting}
                    class="size-7.5 rounded-full flex items-center justify-center transition cursor-pointer bg-black/5 hover:bg-black/10 text-text/80"
                    title="Lighting: {lightingMode.toUpperCase()} (Click to cycle)"
                    aria-label="Cycle Lighting Mode"
                >
                    <span class="material-symbols-rounded text-base">
                        {lightingMode === 'studio' ? 'wb_sunny' : lightingMode === 'night' ? 'dark_mode' : 'bolt'}
                    </span>
                </button>

                <!-- Show/Hide Logo Slots Toggle -->
                <button
                    onclick={toggleLogoSlots}
                    class="size-7.5 rounded-full flex items-center justify-center transition cursor-pointer {showLogoSlots ? 'bg-primary text-white shadow-xs' : 'bg-black/5 hover:bg-black/10 text-text/80'}"
                    style={showLogoSlots ? `background-color: ${brand.primaryColor};` : ''}
                    title={showLogoSlots ? "Hide Brand Logo Markers" : "Show Brand Logo Markers"}
                    aria-label="Toggle Brand Logo Markers"
                >
                    <span class="material-symbols-rounded text-base">
                        {showLogoSlots ? 'visibility_off' : 'verified'}
                    </span>
                </button>

                <!-- Auto-Rotate Toggle -->
                <button
                    onclick={() => (autoRotate = !autoRotate)}
                    class="size-7.5 rounded-full flex items-center justify-center transition cursor-pointer {autoRotate ? 'bg-primary/10 text-primary font-bold' : 'bg-black/5 hover:bg-black/10 text-text/80'}"
                    title={autoRotate ? "Pause Auto Rotation" : "Start Auto Rotation"}
                    aria-label="Toggle Auto Rotation"
                >
                    <span class="material-symbols-rounded text-base">
                        {autoRotate ? 'sync' : 'sync_disabled'}
                    </span>
                </button>

                <!-- Reset View Button -->
                <button
                    onclick={resetView}
                    class="size-7.5 rounded-full bg-black/5 hover:bg-black/10 text-text/80 flex items-center justify-center transition cursor-pointer"
                    title="Reset View"
                    aria-label="Reset View"
                >
                    <span class="material-symbols-rounded text-base">refresh</span>
                </button>

                <!-- Exit Live View Button -->
                <button
                    onclick={stopLive}
                    class="size-7.5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition cursor-pointer shadow-xs"
                    title="Exit Live View"
                    aria-label="Exit Live View"
                >
                    <span class="material-symbols-rounded text-base">close</span>
                </button>
            </div>
        </div>

        <!-- Loading Overlay -->
        {#if isLoading}
            <div class="absolute inset-0 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center text-white z-30 transition-opacity duration-300">
                <div class="size-10 border-3 border-white/20 border-t-primary rounded-full animate-spin mb-3 shadow-lg" style="border-top-color: {brand.primaryColor};"></div>
                <span class="text-xs font-bold uppercase tracking-widest text-white/90">
                    Assembling True Scale Stand…
                </span>
            </div>
        {/if}
    {/if}
</div>
