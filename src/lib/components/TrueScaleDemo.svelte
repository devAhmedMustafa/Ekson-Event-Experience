<script lang="ts">
    import { Canvas, T } from "@threlte/core";
    import { GLTF } from "@threlte/extras";
    import * as THREE from "three";
    import { onMount } from "svelte";

    let position = $state<[x: number, y: number, z: number]>([0, 3.2, 5.2]);
    let rotation = $state<[x: number, y: number, z: number]>([-0.115, 0, 0]);
    let container = $state<HTMLElement | null>(null);

    onMount(() => {
        const tempCam = new THREE.PerspectiveCamera();
        
        const startCamPos = new THREE.Vector3(0, 3.2, 5.2);
        const startLookAt = new THREE.Vector3(0, 2.6, 0);

        const endCamPos = new THREE.Vector3(3.5, 3.2, 3.5);
        const endLookAt = new THREE.Vector3(0, 0, 0);

        function updateCamera(progress: number) {
            const curPos = new THREE.Vector3().lerpVectors(startCamPos, endCamPos, progress);
            const curLookAt = new THREE.Vector3().lerpVectors(startLookAt, endLookAt, progress);

            tempCam.position.copy(curPos);
            tempCam.lookAt(curLookAt);

            position = [curPos.x, curPos.y, curPos.z];
            rotation = [tempCam.rotation.x, tempCam.rotation.y, tempCam.rotation.z];
        }

        function handleScroll() {
            if (!container) return;
            const rect = container.getBoundingClientRect();
            const scrollableHeight = container.offsetHeight - window.innerHeight;
            if (scrollableHeight <= 0) return;
            const scrolled = -rect.top;
            const progress = Math.min(Math.max(scrolled / scrollableHeight, 0), 1);
            updateCamera(progress);
        }

        window.addEventListener("scroll", handleScroll, { passive: true });
        window.addEventListener("resize", handleScroll, { passive: true });
        handleScroll();

        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", handleScroll);
        };
    });
</script>

<div bind:this={container} class="relative w-full h-[400vh]">
    <div class="sticky w-full h-screen top-0 overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-full z-10 flex flex-col justify-center items-center text-black pointer-events-none">
            <h2 class="text-7xl font-bold mb-4">True Scale Demo</h2>
        </div>
        
        <div class="w-full h-full">
            <Canvas>
                <T.PerspectiveCamera
                    {position}
                    {rotation}
                    fov={75}
                    near={0.1}
                    far={1000}
                    makeDefault
                />
                
                <T.DirectionalLight
                    position={[5, 5, 0]}
                    intensity={1}
                />
                <T.AmbientLight intensity={0.8} />
                <GLTF
                    url="3D/trueScale.glb"
                    position={[0, 0, 0]}
                    scale={0.2}
                    rotation={[0, Math.PI / 2, 0]}
                />
            </Canvas>
        </div>
    </div>
</div>

