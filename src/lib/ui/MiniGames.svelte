<script lang="ts">
    import LuckyWheel from "$lib/components/LuckyWheel.svelte";
    import ReflexChallenge from "$lib/components/ReflexChallenge.svelte";
    import CatchCollectGame from "$lib/components/CatchCollectGame.svelte";
    import ProductQuiz from "$lib/components/ProductQuiz.svelte";
    import { brand } from "$lib/brand.svelte";

    interface GameSlide {
        id: string;
        title: string;
        code: string;
        icon: string;
        imageSrc?: string;
    }

    const slides: GameSlide[] = [
        { id: "lucky-wheel", title: "Lucky Wheel", code: "EXP_01", icon: "rotate_right", imageSrc: "" },
        { id: "reflex-challenge", title: "Reflex Speed", code: "EXP_02", icon: "bolt", imageSrc: "" },
        { id: "catch-collect", title: "Catch & Collect", code: "EXP_03", icon: "token", imageSrc: "" },
        { id: "product-quiz", title: "Product Quiz", code: "EXP_04", icon: "quiz", imageSrc: "" },
    ];

    let currentIndex = $state(0);
    let isDragging = $state(false);
    let startX = $state(0);
    let dragOffset = $state(0);
    let sliderTrack = $state<HTMLElement | null>(null);
    let liveGames = $state<Record<string, boolean>>({});

    const totalSlides = slides.length;

    function toggleLive(id: string, state: boolean) {
        liveGames[id] = state;
    }

    function handleTryLive(id: string) {
        if (!brand.isCustom) {
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("ekson_open_brand_modal"));
            }
            return;
        }
        toggleLive(id, true);
    }

    function nextSlide() {
        if (currentIndex < totalSlides - 1) {
            currentIndex += 1;
        } else {
            currentIndex = 0;
        }
    }

    function prevSlide() {
        if (currentIndex > 0) {
            currentIndex -= 1;
        } else {
            currentIndex = totalSlides - 1;
        }
    }

    function goToSlide(index: number) {
        currentIndex = index;
    }

    // Touch & Mouse Drag Handlers
    function handleTouchStart(e: TouchEvent) {
        const target = e.target as HTMLElement;
        if (target.closest("button, input, select, a")) return;
        isDragging = true;
        startX = e.touches[0].clientX;
        dragOffset = 0;
    }

    function handleTouchMove(e: TouchEvent) {
        if (!isDragging) return;
        const currentX = e.touches[0].clientX;
        dragOffset = currentX - startX;
    }

    function handleTouchEnd() {
        if (!isDragging) return;
        isDragging = false;
        const threshold = 50;
        if (dragOffset < -threshold) {
            nextSlide();
        } else if (dragOffset > threshold) {
            prevSlide();
        }
        dragOffset = 0;
    }

    function handleMouseDown(e: MouseEvent) {
        const target = e.target as HTMLElement;
        if (target.closest("button, input, select, a")) return;
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
        const threshold = 50;
        if (dragOffset < -threshold) {
            nextSlide();
        } else if (dragOffset > threshold) {
            prevSlide();
        }
        dragOffset = 0;
    }

    function handleMouseLeave() {
        if (isDragging) {
            isDragging = false;
            dragOffset = 0;
        }
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "ArrowLeft") {
            prevSlide();
        } else if (e.key === "ArrowRight") {
            nextSlide();
        }
    }
</script>

<svelte:window onkeydown={handleKeyDown} />

<div class="w-full h-full min-h-dvh md:h-screen max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex flex-col justify-between select-none font-sans overflow-hidden">
    <!-- Clean Minimalist Header -->
    <div class="flex items-end justify-between pb-2 border-b border-black/5 shrink-0 w-full mb-2 sm:mb-3">
        <div>
            <div class="flex items-center gap-1.5 font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-primary font-bold mb-0.5">
                <span class="size-1.5 bg-primary"></span>
                <span>05 / Interactive Gamification</span>
            </div>
            <h2 class="text-xl sm:text-2xl md:text-3xl font-extrabold text-text tracking-tight uppercase">
                Mini Games Suite
            </h2>
            <p class="text-[11px] sm:text-xs text-text/70 mt-0.5 max-w-xl">
                Competitive arcade challenges and interactive brand knowledge quizzes.
            </p>
        </div>

        <!-- Navigation Status & Controls -->
        <div class="flex items-center gap-2 sm:gap-3">
            <span class="font-mono text-[10px] sm:text-xs font-bold text-text/50 tracking-widest">
                [0{currentIndex + 1} / 0{totalSlides}]
            </span>

            <div class="flex items-center gap-1">
                <button
                    onclick={prevSlide}
                    class="size-7 sm:size-8 bg-black/5 hover:bg-primary hover:text-white text-text rounded-full flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
                    aria-label="Previous Slide"
                >
                    <span class="material-symbols-rounded text-[15px] sm:text-[16px]">arrow_back</span>
                </button>
                <button
                    onclick={nextSlide}
                    class="size-7 sm:size-8 bg-black/5 hover:bg-primary hover:text-white text-text rounded-full flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
                    aria-label="Next Slide"
                >
                    <span class="material-symbols-rounded text-[15px] sm:text-[16px]">arrow_forward</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Main Viewport Surface -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
        class="relative w-full h-[55vh] sm:h-[60vh] md:h-[65vh] max-h-145 bg-white/60 backdrop-blur-md rounded-2xl border border-black/10 shadow-xs overflow-hidden cursor-grab active:cursor-grabbing shrink-0"
        ontouchstart={handleTouchStart}
        ontouchmove={handleTouchMove}
        ontouchend={handleTouchEnd}
        onmousedown={handleMouseDown}
        onmousemove={handleMouseMove}
        onmouseup={handleMouseUp}
        onmouseleave={handleMouseLeave}
        role="region"
        aria-label="Mini Games Carousel"
    >
        <!-- Horizontal Sliding Track -->
        <div
            bind:this={sliderTrack}
            class="flex h-full w-full will-change-transform"
            style="transform: translateX(calc(-{currentIndex * 100}% + {dragOffset}px)); transition: {isDragging ? 'none' : 'transform 0.45s cubic-bezier(0.2, 0.9, 0.3, 1)'};"
        >
            {#each slides as slide (slide.id)}
                <div class="w-full h-full shrink-0 flex items-center justify-center p-2">
                    <div class="relative w-full h-full flex items-center justify-center rounded-xl overflow-hidden group/game-card bg-slate-900/90 text-white">
                        {#if !liveGames[slide.id]}
                            {#if slide.imageSrc}
                                <img src={slide.imageSrc} alt={slide.title} class="w-full h-full object-cover" />
                            {:else}
                                <!-- Image Placeholder: Ready for src attribute -->
                                <div class="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                                    <div class="size-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-3 border border-white/10 shadow-lg">
                                        <span class="material-symbols-rounded text-3xl text-primary" style="color: {brand.primaryColor || '#009dd6'};">
                                            {slide.icon}
                                        </span>
                                    </div>
                                    <h3 class="text-lg font-extrabold tracking-tight uppercase mb-1">{slide.title}</h3>
                                    <p class="text-xs text-white/60 font-mono mb-3">Interactive Mini-Game ({slide.code})</p>
                                    <span class="text-[10px] font-mono text-white/40 bg-black/40 px-3 py-1 rounded-full border border-white/10">
                                        Image Preview Placeholder (src="{slide.imageSrc || ''}")
                                    </span>
                                </div>
                            {/if}

                            <!-- Hover Overlay with 'Try it live' button -->
                            <div class="absolute inset-0 bg-slate-950/50 backdrop-blur-xs opacity-0 hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center p-4">
                                {#if !brand.isCustom}
                                    <div class="mb-3 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                                        <span class="material-symbols-rounded text-sm">lock</span>
                                        <span>Provide Brand Details To Unlock Live Game</span>
                                    </div>
                                    <button
                                        onclick={() => handleTryLive(slide.id)}
                                        class="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer border border-white/20"
                                        style="background-color: {brand.primaryColor || '#009dd6'};"
                                    >
                                        <span class="material-symbols-rounded text-base">auto_awesome</span>
                                        <span>Try it for your brand</span>
                                    </button>
                                {:else}
                                    <button
                                        onclick={() => handleTryLive(slide.id)}
                                        class="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer border border-white/20"
                                        style="background-color: {brand.primaryColor || '#009dd6'};"
                                    >
                                        <span class="material-symbols-rounded text-base">play_arrow</span>
                                        <span>Try it live</span>
                                    </button>
                                {/if}
                            </div>
                        {:else}
                            <!-- Live Component View -->
                            <div class="relative w-full h-full flex items-center justify-center overflow-hidden">
                                {#if slide.id === "lucky-wheel"}
                                    <LuckyWheel />
                                {:else if slide.id === "reflex-challenge"}
                                    <ReflexChallenge />
                                {:else if slide.id === "catch-collect"}
                                    <CatchCollectGame />
                                {:else if slide.id === "product-quiz"}
                                    <ProductQuiz />
                                {/if}

                                <!-- Exit Live View Button -->
                                <button
                                    onclick={() => toggleLive(slide.id, false)}
                                    class="absolute top-3 right-3 z-30 px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase transition flex items-center gap-1 shadow-md border cursor-pointer bg-red-500/90 hover:bg-red-600 text-white border-red-400"
                                    title="Exit Live Game Preview"
                                >
                                    <span class="material-symbols-rounded text-[14px]">close</span>
                                    <span class="hidden sm:inline">Exit Live</span>
                                </button>
                            </div>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    </div>

    <!-- Minimal Responsive Tabs Bar -->
    <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none md:grid md:grid-cols-4 md:gap-2 mt-2 sm:mt-3 shrink-0">
        {#each slides as slide, idx}
            <button
                onclick={() => goToSlide(idx)}
                class="flex items-center justify-between px-3 py-1.5 text-left rounded-xl transition-all duration-200 cursor-pointer shrink-0 md:shrink {currentIndex === idx ? 'bg-primary text-white shadow-xs' : 'bg-white/70 text-text/70 hover:bg-white hover:text-text border border-black/5'}"
            >
                <div class="flex items-center gap-1.5 truncate">
                    <span class="material-symbols-rounded text-[15px] sm:text-[16px] {currentIndex === idx ? 'text-white' : 'text-primary'} shrink-0">
                        {slide.icon}
                    </span>
                    <span class="text-[11px] sm:text-xs font-bold tracking-tight truncate">{slide.title}</span>
                </div>
            </button>
        {/each}
    </div>
</div>