<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import * as THREE from "three";
    import { brand } from "$lib/brand.svelte";
    import { createMerchModel } from "$lib/three/merch";
    import { getLogoImage, logoTexture } from "$lib/three/logo-texture";
    import { envFor, contactShadow, disposeObject } from "$lib/three/env";
    import { QUALITY } from "$lib/three/quality";

    interface Props {
        modelId: string;
        name?: string;
        icon?: string;
    }

    let { modelId, name = "", icon = "cube" }: Props = $props();

    let containerEl = $state<HTMLElement | null>(null);
    let canvasEl = $state<HTMLCanvasElement | null>(null);

    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let pivot: THREE.Group | null = null;
    let activeModelGroup: THREE.Group | null = null;
    let shadowMesh: THREE.Mesh | null = null;
    let animationFrameId: number | null = null;

    let isLoaded = $state(false);
    let autoRotate = $state(true);

    // Orbit Interaction State
    let spin = $state(-0.5);
    let targetSpin = -0.5;
    let tilt = $state(-0.1);
    let targetTilt = -0.1;

    let isDragging = false;
    let lastSingleX = 0;
    let lastSingleY = 0;

    let logoImg: HTMLImageElement | null = null;
    let logoMap: THREE.Texture | null = null;

    async function loadModel(id: string) {
        if (!scene || !pivot) return;

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

        const accentColor = brand.primaryColor || "#009dd6";

        activeModelGroup = createMerchModel(id, {
            logoMap,
            logoImage: logoImg,
            accent: accentColor
        });

        const focus = activeModelGroup.userData.focus || {
            center: new THREE.Vector3(0, 0.05, 0),
            radius: 0.12
        };

        activeModelGroup.position.y = -focus.center.y;
        pivot.add(activeModelGroup);

        shadowMesh = contactShadow(focus.radius * 1.8, 0.38);
        shadowMesh.position.y = -focus.center.y - 0.002;
        pivot.add(shadowMesh);
    }

    function resetView() {
        targetSpin = -0.5;
        spin = -0.5;
        targetTilt = -0.1;
        tilt = -0.1;
        autoRotate = true;
    }

    /* ── Pointer Controls ────────────────────────────────────────── */

    function onPointerDown(e: PointerEvent) {
        if (!containerEl) return;
        isDragging = true;
        autoRotate = false;
        lastSingleX = e.clientX;
        lastSingleY = e.clientY;
        containerEl.setPointerCapture?.(e.pointerId);
    }

    function onPointerMove(e: PointerEvent) {
        if (!isDragging) return;
        const dx = e.clientX - lastSingleX;
        const dy = e.clientY - lastSingleY;
        lastSingleX = e.clientX;
        lastSingleY = e.clientY;

        targetSpin += dx * 0.015;
        targetTilt = Math.max(-0.8, Math.min(0.8, targetTilt + dy * 0.01));
    }

    function onPointerUp(e: PointerEvent) {
        isDragging = false;
        try {
            containerEl?.releasePointerCapture?.(e.pointerId);
        } catch (_) {}
    }

    /* ── Scene Setup & Lifecycle ────────────────────────────────── */

    async function initScene() {
        if (typeof window === "undefined" || !canvasEl || !containerEl) return;

        const w = containerEl.clientWidth || 200;
        const h = containerEl.clientHeight || 200;

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(34, w / h, 0.01, 20);
        camera.position.set(0, 0.2, 0.6);

        renderer = new THREE.WebGLRenderer({
            canvas: canvasEl,
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;

        try {
            const env = await envFor(renderer);
            scene.environment = env;
            scene.environmentIntensity = QUALITY.envMapIntensity * 0.8;
        } catch (e) {
            console.warn("PMREM env fallback:", e);
        }

        // Lighting
        const keyLight = new THREE.DirectionalLight(0xfff5ea, 2.0);
        keyLight.position.set(1.2, 2.0, 1.5);
        scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0xdee8ff, 0.85);
        fillLight.position.set(-1.8, 1.2, -1.0);
        scene.add(fillLight);

        const rimLight = new THREE.DirectionalLight(new THREE.Color(brand.primaryColor || "#009dd6"), 1.2);
        rimLight.position.set(0, 1.8, -1.6);
        scene.add(rimLight);

        const hemiLight = new THREE.HemisphereLight(0xf4f7fd, 0x1f242e, 0.6);
        scene.add(hemiLight);

        pivot = new THREE.Group();
        scene.add(pivot);

        try {
            logoImg = await getLogoImage();
            logoMap = logoTexture(logoImg, { padding: 0.08 });
        } catch (err) {
            logoMap = logoTexture(null, { padding: 0.08 });
        }

        await loadModel(modelId);

        window.addEventListener("resize", handleResize);
        containerEl.addEventListener("pointerdown", onPointerDown);
        containerEl.addEventListener("pointermove", onPointerMove);
        containerEl.addEventListener("pointerup", onPointerUp);
        containerEl.addEventListener("pointercancel", onPointerUp);

        isLoaded = true;

        const clock = new THREE.Clock();

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            const dt = Math.min(0.05, clock.getDelta());

            if (!isDragging && autoRotate) {
                targetSpin += dt * 0.5;
            }
            spin += (targetSpin - spin) * Math.min(1, dt * 8);
            tilt += (targetTilt - tilt) * Math.min(1, dt * 8);

            const focus = activeModelGroup?.userData.focus || { center: new THREE.Vector3(0, 0.05, 0), radius: 0.12 };
            const dist = focus.radius * 4.6;

            if (pivot) {
                pivot.rotation.y = spin;
                pivot.position.set(0, 0, 0);
            }
            if (camera) {
                camera.position.set(0, focus.radius * (1.0 - tilt * 1.3), dist);
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
        if (w === 0 || h === 0) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    }

    function cleanupScene() {
        if (typeof window === "undefined") return;
        window.removeEventListener("resize", handleResize);
        if (containerEl) {
            containerEl.removeEventListener("pointerdown", onPointerDown);
            containerEl.removeEventListener("pointermove", onPointerMove);
            containerEl.removeEventListener("pointerup", onPointerUp);
            containerEl.removeEventListener("pointercancel", onPointerUp);
        }
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        if (scene) disposeObject(scene);
        renderer?.dispose();
        renderer = null;
        scene = null;
        camera = null;
        pivot = null;
        activeModelGroup = null;
    }

    $effect(() => {
        if (typeof window === "undefined") return;
        const _color = brand.primaryColor;
        const _name = brand.name;
        const _logo = brand.logo;

        if (scene && pivot) {
            (async () => {
                try {
                    logoImg = await getLogoImage();
                    logoMap = logoTexture(logoImg, { padding: 0.08 });
                } catch (_) {}
                loadModel(modelId);
            })();
        }
    });

    onMount(() => {
        initScene();

        const onBrandUpdated = async () => {
            if (scene && pivot) {
                try {
                    logoImg = await getLogoImage();
                    logoMap = logoTexture(logoImg, { padding: 0.08 });
                } catch (_) {}
                loadModel(modelId);
            }
        };
        window.addEventListener("ekson_brand_updated", onBrandUpdated);

        return () => {
            if (typeof window !== "undefined") {
                window.removeEventListener("ekson_brand_updated", onBrandUpdated);
            }
            cleanupScene();
        };
    });

    onDestroy(() => {
        cleanupScene();
    });
</script>

<div
    bind:this={containerEl}
    class="relative w-full h-full min-h-28 rounded-2xl overflow-hidden touch-none cursor-grab active:cursor-grabbing select-none group/box"
>
    <!-- WebGL Canvas -->
    <canvas bind:this={canvasEl} class="w-full h-full block outline-none"></canvas>

    <!-- Top Badge -->
    <div class="absolute top-2 left-2 pointer-events-none z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 text-[9px] font-mono font-bold text-white shadow-xs">
        <span class="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span class="uppercase tracking-wider">3D Live</span>
    </div>

    <!-- Bottom Action Controls -->
    <div class="absolute bottom-2 right-2 z-10 flex items-center gap-1 opacity-80 group-hover/box:opacity-100 transition duration-200">
        <button
            onclick={() => (autoRotate = !autoRotate)}
            class="size-6 rounded-lg bg-black/60 hover:bg-white/20 text-white/80 hover:text-white border border-white/10 flex items-center justify-center backdrop-blur-xs transition cursor-pointer"
            title={autoRotate ? "Pause Spin" : "Auto Spin"}
            aria-label="Toggle auto spin"
        >
            <span class="material-symbols-rounded text-xs {autoRotate ? 'animate-spin-slow' : ''}">sync</span>
        </button>

        <button
            onclick={resetView}
            class="size-6 rounded-lg bg-black/60 hover:bg-white/20 text-white/80 hover:text-white border border-white/10 flex items-center justify-center backdrop-blur-xs transition cursor-pointer"
            title="Reset View Angle"
            aria-label="Reset view angle"
        >
            <span class="material-symbols-rounded text-xs">restart_alt</span>
        </button>
    </div>

    <!-- Drag Hint on Hover -->
    <div class="absolute inset-x-0 bottom-2 left-2 pointer-events-none z-10 opacity-0 group-hover/box:opacity-100 transition duration-200">
        <span class="text-[8px] font-mono text-white/50 bg-black/40 px-1.5 py-0.5 rounded-full backdrop-blur-xs">
            Drag to rotate
        </span>
    </div>
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
        animation: spinSlow 12s linear infinite;
    }
</style>
