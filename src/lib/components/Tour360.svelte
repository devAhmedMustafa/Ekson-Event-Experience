<script lang="ts">
    import { Canvas, T } from "@threlte/core";
    import * as THREE from "three";
    import { onMount } from "svelte";

    let texture = $state<THREE.Texture | null>(null);
    let rotationY = $state(0);
    let container = $state<HTMLElement | null>(null);

    const MAX_ROTATION = Math.PI * 2;

    onMount(() => {
        const loader = new THREE.TextureLoader();
        loader.load("3D/panorama.jpg", (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            if (tex == null) return;
            texture = tex;
        });

        function handleScroll() {
            if (!container) return;
            const rect = container.getBoundingClientRect();
            const scrollableHeight = container.offsetHeight - window.innerHeight;
            if (scrollableHeight <= 0) return;
            const scrolled = -rect.top;
            const progress = Math.min(Math.max(scrolled / scrollableHeight, 0), 1);
            rotationY = progress * MAX_ROTATION;
        }

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    });
</script>

<div bind:this={container} class="relative w-full h-[300vh] sm:h-[400vh]">
    <div class="sticky top-0 h-[100dvh] md:h-screen w-full overflow-hidden flex flex-col justify-between p-4 sm:p-8 md:p-12 select-none">
        <!-- Floating Info HUD -->
        <div class="relative z-10 max-w-xl bg-black/40 backdrop-blur-md p-4 sm:p-6 text-white border border-white/10 shadow-lg">
            <div class="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-primary font-bold mb-1">
                <span class="size-1.5 bg-primary"></span>
                <span>03 / Virtual Presence</span>
            </div>
            <h2 class="text-3xl sm:text-5xl md:text-7xl font-black uppercase tracking-tight leading-none text-white">
                360° Tour
            </h2>
            <p class="text-xs sm:text-sm text-white/80 mt-2 leading-relaxed">
                Step into a high-fidelity 360-degree immersive spatial reproduction of real-world event venues and architectural booths.
            </p>

            <div class="flex flex-wrap gap-2 mt-4">
                <span class="px-2.5 py-1 bg-white/10 border border-white/10 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
                    Photorealistic
                </span>
                <span class="px-2.5 py-1 bg-white/10 border border-white/10 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
                    Scroll Navigation
                </span>
                <span class="px-2.5 py-1 bg-white/10 border border-white/10 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
                    WebXR Ready
                </span>
            </div>
        </div>

        <!-- 3D Panorama Sphere Canvas -->
        <div class="absolute inset-0 w-full h-full z-0">
            {#if texture}
                <Canvas>
                    <T.PerspectiveCamera makeDefault position={[0, 0, 0.1]} fov={75} rotation.y={rotationY} />
                    <T.Mesh>
                        <T.SphereGeometry args={[500, 60, 40]} />
                        <T.MeshBasicMaterial map={texture} side={THREE.BackSide} />
                    </T.Mesh>
                </Canvas>
            {/if}
        </div>
    </div>
</div>
