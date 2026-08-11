<script lang="ts">
    import Values from "./Values.svelte";

    const metrics = [
        { value: "80+", label: "Specialist Experts" },
        { value: "150+", label: "Global Activations" },
        { value: "1:1", label: "Spatial Metric Scale" },
        { value: "100%", label: "Turnkey Event Delivery" }
    ];
</script>

<div class="relative w-full h-full max-h-screen max-w-6xl mx-auto px-4 md:px-8 py-4 sm:py-6 flex flex-col justify-between items-center select-none font-sans overflow-hidden">
    <!-- Top Header -->
    <div class="text-center max-w-2xl shrink-0">
        <h2 class="text-2xl sm:text-3xl md:text-4xl font-black text-text tracking-tight uppercase">
            Pioneering Spatial Event Experiences
        </h2>
        <p class="text-xs sm:text-sm text-text/70 mt-1.5 leading-relaxed">
            More than 80 talented spatial technologists, 3D artists, and creative engineers building high-impact interactive systems for world-class exhibition booths.
        </p>
    </div>

    <!-- Center 4 Pillars Grid -->
    <div class="w-full my-auto py-2 shrink-0">
        <Values />
    </div>

    <!-- Bottom Metrics Banner -->
    <div class="w-full bg-white/70 backdrop-blur-md rounded-xl border border-black/5 p-3 sm:p-4 shadow-xs shrink-0">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center divide-x divide-black/5">
            {#each metrics as m}
                <div class="flex flex-col items-center px-2">
                    <span class="text-xl sm:text-2xl font-black text-text tracking-tight font-mono">
                        {m.value}
                    </span>
                    <span class="text-[10px] font-mono font-bold text-text/50 uppercase tracking-wider mt-0.5">
                        {m.label}
                    </span>
                </div>
            {/each}
        </div>
    </div>
</div>