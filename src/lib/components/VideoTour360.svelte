<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import * as THREE from "three";
    import { brand } from "$lib/brand.svelte";

    let containerEl = $state<HTMLElement | null>(null);
    let canvasEl = $state<HTMLCanvasElement | null>(null);
    let videoEl = $state<HTMLVideoElement | null>(null);

    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let animationFrameId: number | null = null;
    let clock: THREE.Clock | null = null;
    let videoTexture: THREE.VideoTexture | THREE.CanvasTexture | null = null;

    let autoRotate = $state(true);
    let isPlaying = $state(true);
    let isLoaded = $state(false);

    // Panorama view limits & FOV
    const PANO_FOV = { min: 40, max: 85, home: 70 };
    const PANO_PITCH_LIMIT = 0.85;

    let yaw = Math.PI * 0.25;
    let pitch = 0;
    let targetYaw = Math.PI * 0.25;
    let targetPitch = 0;
    let fov = PANO_FOV.home;
    let targetFov = PANO_FOV.home;

    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

    function handlePointerDown(e: PointerEvent) {
        const target = e.target as HTMLElement;
        if (target.closest("button, input, select, a")) return;
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
        targetYaw = Math.PI * 0.25;
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

    function togglePlay() {
        isPlaying = !isPlaying;
        if (videoEl) {
            if (isPlaying) videoEl.play().catch(() => {});
            else videoEl.pause();
        }
    }

    // Procedural equirectangular video canvas fallback generator for high performance
    function createProcedural360VideoCanvas() {
        const canvas = document.createElement("canvas");
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext("2d")!;

        let time = 0;
        function updateCanvas() {
            time += 0.02;
            const w = canvas.width;
            const h = canvas.height;

            // Sky to horizon gradient
            const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
            skyGrad.addColorStop(0, "#0b1329");
            skyGrad.addColorStop(0.4, "#1e293b");
            skyGrad.addColorStop(0.7, "#0f172a");
            skyGrad.addColorStop(1, "#020617");
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, w, h);

            // Animated grid & lights
            ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
            ctx.lineWidth = 1.5;

            // Horizon line
            ctx.beginPath();
            ctx.moveTo(0, h / 2);
            ctx.lineTo(w, h / 2);
            ctx.stroke();

            // Latitude lines
            for (let y = h * 0.1; y < h; y += h * 0.1) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.stroke();
            }

            // Moving longitude bars & spotlights
            for (let x = 0; x < w; x += 64) {
                const shiftX = (x + time * 30) % w;
                ctx.beginPath();
                ctx.moveTo(shiftX, 0);
                ctx.lineTo(shiftX, h);
                ctx.stroke();

                // Dynamic light beacons in 360 video space
                const beaconY = h * 0.5 + Math.sin(time + x * 0.01) * (h * 0.15);
                ctx.fillStyle = `rgba(0, 157, 214, ${0.4 + Math.sin(time * 2 + x) * 0.3})`;
                ctx.beginPath();
                ctx.arc(shiftX, beaconY, 6, 0, Math.PI * 2);
                ctx.fill();
            }

            // Brand Label Overlay
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 24px 'Plus Jakarta Sans', sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(`${brand.name} 360° Interactive Video Tour`, w / 2, h * 0.45);
        }

        return { canvas, updateCanvas };
    }

    async function initVideoPano() {
        if (typeof window === "undefined" || !canvasEl || !containerEl) return;
        cleanupVideoPano();

        const w = containerEl.clientWidth || 300;
        const h = containerEl.clientHeight || 300;

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(PANO_FOV.home, w / h, 0.1, 1000);
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

        // Create 360 inverted sphere
        const geometry = new THREE.SphereGeometry(500, 60, 40);
        geometry.scale(-1, 1, 1); // Invert so inside is visible

        const procedural = createProcedural360VideoCanvas();
        const canvasTex = new THREE.CanvasTexture(procedural.canvas);
        canvasTex.colorSpace = THREE.SRGBColorSpace;
        canvasTex.wrapS = THREE.RepeatWrapping;
        canvasTex.wrapT = THREE.ClampToEdgeWrapping;

        const material = new THREE.MeshBasicMaterial({ map: canvasTex });
        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);

        isLoaded = true;

        window.addEventListener("resize", handleResize);
        containerEl.addEventListener("pointerdown", handlePointerDown);
        containerEl.addEventListener("pointermove", handlePointerMove);
        containerEl.addEventListener("pointerup", handlePointerUp);
        containerEl.addEventListener("pointercancel", handlePointerUp);
        containerEl.addEventListener("wheel", handleWheel, { passive: false });

        clock = new THREE.Clock();

        const loop = () => {
            const dt = Math.min(0.05, clock ? clock.getDelta() : 0.016);

            if (isPlaying) {
                procedural.updateCanvas();
                canvasTex.needsUpdate = true;
            }

            if (autoRotate && !isDragging) {
                targetYaw += dt * 0.08;
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

    function cleanupVideoPano() {
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
                                initVideoPano();
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
            initVideoPano();
        }
    });

    onDestroy(() => {
        cleanupVideoPano();
    });
</script>

<div
    bind:this={containerEl}
    class="relative w-full h-full min-h-90 overflow-hidden select-none group/canvas"
    role="region"
    aria-label="360 Video Panorama Viewport"
>
    <!-- WebGL Canvas for 360 Video Sphere -->
    <canvas bind:this={canvasEl} class="w-full h-full block cursor-grab active:cursor-grabbing outline-none"></canvas>

    <!-- Floating Glass Toolbar Header (Minimized & Auto-adapts to small & large screens) -->
    <div class="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <!-- Title Badge (Hidden on tiny screens) -->
        <div class="hidden sm:flex items-center gap-1.5 bg-white backdrop-blur-xl px-3.5 py-1.5 rounded-full border border-black/5 shadow-sm pointer-events-auto">
            <span class="size-2 rounded-full bg-red-500 animate-pulse"></span>
            <span class="text-xs font-bold text-text tracking-tight">
                360° Video Panorama
            </span>
        </div>

        <!-- Single Consolidated Control Pill -->
        <div class="flex items-center gap-1 bg-white backdrop-blur-xl p-1.5 rounded-full border border-black/5 shadow-md pointer-events-auto ml-auto">
            <!-- Play / Pause Video Button -->
            <button
                onclick={togglePlay}
                class="px-2.5 py-1 rounded-full text-xs font-semibold transition flex items-center gap-1 cursor-pointer {isPlaying ? 'bg-primary text-white shadow-xs' : 'bg-black/5 hover:bg-black/10 text-text/80'}"
                style={isPlaying ? "background-color: var(--color-primary)" : ""}
                title={isPlaying ? "Pause 360° Video" : "Play 360° Video"}
                aria-label="Toggle Video Playback"
            >
                <span class="material-symbols-rounded text-base">
                    {isPlaying ? 'pause' : 'play_arrow'}
                </span>
                <span class="hidden md:inline">{isPlaying ? 'LIVE' : 'PLAY'}</span>
            </button>

            <!-- Compass Direction Dropdown -->
            <div class="relative flex items-center px-2.5 py-1 rounded-full bg-black/5 hover:bg-black/10 transition cursor-pointer">
                <span class="material-symbols-rounded text-base text-text/70 mr-1 shrink-0">explore</span>
                <select
                    onchange={(e) => jumpDirection(Number((e.target as HTMLSelectElement).value))}
                    class="bg-transparent text-xs font-semibold text-text focus:outline-none cursor-pointer pr-1"
                    aria-label="Jump Compass Direction"
                >
                    <option value={Math.PI / 4}>North</option>
                    <option value={Math.PI * 0.75}>East</option>
                    <option value={-Math.PI * 0.75}>South</option>
                    <option value={-Math.PI / 4}>West</option>
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
