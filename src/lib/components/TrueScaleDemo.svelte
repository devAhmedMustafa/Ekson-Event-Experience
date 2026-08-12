<script lang="ts">
    import { Canvas, T } from "@threlte/core";
    import { GLTF } from "@threlte/extras";
    import CameraController from "./CameraController.svelte";

    interface CameraPreset {
        id: string;
        label: string;
        title: string;
        pos: [number, number, number];
        look: [number, number, number];
    }

    const presets: CameraPreset[] = [
        { id: "iso", label: "01 ISO", title: "Isometric Overview", pos: [4.5, 3.2, 4.5], look: [0, 0.7, 0] },
        { id: "front", label: "02 FRONT", title: "Front Elevation", pos: [0, 2.2, 5.2], look: [0, 0.8, 0] },
        { id: "detail", label: "03 DETAIL", title: "Product Station", pos: [-3.2, 1.8, 3.2], look: [0, 0.7, 0] },
        { id: "booth", label: "04 WALK-IN", title: "Eye Level View", pos: [0, 1.3, 3.0], look: [0, 0.8, 0] }
    ];

    let activePreset = $state<string>("iso");
    let autoRotate = $state(true);
    let targetPos = $state<[number, number, number] | null>([4.5, 3.2, 4.5]);
    let targetLookAt = $state<[number, number, number] | null>([0, 0.7, 0]);

    function selectPreset(preset: CameraPreset) {
        activePreset = preset.id;
        targetPos = [...preset.pos];
        targetLookAt = [...preset.look];
    }

    function toggleAutoRotate() {
        autoRotate = !autoRotate;
    }
</script>

<div class="relative w-full h-full min-h-[380px] sm:min-h-[440px] md:min-h-full flex flex-col justify-between p-3 sm:p-5 select-none font-sans overflow-hidden bg-slate-50/60">
    <!-- Top Header Badge & Title (Overlaid) -->
    <div class="relative z-10 flex items-start justify-between gap-2 pointer-events-none">
        <div>
            <div class="flex items-center gap-1.5 font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-primary font-bold mb-0.5">
                <span class="size-1.5 bg-primary"></span>
                <span>04 / TRUE SCALE 3D</span>
            </div>
            <h3 class="text-lg sm:text-xl md:text-2xl font-black text-text uppercase tracking-tight">
                True Scale Demo
            </h3>
            <p class="text-[10px] sm:text-xs text-text/60 font-medium max-w-xs mt-0.5">
                1:1 Scale real-time architectural booth model.
            </p>
        </div>

        <div class="pointer-events-auto flex items-center gap-1">
            <button
                onclick={toggleAutoRotate}
                class="size-7 sm:size-8 bg-white/80 hover:bg-white text-text rounded-full flex items-center justify-center border border-black/10 shadow-xs transition cursor-pointer"
                title={autoRotate ? "Pause Auto-Rotation" : "Enable Auto-Rotation"}
                aria-label="Toggle Auto-Rotation"
            >
                <span class="material-symbols-rounded text-[16px] {autoRotate ? 'text-primary animate-spin' : 'text-text/60'}">
                    sync
                </span>
            </button>
        </div>
    </div>

    <!-- 3D Canvas Viewport with Orbit Mouse Controls -->
    <div class="absolute inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing">
        <Canvas>
            <T.PerspectiveCamera
                makeDefault
                position={[4.5, 3.2, 4.5]}
                fov={55}
                near={0.1}
                far={1000}
            >
                <CameraController
                    {autoRotate}
                    {targetPos}
                    {targetLookAt}
                    onUserInteraction={() => {
                        // User started dragging
                    }}
                />
            </T.PerspectiveCamera>

            <!-- Daylight Studio Lighting Rig -->
            <T.DirectionalLight position={[8, 14, 8]} intensity={2.8} color="#ffffff" />
            <T.DirectionalLight position={[-10, 8, -6]} intensity={1.4} color="#e0f2fe" />
            <T.DirectionalLight position={[0, 12, -10]} intensity={2.2} color="#009dd6" />
            <T.HemisphereLight args={["#ffffff", "#e2e8f0", 1.2]} />
            <T.PointLight position={[0, 5, 4]} intensity={1.8} color="#ffffff" distance={25} decay={2} />

            <!-- True Scale 3D GLTF Model -->
            <GLTF
                url="3D/trueScale.glb"
                position={[0, 0, 0]}
                scale={0.2}
                rotation={[0, Math.PI / 2, 0]}
            />
        </Canvas>
    </div>

    <!-- Bottom HUD Controls & Angle Presets -->
    <div class="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-black/5 mt-auto">
        <!-- Interaction Hint -->
        <div class="flex items-center gap-1.5 bg-white/85 backdrop-blur-md px-3 py-1 rounded-full border border-black/10 shadow-xs font-mono text-[9px] text-text/60 uppercase">
            <span class="material-symbols-rounded text-[13px] text-primary">drag_pan</span>
            <span>DRAG MOUSE TO ORBIT</span>
        </div>

        <!-- Camera Angle Preset Buttons -->
        <div class="flex items-center gap-1 bg-white/85 backdrop-blur-md p-1 rounded-full border border-black/10 shadow-xs overflow-x-auto scrollbar-none">
            {#each presets as preset}
                <button
                    onclick={() => selectPreset(preset)}
                    class="px-2.5 py-0.5 sm:px-3 sm:py-1 text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider rounded-full transition cursor-pointer border shrink-0 {activePreset === preset.id ? 'bg-primary text-white border-primary shadow-xs' : 'bg-black/3 text-text/70 hover:text-text border-black/5'}"
                    title={preset.title}
                >
                    {preset.label}
                </button>
            {/each}
        </div>
    </div>
</div>
