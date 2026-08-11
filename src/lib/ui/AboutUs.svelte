<script lang="ts">
    import Values from "./Values.svelte";

    const metrics = [
        { value: "80+", label: "Specialist Experts" },
        { value: "150+", label: "Global Activations" },
        { value: "1:1", label: "Spatial Metric Scale" },
        { value: "100%", label: "Turnkey Delivery" }
    ];
</script>

<div class="relative w-full h-full min-h-[100dvh] md:h-screen max-w-6xl mx-auto px-3 sm:px-6 md:px-8 py-3 sm:py-6 flex flex-col justify-between items-center select-none font-sans overflow-hidden">
    <!-- Top Header -->
    <div class="text-center max-w-2xl shrink-0">
        <div class="flex items-center justify-center gap-2 font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-primary font-bold mb-0.5">
            <span class="size-1.5 bg-primary"></span>
            <span>02 / Who We Are</span>
        </div>
        <h2 class="text-xl sm:text-3xl md:text-4xl font-black text-text tracking-tight uppercase">
            Pioneering Spatial Event Experiences
        </h2>
        <p class="text-[11px] sm:text-xs md:text-sm text-text/70 mt-1 leading-relaxed">
            More than 80 talented spatial technologists, 3D artists, and creative engineers building high-impact interactive systems for world-class exhibition booths.
        </p>
    </div>

    <!-- Center 4 Pillars Grid -->
    <div class="w-full my-auto py-1.5 sm:py-2 shrink-0">
        <Values />
    </div>

    <!-- Bottom Metrics Banner -->
    <div class="w-full bg-white/70 backdrop-blur-md rounded-xl border border-black/5 p-2 sm:p-3 md:p-4 shadow-xs shrink-0">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 text-center divide-x divide-black/5">
            {#each metrics as m}
                <div class="flex flex-col items-center px-1 sm:px-2">
                    <span class="text-lg sm:text-xl md:text-2xl font-black text-text tracking-tight font-mono">
                        {m.value}
                    </span>
                    <span class="text-[8px] sm:text-[10px] font-mono font-bold text-text/50 uppercase tracking-wider mt-0.5">
                        {m.label}
                    </span>
                </div>
            {/each}
        </div>
    </div>
</div>