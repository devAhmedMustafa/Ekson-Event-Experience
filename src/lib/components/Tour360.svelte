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
    let clock: THREE.Clock | null = null;

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

        clock = new THREE.Clock();
        startLoop();
    }

    function startLoop() {
        if (animationFrameId) return;
        if (!clock) clock = new THREE.Clock();
        else clock.start();

        const loop = () => {
            const dt = Math.min(0.05, clock ? clock.getDelta() : 0.016);

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

    let isInitialized = false;

    onMount(() => {
        if (typeof window !== "undefined" && "IntersectionObserver" in window && containerEl) {
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            if (!isInitialized) {
                                isInitialized = true;
                                initPano();
                            } else {
                                startLoop();
                            }
                        } else {
                            if (animationFrameId) {
                                cancelAnimationFrame(animationFrameId);
                                animationFrameId = null;
                            }
                        }
                    });
                },
                { rootMargin: "150px" }
            );
            observer.observe(containerEl);
            return () => observer.disconnect();
        } else {
            initPano();
        }
    });

    onDestroy(() => {
        cleanupPano();
    });
</script>

<div
    bind:this={containerEl}
    class="relative w-full h-full min-h-90 overflow-hidden select-none group/canvas"
    role="region"
    aria-label="360 Tour Viewport"
>
    <!-- WebGL Canvas for 2K HDR Panorama -->
    <canvas bind:this={canvasEl} class="w-full h-full block cursor-grab active:cursor-grabbing outline-none"></canvas>

    <!-- Floating Glass Toolbar Header (Minimized & Auto-adapts to small & large screens) -->
    <div class="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <!-- Title Badge (Hidden on tiny screens) -->
        <div class="hidden sm:flex bg-white/80 backdrop-blur-xl px-3.5 py-1.5 rounded-full border border-black/5 shadow-sm pointer-events-auto">
            <span class="text-xs font-bold text-text tracking-tight">
                360° Panorama View
            </span>
        </div>

        <!-- Single Consolidated Control Pill -->
        <div class="flex items-center gap-1 bg-white/85 backdrop-blur-xl p-1.5 rounded-full border border-black/5 shadow-md pointer-events-auto ml-auto">
            <!-- Compass Direction Dropdown -->
            <div class="relative flex items-center px-2.5 py-1 rounded-full bg-black/5 hover:bg-black/10 transition cursor-pointer">
                <span class="material-symbols-rounded text-base text-text/70 mr-1 shrink-0">explore</span>
                <select
                    onchange={(e) => jumpDirection(Number((e.target as HTMLSelectElement).value))}
                    class="bg-transparent text-xs font-semibold text-text focus:outline-none cursor-pointer pr-1"
                    aria-label="Jump Compass Direction"
                >
                    <option value="0">North</option>
                    <option value={Math.PI / 2}>East</option>
                    <option value={Math.PI}>South</option>
                    <option value={-Math.PI / 2}>West</option>
                </select>
            </div>

            <!-- Auto-Rotate Toggle Button -->
            <button
                onclick={toggleAutoRotate}
                class="size-7.5 rounded-full flex items-center justify-center transition cursor-pointer {autoRotate ? 'bg-primary/10 text-primary font-bold' : 'bg-black/5 hover:bg-black/10 text-text/80'}"
                title={autoRotate ? "Pause Auto Rotation" : "Start Auto Rotation"}
                aria-label="Toggle Auto Rotation"
            >
                <span class="material-symbols-rounded text-base">
                    {autoRotate ? 'sync' : 'sync_disabled'}
                </span>
            </button>

            <!-- Reset Camera View Button -->
            <button
                onclick={resetView}
                class="size-7.5 rounded-full bg-black/5 hover:bg-black/10 text-text/80 flex items-center justify-center transition cursor-pointer"
                title="Reset View"
                aria-label="Reset View"
            >
                <span class="material-symbols-rounded text-base">refresh</span>
            </button>
        </div>
    </div>
</div>
