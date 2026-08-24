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

        // Load HDR Asset: pan.hdr
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
    class="relative w-full h-full min-h-90 overflow-hidden select-none font-sans group/canvas"
    role="region"
    aria-label="360 Tour Viewport"
>
    <!-- WebGL Canvas for 2K HDR Panorama -->
    <canvas bind:this={canvasEl} class="w-full h-full block cursor-grab active:cursor-grabbing outline-none"></canvas>

    <!-- Top Overlay Header: Title Badge & Controls Toolbar -->
    <div class="absolute top-3 left-3 right-3 flex items-start justify-between pointer-events-none z-10">
        <!-- Title & Subtitle Badge (Matches TrueScale Styling) -->
        <div class="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-black/10 shadow-xs flex flex-col pointer-events-auto">
            <div class="flex items-center gap-1.5">
                <span class="size-2 rounded-full animate-pulse" style="background-color: {brand.primaryColor};"></span>
                <span class="font-mono text-[9px] uppercase tracking-wider font-bold text-text">
                    03 / Spatial Tour
                </span>
            </div>
            <span class="text-[11px] font-black uppercase text-text tracking-tight mt-0.5">
                360° Environment
            </span>
        </div>

        <!-- Controls Toolbar -->
        <div class="flex items-center gap-1.5 pointer-events-auto">
            <!-- Auto Rotate Toggle -->
            <button
                onclick={toggleAutoRotate}
                class="p-1.5 rounded-xl border shadow-xs transition cursor-pointer {autoRotate ? 'bg-white text-primary border-primary/30' : 'bg-white/90 text-text/60 border-black/10'}"
                title="Toggle Auto Rotation"
            >
                <span class="material-symbols-rounded text-[16px]">
                    {autoRotate ? 'sync' : 'sync_disabled'}
                </span>
            </button>

            <!-- Reset View -->
            <button
                onclick={resetView}
                class="p-1.5 bg-white/90 hover:bg-white text-text border border-black/10 rounded-xl shadow-xs transition cursor-pointer"
                title="Reset Camera View"
            >
                <span class="material-symbols-rounded text-[16px]">refresh</span>
            </button>
        </div>
    </div>

    <!-- Bottom Left: Directional Navigation Chips -->
    <div class="absolute bottom-3 left-3 flex flex-wrap gap-1 z-10 max-w-[85%] pointer-events-auto">
        <button
            onclick={() => jumpDirection(0)}
            class="px-2 py-1 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider transition border cursor-pointer shadow-xs bg-white/90 text-text/80 border-black/10 hover:bg-white"
        >
            NORTH
        </button>
        <button
            onclick={() => jumpDirection(Math.PI / 2)}
            class="px-2 py-1 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider transition border cursor-pointer shadow-xs bg-white/90 text-text/80 border-black/10 hover:bg-white"
        >
            EAST
        </button>
        <button
            onclick={() => jumpDirection(Math.PI)}
            class="px-2 py-1 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider transition border cursor-pointer shadow-xs bg-white/90 text-text/80 border-black/10 hover:bg-white"
        >
            SOUTH
        </button>
        <button
            onclick={() => jumpDirection(-Math.PI / 2)}
            class="px-2 py-1 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider transition border cursor-pointer shadow-xs bg-white/90 text-text/80 border-black/10 hover:bg-white"
        >
            WEST
        </button>
    </div>

    <!-- Bottom Right: Interaction Hint Badge -->
    <div class="absolute bottom-3 right-3 flex items-center bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-black/10 shadow-xs z-10 gap-1.5 text-[9px] font-mono font-bold uppercase text-text/70">
        <span class="material-symbols-rounded text-[14px]" style="color: {brand.primaryColor};">touch_app</span>
        <span>Drag to look · Scroll to zoom</span>
    </div>
</div>
