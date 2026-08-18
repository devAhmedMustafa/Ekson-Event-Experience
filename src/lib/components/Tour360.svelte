<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import * as THREE from "three";
    import { loadHDR } from "$lib/three/env";
    import { brand } from "$lib/brand.svelte";

    let containerEl = $state<HTMLElement | null>(null);
    let canvasEl = $state<HTMLCanvasElement | null>(null);

    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let animationFrameId: number | null = null;

    let autoRotate = $state(true);
    let isLoaded = $state(false);

    // Panorama view limits & FOV
    const PANO_FOV = { min: 40, max: 85, home: 70 };
    const PANO_PITCH_LIMIT = 0.85;

    let yaw = Math.PI * 0.15;
    let pitch = 0;
    let targetYaw = Math.PI * 0.15;
    let targetPitch = 0;
    let fov = PANO_FOV.home;
    let targetFov = PANO_FOV.home;

    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

    function handlePointerDown(e: PointerEvent) {
        const target = e.target as HTMLElement;
        if (target.closest("button, input, a")) return;
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        containerEl?.setPointerCapture?.(e.pointerId);
    }

    function handlePointerMove(e: PointerEvent) {
        if (!isDragging) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;

        const speed = (fov / PANO_FOV.home) * 0.0032;
        targetYaw -= dx * speed;
        targetPitch = Math.max(-PANO_PITCH_LIMIT, Math.min(PANO_PITCH_LIMIT, targetPitch - dy * speed));
    }

    function handlePointerUp(e: PointerEvent) {
        isDragging = false;
        try {
            containerEl?.releasePointerCapture?.(e.pointerId);
        } catch (_) {}
    }

    function handleWheel(e: WheelEvent) {
        e.preventDefault();
        targetFov = Math.max(PANO_FOV.min, Math.min(PANO_FOV.max, targetFov + Math.sign(e.deltaY) * 4));
    }

    function resetView() {
        targetYaw = Math.PI * 0.15;
        targetPitch = 0;
        targetFov = PANO_FOV.home;
    }

    function jumpDirection(radians: number) {
        targetYaw = radians;
        targetPitch = 0;
    }

    function toggleAutoRotate() {
        autoRotate = !autoRotate;
    }

    async function initPano() {
        if (typeof window === "undefined" || !canvasEl || !containerEl) return;
        cleanupPano();

        const w = containerEl.clientWidth || 300;
        const h = containerEl.clientHeight || 300;

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(PANO_FOV.home, w / h, 0.1, 100);
        camera.position.set(0, 0, 0);

        renderer = new THREE.WebGLRenderer({
            canvas: canvasEl,
            antialias: true,
            alpha: false,
            powerPreference: "high-performance"
        });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.35;

        // Load HDR Asset: modern_buildings_2_2k.hdr
        try {
            const hdr = await loadHDR();
            if (hdr) {
                hdr.generateMipmaps = true;
                hdr.minFilter = THREE.LinearMipmapLinearFilter;
                hdr.magFilter = THREE.LinearFilter;
                hdr.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
                hdr.needsUpdate = true;
                scene.background = hdr;
                scene.backgroundIntensity = 1.0;
            } else {
                scene.background = new THREE.Color("#0b0f17");
            }
        } catch (e) {
            console.warn("HDR load error in Tour360:", e);
            scene.background = new THREE.Color("#0b0f17");
        }

        isLoaded = true;

        window.addEventListener("resize", handleResize);
        containerEl.addEventListener("pointerdown", handlePointerDown);
        containerEl.addEventListener("pointermove", handlePointerMove);
        containerEl.addEventListener("pointerup", handlePointerUp);
        containerEl.addEventListener("pointercancel", handlePointerUp);
        containerEl.addEventListener("wheel", handleWheel, { passive: false });

        const clock = new THREE.Clock();

        const loop = () => {
            const dt = Math.min(0.05, clock.getDelta());

            if (autoRotate && !isDragging) {
                targetYaw += dt * 0.08;
            }

            yaw += (targetYaw - yaw) * Math.min(1, dt * 10);
            pitch += (targetPitch - pitch) * Math.min(1, dt * 10);
            fov += (targetFov - fov) * Math.min(1, dt * 10);

            if (camera) {
                camera.fov = fov;
                camera.updateProjectionMatrix();

                // Spherical look-at target vector
                const cosPitch = Math.cos(pitch);
                const lookX = Math.sin(yaw) * cosPitch;
                const lookY = Math.sin(pitch);
                const lookZ = Math.cos(yaw) * cosPitch;
                camera.lookAt(lookX, lookY, lookZ);
            }

            if (renderer && scene && camera) {
                renderer.render(scene, camera);
            }

            animationFrameId = requestAnimationFrame(loop);
        };

        animationFrameId = requestAnimationFrame(loop);
    }

    function handleResize() {
        if (!containerEl || !renderer || !camera) return;
        const w = containerEl.clientWidth;
        const h = containerEl.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    }

    function cleanupPano() {
        if (typeof window === "undefined") return;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        window.removeEventListener("resize", handleResize);
        if (containerEl) {
            containerEl.removeEventListener("pointerdown", handlePointerDown);
            containerEl.removeEventListener("pointermove", handlePointerMove);
            containerEl.removeEventListener("pointerup", handlePointerUp);
            containerEl.removeEventListener("pointercancel", handlePointerUp);
            containerEl.removeEventListener("wheel", handleWheel);
        }
        renderer?.dispose();
    }

    onMount(() => {
        initPano();
    });

    onDestroy(() => {
        cleanupPano();
    });
</script>

<div
    bind:this={containerEl}
    class="relative w-full h-full min-h-[380px] sm:min-h-[440px] md:min-h-full flex flex-col justify-between p-3.5 sm:p-5 select-none font-sans overflow-hidden bg-slate-950 cursor-grab active:cursor-grabbing touch-none"
    role="region"
    aria-label="360 Tour Viewport"
>
    <!-- WebGL Canvas for 2K HDR Panorama -->
    <canvas bind:this={canvasEl} class="absolute inset-0 w-full h-full block z-0 outline-none"></canvas>

    <!-- Top Header Badge & Title (Overlaid with Glassmorphism) -->
    <div class="relative z-10 flex items-start justify-between gap-2 pointer-events-none">
        <div class="p-2.5 sm:p-3 text-white max-w-xs bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg">
            <div class="flex items-center gap-1.5 font-mono text-[9px] sm:text-[10px] uppercase tracking-widest font-bold mb-0.5" style="color: {brand.primaryColor};">
                <span class="size-1.5 rounded-full" style="background-color: {brand.primaryColor};"></span>
                <span>03 / SPATIAL TOUR</span>
            </div>
            <h3 class="text-base sm:text-lg md:text-xl font-black uppercase tracking-tight leading-tight text-white">
                360° Environment
            </h3>
            <p class="text-[10px] sm:text-xs text-white/70 font-normal mt-0.5 leading-snug">
                Equirectangular 2K HDR venue capture.
            </p>
        </div>

        <div class="pointer-events-auto flex items-center gap-1.5">
            <button
                onclick={toggleAutoRotate}
                class="size-8 sm:size-9 bg-slate-900/80 hover:bg-slate-900 backdrop-blur-md text-white rounded-full flex items-center justify-center border border-white/15 shadow-md transition cursor-pointer"
                title={autoRotate ? "Pause Auto-Rotation" : "Enable Auto-Rotation"}
                aria-label="Toggle Auto-Rotation"
            >
                <span class="material-symbols-rounded text-base {autoRotate ? 'animate-spin' : 'text-white/60'}" style="{autoRotate ? `color: ${brand.primaryColor}` : ''}">
                    sync
                </span>
            </button>
            <button
                onclick={resetView}
                class="size-8 sm:size-9 bg-slate-900/80 hover:bg-slate-900 backdrop-blur-md text-white rounded-full flex items-center justify-center border border-white/15 shadow-md transition cursor-pointer"
                title="Reset View"
                aria-label="Reset View"
            >
                <span class="material-symbols-rounded text-base text-white/80">
                    center_focus_strong
                </span>
            </button>
        </div>
    </div>

    <!-- Bottom HUD Controls & Directional Navigation -->
    <div class="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-white/10 mt-auto pointer-events-none">
        <!-- Interaction Hint -->
        <div class="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 shadow-md font-mono text-[9px] sm:text-[10px] text-white/80 uppercase pointer-events-auto">
            <span class="material-symbols-rounded text-[13px]" style="color: {brand.primaryColor};">touch_app</span>
            <span>DRAG TO LOOK AROUND · SCROLL TO ZOOM</span>
        </div>

        <!-- Cardinal Direction Quick Views -->
        <div class="flex items-center gap-1 bg-slate-900/80 backdrop-blur-md p-1 rounded-full border border-white/15 shadow-md pointer-events-auto overflow-x-auto scrollbar-none">
            <button
                onclick={() => jumpDirection(0)}
                class="px-2.5 py-1 text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider rounded-full transition cursor-pointer border bg-white/5 text-white/80 hover:text-white border-white/10 hover:border-white/30"
            >
                NORTH
            </button>
            <button
                onclick={() => jumpDirection(Math.PI / 2)}
                class="px-2.5 py-1 text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider rounded-full transition cursor-pointer border bg-white/5 text-white/80 hover:text-white border-white/10 hover:border-white/30"
            >
                EAST
            </button>
            <button
                onclick={() => jumpDirection(Math.PI)}
                class="px-2.5 py-1 text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider rounded-full transition cursor-pointer border bg-white/5 text-white/80 hover:text-white border-white/10 hover:border-white/30"
            >
                SOUTH
            </button>
            <button
                onclick={() => jumpDirection(-Math.PI / 2)}
                class="px-2.5 py-1 text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider rounded-full transition cursor-pointer border bg-white/5 text-white/80 hover:text-white border-white/10 hover:border-white/30"
            >
                WEST
            </button>
        </div>
    </div>
</div>
