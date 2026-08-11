<script lang="ts">
    import { Canvas, T } from "@threlte/core";
    import { GLTF } from "@threlte/extras";
    import * as THREE from "three";
    import { onMount } from "svelte";

    // Camera State
    let position = $state<[x: number, y: number, z: number]>([0, 3.2, 5.2]);
    let rotation = $state<[x: number, y: number, z: number]>([-0.115, 0, 0]);
    let scrollProgress = $state(0);
    let container = $state<HTMLElement | null>(null);

    // Camera Waypoints for smooth cinematic journey
    const cameraKeyframes = [
        { progress: 0.0, pos: new THREE.Vector3(0, 3.8, 5.8), look: new THREE.Vector3(0, 1.2, 0), title: "Macro Architecture", desc: "1:1 True-Scale Volumetric Envelope" },
        { progress: 0.35, pos: new THREE.Vector3(4.2, 2.8, 3.8), look: new THREE.Vector3(0, 0.9, 0), title: "Isometric Structural Depth", desc: "Dynamic Facade & Modular Geometry" },
        { progress: 0.70, pos: new THREE.Vector3(-3.5, 1.8, 3.2), look: new THREE.Vector3(0, 0.7, 0), title: "Interactive Product Station", desc: "Digital Touchpoints & Display Integration" },
        { progress: 1.0, pos: new THREE.Vector3(0, 1.4, 3.2), look: new THREE.Vector3(0, 0.8, 0), title: "Eye-Level Booth Immersion", desc: "Visitor Perspective Walk-In View" }
    ];

    let currentStage = $derived.by(() => {
        if (scrollProgress < 0.25) return cameraKeyframes[0];
        if (scrollProgress < 0.60) return cameraKeyframes[1];
        if (scrollProgress < 0.85) return cameraKeyframes[2];
        return cameraKeyframes[3];
    });

    const tempCam = new THREE.PerspectiveCamera();

    function interpolateCamera(p: number) {
        let i = 0;
        while (i < cameraKeyframes.length - 1 && cameraKeyframes[i + 1].progress < p) {
            i++;
        }
        const kf1 = cameraKeyframes[i];
        const kf2 = cameraKeyframes[Math.min(i + 1, cameraKeyframes.length - 1)];

        const span = kf2.progress - kf1.progress;
        const localT = span > 0 ? (p - kf1.progress) / span : 0;
        const easedT = localT * localT * (3 - 2 * localT); // Smoothstep

        const curPos = new THREE.Vector3().lerpVectors(kf1.pos, kf2.pos, easedT);
        const curLook = new THREE.Vector3().lerpVectors(kf1.look, kf2.look, easedT);

        tempCam.position.copy(curPos);
        tempCam.lookAt(curLook);

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
        scrollProgress = progress;
        interpolateCamera(progress);
    }

    function jumpToStage(index: number) {
        if (!container) return;
        const targetProgress = cameraKeyframes[index].progress;
        const scrollableHeight = container.offsetHeight - window.innerHeight;
        const targetScroll = container.offsetTop + (targetProgress * scrollableHeight);
        window.scrollTo({ top: targetScroll, behavior: "smooth" });
    }

    onMount(() => {
        window.addEventListener("scroll", handleScroll, { passive: true });
        window.addEventListener("resize", handleScroll, { passive: true });
        handleScroll();

        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", handleScroll);
        };
    });
</script>

<div bind:this={container} class="relative w-full h-[350vh] font-sans select-none">
    <!-- Sticky 100vh 3D Stage in Light Mode -->
    <div class="sticky top-0 w-full h-screen overflow-hidden flex flex-col justify-between p-4 sm:p-6">
        
        <!-- TOP CENTER TITLE ON TOP OF THE MODEL -->
        <div class="z-20 w-full max-w-4xl mx-auto text-center shrink-0 pt-2">
            
            <h2 class="text-3xl sm:text-4xl md:text-5xl font-black text-text tracking-tight uppercase">
                True Scale Demo
            </h2>
            <p class="text-xs sm:text-sm text-text/60 font-medium mt-0.5">
                Explore real-time 1:1 scale interactive spatial architecture.
            </p>
        </div>

        <!-- 3D Canvas Viewport in Crisp Daylight Mode (No Floor Plane) -->
        <div class="absolute inset-0 w-full h-full z-0">
            <Canvas>
                <T.PerspectiveCamera
                    {position}
                    {rotation}
                    fov={60}
                    near={0.1}
                    far={1000}
                    makeDefault
                />

                <!-- Clean Daylight Studio Lighting Rig -->
                <!-- Key Directional Sunlight -->
                <T.DirectionalLight
                    position={[8, 14, 8]}
                    intensity={2.8}
                    color="#ffffff"
                />

                <!-- Cool Fill Light for crisp shadow definition -->
                <T.DirectionalLight
                    position={[-10, 8, -6]}
                    intensity={1.4}
                    color="#e0f2fe"
                />

                <!-- Rim Backlight for sharp geometry separation -->
                <T.DirectionalLight
                    position={[0, 12, -10]}
                    intensity={2.2}
                    color="#009dd6"
                />

                <!-- Natural Sky / Ground Ambient Fill -->
                <T.HemisphereLight
                    args={["#ffffff", "#e2e8f0", 1.2]}
                />

                <!-- Front Key Accent Light -->
                <T.PointLight
                    position={[0, 5, 4]}
                    intensity={1.8}
                    color="#ffffff"
                    distance={25}
                    decay={2}
                />

                <!-- True Scale 3D GLTF Model -->
                <GLTF
                    url="3D/trueScale.glb"
                    position={[0, 0, 0]}
                    scale={0.2}
                    rotation={[0, Math.PI / 2, 0]}
                />
            </Canvas>
        </div>

        <!-- BOTTOM HUD: Light Mode Stage Telemetry & Angle Keyframes -->
        <div class="z-20 w-full max-w-5xl mx-auto flex flex-col gap-2.5 shrink-0 pb-2">
            <!-- Stage Callout & Quick Angle Navigation -->
            <div class="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3">
                

                <!-- Camera Keyframe Presets -->
                <div class="flex items-center gap-1 bg-white/80 backdrop-blur-md p-1 border border-black/10 shadow-xs">
                    {#each cameraKeyframes as kf, idx}
                        <button
                            onclick={() => jumpToStage(idx)}
                            class="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider transition cursor-pointer border {currentStage.title === kf.title ? 'bg-primary text-white border-primary shadow-xs' : 'bg-black/3 text-text/60 hover:text-text border-black/5'}"
                            title={kf.title}
                        >
                            0{idx + 1}
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Scroll Progress Bar -->
            <div class="w-full bg-black/10 h-1 rounded-full overflow-hidden">
                <div
                    class="h-full bg-primary transition-all duration-150"
                    style="width: {Math.max(scrollProgress * 100, 3)}%;"
                ></div>
            </div>

            <div class="flex items-center justify-between text-[9px] font-mono text-text/40 uppercase">
                <span>SCROLL TO EXPLORE ARCHITECTURE</span>
                <span>STAGE [{Math.round(scrollProgress * 100)}%]</span>
            </div>
        </div>

    </div>
</div>
