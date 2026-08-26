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
            image: "images/beat-cyber.webp"
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
            image: "images/shooting.png"
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
            image: "images/tennis.avif"
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
            image: "images/boxing.jpeg"
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
            image: "images/archer.jpg"
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
            <div class="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/40 to-black/30 pointer-events-none"></div>
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
            <div class="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/40 to-black/30 pointer-events-none"></div>
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
            <div class="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/40 to-black/30 pointer-events-none"></div>
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
            <div class="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/40 to-black/30 pointer-events-none"></div>
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
            <div class="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/40 to-black/30 pointer-events-none"></div>
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

<div class="w-full h-full min-h-dvh md:h-screen max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-8 flex flex-col justify-between select-none overflow-visible md:overflow-hidden">
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
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center my-auto w-full flex-1 max-h-none lg:max-h-[78vh] py-2">
        <!-- LEFT COLUMN: Bundle Overview & Included Games Checklist -->
        <div class="lg:col-span-6 flex flex-col justify-center space-y-6">
            <div class="bg-white/70 backdrop-blur-xl rounded-3xl p-4 sm:p-8 border border-black/5 shadow-sm space-y-4">
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
                <div class="grid grid-cols-2 gap-2.5 sm:gap-3 pt-2">
                    <div class="bg-white/80 border border-black/5 rounded-2xl p-2.5 sm:p-3 flex items-center gap-2 sm:gap-2.5 shadow-2xs">
                        <span class="material-symbols-rounded text-primary text-lg sm:text-xl">headset</span>
                        <div class="flex flex-col">
                            <span class="text-[11px] sm:text-xs font-extrabold text-text">6x VR Headsets</span>
                            <span class="text-[9px] sm:text-[10px] text-text/60">Standalone Wireless</span>
                        </div>
                    </div>
                    <div class="bg-white/80 border border-black/5 rounded-2xl p-2.5 sm:p-3 flex items-center gap-2 sm:gap-2.5 shadow-2xs">
                        <span class="material-symbols-rounded text-primary text-lg sm:text-xl">bolt</span>
                        <div class="flex flex-col">
                            <span class="text-[11px] sm:text-xs font-extrabold text-text">Power Charging Hub</span>
                            <span class="text-[9px] sm:text-[10px] text-text/60">Non-stop 24/7 Dwell</span>
                        </div>
                    </div>
                    <div class="bg-white/80 border border-black/5 rounded-2xl p-2.5 sm:p-3 flex items-center gap-2 sm:gap-2.5 shadow-2xs">
                        <span class="material-symbols-rounded text-primary text-lg sm:text-xl">tv</span>
                        <div class="flex flex-col">
                            <span class="text-[11px] sm:text-xs font-extrabold text-text">Spectator Screen</span>
                            <span class="text-[9px] sm:text-[10px] text-text/60">Live Video Cast</span>
                        </div>
                    </div>
                    <div class="bg-white/80 border border-black/5 rounded-2xl p-2.5 sm:p-3 flex items-center gap-2 sm:gap-2.5 shadow-2xs">
                        <span class="material-symbols-rounded text-primary text-lg sm:text-xl">support_agent</span>
                        <div class="flex flex-col">
                            <span class="text-[11px] sm:text-xs font-extrabold text-text">Turnkey Staffing</span>
                            <span class="text-[9px] sm:text-[10px] text-text/60">On-site Support</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- RIGHT COLUMN: Interactive GSAP 3D CardSwap Component -->
        <div class="lg:col-span-6 relative h-72 sm:h-95 md:h-110 flex items-center justify-center overflow-visible">
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
