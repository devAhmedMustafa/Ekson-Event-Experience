<script lang="ts">
    import Values from "./Values.svelte";

    const metrics = [
        { value: "80+", label: "Specialist Experts" },
        { value: "150+", label: "Global Activations" },
        { value: "1:1", label: "Spatial Metric Scale" },
        { value: "100%", label: "Turnkey Delivery" }
    ];
</script>

<div class="relative w-full h-full min-h-[100dvh] md:h-screen max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex flex-col justify-between select-none font-sans overflow-hidden">
    <!-- Top Header (Standardized Alignment) -->
    <div class="flex items-end justify-between pb-2 border-b border-black/5 shrink-0 w-full mb-2 sm:mb-3">
        <div>
            <div class="flex items-center gap-1.5 font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-primary font-bold mb-0.5">
                <span class="size-1.5 bg-primary"></span>
                <span>02 / Who We Are</span>
            </div>
            <h2 class="text-xl sm:text-2xl md:text-3xl font-extrabold text-text tracking-tight uppercase">
                Pioneering Spatial Event Experiences
            </h2>
            <p class="text-[11px] sm:text-xs text-text/70 mt-0.5 max-w-xl">
                More than 80 spatial technologists, 3D artists, and creative engineers building high-impact interactive systems for world-class exhibition booths.
            </p>
        </div>

        <div class="hidden sm:flex items-center gap-2 font-mono text-[10px] text-text/50">
            <span class="size-2 bg-primary rounded-full"></span>
            <span>GLOBAL ACTIVATIONS</span>
        </div>
    </div>

    <!-- Center 4 Pillars Grid -->
    <div class="w-full my-auto py-1 sm:py-2 shrink-0">
        <Values />
    </div>

    <!-- Bottom Metrics Banner -->
    <div class="w-full bg-white/70 backdrop-blur-md rounded-2xl border border-black/5 p-3 sm:p-4 md:p-5 shadow-xs shrink-0">
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