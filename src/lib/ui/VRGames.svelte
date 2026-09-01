<script lang="ts">
    import { onMount } from "svelte";
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
            accentColor: "#4abbff",
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
    let progress = $state(0);

    const DURATION = 5000;
    const totalGames = games.length;

    let animFrameId: number | null = null;
    let startTime = 0;

    function resetTimer() {
        startTime = performance.now();
        progress = 0;
    }

    function nextSlide() {
        if (currentIndex < totalGames - 1) {
            currentIndex += 1;
        } else {
            currentIndex = 0;
        }
        resetTimer();
    }

    function prevSlide() {
        if (currentIndex > 0) {
            currentIndex -= 1;
        } else {
            currentIndex = totalGames - 1;
        }
        resetTimer();
    }

    function goToSlide(idx: number) {
        currentIndex = idx;
        resetTimer();
    }

    onMount(() => {
        startTime = performance.now();

        function tick(now: number) {
            if (!isDragging) {
                const elapsed = now - startTime;
                progress = Math.min(elapsed / DURATION, 1);

                if (elapsed >= DURATION) {
                    currentIndex = (currentIndex + 1) % totalGames;
                    startTime = now;
                    progress = 0;
                }
            } else {
                startTime = now - (progress * DURATION);
            }
            animFrameId = requestAnimationFrame(tick);
        }

        animFrameId = requestAnimationFrame(tick);

        return () => {
            if (animFrameId !== null) {
                cancelAnimationFrame(animFrameId);
            }
        };
    });

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
        else resetTimer();
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
        else resetTimer();
        dragOffset = 0;
    }

    function handleMouseLeave() {
        if (isDragging) {
            isDragging = false;
            dragOffset = 0;
            resetTimer();
        }
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "ArrowLeft") prevSlide();
        else if (e.key === "ArrowRight") nextSlide();
    }
</script>

<svelte:window onkeydown={handleKeyDown} />

<div class="w-full min-h-dvh max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8 flex flex-col justify-center">
    
    <!-- 2-COLUMN GRID LAYOUT -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full items-stretch my-auto">
        
        <!-- LEFT COLUMN: Game Image Box with Sliding Bar Under Image -->
        <div class="flex flex-col gap-4 w-full h-full justify-between">
            <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
            <div 
                class="relative w-full flex-1 min-h-95 lg:min-h-105 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between p-6 cursor-grab active:cursor-grabbing group"
                ontouchstart={handleTouchStart}
                ontouchmove={handleTouchMove}
                ontouchend={handleTouchEnd}
                onmousedown={handleMouseDown}
                onmousemove={handleMouseMove}
                onmouseup={handleMouseUp}
                onmouseleave={handleMouseLeave}
                role="region"
                aria-label="VR Games Image Preview"
            >
                {#each games as game, idx}
                    {#if idx === currentIndex}
                        <img 
                            src={game.image} 
                            alt={game.title} 
                            class="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                        />
                        <div class="absolute inset-0 bg-linear-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none"></div>
                        
                        <!-- Overlay Badge on Image Top -->
                        <div class="relative z-10 flex items-center justify-between w-full">
                            <span class="px-3.5 py-1.5 rounded-full text-xs font-black bg-black/40 backdrop-blur-md text-white border border-white/20">
                                &bull; {game.title}
                            </span>
                            <div class="size-10 rounded-2xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20">
                                <span class="material-symbols-rounded text-xl text-white">{game.icon}</span>
                            </div>
                        </div>
                    {/if}
                {/each}

                <!-- Sliding Bar under the image -->
                <div class="relative z-20 flex items-center justify-between pt-3 border-t border-white/20 w-full mt-auto">
                    <!-- Slide Indicators -->
                    <div class="flex items-center gap-2">
                        {#each games as game, idx}
                            <button
                                onclick={() => goToSlide(idx)}
                                class="relative h-2 rounded-full overflow-hidden transition-all duration-300 cursor-pointer bg-white/30 hover:bg-white/50 border border-white/20 {currentIndex === idx ? 'w-10 sm:w-12' : 'w-4 sm:w-6'}"
                                aria-label="Go to slide {idx + 1}: {game.title}"
                                title="{game.title} ({idx + 1}/{totalGames})"
                            >
                                <div
                                    class="absolute top-0 left-0 h-full rounded-full transition-none {currentIndex === idx ? 'bg-primary' : idx < currentIndex ? 'bg-white/70' : 'bg-transparent'}"
                                    style="width: {currentIndex === idx ? `${(progress * 100).toFixed(1)}%` : idx < currentIndex ? '100%' : '0%'};"
                                ></div>
                            </button>
                        {/each}
                    </div>

                    <!-- Navigation Buttons -->
                    <div class="flex items-center gap-2">
                        <button
                            onclick={prevSlide}
                            class="size-9 rounded-full bg-black/40 hover:bg-white/30 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                            aria-label="Previous Game"
                            title="Previous Game"
                        >
                            <span class="material-symbols-rounded text-xl">chevron_left</span>
                        </button>
                        <button
                            onclick={nextSlide}
                            class="size-9 rounded-full bg-black/40 hover:bg-white/30 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                            aria-label="Next Game"
                            title="Next Game"
                        >
                            <span class="material-symbols-rounded text-xl">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- RIGHT COLUMN: Stacked Cards (Top: MiniGames Desc, Bottom: Current game content) -->
        <div class="flex flex-col gap-6 w-full justify-between">
            
            <!-- TOP RIGHT CARD: MiniGames Header & Description -->
            <div class="flex flex-col justify-center space-y-3 p-6 sm:p-8 ">
                <h2 class="text-2xl sm:text-3xl font-extrabold text-text tracking-tight leading-tight">
                    VR Gaming <span class="text-transparent bg-clip-text bg-linear-to-r from-primary to-secondary">Experiences</span>
                </h2>
                <p class="text-xs sm:text-sm text-text/75 leading-relaxed font-medium">
                    Magnetize exhibition crowds with a complete, multi-user VR esports zone. Visitors step into rhythm, shooting, tennis, boxing, and archery challenges.
                </p>
            </div>

            <!-- BOTTOM RIGHT CARD: Current game content (Clean gradient background, no image overlay) -->
            <div 
                class="relative flex-1 w-full p-6 sm:p-8 flex flex-col justify-between text-black min-h-75"
                role="region"
                aria-label="Current game content"
            >
                {#each games as game, idx}
                    {#if idx === currentIndex}
                        <div class="absolute inset-0"></div>

                        <!-- Card Header -->
                        <div class="relative z-10 flex items-center justify-between">
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="text-xs font-extrabold uppercase tracking-widest py-1 rounded-full border border-white/15">
                                    {game.subtitle}
                                </span>
                            </div>
                        </div>

                        <!-- Card Body -->
                        <div class="relative z-10 space-y-3 my-4">
                            <h3 class="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight drop-shadow-sm">
                                {game.title}
                            </h3>
                            <p class="text-xs sm:text-sm leading-relaxed font-medium">
                                {game.description}
                            </p>
                        </div>

                        <!-- Card Features -->
                        <div class="relative z-10 flex flex-wrap gap-2 pt-3 border-t border-black/15">
                            {#each game.features as feat}
                                <span class="text-xs font-semibold bg-black/15 backdrop-blur-md px-3 py-1 rounded-xl border border-black/10">
                                    ✓ {feat}
                                </span>
                            {/each}
                        </div>
                    {/if}
                {/each}
            </div>

        </div>

    </div>

</div>




