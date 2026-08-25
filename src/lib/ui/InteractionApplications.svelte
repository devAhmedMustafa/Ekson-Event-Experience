<script>
    import Tour360 from "$lib/components/Tour360.svelte";
    import TrueScaleDemo from "$lib/components/TrueScaleDemo.svelte";
    import RealTimeWalking from "./RealTimeWalking.svelte";
</script>

<div class="w-full flex flex-col">
    <!-- Single Combined Section: 360 Tour (Left Half) & True Scale Demo (Right Half) -->
    <div class="w-full min-h-[100dvh] md:h-screen max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 flex flex-col justify-between select-none overflow-hidden">
        <!-- Unified Section Header -->
        <div class="flex items-end justify-between pb-3 border-b border-black/5 shrink-0 w-full mb-3 sm:mb-4">
            <div>
                <h2 class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-text tracking-tight">
                    3D Presence & True Scale
                </h2>
                <p class="text-xs sm:text-sm text-text/70 mt-1 max-w-xl leading-relaxed">
                    Interactive 360° panoramas and 1:1 true-scale booth configurators.
                </p>
            </div>
        </div>

        <!-- 50/50 Split 3D Viewports Container -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 flex-1 w-full my-auto max-h-[74vh] md:max-h-[78vh] overflow-hidden">
            <!-- 360 Tour - Left Half -->
            <div class="w-full h-[38vh] md:h-full relative overflow-hidden rounded-3xl border border-black/5 shadow-sm bg-slate-900">
                <Tour360 />
            </div>

            <!-- True Scale Demo - Right Half -->
            <div class="w-full h-[38vh] md:h-full relative overflow-hidden rounded-3xl border border-black/5 shadow-sm bg-white/70 backdrop-blur-xl">
                <TrueScaleDemo />
            </div>
        </div>
    </div>

    <!-- Real-Time Walking Section -->
    <RealTimeWalking />
</div>