<script lang="ts">
    interface ARApp {
        id: string;
        title: string;
        code: string;
        tagline: string;
        description: string;
        qrImage: string;
        videoSrc: string;
        tech: string[];
    }
    const arApps: ARApp[] = [
        {
            id: "booth-portal",
            title: "Spatial Booth Portal",
            code: "AR_01",
            tagline: "1:1 Scale Physical World Placement",
            description: "Scan to project a full-scale holographic event booth into your immediate physical space with real-time floor plane detection.",
            qrImage: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2-bSTmiStyCsD1hYTAcOKpw2QAE383gnyKPKNkM6DcQ&s=10",
            videoSrc: "/Walkthrough-demo.mp4",
            tech: ["WebXR", "Plane SLAM", "Light Estimation"]
        },
        {
            id: "product-lens",
            title: "HoloProduct Dissector",
            code: "AR_02",
            tagline: "Interactive 3D Component Inspection",
            description: "Interact with floating 3D hardware models. Explode assemblies, rotate in 6DoF, and view real-time architectural callouts.",
            qrImage: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2-bSTmiStyCsD1hYTAcOKpw2QAE383gnyKPKNkM6DcQ&s=10",
            videoSrc: "/Walkthrough-demo.mp4",
            tech: ["6DoF Tracking", "Exploded View", "Physics PBR"]
        },
        {
            id: "wayfinding",
            title: "Venue AR Wayfinding",
            code: "AR_03",
            tagline: "Augmented Indoor GPS Navigation",
            description: "Overlay directional navigation paths and dynamic point-of-interest markers across high-density exhibition halls.",
            qrImage: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2-bSTmiStyCsD1hYTAcOKpw2QAE383gnyKPKNkM6DcQ&s=10",
            videoSrc: "/Walkthrough-demo.mp4",
            tech: ["Indoor VPS", "Dynamic Markers", "Instant WebAR"]
        }
    ];

    let currentIndex = $state(0);
    let isDragging = $state(false);
    let startX = $state(0);
    let dragOffset = $state(0);
    let isVideoPlaying = $state(true);

    let videoElements = $state<(HTMLVideoElement | null)[]>([]);

    const totalApps = arApps.length;

    function nextSlide() {
        if (currentIndex < totalApps - 1) {
            currentIndex += 1;
        } else {
            currentIndex = 0;
        }
    }

    function prevSlide() {
        if (currentIndex > 0) {
            currentIndex -= 1;
        } else {
            currentIndex = totalApps - 1;
        }
    }

    function goToSlide(index: number) {
        currentIndex = index;
    }

    // Touch & Mouse Handlers for Drag/Swipe
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
        if (dragOffset < -40) nextSlide();
        else if (dragOffset > 40) prevSlide();
        dragOffset = 0;
    }

    function handleMouseDown(e: MouseEvent) {
        const target = e.target as HTMLElement;
        if (target.closest("button, input, a")) return;
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
        if (dragOffset < -40) nextSlide();
        else if (dragOffset > 40) prevSlide();
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

    function toggleVideo(idx: number) {
        const vid = videoElements[idx];
        if (!vid) return;
        if (vid.paused) {
            vid.play();
            isVideoPlaying = true;
        } else {
            vid.pause();
            isVideoPlaying = false;
        }
    }
</script>

<svelte:window onkeydown={handleKeyDown} />

<div class="w-full h-full min-h-[100dvh] md:h-screen max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex flex-col justify-between select-none font-sans overflow-hidden">
    <!-- Header -->
    <div class="flex items-end justify-between mb-2 pb-1.5 border-b border-black/5 shrink-0">
        <div>
            <div class="flex items-center gap-2 font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-primary font-bold mb-0.5">
                <span class="size-1.5 bg-primary"></span>
                <span>06 / Spatial Lens</span>
            </div>
            <h2 class="text-xl sm:text-2xl md:text-3xl font-extrabold text-text tracking-tight uppercase">
                AR Applications
            </h2>
        </div>

        <!-- Metric Counter & Nav Controls -->
        <div class="flex items-center gap-2 sm:gap-3">
            <span class="font-mono text-[10px] sm:text-xs font-bold text-text/50 tracking-widest">
                [0{currentIndex + 1} / 0{totalApps}]
            </span>

            <div class="flex items-center gap-1">
                <button
                    onclick={prevSlide}
                    class="size-7 sm:size-8 bg-black/3 hover:bg-primary hover:text-white text-text flex items-center justify-center transition-colors active:scale-95 cursor-pointer border border-black/5"
                    aria-label="Previous AR App"
                >
                    <span class="material-symbols-outlined text-[15px] sm:text-[16px]">arrow_back</span>
                </button>
                <button
                    onclick={nextSlide}
                    class="size-7 sm:size-8 bg-black/3 hover:bg-primary hover:text-white text-text flex items-center justify-center transition-colors active:scale-95 cursor-pointer border border-black/5"
                    aria-label="Next AR App"
                >
                    <span class="material-symbols-outlined text-[15px] sm:text-[16px]">arrow_forward</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Main Viewport Carousel -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
        class="relative w-full h-[55vh] sm:h-[60vh] md:h-[65vh] max-h-[560px] overflow-hidden cursor-grab active:cursor-grabbing shrink-0"
        ontouchstart={handleTouchStart}
        ontouchmove={handleTouchMove}
        ontouchend={handleTouchEnd}
        onmousedown={handleMouseDown}
        onmousemove={handleMouseMove}
        onmouseup={handleMouseUp}
        onmouseleave={handleMouseLeave}
        role="region"
        aria-label="AR Apps Carousel"
    >
        <!-- Sliding Horizontal Track -->
        <div
            class="flex h-full w-full will-change-transform"
            style="transform: translateX(calc(-{currentIndex * 100}% + {dragOffset}px)); transition: {isDragging ? 'none' : 'transform 0.45s cubic-bezier(0.2, 0.9, 0.3, 1)'};"
        >
            {#each arApps as app, idx}
                <div class="w-full h-full shrink-0 flex items-center justify-center px-1">
                    <div class="w-full h-full flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 overflow-hidden bg-white border border-black/10 p-3 sm:p-5 shadow-xs">
                        
                        <!-- LEFT: Clean QR Code Image Panel -->
                        <div class="w-full md:w-60 lg:w-72 h-auto md:h-full flex flex-row md:flex-col justify-between items-center shrink-0 gap-3">
                            <div class="text-left md:text-center w-full">
                                <h3 class="text-base sm:text-lg font-black text-text uppercase tracking-tight">
                                    {app.title}
                                </h3>
                                <p class="text-[10px] sm:text-xs text-primary font-mono font-bold mt-0.5">
                                    {app.tagline}
                                </p>
                            </div>

                            <!-- QR Code Image Stage -->
                            <div class="relative size-28 sm:size-36 md:size-44 p-1.5 sm:p-2 bg-white border border-black/10 flex items-center justify-center shrink-0">
                                <img
                                    src={app.qrImage}
                                    alt="{app.title} QR Code"
                                    class="w-full h-full object-contain"
                                />
                            </div>

                            <!-- Scan Hint -->
                            <div class="hidden md:flex items-center gap-1 font-mono text-[9px] text-text/50 uppercase tracking-wider">
                                <span class="material-symbols-outlined text-[13px] text-primary">qr_code_scanner</span>
                                <span>SCAN TO LAUNCH</span>
                            </div>
                        </div>

                        <!-- RIGHT: Preview Video Stage & Info -->
                        <div class="flex-1 w-full h-full flex flex-col justify-between overflow-hidden">
                            <!-- Video Frame -->
                            <div class="relative flex-1 w-full bg-slate-900 overflow-hidden group/vid my-1 border border-black/10 min-h-[140px]">
                                <!-- svelte-ignore a11y_media_has_caption -->
                                <video
                                    bind:this={videoElements[idx]}
                                    class="w-full h-full object-cover"
                                    src={app.videoSrc}
                                    autoplay
                                    muted
                                    loop
                                    playsinline
                                ></video>

                                <!-- Play/Pause Overlay Button -->
                                <button
                                    onclick={() => toggleVideo(idx)}
                                    class="absolute bottom-2 right-2 size-7 bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition cursor-pointer"
                                    aria-label="Toggle Video Playback"
                                >
                                    <span class="material-symbols-outlined text-[16px]">
                                        {isVideoPlaying ? "pause" : "play_arrow"}
                                    </span>
                                </button>
                            </div>

                            <!-- Description -->
                            <p class="text-[10px] sm:text-xs text-text/70 leading-snug line-clamp-2 mt-1">
                                {app.description}
                            </p>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    </div>

    <!-- Bottom Indicator Pagination Dots -->
    <div class="flex items-center justify-center gap-2 shrink-0 pt-1">
        {#each arApps as _, idx}
            <button
                onclick={() => goToSlide(idx)}
                class="h-1 transition-all duration-300 cursor-pointer {currentIndex === idx ? 'w-8 bg-primary' : 'w-2 bg-black/10 hover:bg-black/20'}"
                aria-label="Go to AR App {idx + 1}"
            ></button>
        {/each}
    </div>
</div>
