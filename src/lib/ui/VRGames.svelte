<script lang="ts">
    import { brand } from "$lib/brand.svelte";

    interface VRGameCard {
        id: string;
        code: string;
        title: string;
        description: string;
        icon: string;
    }

    const games: VRGameCard[] = [
        {
            id: "beat-cyber",
            code: "01",
            title: "Beat Cyber",
            description: "Slice to the beat in this high-energy rhythm game. Dodge, slash, and feel the music like never before.",
            icon: "headphones"
        },
        {
            id: "shots-target-arena",
            code: "02",
            title: "Shots: Target Arena",
            description: "Test your aim and reflexes in exciting shooting challenges. Multiple modes and targets for endless fun.",
            icon: "adjust"
        },
        {
            id: "vr-tennis",
            code: "03",
            title: "VR Tennis",
            description: "Step onto the court and compete in realistic tennis matches. Serve, rally, and win like a champion.",
            icon: "sports_tennis"
        },
        {
            id: "boxing-champions",
            code: "04",
            title: "Boxing Champions",
            description: "Step into the ring and fight like a champion. Dodge, punch, and outsmart your opponent in epic matches.",
            icon: "sports_mma"
        },
        {
            id: "archers-quest",
            code: "05",
            title: "Archer's Quest",
            description: "Sharpen your focus and accuracy in this immersive archery adventure. Hit the target and beat your best.",
            icon: "track_changes"
        }
    ];
</script>

<div class="w-full h-full min-h-dvh md:h-screen max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 flex flex-col justify-between select-none overflow-hidden">
    <!-- Header Area -->
    <div class="w-full shrink-0 mb-3 sm:mb-4 pb-3 border-b border-black/5">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex-1">

                <!-- Section Title & Subtitle -->
                <h2 class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-text tracking-tight">
                    VR Games
                </h2>
                <p class="text-xs sm:text-sm text-text/80 mt-1 max-w-xl font-medium leading-relaxed">
                    Complete VR Gaming Bundle: Includes 6 VR Headsets, 5 Popular Games, Power Charger, and Essential Accessories.
                </p>
            </div>
        </div>
    </div>

    <!-- 5 VR Game Cards Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 my-auto w-full flex-1 max-h-[78vh] py-2 overflow-y-auto scrollbar-none">
        {#each games as game (game.id)}
            <div class="group relative bg-white/70 backdrop-blur-xl border border-black/5 hover:border-black/15 transition-all duration-300 rounded-2xl shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden">
                
                <!-- Image Placeholder Area -->
                <div class="relative w-full aspect-4/3 bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 overflow-hidden flex items-center justify-center">
                    <!-- Top Left Number Badge -->
                    <div class="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md text-[11px] font-extrabold text-white shadow-xs" style="background-color: {brand.primaryColor || '#009dd6'};">
                        {game.code}
                    </div>

                    <!-- Placeholder Image Content Overlay -->
                    <div class="flex flex-col items-center justify-center p-3 text-center text-white/80 group-hover:scale-105 transition-transform duration-300">
                        <div class="size-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center mb-1.5 border border-white/10">
                            <span class="material-symbols-rounded text-xl" style="color: {brand.primaryColor || '#009dd6'};">
                                {game.icon}
                            </span>
                        </div>
                        <span class="text-[10px] font-semibold uppercase tracking-wider text-white/60">Image Placeholder</span>
                    </div>

                    <!-- Subtle Inner Glow Border -->
                    <div class="absolute inset-0 border border-white/10 pointer-events-none rounded-t-2xl"></div>
                </div>

                <!-- Text Content Area -->
                <div class="p-3 sm:p-3.5 flex flex-col justify-between flex-1">
                    <div>
                        <h3 class="text-sm font-bold text-text tracking-tight mb-1 line-clamp-1">
                            {game.title}
                        </h3>
                        <p class="text-[11px] sm:text-xs text-text/70 leading-relaxed line-clamp-3">
                            {game.description}
                        </p>
                    </div>
                </div>
            </div>
        {/each}
    </div>
</div>
