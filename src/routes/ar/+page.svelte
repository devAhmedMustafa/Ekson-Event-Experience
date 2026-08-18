<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { page } from "$app/state";
    import * as THREE from "three";
    import { brand } from "$lib/brand.svelte";
    import { MERCH, createMerchModel, type MerchItem } from "$lib/three/merch";
    import { getLogoImage, logoTexture } from "$lib/three/logo-texture";
    import { envFor, contactShadow, disposeObject } from "$lib/three/env";
    import { QUALITY } from "$lib/three/quality";
    import favicon from "$lib/assets/favicon.svg";

    let containerEl = $state<HTMLElement | null>(null);
    let canvasEl = $state<HTMLCanvasElement | null>(null);

    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let pivot: THREE.Group | null = null;
    let activeModelGroup: THREE.Group | null = null;
    let shadowMesh: THREE.Mesh | null = null;
    let animationFrameId: number | null = null;

    // Derived or URL parameters
    let displayName = $derived(page.url.searchParams.get("name") || brand.name || "Ekson");
    let displayColor = $derived(page.url.searchParams.get("color") || brand.primaryColor || "#009dd6");
    let displayDark = $derived(page.url.searchParams.get("dark") || brand.darkColor || "#04547c");

    // Selected Merch Model
    const urlModel = page.url.searchParams.get("m") || page.url.searchParams.get("model") || "mug";
    let selectedModelId = $state(MERCH.some((m) => m.id === urlModel) ? urlModel : "mug");
    let selectedItem = $derived(MERCH.find((m) => m.id === selectedModelId) || MERCH[0]);

    let autoRotate = $state(true);
    let isLoaded = $state(false);

    // Orbit Camera State
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let cameraTheta = 0.6;
    let cameraPhi = 0.55;
    let cameraDistance = 0.35;
    let targetTheta = 0.6;
    let targetPhi = 0.55;
    let targetDistance = 0.35;

    // Touch interaction
    let initialTouchDist = 0;

    let logoImg: HTMLImageElement | null = null;
    let logoMap: THREE.Texture | null = null;

    async function loadModel(modelId: string) {
        if (!scene || !pivot || !camera) return;

        if (activeModelGroup) {
            pivot.remove(activeModelGroup);
            disposeObject(activeModelGroup);
            activeModelGroup = null;
        }
        if (shadowMesh) {
            pivot.remove(shadowMesh);
            disposeObject(shadowMesh);
            shadowMesh = null;
        }

        selectedModelId = modelId;

        // Build Merch Model with Brand Logo and Accent
        activeModelGroup = createMerchModel(modelId, {
            logoMap,
            accent: displayColor
        });

        const focus = activeModelGroup.userData.focus || {
            center: new THREE.Vector3(0, 0.05, 0),
            radius: 0.12
        };

        activeModelGroup.position.y = -focus.center.y;
        pivot.add(activeModelGroup);

        // Ground Contact Shadow
        shadowMesh = contactShadow(focus.radius * 1.8, 0.38);
        shadowMesh.position.y = -focus.center.y - 0.002;
        pivot.add(shadowMesh);

        // Adjust camera target framing based on model scale
        const dist = Math.max(0.2, focus.radius * 4.2);
        targetDistance = dist;
        cameraDistance = dist;
        targetTheta = 0.6;
        targetPhi = 0.55;
    }

    function selectModel(modelId: string) {
        selectedModelId = modelId;
        loadModel(modelId);
        if (typeof window !== "undefined" && window.history.replaceState) {
            const url = new URL(window.location.href);
            url.searchParams.set("m", modelId);
            window.history.replaceState({}, "", url.toString());
        }
    }

    function resetCamera() {
        const focus = activeModelGroup?.userData.focus || { radius: 0.12 };
        const dist = Math.max(0.2, focus.radius * 4.2);
        targetTheta = 0.6;
        targetPhi = 0.55;
        targetDistance = dist;
    }

    async function initScene() {
        if (typeof window === "undefined" || !canvasEl || !containerEl) return;
        cleanupScene();

        const w = containerEl.clientWidth;
        const h = containerEl.clientHeight;

        scene = new THREE.Scene();
        scene.background = new THREE.Color("#0b0f17");

        camera = new THREE.PerspectiveCamera(35, w / h, 0.01, 20);
        camera.position.set(0, 0.2, 0.6);

        renderer = new THREE.WebGLRenderer({
            canvas: canvasEl,
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // PMREM Environment Image-Based Lighting
        try {
            const env = await envFor(renderer);
            scene.environment = env;
            scene.environmentIntensity = QUALITY.envMapIntensity * 0.9;
        } catch (e) {
            console.warn("PMREM environment fallback:", e);
        }

        // 3-Point Studio Product Lighting Rig
        const keyLight = new THREE.DirectionalLight(0xfff5ea, 2.0);
        keyLight.position.set(1.2, 2.0, 1.5);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(1024, 1024);
        keyLight.shadow.bias = -0.0003;
        scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0xdee8ff, 0.85);
        fillLight.position.set(-1.8, 1.2, -1.0);
        scene.add(fillLight);

        const rimLight = new THREE.DirectionalLight(new THREE.Color(displayColor), 1.2);
        rimLight.position.set(0, 1.8, -1.6);
        scene.add(rimLight);

        const hemiLight = new THREE.HemisphereLight(0xf4f7fd, 0x1f242e, 0.55);
        scene.add(hemiLight);

        // Pivot Root
        pivot = new THREE.Group();
        pivot.name = "merch_pivot";
        scene.add(pivot);

        // Logo Texture Generation
        try {
            logoImg = await getLogoImage();
            logoMap = logoTexture(logoImg, { padding: 0.08 });
        } catch (err) {
            console.warn("Logo texture generation fallback:", err);
            logoMap = logoTexture(null, { padding: 0.08 });
        }

        await loadModel(selectedModelId);

        // Event listeners
        window.addEventListener("resize", handleResize);
        containerEl.addEventListener("pointerdown", handlePointerDown);
        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);
        containerEl.addEventListener("wheel", handleWheel, { passive: false });
        containerEl.addEventListener("touchstart", handleTouchStart, { passive: true });
        containerEl.addEventListener("touchmove", handleTouchMove, { passive: false });

        isLoaded = true;

        // Render Loop
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);

            // Smooth orbit interpolation
            cameraTheta += (targetTheta - cameraTheta) * 0.1;
            cameraPhi += (targetPhi - cameraPhi) * 0.1;
            cameraDistance += (targetDistance - cameraDistance) * 0.1;

            if (autoRotate && !isDragging) {
                targetTheta += 0.005;
            }

            if (camera) {
                const x = cameraDistance * Math.sin(cameraPhi) * Math.sin(cameraTheta);
                const y = cameraDistance * Math.cos(cameraPhi);
                const z = cameraDistance * Math.sin(cameraPhi) * Math.cos(cameraTheta);
                camera.position.set(x, y, z);
                camera.lookAt(0, 0, 0);
            }

            if (renderer && scene && camera) {
                renderer.render(scene, camera);
            }
        };

        animate();
    }

    function handleResize() {
        if (!containerEl || !renderer || !camera) return;
        const w = containerEl.clientWidth;
        const h = containerEl.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    }

    function handlePointerDown(e: PointerEvent) {
        if (e.pointerType === "touch") return;
        isDragging = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
    }

    function handlePointerMove(e: PointerEvent) {
        if (!isDragging) return;
        const dx = e.clientX - prevMouseX;
        const dy = e.clientY - prevMouseY;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;

        targetTheta -= dx * 0.007;
        targetPhi = Math.max(0.12, Math.min(Math.PI / 2 + 0.15, targetPhi - dy * 0.007));
    }

    function handlePointerUp() {
        isDragging = false;
    }

    function handleWheel(e: WheelEvent) {
        e.preventDefault();
        const focus = activeModelGroup?.userData.focus || { radius: 0.12 };
        const minDist = focus.radius * 1.5;
        const maxDist = focus.radius * 8.0;
        targetDistance = Math.max(minDist, Math.min(maxDist, targetDistance + e.deltaY * 0.0006));
    }

    function handleTouchStart(e: TouchEvent) {
        if (e.touches.length === 1) {
            isDragging = true;
            prevMouseX = e.touches[0].clientX;
            prevMouseY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
            initialTouchDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
        }
    }

    function handleTouchMove(e: TouchEvent) {
        if (e.touches.length === 1 && isDragging) {
            const dx = e.touches[0].clientX - prevMouseX;
            const dy = e.touches[0].clientY - prevMouseY;
            prevMouseX = e.touches[0].clientX;
            prevMouseY = e.touches[0].clientY;

            targetTheta -= dx * 0.008;
            targetPhi = Math.max(0.12, Math.min(Math.PI / 2 + 0.15, targetPhi - dy * 0.008));
        } else if (e.touches.length === 2) {
            e.preventDefault();
            const currentDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const diff = initialTouchDist - currentDist;
            const focus = activeModelGroup?.userData.focus || { radius: 0.12 };
            const minDist = focus.radius * 1.5;
            const maxDist = focus.radius * 8.0;
            targetDistance = Math.max(minDist, Math.min(maxDist, targetDistance + diff * 0.002));
            initialTouchDist = currentDist;
        }
    }

    function cleanupScene() {
        if (typeof window === "undefined") return;
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        if (scene) disposeObject(scene);
        renderer?.dispose();
    }

    onMount(() => {
        initScene();
    });

    onDestroy(() => {
        cleanupScene();
    });
</script>

<svelte:head>
    <title>{displayName} · {selectedItem.name} 3D Preview</title>
    <link rel="icon" href={favicon} />
</svelte:head>

<div class="fixed inset-0 w-full h-full bg-slate-950 text-white flex flex-col justify-between select-none font-sans overflow-hidden">
    <!-- Top Header & Model Switcher Bar -->
    <header class="relative z-20 w-full px-3 sm:px-6 py-2.5 sm:py-3.5 flex flex-col gap-2 border-b border-white/10 bg-slate-900/90 backdrop-blur-md">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5 sm:gap-3">
                <a
                    href="/"
                    class="size-8 sm:size-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition border border-white/15 cursor-pointer shrink-0"
                    title="Back to Catalog"
                >
                    <span class="material-symbols-rounded text-base sm:text-lg">arrow_back</span>
                </a>

                <div class="flex flex-col">
                    <div class="flex items-center gap-1.5 font-mono text-[8px] sm:text-[9px] uppercase tracking-wider text-white/60 font-bold">
                        <span class="size-1.5 rounded-full" style="background-color: {displayColor};"></span>
                        <span>3D Giveaway Merch Suite · 1:1 Metric Scale</span>
                    </div>
                    <h1 class="text-xs sm:text-sm md:text-base font-black uppercase text-white tracking-tight flex items-center gap-1.5 sm:gap-2 truncate">
                        <span>{displayName} {selectedItem.name}</span>
                        <span class="px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-mono font-bold uppercase border shrink-0" style="background-color: {displayColor}25; border-color: {displayColor}; color: {displayColor};">
                            Live PBR
                        </span>
                    </h1>
                </div>
            </div>

            <div class="flex items-center gap-1.5 sm:gap-2">
                <!-- Auto Rotate Toggle -->
                <button
                    onclick={() => (autoRotate = !autoRotate)}
                    class="px-2.5 sm:px-3 py-1.5 rounded-xl border text-[9px] sm:text-[10px] font-mono font-bold uppercase transition flex items-center gap-1 cursor-pointer {autoRotate ? 'bg-white/15 text-white border-white/30' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}"
                    title="Toggle Auto Rotation"
                >
                    <span class="material-symbols-rounded text-xs sm:text-sm {autoRotate ? 'animate-spin' : ''}">rotate_right</span>
                    <span class="hidden sm:inline">Rotate</span>
                </button>

                <!-- Reset Camera View -->
                <button
                    onclick={resetCamera}
                    class="px-2.5 sm:px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/15 text-[9px] sm:text-[10px] font-mono font-bold uppercase transition flex items-center gap-1 cursor-pointer"
                    title="Reset Camera View"
                >
                    <span class="material-symbols-rounded text-xs sm:text-sm">restart_alt</span>
                    <span class="hidden sm:inline">Reset</span>
                </button>
            </div>
        </div>

        <!-- 4 Merch Model Selector Tabs -->
        <div class="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {#each MERCH as item}
                <button
                    onclick={() => selectModel(item.id)}
                    class="px-2.5 sm:px-3.5 py-1 rounded-xl text-[9px] sm:text-[10px] font-mono font-bold uppercase transition flex items-center gap-1.5 cursor-pointer shrink-0 border {selectedModelId === item.id ? 'text-white shadow-sm ring-1' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'}"
                    style="{selectedModelId === item.id ? `background-color: ${displayColor}; border-color: ${displayColor}; ring-color: ${displayColor};` : ''}"
                >
                    <span class="material-symbols-rounded text-[13px] sm:text-[14px]">
                        {item.id === 'mug' ? 'coffee' : item.id === 'pen' ? 'edit' : item.id === 'notebook' ? 'menu_book' : 'shopping_bag'}
                    </span>
                    <span>{item.name}</span>
                </button>
            {/each}
        </div>
    </header>

    <!-- Center 3D Interactive Viewport -->
    <main
        bind:this={containerEl}
        class="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden touch-none cursor-grab active:cursor-grabbing"
    >
        <!-- WebGL Canvas -->
        <canvas bind:this={canvasEl} class="w-full h-full block outline-none"></canvas>

        <!-- Dynamic Hologram Ambient Ring -->
        <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div class="size-80 sm:size-112 rounded-full border border-dashed border-white/10 animate-spin-slow opacity-50"></div>
        </div>

        <!-- Touch / Mouse Hint Overlay -->
        {#if isLoaded}
            <div class="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none z-10 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[9px] font-mono text-white/70 shadow-lg flex items-center gap-1.5 sm:gap-2">
                <span class="material-symbols-rounded text-sm" style="color: {displayColor};">touch_app</span>
                <span>Drag to rotate · Pinch/scroll to zoom</span>
            </div>
        {/if}
    </main>

    <!-- Bottom Specs & Model Information Tray -->
    <footer class="relative z-20 w-full px-3 sm:px-6 py-2.5 sm:py-3.5 bg-slate-900/90 backdrop-blur-md border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 font-mono">
        <!-- Model Description & Specs -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-3 w-full sm:w-auto">
            <div class="flex items-center gap-1.5">
                <span class="size-2 rounded-full" style="background-color: {displayColor};"></span>
                <span class="text-[10px] sm:text-xs font-bold text-white uppercase">{selectedItem.name}</span>
            </div>
            <span class="text-[8px] sm:text-[9px] text-white/60 truncate">{selectedItem.blurb}</span>
        </div>

        <!-- Specification Pill Tags -->
        <div class="flex items-center gap-1 sm:gap-1.5 flex-wrap w-full sm:w-auto justify-start sm:justify-end">
            {#each selectedItem.specs as spec}
                <span class="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[8px] sm:text-[9px] text-white/70 font-medium">
                    {spec}
                </span>
            {/each}
        </div>
    </footer>
</div>

<style>
    @keyframes spinSlow {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }
    .animate-spin-slow {
        animation: spinSlow 30s linear infinite;
    }
</style>
