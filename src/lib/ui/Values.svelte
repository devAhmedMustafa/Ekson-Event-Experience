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

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
    {#each values as value}
        <div
            class="group relative bg-white/70 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-black/5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
        >
            <div>
                <!-- Icon Frame -->
                <div class="size-10 sm:size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <span class="material-symbols-rounded text-2xl">
                        {value.symbol}
                    </span>
                </div>

                <!-- Titles -->
                <h3 class="text-base sm:text-lg font-bold text-text tracking-tight">
                    {value.title}
                </h3>
                <p class="text-xs font-semibold text-primary mt-0.5">
                    {value.sub}
                </p>

                <!-- Description -->
                <p class="text-xs text-text/70 leading-relaxed mt-2">
                    {value.description}
                </p>
            </div>
        </div>
    {/each}
</div>