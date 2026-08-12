<script>
    import Tour360 from "$lib/components/Tour360.svelte";
    import TrueScaleDemo from "$lib/components/TrueScaleDemo.svelte";
    import RealTimeWalking from "./RealTimeWalking.svelte";
</script>

<div class="w-full flex flex-col">
    <!-- Single Combined Section: 360 Tour (Left Half) & True Scale Demo (Right Half) -->
    <div class="w-full min-h-[100dvh] md:h-screen max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex flex-col justify-between select-none font-sans overflow-hidden">
        <!-- Unified Section Header -->
        <div class="flex items-end justify-between pb-2 border-b border-black/5 shrink-0 w-full mb-2 sm:mb-3">
            <div>
                <div class="flex items-center gap-1.5 font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-primary font-bold mb-0.5">
                    <span class="size-1.5 bg-primary"></span>
                    <span>03 / Spatial Architecture</span>
                </div>
                <h2 class="text-xl sm:text-2xl md:text-3xl font-extrabold text-text tracking-tight uppercase">
                    3D Virtual Presence & True Scale
                </h2>
                <p class="text-[11px] sm:text-xs text-text/70 mt-0.5 max-w-xl">
                    Interact with real-time 360° panoramic spatial environments and 1:1 true-scale architectural booth models.
                </p>
            </div>
            <div class="hidden sm:flex items-center gap-2 font-mono text-[10px] text-text/50">
                <span class="size-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span>MOUSE CONTROLLABLE</span>
            </div>
        </div>

        <!-- 50/50 Split 3D Viewports Container -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 flex-1 w-full my-auto max-h-[74vh] md:max-h-[78vh] overflow-hidden border border-black/10 shadow-xs">
            <!-- 360 Tour - Left Half -->
            <div class="w-full h-[38vh] md:h-full relative overflow-hidden border-b md:border-b-0 md:border-r border-black/10 bg-slate-900">
                <Tour360 />
            </div>

            <!-- True Scale Demo - Right Half -->
            <div class="w-full h-[38vh] md:h-full relative overflow-hidden bg-slate-50">
                <TrueScaleDemo />
            </div>
        </div>
    </div>

    <!-- Real-Time Walking Section -->
    <RealTimeWalking />
</div>