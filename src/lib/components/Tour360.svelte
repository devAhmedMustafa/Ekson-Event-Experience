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
            const scrolled = -rect.top;
            const progress = Math.min(Math.max(scrolled / scrollableHeight, 0), 1);
            rotationY = progress * MAX_ROTATION;
        }

        window.addEventListener("scroll", handleScroll, {passive: false});
        handleScroll();
        return () => {
            window.removeEventListener("scroll", handleScroll);
        }
    });
</script>

<div bind:this={container} class="relative w-full h-[400vh]">
    
    <div class="sticky top-0 h-screen">
        <div class="absolute z-10 text-white">
            <h2 class="text-9xl">360 Tour</h2>
            <p class="text-2xl">Some description</p>
        
            <ul class="flex gap-2">
                <li>Football</li>
                <li>Dwell</li>
                <li>Leads</li>
            </ul>
        </div>
        {#if texture}
            <Canvas>
                <T.PerspectiveCamera makeDefault position={[0, 0, 0.1]} fov={75} rotation.y={rotationY}/>
        
                <T.Mesh>
                    <T.SphereGeometry args={[500, 60, 40]} />
                    <T.MeshBasicMaterial map={texture} side={THREE.BackSide} />
                </T.Mesh>
            </Canvas>
        {/if}
    </div>
</div>
