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
        heightClass: string;
    }

    const slides: GameSlide[] = [
        { id: "lucky-wheel", title: "Lucky Wheel", code: "01", icon: "rotate_right", imageSrc: "lucky_wheel.jpg", heightClass: "h-44 sm:h-52 md:h-56" },
        { id: "reflex-challenge", title: "Reflex Speed", code: "02", icon: "bolt", imageSrc: "reflex_speed.jpg", heightClass: "h-32 sm:h-36 md:h-40" },
        { id: "catch-collect", title: "Catch & Collect", code: "03", icon: "token", imageSrc: "catch_collect.jpg", heightClass: "h-36 sm:h-40 md:h-44" },
        { id: "product-quiz", title: "Product Quiz", code: "04", icon: "quiz", imageSrc: "product_quiz.jpg", heightClass: "h-48 sm:h-56 md:h-64" },
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

<div class="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col overflow-visible">
    
    <!-- MAIN 2-COLUMN STAGE: LEFT = TITLE + DESC + STAGGERED IMAGES (5/12) | RIGHT = KIOSK DISPLAY (7/12) -->
    <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-center justify-between flex-1 w-full my-auto">
        
        <!-- LEFT COLUMN (Taller col-span-5 with staggered image card heights) -->
        <div class="md:col-span-5 flex flex-col justify-between space-y-5 sm:space-y-6">
            <div>
                <h2 class="text-3xl sm:text-4xl lg:text-5xl font-black text-text tracking-tight leading-tight">
                    Kiosk
                    <span class="text-transparent bg-clip-text bg-linear-to-r from-primary to-secondary">Mini Games</span>
                </h2>
                
                <p class="text-xs sm:text-sm text-text/75 mt-2.5 leading-relaxed font-medium">
                    Boost attendee foot traffic and lead generation with interactive trade show touchscreen kiosk challenges.
                </p>
            </div>

            <!-- 4 IMAGES GRID (STAGGERED BENTO LAYOUT WITH DIFFERENT HEIGHTS) -->
            <div class="grid grid-cols-2 gap-3 sm:gap-3.5 pt-1">
                {#each [[0, 2], [1, 3]] as columnIndices}
                    <div class="flex flex-col gap-3 sm:gap-3.5">
                        {#each columnIndices as idx}
                            {@const slide = slides[idx]}
                            <button
                                onclick={() => goToSlide(idx)}
                                class="group relative {slide.heightClass} rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer text-left flex flex-col justify-end p-3 sm:p-3.5 shadow-xs hover:shadow-md {currentIndex === idx ? 'border-primary ring-2 ring-primary/40 scale-[1.02]' : 'border-black/10 hover:border-black/25 opacity-85 hover:opacity-100'}"
                                aria-label="Select {slide.title}"
                            >
                                <!-- Card Background Image -->
                                {#if slide.imageSrc}
                                    <img
                                        src={slide.imageSrc}
                                        alt={slide.title}
                                        class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div class="absolute inset-0 bg-linear-to-t from-slate-950/90 via-slate-950/40 to-black/20"></div>
                                {:else}
                                    <div class="absolute inset-0 bg-linear-to-br from-slate-900 to-slate-950"></div>
                                {/if}

                                <!-- Active Indicator / Icon Header -->
                                <div class="relative z-10 flex items-center justify-between w-full mb-auto">
                                    {#if currentIndex === idx}
                                        <span class="px-2 py-0.5 rounded-md bg-primary text-white text-[9px] font-black uppercase tracking-wider shadow-xs">
                                            Active
                                        </span>
                                    {/if}
                                </div>

                                <!-- Title -->
                                <div class="relative z-10">
                                    <h3 class="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight group-hover:text-primary transition-colors truncate">
                                        {slide.title}
                                    </h3>
                                </div>
                            </button>
                        {/each}
                    </div>
                {/each}
            </div>
        </div>

        <!-- RIGHT COLUMN (col-span-7 out of 12): TALL REALISTIC TRADE SHOW KIOSK TOTEM -->
        <div class="md:col-span-7 flex flex-col items-center justify-center relative">
            <!-- Kiosk Stage Wrapper with Side Navigation Controls -->
            <div class="relative flex items-center justify-center w-full">
                <!-- Left Slide Button on Side of Kiosk -->
                <button
                    onclick={prevSlide}
                    class="absolute left-20 top-1/2 -translate-y-1/2 z-40 size-9 sm:size-11 rounded-full bg-white/90 hover:bg-white text-text shadow-lg border border-black/5 backdrop-blur-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                    aria-label="Previous Game"
                    title="Previous Game"
                >
                    <span class="material-symbols-rounded text-lg sm:text-2xl text-text/80">chevron_left</span>
                </button>

                <!-- REAL TRADE SHOW INTERACTIVE KIOSK TOTEM STAND (50% SCREEN / 50% METALLIC BASE) -->
                <div class="relative flex flex-col w-[min(380px,90vw)] sm:w-102.5 md:w-110 h-140 sm:h-157.5 md:h-167.5 p-3 sm:p-4 rounded-2xl bg-slate-900 shadow-2xl ring-1 ring-white/10 border-2 border-slate-700/60 overflow-hidden">

                    <!-- TOUCHSCREEN VIEWPORT (UPPER HALF / ~50% HEIGHT) -->
                    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                    <div
                        class="relative h-1/2 w-full rounded-2xl overflow-hidden bg-slate-950 border border-black/60 cursor-grab active:cursor-grabbing shadow-inner shrink-0"
                        ontouchstart={handleTouchStart}
                        ontouchmove={handleTouchMove}
                        ontouchend={handleTouchEnd}
                        onmousedown={handleMouseDown}
                        onmousemove={handleMouseMove}
                        onmouseup={handleMouseUp}
                        onmouseleave={handleMouseLeave}
                        role="region"
                        aria-label="Interactive Touchscreen Kiosk Carousel"
                    >
                        <!-- Horizontal Sliding Track INSIDE the Kiosk Display -->
                        <div
                            bind:this={sliderTrack}
                            class="flex h-full w-full will-change-transform"
                            style="transform: translateX(calc(-{currentIndex * 100}% + {dragOffset}px)); transition: {isDragging ? 'none' : 'transform 0.45s cubic-bezier(0.2, 0.9, 0.3, 1)'};"
                        >
                            {#each slides as slide (slide.id)}
                                <div class="w-full h-full shrink-0 relative flex flex-col justify-between overflow-hidden">
                                    {#if !brand.isCustom && !liveGames[slide.id]}
                                        <!-- PREVIEW CARD INSIDE THE KIOSK DISPLAY -->
                                        {#if slide.imageSrc}
                                            <img src={slide.imageSrc} alt={slide.title} class="absolute inset-0 w-full h-full object-cover" />
                                        {:else}
                                            <div class="absolute inset-0 bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 flex flex-col items-center justify-center p-6 text-center text-white">
                                                <div class="size-16 sm:size-20 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-4 border border-white/10 shadow-xl">
                                                    <span class="material-symbols-rounded text-3xl sm:text-4xl text-primary">
                                                        {slide.icon}
                                                    </span>
                                                </div>
                                                <h3 class="text-xl sm:text-2xl font-bold tracking-tight mb-1">{slide.title}</h3>
                                                <p class="text-xs text-white/60 mb-4 max-w-55">Touch screen or play live on kiosk</p>
                                            </div>
                                        {/if}

                                        <!-- Bottom Gradient Scrim -->
                                        <div class="absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-slate-950 via-slate-950/70 to-transparent pointer-events-none z-10"></div>

                                        <!-- Overlay 'Try it live' button INSIDE KIOSK -->
                                        <div class="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center p-4 z-20">
                                            <button
                                                onclick={() => handleTryLive(slide.id)}
                                                class="px-6 py-3 rounded-full font-semibold text-xs text-white bg-primary shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer border border-white/20"
                                            >
                                                <span class="material-symbols-rounded text-base">
                                                    {!brand.isCustom ? 'auto_awesome' : 'touch_app'}
                                                </span>
                                                <span>{!brand.isCustom ? 'Try for your brand' : 'Touch to Play Live'}</span>
                                            </button>
                                        </div>
                                    {:else}
                                        <!-- LIVE INTERACTIVE GAME RUNNING INSIDE THE KIOSK DISPLAY -->
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

                                            {#if !brand.isCustom}
                                                <!-- Exit Live Button INSIDE KIOSK -->
                                                <button
                                                    onclick={() => toggleLive(slide.id, false)}
                                                    class="absolute top-3 right-3 z-40 size-7.5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition cursor-pointer shadow-md"
                                                    title="Exit Live Game"
                                                    aria-label="Exit Live Game"
                                                >
                                                    <span class="material-symbols-rounded text-base">close</span>
                                                </button>
                                            {/if}
                                        </div>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    </div>

                </div>

                <!-- Right Slide Button on Side of Kiosk -->
                <button
                    onclick={nextSlide}
                    class="absolute right-20 top-1/2 -translate-y-1/2 z-40 size-9 sm:size-11 rounded-full bg-white/90 hover:bg-white text-text shadow-lg border border-black/5 backdrop-blur-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                    aria-label="Next Game"
                    title="Next Game"
                >
                    <span class="material-symbols-rounded text-lg sm:text-2xl text-text/80">chevron_right</span>
                </button>
            </div>

            <!-- EXTERNAL GAMES SELECTOR (MOVED OUTSIDE DEVICE INTO NORMAL UI) -->
            <div class="mt-3.5 sm:mt-4 flex items-center justify-center gap-1.5 sm:gap-2 p-1.5 bg-white/80 backdrop-blur-md rounded-2xl border border-black/10 shadow-sm max-w-full overflow-x-auto">
                {#each slides as slide, idx}
                    <button
                        onclick={() => goToSlide(idx)}
                        class="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap {currentIndex === idx ? 'bg-primary text-white shadow-sm scale-102' : 'text-text/75 hover:text-text hover:bg-black/5'}"
                    >
                        <span class="material-symbols-rounded text-sm sm:text-base shrink-0">
                            {slide.icon}
                        </span>
                        <span>{slide.title}</span>
                    </button>
                {/each}
            </div>
        </div>

    </div>

</div>