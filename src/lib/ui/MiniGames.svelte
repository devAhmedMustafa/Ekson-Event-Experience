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
        { id: "score-board", title: "Live Leaderboard", code: "EXP_02", icon: "leaderboard" },
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
        const threshold = 60;
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
        const threshold = 60;
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

<div class="w-full h-full max-h-screen max-w-6xl mx-auto px-4 md:px-8 py-4 md:py-6 flex flex-col justify-center select-none overflow-hidden font-sans">
    <!-- Architectural Header -->
    <div class="flex items-end justify-between mb-4 pb-3 border-b border-text/10 shrink-0">
        <div>
            <div class="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-text/60 mb-1">
                <span class="size-1.5 bg-primary"></span>
                <span>04 / Interactive Gamification</span>
            </div>
            <h2 class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-text tracking-tight uppercase">
                Event Mini-Games
            </h2>
        </div>

        <!-- Metric Counter & Nav Controls -->
        <div class="flex items-center gap-4">
            <span class="font-mono text-xs font-bold text-text/50 tracking-widest">
                [0{currentIndex + 1} / 0{totalSlides}]
            </span>

            <div class="flex items-center gap-1">
                <button
                    onclick={prevSlide}
                    class="size-9 bg-text/5 hover:bg-primary hover:text-white text-text flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
                    aria-label="Previous Slide"
                >
                    <span class="material-symbols-outlined text-[18px]">arrow_back</span>
                </button>
                <button
                    onclick={nextSlide}
                    class="size-9 bg-text/5 hover:bg-primary hover:text-white text-text flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
                    aria-label="Next Slide"
                >
                    <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Main Viewport (Sharp, Borderless Surface) -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
        class="relative w-full h-[390px] sm:h-[420px] md:h-[450px] max-h-[60vh] bg-white/60 backdrop-blur-md overflow-hidden cursor-grab active:cursor-grabbing shrink-0"
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
            <div class="w-full h-full shrink-0 flex items-center justify-center">
                <LuckyWheel />
            </div>

            <!-- Slide 2: Live Leaderboard -->
            <div class="w-full h-full shrink-0 flex items-center justify-center">
                <ScoreBoard />
            </div>

            <!-- Slide 3: Reflex Challenge -->
            <div class="w-full h-full shrink-0 flex items-center justify-center">
                <ReflexChallenge />
            </div>

            <!-- Slide 4: Catch & Collect -->
            <div class="w-full h-full shrink-0 flex items-center justify-center">
                <CatchCollectGame />
            </div>

            <!-- Slide 5: Product Quiz -->
            <div class="w-full h-full shrink-0 flex items-center justify-center">
                <ProductQuiz />
            </div>
        </div>
    </div>

    <!-- Minimal Sharp Tabs Navigation Bar -->
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mt-4 shrink-0">
        {#each slides as slide, idx}
            <button
                onclick={() => goToSlide(idx)}
                class="flex items-center justify-between px-3 py-2 text-left transition-all duration-200 cursor-pointer {currentIndex === idx ? 'bg-primary text-white shadow-xs' : 'bg-white/70 text-text/70 hover:bg-white hover:text-text border border-black/5'}"
            >
                <div class="flex items-center gap-2 truncate">
                    <span class="material-symbols-outlined text-[16px] {currentIndex === idx ? 'text-white' : 'text-primary'} shrink-0">
                        {slide.icon}
                    </span>
                    <span class="text-xs font-bold tracking-tight truncate">{slide.title}</span>
                </div>
                <span class="font-mono text-[10px] {currentIndex === idx ? 'text-white/80' : 'text-text/40'} ml-1.5 shrink-0">{slide.code}</span>
            </button>
        {/each}
    </div>
</div>