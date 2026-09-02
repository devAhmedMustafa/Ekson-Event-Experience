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

    interface VRFeatureTag {
        id: string;
        title: string;
        subtitle: string;
        icon: string;
    }

    const vrFeatureTags: VRFeatureTag[] = [
        {
            id: "spatial",
            title: "6DoF Spatial Tracking",
            subtitle: "Sub-millimeter motion precision",
            icon: "3d_rotation"
        },
        {
            id: "multiuser",
            title: "Multi-User Arena",
            subtitle: "Simultaneous headset stations",
            icon: "groups"
        },
        {
            id: "leaderboards",
            title: "Spectator & Leaderboards",
            subtitle: "Real-time external screen feeds",
            icon: "leaderboard"
        }
    ];

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

<div class="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col justify-center">
    
    <!-- 2-COLUMN GRID LAYOUT -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full items-stretch my-auto">
        
        <!-- LEFT COLUMN: Game Card Image with White Font Overlay & Controls at Bottom -->
        <div class="flex flex-col gap-4 w-full h-full justify-between lg:col-span-2">
            <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
            <div 
                class="relative w-full flex-1 rounded-3xl overflow-hidden shadow-2xl flex flex-col p-6 sm:p-8 cursor-grab active:cursor-grabbing group select-none "
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
                        <!-- Gradient overlay for white text readability -->
                        <div class="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/60 to-slate-950/20 pointer-events-none"></div>
                        
                        <!-- Top Tag Badge in White Font -->
                        <div class="relative z-10 flex items-center justify-between w-full">
                            <span class="px-3.5 py-1 rounded-full text-xs font-bold bg-white/30 backdrop-blur-md text-white flex items-center gap-1.5 shadow-xs">
                                <span>{game.title}</span>
                            </span>
                        </div>

                        <!-- Bottom Content: Game Title & Data Overlay in White Font -->
                        <div class="relative z-10 space-y-3 mt-auto text-white">
                            <div>
                                <h3 class="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-md">
                                    {game.title}
                                </h3>
                            </div>

                            <p class="text-xs sm:text-sm text-white/90 font-medium leading-relaxed drop-shadow-xs max-w-xl">
                                {game.description}
                            </p>
                        </div>
                    {/if}
                {/each}

                <!-- Sliding Bar under the overlay at the bottom -->
                <div class="relative z-20 flex items-center justify-between pt-4 border-t border-white/20 w-full mt-4">
                    <button
                        onclick={prevSlide}
                        class="size-9 rounded-full bg-black/50 hover:bg-white/30 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                        aria-label="Previous Game"
                        title="Previous Game"
                    >
                        <span class="material-symbols-rounded text-xl">chevron_left</span>
                    </button>
                    
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

                    <button
                        onclick={nextSlide}
                        class="size-9 rounded-full bg-black/50 hover:bg-white/30 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                        aria-label="Next Game"
                        title="Next Game"
                    >
                        <span class="material-symbols-rounded text-xl">chevron_right</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- RIGHT COLUMN: Header & Interactive VR Game List Selector -->
        <div class="flex flex-col gap-6 w-full justify-between lg:col-span-1">
            
            <!-- TOP RIGHT CARD: VR Header, Description & 3 Feature Tags -->
            <div class="flex flex-col justify-between space-y-4 px-6 sm:px-8 rounded-3xl shadow-xs h-full">
                <div class="space-y-3">
                    
                    <h2 class="text-3xl sm:text-4xl lg:text-5xl font-black text-text tracking-tight leading-tight">
                        VR Gaming <span class="text-transparent bg-clip-text bg-linear-to-r from-primary to-secondary">Experiences</span>
                    </h2>
                    <p class="text-xs sm:text-sm text-text/75 leading-relaxed font-medium">
                        Magnetize exhibition crowds with a complete, multi-user VR esports zone. Visitors step into rhythm, shooting, tennis, boxing, and archery challenges with real-time spectator feeds and leaderboards.
                    </p>
                </div>

                <!-- 3 FEATURE TAGS SECTION -->
                <div class="flex flex-col gap-2.5 pt-3 border-t border-black/10">
                    <span class="text-[10px] font-extrabold uppercase tracking-widest text-text/50 font-mono">
                        Key Features
                    </span>
                    <div class="grid grid-cols-1 gap-2">
                        {#each vrFeatureTags as feat}
                            <div class="flex items-center gap-3 p-2.5 rounded-2xl bg-white/80 border border-black/10 shadow-2xs hover:border-primary/40 transition-colors group">
                                <div class="flex flex-col min-w-0">
                                    <span class="text-xs font-bold text-text truncate tracking-tight">{feat.title}</span>
                                    <span class="text-[10px] text-text/60 font-medium truncate">{feat.subtitle}</span>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>

            </div>

        </div>

    </div>

</div>





