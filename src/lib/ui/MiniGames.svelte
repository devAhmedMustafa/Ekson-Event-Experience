<script lang="ts">
    import LuckyWheel from "$lib/components/LuckyWheel.svelte";
    import ScoreBoard from "$lib/ui/ScoreBoard.svelte";
    import ReflexChallenge from "$lib/components/ReflexChallenge.svelte";
    import CatchCollectGame from "$lib/components/CatchCollectGame.svelte";
    import ProductQuiz from "$lib/components/ProductQuiz.svelte";

    interface GameSlide {
        id: string;
        title: string;
        code: string;
        icon: string;
    }

    const slides: GameSlide[] = [
        { id: "lucky-wheel", title: "Lucky Wheel", code: "EXP_01", icon: "rotate_right" },
        { id: "score-board", title: "Leaderboard", code: "EXP_02", icon: "leaderboard" },
        { id: "reflex-challenge", title: "Reflex Speed", code: "EXP_03", icon: "bolt" },
        { id: "catch-collect", title: "Catch & Collect", code: "EXP_04", icon: "token" },
        { id: "product-quiz", title: "Product Quiz", code: "EXP_05", icon: "quiz" },
    ];

    let currentIndex = $state(0);
    let isDragging = $state(false);
    let startX = $state(0);
    let dragOffset = $state(0);
    let sliderTrack = $state<HTMLElement | null>(null);

    const totalSlides = slides.length;

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

<div class="w-full h-full min-h-[100dvh] md:h-screen max-w-6xl mx-auto px-3 sm:px-6 md:px-8 py-3 sm:py-4 flex flex-col justify-between select-none font-sans overflow-hidden">
    <!-- Clean Minimalist Header -->
    <div class="flex items-end justify-between mb-2 pb-1.5 border-b border-black/5 shrink-0">
        <div>
            <div class="flex items-center gap-2 font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-primary font-bold mb-0.5">
                <span class="size-1.5 bg-primary"></span>
                <span>04 / Interactive Gamification</span>
            </div>
            <h2 class="text-xl sm:text-2xl md:text-3xl font-extrabold text-text tracking-tight uppercase">
                Mini Games Suite
            </h2>
        </div>

        <!-- Navigation Status & Controls -->
        <div class="flex items-center gap-2 sm:gap-3">
            <span class="font-mono text-[10px] sm:text-xs font-bold text-text/50 tracking-widest">
                [0{currentIndex + 1} / 0{totalSlides}]
            </span>

            <div class="flex items-center gap-1">
                <button
                    onclick={prevSlide}
                    class="size-7 sm:size-8 bg-black/5 hover:bg-primary hover:text-white text-text flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
                    aria-label="Previous Slide"
                >
                    <span class="material-symbols-outlined text-[15px] sm:text-[16px]">arrow_back</span>
                </button>
                <button
                    onclick={nextSlide}
                    class="size-7 sm:size-8 bg-black/5 hover:bg-primary hover:text-white text-text flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
                    aria-label="Next Slide"
                >
                    <span class="material-symbols-outlined text-[15px] sm:text-[16px]">arrow_forward</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Main Viewport Surface -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
        class="relative w-full h-[55vh] sm:h-[60vh] md:h-[65vh] max-h-[580px] bg-white/60 backdrop-blur-md overflow-hidden cursor-grab active:cursor-grabbing shrink-0"
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
            <!-- Slide 1: Lucky Wheel -->
            <div class="w-full h-full shrink-0 flex items-center justify-center p-2">
                <LuckyWheel />
            </div>

            <!-- Slide 2: Live Leaderboard -->
            <div class="w-full h-full shrink-0 flex items-center justify-center p-2">
                <ScoreBoard />
            </div>

            <!-- Slide 3: Reflex Challenge -->
            <div class="w-full h-full shrink-0 flex items-center justify-center p-2">
                <ReflexChallenge />
            </div>

            <!-- Slide 4: Catch & Collect -->
            <div class="w-full h-full shrink-0 flex items-center justify-center p-2">
                <CatchCollectGame />
            </div>

            <!-- Slide 5: Product Quiz -->
            <div class="w-full h-full shrink-0 flex items-center justify-center p-2">
                <ProductQuiz />
            </div>
        </div>
    </div>

    <!-- Minimal Responsive Tabs Bar (Horizontal scroll on mobile, grid on desktop) -->
    <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none md:grid md:grid-cols-5 md:gap-2 mt-2 sm:mt-3 shrink-0">
        {#each slides as slide, idx}
            <button
                onclick={() => goToSlide(idx)}
                class="flex items-center justify-between px-2.5 sm:px-3 py-1.5 text-left transition-all duration-200 cursor-pointer shrink-0 md:shrink {currentIndex === idx ? 'bg-primary text-white shadow-xs' : 'bg-white/70 text-text/70 hover:bg-white hover:text-text border border-black/5'}"
            >
                <div class="flex items-center gap-1.5 truncate">
                    <span class="material-symbols-outlined text-[15px] sm:text-[16px] {currentIndex === idx ? 'text-white' : 'text-primary'} shrink-0">
                        {slide.icon}
                    </span>
                    <span class="text-[11px] sm:text-xs font-bold tracking-tight truncate">{slide.title}</span>
                </div>
                <span class="font-mono text-[9px] sm:text-[10px] {currentIndex === idx ? 'text-white/80' : 'text-text/40'} ml-1.5 shrink-0 hidden sm:inline">{slide.code}</span>
            </button>
        {/each}
    </div>
</div>