<script lang="ts">
    import { Canvas, T } from "@threlte/core";
    import * as THREE from "three";
    import { onMount, onDestroy } from "svelte";

    let texture = $state<THREE.Texture | null>(null);
    let targetYaw = $state(0);
    let targetPitch = $state(0);
    let currentYaw = $state(0);
    let currentPitch = $state(0);
    let isDragging = $state(false);
    let autoRotate = $state(true);

    let startX = 0;
    let startY = 0;
    let dragStartYaw = 0;
    let dragStartPitch = 0;
    let animationFrameId: number | null = null;

    function handleMouseDown(e: MouseEvent) {
        const target = e.target as HTMLElement;
        if (target.closest("button, input, a")) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        dragStartYaw = targetYaw;
        dragStartPitch = targetPitch;
    }

    function handleMouseMove(e: MouseEvent) {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        targetYaw = dragStartYaw + dx * 0.0035;
    }

    function handleMouseUp() {
        isDragging = false;
    }

    function handleTouchStart(e: TouchEvent) {
        if (e.touches.length !== 1) return;
        const target = e.target as HTMLElement;
        if (target.closest("button, input, a")) return;
        isDragging = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        dragStartYaw = targetYaw;
        dragStartPitch = targetPitch;
    }

    function handleTouchMove(e: TouchEvent) {
        if (!isDragging || e.touches.length !== 1) return;
        const dx = e.touches[0].clientX - startX;
        targetYaw = dragStartYaw + dx * 0.0045;
    }

    function handleTouchEnd() {
        isDragging = false;
    }

    function resetView() {
        targetYaw = 0;
        targetPitch = 0;
    }

    function jumpDirection(radians: number) {
        targetYaw = radians;
        targetPitch = 0;
    }

    function toggleAutoRotate() {
        autoRotate = !autoRotate;
    }

    onMount(() => {
        const loader = new THREE.TextureLoader();
        loader.load("3D/panorama.jpg", (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            if (tex == null) return;
            texture = tex;
        });

        const loop = () => {
            if (autoRotate && !isDragging) {
                targetYaw += 0.0015;
            }
            currentYaw += (targetYaw - currentYaw) * 0.08;
            currentPitch += (targetPitch - currentPitch) * 0.08;
            animationFrameId = requestAnimationFrame(loop);
        };

        animationFrameId = requestAnimationFrame(loop);

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    });

    onDestroy(() => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
    });
</script>

<svelte:window
    onmouseup={handleMouseUp}
    ontouchend={handleTouchEnd}
/>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
    class="relative w-full h-full min-h-95 sm:min-h-110 md:min-h-full flex flex-col justify-between p-3 sm:p-5 select-none font-sans overflow-hidden bg-slate-900 cursor-grab active:cursor-grabbing"
    onmousedown={handleMouseDown}
    onmousemove={handleMouseMove}
    ontouchstart={handleTouchStart}
    ontouchmove={handleTouchMove}
    role="region"
    aria-label="360 Tour Viewport"
>
    <!-- Top Header Badge & Title (Overlaid with Glassmorphism) -->
    <div class="relative z-10 flex items-start justify-between gap-2 pointer-events-none">
        <div class="p-2.5 sm:p-3 text-white max-w-xs">
            <div class="flex items-center gap-1.5 font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-primary font-bold mb-0.5">
                <span class="size-1.5 bg-primary"></span>
                <span>03 / SPATIAL TOUR</span>
            </div>
            <h3 class="text-lg sm:text-xl md:text-2xl font-black uppercase tracking-tight leading-tight">
                360° Tour
            </h3>
            <p class="text-[10px] sm:text-xs text-white/80 font-normal mt-0.5 leading-snug">
                Step inside high-fidelity 360° event venues.
            </p>
        </div>

        <div class="pointer-events-auto flex items-center gap-1">
            <button
                onclick={toggleAutoRotate}
                class="size-7 sm:size-8 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white rounded-full flex items-center justify-center border border-white/10 shadow-xs transition cursor-pointer"
                title={autoRotate ? "Pause Auto-Rotation" : "Enable Auto-Rotation"}
                aria-label="Toggle Auto-Rotation"
            >
                <span class="material-symbols-rounded text-[16px] {autoRotate ? 'text-primary animate-spin' : 'text-white/60'}">
                    sync
                </span>
            </button>
            <button
                onclick={resetView}
                class="size-7 sm:size-8 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white rounded-full flex items-center justify-center border border-white/10 shadow-xs transition cursor-pointer"
                title="Reset View"
                aria-label="Reset View"
            >
                <span class="material-symbols-rounded text-[16px] text-white/80">
                    center_focus_strong
                </span>
            </button>
        </div>
    </div>

    <!-- 3D Panorama Canvas (Mouse & Touch Draggable) -->
    <div class="absolute inset-0 w-full h-full z-0 pointer-events-none">
        {#if texture}
            <Canvas>
                <T.PerspectiveCamera
                    makeDefault
                    position={[0, 0, 0.05]}
                    fov={75}
                    rotation={[0, currentYaw, 0]}
                />
                <T.Mesh>
                    <T.SphereGeometry args={[500, 60, 40]} />
                    <T.MeshBasicMaterial map={texture} side={THREE.BackSide} />
                </T.Mesh>
            </Canvas>
        {/if}
    </div>

    <!-- Bottom HUD Controls & Directional Navigation -->
    <div class="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-white/10 mt-auto pointer-events-none">
        <!-- Interaction Hint -->
        <div class="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 shadow-xs font-mono text-[9px] text-white/80 uppercase pointer-events-auto">
            <span class="material-symbols-rounded text-[13px] text-primary">touch_app</span>
            <span>DRAG HORIZONTALLY (360°)</span>
        </div>

        <!-- Cardinal Direction Quick Views -->
        <div class="flex items-center gap-1 bg-black/50 backdrop-blur-md p-1 rounded-full border border-white/10 shadow-xs pointer-events-auto overflow-x-auto scrollbar-none">
            <button
                onclick={() => jumpDirection(0)}
                class="px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded-full transition cursor-pointer border bg-white/10 text-white hover:bg-primary border-white/10"
            >
                NORTH
            </button>
            <button
                onclick={() => jumpDirection(Math.PI / 2)}
                class="px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded-full transition cursor-pointer border bg-white/10 text-white hover:bg-primary border-white/10"
            >
                EAST
            </button>
            <button
                onclick={() => jumpDirection(Math.PI)}
                class="px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded-full transition cursor-pointer border bg-white/10 text-white hover:bg-primary border-white/10"
            >
                SOUTH
            </button>
            <button
                onclick={() => jumpDirection(-Math.PI / 2)}
                class="px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded-full transition cursor-pointer border bg-white/10 text-white hover:bg-primary border-white/10"
            >
                WEST
            </button>
        </div>
    </div>
</div>
