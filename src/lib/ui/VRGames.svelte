<script lang="ts">
    import CardSwap, { type CardSwapItem } from "$lib/components/CardSwap.svelte";
    import { brand } from "$lib/brand.svelte";

    interface VRGameCard {
        id: string;
        code: string;
        title: string;
        subtitle: string;
        description: string;
        icon: string;
        bgGradient: string;
        accentColor: string;
        features: string[];
        image?: string;
    }

    const games: VRGameCard[] = [
        {
            id: "beat-cyber",
            code: "01",
            title: "Beat Cyber",
            subtitle: "Rhythm & Saber Slash",
            description: "Slice to the beat in this high-energy rhythm game. Dodge obstacles, slash glowing cubes, and feel the music.",
            icon: "headphones",
            bgGradient: "from-purple-950 via-slate-950 to-indigo-950",
            accentColor: "#9333ea",
            features: ["High Energy Beat", "Dual Saber Haptics", "Global Leaderboards"],
            image: "data:image/jpeg;base64,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"
        },
        {
            id: "shots-target-arena",
            code: "02",
            title: "Shots: Target Arena",
            subtitle: "Precision Tactical Shooting",
            description: "Test your aim and reflexes in exciting shooting challenges. Multiple modes, moving targets, and instant scoring.",
            icon: "adjust",
            bgGradient: "from-sky-950 via-slate-950 to-blue-950",
            accentColor: "#009dd6",
            features: ["Precision Optics", "Multi-Target Waves", "Reflex Combat"],
            image: ""
        },
        {
            id: "vr-tennis",
            code: "03",
            title: "VR Tennis",
            subtitle: "1:1 Spatial Court Matches",
            description: "Step onto the court and compete in realistic tennis matches. Serve aces, rally with precision, and win like a champion.",
            icon: "sports_tennis",
            bgGradient: "from-emerald-950 via-slate-950 to-teal-950",
            accentColor: "#10b981",
            features: ["1:1 Court Physics", "Haptic Racket Swing", "Multiplayer Matches"],
            image: ""
        },
        {
            id: "boxing-champions",
            code: "04",
            title: "Boxing Champions",
            subtitle: "Heavyweight Championship",
            description: "Step into the ring and fight like a champion. Dodge punches, deliver knockouts, and outsmart your opponent in epic bouts.",
            icon: "sports_mma",
            bgGradient: "from-rose-950 via-slate-950 to-red-950",
            accentColor: "#f43f5e",
            features: ["Physical Boxing", "Dodging & Countering", "Knockout Rounds"],
            image: ""
        },
        {
            id: "archers-quest",
            code: "05",
            title: "Archer's Quest",
            subtitle: "Focus & Archery Precision",
            description: "Sharpen your focus and accuracy in this immersive archery adventure. Draw your bow, hit bullseyes, and beat your best.",
            icon: "track_changes",
            bgGradient: "from-amber-950 via-slate-950 to-orange-950",
            accentColor: "#f59e0b",
            features: ["Realistic Bow Tension", "Bullseye Tracking", "Wind & Distance Physics"],
            image: ""
        }
    ];

    let activeGameIndex = $state(0);

    function handleCardClick(index: number) {
        activeGameIndex = index;
    }
</script>

<!-- Card Snippets for 3D CardSwap Component -->
{#snippet card0()}
    <div class="w-full h-full bg-linear-to-br {games[0].bgGradient} p-6 sm:p-7 flex flex-col justify-between text-white relative overflow-hidden select-none border border-white/10">
        {#if games[0].image}
            <img src={games[0].image} alt={games[0].title} class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500 pointer-events-none" />
            <div class="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/70 to-black/30 pointer-events-none"></div>
        {/if}
        <div class="flex items-center justify-between z-10">
            <span class="px-3 py-1 rounded-full text-xs font-black bg-white/15 backdrop-blur-md text-white border border-white/20">
                {games[0].code}
            </span>
            <div class="size-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/15">
                <span class="material-symbols-rounded text-xl text-purple-400">{games[0].icon}</span>
            </div>
        </div>
        <div class="my-auto z-10 space-y-2">
            <span class="text-[10px] font-extrabold uppercase tracking-widest text-purple-300 bg-purple-500/20 px-2.5 py-0.5 rounded-full">
                {games[0].subtitle}
            </span>
            <h3 class="text-2xl font-black tracking-tight text-white">{games[0].title}</h3>
            <p class="text-xs text-white/80 leading-relaxed line-clamp-3">{games[0].description}</p>
        </div>
        <div class="flex flex-wrap gap-1.5 z-10 pt-2 border-t border-white/10">
            {#each games[0].features as feat}
                <span class="text-[10px] font-semibold bg-white/10 px-2 py-0.5 rounded-md text-white/90">{feat}</span>
            {/each}
        </div>
        <div class="absolute -bottom-10 -right-10 size-40 bg-purple-500/20 rounded-full blur-2xl pointer-events-none"></div>
    </div>
{/snippet}

{#snippet card1()}
    <div class="w-full h-full bg-linear-to-br {games[1].bgGradient} p-6 sm:p-7 flex flex-col justify-between text-white relative overflow-hidden select-none border border-white/10">
        {#if games[1].image}
            <img src={games[1].image} alt={games[1].title} class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500 pointer-events-none" />
            <div class="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/70 to-black/30 pointer-events-none"></div>
        {/if}
        <div class="flex items-center justify-between z-10">
            <span class="px-3 py-1 rounded-full text-xs font-black bg-white/15 backdrop-blur-md text-white border border-white/20">
                {games[1].code}
            </span>
            <div class="size-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/15">
                <span class="material-symbols-rounded text-xl text-sky-400">{games[1].icon}</span>
            </div>
        </div>
        <div class="my-auto z-10 space-y-2">
            <span class="text-[10px] font-extrabold uppercase tracking-widest text-sky-300 bg-sky-500/20 px-2.5 py-0.5 rounded-full">
                {games[1].subtitle}
            </span>
            <h3 class="text-2xl font-black tracking-tight text-white">{games[1].title}</h3>
            <p class="text-xs text-white/80 leading-relaxed line-clamp-3">{games[1].description}</p>
        </div>
        <div class="flex flex-wrap gap-1.5 z-10 pt-2 border-t border-white/10">
            {#each games[1].features as feat}
                <span class="text-[10px] font-semibold bg-white/10 px-2 py-0.5 rounded-md text-white/90">{feat}</span>
            {/each}
        </div>
        <div class="absolute -bottom-10 -right-10 size-40 bg-sky-500/20 rounded-full blur-2xl pointer-events-none"></div>
    </div>
{/snippet}

{#snippet card2()}
    <div class="w-full h-full bg-linear-to-br {games[2].bgGradient} p-6 sm:p-7 flex flex-col justify-between text-white relative overflow-hidden select-none border border-white/10">
        {#if games[2].image}
            <img src={games[2].image} alt={games[2].title} class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500 pointer-events-none" />
            <div class="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/70 to-black/30 pointer-events-none"></div>
        {/if}
        <div class="flex items-center justify-between z-10">
            <span class="px-3 py-1 rounded-full text-xs font-black bg-white/15 backdrop-blur-md text-white border border-white/20">
                {games[2].code}
            </span>
            <div class="size-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/15">
                <span class="material-symbols-rounded text-xl text-emerald-400">{games[2].icon}</span>
            </div>
        </div>
        <div class="my-auto z-10 space-y-2">
            <span class="text-[10px] font-extrabold uppercase tracking-widest text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full">
                {games[2].subtitle}
            </span>
            <h3 class="text-2xl font-black tracking-tight text-white">{games[2].title}</h3>
            <p class="text-xs text-white/80 leading-relaxed line-clamp-3">{games[2].description}</p>
        </div>
        <div class="flex flex-wrap gap-1.5 z-10 pt-2 border-t border-white/10">
            {#each games[2].features as feat}
                <span class="text-[10px] font-semibold bg-white/10 px-2 py-0.5 rounded-md text-white/90">{feat}</span>
            {/each}
        </div>
        <div class="absolute -bottom-10 -right-10 size-40 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none"></div>
    </div>
{/snippet}

{#snippet card3()}
    <div class="w-full h-full bg-linear-to-br {games[3].bgGradient} p-6 sm:p-7 flex flex-col justify-between text-white relative overflow-hidden select-none border border-white/10">
        {#if games[3].image}
            <img src={games[3].image} alt={games[3].title} class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500 pointer-events-none" />
            <div class="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/70 to-black/30 pointer-events-none"></div>
        {/if}
        <div class="flex items-center justify-between z-10">
            <span class="px-3 py-1 rounded-full text-xs font-black bg-white/15 backdrop-blur-md text-white border border-white/20">
                {games[3].code}
            </span>
            <div class="size-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/15">
                <span class="material-symbols-rounded text-xl text-rose-400">{games[3].icon}</span>
            </div>
        </div>
        <div class="my-auto z-10 space-y-2">
            <span class="text-[10px] font-extrabold uppercase tracking-widest text-rose-300 bg-rose-500/20 px-2.5 py-0.5 rounded-full">
                {games[3].subtitle}
            </span>
            <h3 class="text-2xl font-black tracking-tight text-white">{games[3].title}</h3>
            <p class="text-xs text-white/80 leading-relaxed line-clamp-3">{games[3].description}</p>
        </div>
        <div class="flex flex-wrap gap-1.5 z-10 pt-2 border-t border-white/10">
            {#each games[3].features as feat}
                <span class="text-[10px] font-semibold bg-white/10 px-2 py-0.5 rounded-md text-white/90">{feat}</span>
            {/each}
        </div>
        <div class="absolute -bottom-10 -right-10 size-40 bg-rose-500/20 rounded-full blur-2xl pointer-events-none"></div>
    </div>
{/snippet}

{#snippet card4()}
    <div class="w-full h-full bg-linear-to-br {games[4].bgGradient} p-6 sm:p-7 flex flex-col justify-between text-white relative overflow-hidden select-none border border-white/10">
        {#if games[4].image}
            <img src={games[4].image} alt={games[4].title} class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500 pointer-events-none" />
            <div class="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/70 to-black/30 pointer-events-none"></div>
        {/if}
        <div class="flex items-center justify-between z-10">
            <span class="px-3 py-1 rounded-full text-xs font-black bg-white/15 backdrop-blur-md text-white border border-white/20">
                {games[4].code}
            </span>
            <div class="size-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/15">
                <span class="material-symbols-rounded text-xl text-amber-400">{games[4].icon}</span>
            </div>
        </div>
        <div class="my-auto z-10 space-y-2">
            <span class="text-[10px] font-extrabold uppercase tracking-widest text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full">
                {games[4].subtitle}
            </span>
            <h3 class="text-2xl font-black tracking-tight text-white">{games[4].title}</h3>
            <p class="text-xs text-white/80 leading-relaxed line-clamp-3">{games[4].description}</p>
        </div>
        <div class="flex flex-wrap gap-1.5 z-10 pt-2 border-t border-white/10">
            {#each games[4].features as feat}
                <span class="text-[10px] font-semibold bg-white/10 px-2 py-0.5 rounded-md text-white/90">{feat}</span>
            {/each}
        </div>
        <div class="absolute -bottom-10 -right-10 size-40 bg-amber-500/20 rounded-full blur-2xl pointer-events-none"></div>
    </div>
{/snippet}

<div class="w-full h-full min-h-dvh md:h-screen max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 flex flex-col justify-between select-none overflow-hidden">
    <!-- Header Area -->
    <div class="w-full shrink-0 mb-3 sm:mb-4 pb-3 border-b border-black/5">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex-1">
                <h2 class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-text tracking-tight">
                    VR Gaming Experiences
                </h2>
                <p class="text-xs sm:text-sm text-text/80 mt-1 max-w-xl font-medium leading-relaxed">
                    Turnkey VR Attraction: Includes 6 VR Headsets, 5 Popular Games, Power Charging Hub, and Full On-site Accessories.
                </p>
            </div>
        </div>
    </div>

    <!-- Main Content Area: Left Details & Right 3D CardSwap Deck -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto w-full flex-1 max-h-[78vh] py-2">
        <!-- LEFT COLUMN: Bundle Overview & Included Games Checklist -->
        <div class="lg:col-span-6 flex flex-col justify-center space-y-6">
            <div class="bg-white/70 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-black/5 shadow-sm space-y-4">
                <div class="flex items-center justify-between">
                    <span class="px-3 py-1 rounded-full text-xs font-extrabold bg-primary text-white shadow-xs">
                        5 VR Experiences
                    </span>
                    <span class="text-xs font-semibold text-text/60">Auto-Rotating 3D Deck</span>
                </div>

                <div>
                    <h3 class="text-xl sm:text-2xl font-extrabold text-text tracking-tight">
                        Immersive VR Attraction Setup
                    </h3>
                    <p class="text-xs sm:text-sm text-text/75 leading-relaxed mt-2">
                        Magnetize exhibition crowds with a complete, multi-user VR esports zone. Visitors step into high-speed rhythm, tactical shooting, tennis, boxing, and archery challenges with real-time scoreboards.
                    </p>
                </div>

                <!-- Included Hardware Specs Badges -->
                <div class="grid grid-cols-2 gap-3 pt-2">
                    <div class="bg-white/80 border border-black/5 rounded-2xl p-3 flex items-center gap-2.5 shadow-2xs">
                        <span class="material-symbols-rounded text-primary text-xl">headset</span>
                        <div class="flex flex-col">
                            <span class="text-xs font-extrabold text-text">6x VR Headsets</span>
                            <span class="text-[10px] text-text/60">Standalone Wireless</span>
                        </div>
                    </div>
                    <div class="bg-white/80 border border-black/5 rounded-2xl p-3 flex items-center gap-2.5 shadow-2xs">
                        <span class="material-symbols-rounded text-primary text-xl">bolt</span>
                        <div class="flex flex-col">
                            <span class="text-xs font-extrabold text-text">Power Charging Hub</span>
                            <span class="text-[10px] text-text/60">Non-stop 24/7 Dwell</span>
                        </div>
                    </div>
                    <div class="bg-white/80 border border-black/5 rounded-2xl p-3 flex items-center gap-2.5 shadow-2xs">
                        <span class="material-symbols-rounded text-primary text-xl">tv</span>
                        <div class="flex flex-col">
                            <span class="text-xs font-extrabold text-text">Spectator Screen</span>
                            <span class="text-[10px] text-text/60">Live Video Cast</span>
                        </div>
                    </div>
                    <div class="bg-white/80 border border-black/5 rounded-2xl p-3 flex items-center gap-2.5 shadow-2xs">
                        <span class="material-symbols-rounded text-primary text-xl">support_agent</span>
                        <div class="flex flex-col">
                            <span class="text-xs font-extrabold text-text">Turnkey Staffing</span>
                            <span class="text-[10px] text-text/60">On-site Support</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- RIGHT COLUMN: Interactive GSAP 3D CardSwap Component -->
        <div class="lg:col-span-6 relative h-95 sm:h-110 flex items-center justify-center overflow-visible">
            <CardSwap
                cards={[
                    { content: card0 },
                    { content: card1 },
                    { content: card2 },
                    { content: card3 },
                    { content: card4 }
                ]}
                cardDistance={42}
                verticalDistance={32}
                delay={4000}
                pauseOnHover={true}
                skewAmount={6}
                easing="elastic"
                onCardClick={handleCardClick}
            />
        </div>
    </div>
</div>
