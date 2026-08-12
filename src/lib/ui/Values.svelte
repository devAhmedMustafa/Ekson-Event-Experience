<script lang="ts">
    interface ValueItem {
        code: string;
        title: string;
        sub: string;
        description: string;
        icon: string;
        symbol: string;
    }

    const values: ValueItem[] = [
        {
            code: "01",
            title: "Attract",
            sub: "High-Density Footfall",
            description: "Magnetize exhibition visitors with larger-than-life interactive spatial visuals.",
            icon: "icons/multiple-users-silhouette.png",
            symbol: "groups"
        },
        {
            code: "02",
            title: "Engage",
            sub: "Dwell Time & Hype",
            description: "Turn passive observers into active participants through competitive gamification.",
            icon: "icons/life-line.png",
            symbol: "trending_up"
        },
        {
            code: "03",
            title: "Interact",
            sub: "Spatial Touch & 3D",
            description: "Seamless 3D manipulation, touchless gesture sensing, and instant WebAR.",
            icon: "icons/double-tap.png",
            symbol: "touch_app"
        },
        {
            code: "04",
            title: "Memorize",
            sub: "Unforgettable Recall",
            description: "Forge lasting emotional connections that amplify post-event ROI and brand loyalty.",
            icon: "icons/artificial.png",
            symbol: "neurology"
        }
    ];
</script>

<div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 w-full">
    {#each values as value}
        <div
            class="group relative bg-white rounded-2xl p-3.5 sm:p-4 md:p-5 border border-black/10 shadow-xs hover:shadow-md hover:border-primary/40 transition-all duration-300 flex flex-col justify-between overflow-hidden"
        >
            <!-- Watermark Code -->
            <span class="absolute top-2 right-3 font-mono text-[20px] sm:text-[28px] font-black text-black/[0.04] group-hover:text-primary/10 transition">
                {value.code}
            </span>

            <div>
                <!-- Icon Frame -->
                <div class="size-8 sm:size-10 md:size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2 sm:mb-3 group-hover:bg-primary group-hover:text-white transition-colors">
                    <span class="material-symbols-rounded text-[18px] sm:text-[22px] md:text-[24px]">
                        {value.symbol}
                    </span>
                </div>

                <!-- Titles -->
                <h3 class="text-sm sm:text-base md:text-lg font-black text-text uppercase tracking-tight">
                    {value.title}
                </h3>
                <p class="text-[10px] sm:text-xs font-bold text-primary font-mono mt-0.5">
                    {value.sub}
                </p>

                <!-- Description -->
                <p class="text-[9px] sm:text-[10px] md:text-[11px] text-text/70 leading-relaxed mt-1 sm:mt-2 line-clamp-3 sm:line-clamp-none">
                    {value.description}
                </p>
            </div>

            <!-- Bottom Progress Line -->
            <div class="w-full h-1 bg-black/5 rounded-full mt-2 sm:mt-4 overflow-hidden">
                <div class="w-0 group-hover:w-full h-full bg-primary transition-all duration-500 rounded-full"></div>
            </div>
        </div>
    {/each}
</div>