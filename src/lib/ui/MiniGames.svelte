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
        { id: "lucky-wheel", title: "Lucky Wheel", code: "01", icon: "rotate_right", imageSrc: "" },
        { id: "reflex-challenge", title: "Reflex Speed", code: "02", icon: "bolt", imageSrc: "" },
        { id: "catch-collect", title: "Catch & Collect", code: "03", icon: "token", imageSrc: "" },
        { id: "product-quiz", title: "Product Quiz", code: "04", icon: "quiz", imageSrc: "" },
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

<div class="w-full min-h-dvh py-4 sm:py-8 max-w-6xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col justify-between select-none overflow-visible md:overflow-hidden">
    <!-- Clean Header -->
    <div class="flex items-end justify-between pb-3 border-b border-black/5 shrink-0 w-full mb-3">
        <div>
            <h2 class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-text tracking-tight">
                Mini Games Suite
            </h2>
            <p class="text-xs sm:text-sm text-text/70 mt-1 max-w-xl leading-relaxed">
                Arcade challenges and brand knowledge quizzes for high booth engagement.
            </p>
        </div>
    </div>

    <!-- MAIN STAGE: PERSISTENT IPHONE PHONE DEVICE FRAME CONTAINER WITH SLIDER INSIDE -->
    <div class="flex-1 w-full min-h-[460px] sm:min-h-[580px] flex items-center justify-center relative my-2 py-2">
        <!-- Phone Stage Wrapper with Side Navigation Controls -->
        <div class="relative flex items-center justify-center">
            <!-- Left Slide Button on Side of Phone -->
            <button
                onclick={prevSlide}
                class="absolute -left-3 sm:-left-7 md:-left-8 top-1/2 -translate-y-1/2 z-40 size-8 sm:size-11 rounded-full bg-white/90 hover:bg-white text-text shadow-lg border border-black/5 backdrop-blur-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                aria-label="Previous Game"
                title="Previous Game"
            >
                <span class="material-symbols-rounded text-lg sm:text-2xl text-text/80">chevron_left</span>
            </button>

            <!-- iPhone Device Frame Silhouette -->
            <div class="relative flex flex-col w-[min(320px,88vw)] sm:w-[350px] md:w-[370px] h-[480px] sm:h-[580px] md:h-[610px] p-2.5 sm:p-3 rounded-[38px] sm:rounded-[44px] bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 shadow-2xl ring-1 ring-white/10 border border-slate-700/40">
                <!-- Top Speaker Notch / Dynamic Island Cut-Out -->
                <div class="absolute top-3.5 sm:top-4 left-1/2 -translate-x-1/2 z-40 w-20 sm:w-24 h-4 sm:h-5 rounded-full bg-slate-950 flex items-center justify-center gap-2 border border-slate-800 shadow-inner">
                    <span class="size-1.5 sm:size-2 rounded-full bg-slate-900 border border-slate-800"></span>
                    <span class="size-1 sm:size-1.5 rounded-full bg-blue-950/80"></span>
                </div>

                <!-- Inner Bezel Screen Viewport -->
                <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                <div
                    class="relative flex-1 w-full h-full rounded-[28px] sm:rounded-[34px] overflow-hidden bg-slate-950 border border-black/50 cursor-grab active:cursor-grabbing"
                    ontouchstart={handleTouchStart}
                    ontouchmove={handleTouchMove}
                    ontouchend={handleTouchEnd}
                    onmousedown={handleMouseDown}
                    onmousemove={handleMouseMove}
                    onmouseup={handleMouseUp}
                    onmouseleave={handleMouseLeave}
                    role="region"
                    aria-label="Mobile Games Carousel"
                >
                    <!-- Horizontal Sliding Track INSIDE the Phone Screen -->
                    <div
                        bind:this={sliderTrack}
                        class="flex h-full w-full will-change-transform"
                        style="transform: translateX(calc(-{currentIndex * 100}% + {dragOffset}px)); transition: {isDragging ? 'none' : 'transform 0.45s cubic-bezier(0.2, 0.9, 0.3, 1)'};"
                    >
                        {#each slides as slide (slide.id)}
                            <div class="w-full h-full shrink-0 relative flex flex-col justify-between overflow-hidden">
                                {#if !liveGames[slide.id]}
                                    <!-- PREVIEW CARD INSIDE THE PHONE SCREEN -->
                                    {#if slide.imageSrc}
                                        <img src={slide.imageSrc} alt={slide.title} class="absolute inset-0 w-full h-full object-cover" />
                                    {:else}
                                        <div class="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex flex-col items-center justify-center p-6 text-center text-white">
                                            <div class="size-20 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-4 border border-white/10 shadow-xl">
                                                <span class="material-symbols-rounded text-4xl text-primary">
                                                    {slide.icon}
                                                </span>
                                            </div>
                                            <h3 class="text-xl font-bold tracking-tight mb-1">{slide.title}</h3>
                                            <p class="text-xs text-white/60 mb-4 max-w-[200px]">Tap play to launch interactive challenge</p>
                                        </div>
                                    {/if}

                                    <!-- Bottom Gradient Scrim -->
                                    <div class="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent pointer-events-none z-10"></div>

                                    <!-- Overlay 'Try it live' button INSIDE THE PHONE SCREEN -->
                                    <div class="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center p-4 z-20">
                                        <button
                                            onclick={() => handleTryLive(slide.id)}
                                            class="px-6 py-3 rounded-full font-semibold text-xs text-white bg-primary shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer border border-white/20"
                                        >
                                            <span class="material-symbols-rounded text-base">
                                                {!brand.isCustom ? 'auto_awesome' : 'play_arrow'}
                                            </span>
                                            <span>{!brand.isCustom ? 'Try for your brand' : 'Try it live'}</span>
                                        </button>
                                    </div>
                                {:else}
                                    <!-- LIVE INTERACTIVE GAME RUNNING INSIDE THE PHONE SCREEN -->
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

                                        <!-- Exit Live Button INSIDE PHONE -->
                                        <button
                                            onclick={() => toggleLive(slide.id, false)}
                                            class="absolute top-11 right-3 z-40 size-7.5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition cursor-pointer shadow-md"
                                            title="Exit Live Game"
                                            aria-label="Exit Live Game"
                                        >
                                            <span class="material-symbols-rounded text-base">close</span>
                                        </button>
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    </div>

                    <!-- iOS Bottom Home Indicator Bar -->
                    <div class="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-40 w-28 h-1 rounded-full bg-white/40 pointer-events-none"></div>
                </div>
            </div>

            <!-- Right Slide Button on Side of Phone -->
            <button
                onclick={nextSlide}
                class="absolute -right-3 sm:-right-7 md:-right-8 top-1/2 -translate-y-1/2 z-40 size-8 sm:size-11 rounded-full bg-white/90 hover:bg-white text-text shadow-lg border border-black/5 backdrop-blur-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                aria-label="Next Game"
                title="Next Game"
            >
                <span class="material-symbols-rounded text-lg sm:text-2xl text-text/80">chevron_right</span>
            </button>
        </div>
    </div>

    <!-- Floating Glass Pill Tabs Bar -->
    <div class="flex items-center justify-center gap-1.5 bg-white/80 backdrop-blur-xl p-1.5 rounded-full border border-black/5 shadow-md w-full max-w-xl mx-auto mt-2 shrink-0">
        {#each slides as slide, idx}
            <button
                onclick={() => goToSlide(idx)}
                class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-center rounded-full transition-all duration-200 cursor-pointer text-xs font-semibold {currentIndex === idx ? 'bg-primary text-white shadow-xs' : 'text-text/70 hover:text-text hover:bg-black/5'}"
            >
                <span class="material-symbols-rounded text-base shrink-0">
                    {slide.icon}
                </span>
                <span class="hidden sm:inline truncate">{slide.title}</span>
            </button>
        {/each}
    </div>
</div>