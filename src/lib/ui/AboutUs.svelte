<script lang="ts">
    import Values from "./Values.svelte";

    const metrics = [
        { value: "80+", label: "Specialist Experts" },
        { value: "150+", label: "Global Activations" },
        { value: "1:1", label: "Spatial Metric Scale" },
        { value: "100%", label: "Turnkey Delivery" }
    ];
</script>

<div class="relative w-full h-full min-h-[100dvh] md:h-screen max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 flex flex-col justify-between select-none overflow-hidden">
    <!-- Top Header -->
    <div class="flex items-end justify-between pb-3 border-b border-black/5 shrink-0 w-full mb-3 sm:mb-4">
        <div>

            <h2 class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-text tracking-tight">
                Pioneering Event Technology
            </h2>
            <p class="text-xs sm:text-sm text-text/70 mt-1 max-w-xl leading-relaxed">
                Building high-impact interactive 3D systems and engagement tools for world-class exhibition booths.
            </p>
        </div>
    </div>

    <!-- Center 4 Pillars Grid -->
    <div class="w-full my-auto py-2 shrink-0">
        <Values />
    </div>

    <!-- Bottom Metrics Banner -->
    <div class="w-full bg-white/60 backdrop-blur-xl rounded-3xl border border-black/5 p-4 sm:p-5 md:p-6 shadow-sm shrink-0">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center divide-x divide-black/5">
            {#each metrics as m}
                <div class="flex flex-col items-center px-2">
                    <span class="text-xl sm:text-2xl md:text-3xl font-extrabold text-text tracking-tight">
                        {m.value}
                    </span>
                    <span class="text-[10px] sm:text-xs font-medium text-text/50 uppercase tracking-wider mt-1">
                        {m.label}
                    </span>
                </div>
            {/each}
        </div>
    </div>
</div>