<script lang="ts">
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

    let currentIndex = $state(0);
    let isDragging = $state(false);
    let startX = $state(0);
    let dragOffset = $state(0);

    const totalGames = games.length;

    function nextSlide() {
        if (currentIndex < totalGames - 1) {
            currentIndex += 1;
        } else {
            currentIndex = 0;
        }
    }

    function prevSlide() {
        if (currentIndex > 0) {
            currentIndex -= 1;
        } else {
            currentIndex = totalGames - 1;
        }
    }

    function goToSlide(idx: number) {
        currentIndex = idx;
    }

    // Drag Handlers
    function handleTouchStart(e: TouchEvent) {
        isDragging = true;
        startX = e.touches[0].clientX;
        dragOffset = 0;
    }

    function handleTouchMove(e: TouchEvent) {
        if (!isDragging) return;
        dragOffset = e.touches[0].clientX - startX;
    }

    function handleTouchEnd() {
        if (!isDragging) return;
        isDragging = false;
        if (dragOffset < -50) nextSlide();
        else if (dragOffset > 50) prevSlide();
        dragOffset = 0;
    }

    function handleMouseDown(e: MouseEvent) {
        isDragging = true;
        startX = e.clientX;
        dragOffset = 0;
    }

    function handleMouseMove(e: MouseEvent) {
        if (!isDragging) return;
        dragOffset = e.clientX - startX;
    }

    function handleMouseUp() {
        if (!isDragging) return;
        isDragging = false;
        if (dragOffset < -50) nextSlide();
        else if (dragOffset > 50) prevSlide();
        dragOffset = 0;
    }

    function handleMouseLeave() {
        if (isDragging) {
            isDragging = false;
            dragOffset = 0;
        }
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "ArrowLeft") prevSlide();
        else if (e.key === "ArrowRight") nextSlide();
    }
</script>

<svelte:window onkeydown={handleKeyDown} />

<div class="w-full min-h-dvh max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-8 flex flex-col justify-between overflow-visible md:overflow-hidden">
    
    <!-- MAIN STAGE: LEFT = TITLE & DESC (3 Cols) | RIGHT = EXPANDED FLAT 2D CARD SLIDER (9 Cols) -->
    <div class="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-center my-auto w-full flex-1">
        
        <!-- LEFT COLUMN: Compact Title & Subtitle Only (col-span-3 out of 12) -->
        <div class="md:col-span-3 flex flex-col justify-center space-y-3">

            <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-text tracking-tight leading-tight">
                VR Gaming <span class="text-transparent bg-clip-text bg-linear-to-r from-primary via-sky-500 to-indigo-600">Experiences</span>
            </h2>
            
            <p class="text-xs sm:text-sm text-text/75 leading-relaxed font-medium">
                Magnetize exhibition crowds with a complete, multi-user VR esports zone. Visitors step into rhythm, shooting, tennis, boxing, and archery challenges.
            </p>
        </div>

        <!-- RIGHT COLUMN: EXPANDED FLAT 2D CARD SLIDER (col-span-9 out of 12) -->
        <div class="md:col-span-9 relative flex items-center justify-center w-full">
            
            <!-- Slider Wrapper with Side Arrow Controls -->
            <div class="relative w-full flex items-center justify-center">
                
                <!-- Left Navigation Arrow -->
                <button
                    onclick={prevSlide}
                    class="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-30 size-9 sm:size-11 rounded-full bg-white/90 hover:bg-white text-text shadow-lg border border-black/5 backdrop-blur-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                    aria-label="Previous Game"
                    title="Previous Game"
                >
                    <span class="material-symbols-rounded text-lg sm:text-2xl text-text/80">chevron_left</span>
                </button>

                <!-- TALLER & LARGER FLAT 2D CARD VIEWPORT -->
                <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                <div
                    class="relative w-full h-[420px] sm:h-[480px] md:h-[530px] rounded-3xl overflow-hidden shadow-xl border border-white/10 bg-slate-950 cursor-grab active:cursor-grabbing"
                    ontouchstart={handleTouchStart}
                    ontouchmove={handleTouchMove}
                    ontouchend={handleTouchEnd}
                    onmousedown={handleMouseDown}
                    onmousemove={handleMouseMove}
                    onmouseup={handleMouseUp}
                    onmouseleave={handleMouseLeave}
                    role="region"
                    aria-label="VR Games 2D Carousel"
                >
                    <!-- Horizontal Sliding Track -->
                    <div
                        class="flex h-full w-full will-change-transform"
                        style="transform: translateX(calc(-{currentIndex * 100}% + {dragOffset}px)); transition: {isDragging ? 'none' : 'transform 0.45s cubic-bezier(0.2, 0.9, 0.3, 1)'};"
                    >
                        {#each games as game (game.id)}
                            <div class="w-full h-full shrink-0 relative p-6 sm:p-10 flex flex-col justify-between text-white overflow-hidden bg-gradient-to-br {game.bgGradient}">
                                
                                <!-- Background Preview Image with Overlay Scrim -->
                                {#if game.image}
                                    <img src={game.image} alt={game.title} class="absolute inset-0 w-full h-full object-cover opacity-50 pointer-events-none" />
                                    <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-black/30 pointer-events-none"></div>
                                {/if}

                                <!-- Top Card Header: Code Badge & Icon -->
                                <div class="flex items-center justify-between z-10">
                                    <div class="flex items-center gap-2">
                                        <span class="px-3.5 py-1 rounded-full text-xs font-black bg-white/15 backdrop-blur-md text-white border border-white/20">
                                            GAME {game.code}
                                        </span>
                                        <span class="text-xs font-extrabold uppercase tracking-widest text-white/90 bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/15">
                                            {game.subtitle}
                                        </span>
                                    </div>
                                    <div class="size-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/15">
                                        <span class="material-symbols-rounded text-2xl text-white">{game.icon}</span>
                                    </div>
                                </div>

                                <!-- Middle Content Body -->
                                <div class="my-auto z-10 space-y-3 max-w-xl">
                                    <h3 class="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-sm">
                                        {game.title}
                                    </h3>
                                    <p class="text-xs sm:text-sm md:text-base text-white/90 leading-relaxed font-medium">
                                        {game.description}
                                    </p>
                                </div>

                                <!-- Bottom Feature Tags -->
                                <div class="flex flex-wrap gap-2.5 z-10 pt-4 border-t border-white/15">
                                    {#each game.features as feat}
                                        <span class="text-xs font-semibold bg-white/15 backdrop-blur-md px-3 py-1 rounded-xl text-white border border-white/10">
                                            ✓ {feat}
                                        </span>
                                    {/each}
                                </div>

                            </div>
                        {/each}
                    </div>

                    <!-- BOTTOM SLIDER DASH INDICATORS (_ _ _ _ _) -->
                    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/15">
                        {#each games as game, idx}
                            <button
                                onclick={() => goToSlide(idx)}
                                class="h-1.5 rounded-full transition-all duration-300 cursor-pointer {currentIndex === idx ? 'w-10 bg-primary shadow-sm' : 'w-4 bg-white/40 hover:bg-white/70'}"
                                aria-label="Go to slide {idx + 1}"
                                title={game.title}
                            ></button>
                        {/each}
                    </div>

                </div>

                <!-- Right Navigation Arrow -->
                <button
                    onclick={nextSlide}
                    class="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-30 size-9 sm:size-11 rounded-full bg-white/90 hover:bg-white text-text shadow-lg border border-black/5 backdrop-blur-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                    aria-label="Next Game"
                    title="Next Game"
                >
                    <span class="material-symbols-rounded text-lg sm:text-2xl text-text/80">chevron_right</span>
                </button>

            </div>

        </div>

    </div>

</div>
