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

    // Drag gestures
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
        if (dragOffset < -40) nextSlide();
        else if (dragOffset > 40) prevSlide();
        dragOffset = 0;
    }

    function handleMouseDown(e: MouseEvent) {
        const target = e.target as HTMLElement;
        if (target.closest("button, a, input")) return;
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

<div class="w-full h-full max-h-screen max-w-6xl mx-auto px-4 md:px-6 py-4 flex flex-col justify-center select-none font-sans overflow-hidden">
    <!-- Header -->
    <div class="flex items-end justify-between mb-3 pb-2 border-b border-black/5 shrink-0">
        <div>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-text tracking-tight uppercase">
                AR Applications
            </h2>
        </div>

        <!-- Metric Counter & Nav Controls -->
        <div class="flex items-center gap-3">
            <span class="font-mono text-xs font-bold text-text/50 tracking-widest">
                [0{currentIndex + 1} / 0{totalApps}]
            </span>

            <div class="flex items-center gap-1">
                <button
                    onclick={prevSlide}
                    class="size-8 bg-black/3 hover:bg-primary hover:text-white text-text flex items-center justify-center transition-colors active:scale-95 cursor-pointer border border-black/5"
                    aria-label="Previous AR App"
                >
                    <span class="material-symbols-outlined text-[16px]">arrow_back</span>
                </button>
                <button
                    onclick={nextSlide}
                    class="size-8 bg-black/3 hover:bg-primary hover:text-white text-text flex items-center justify-center transition-colors active:scale-95 cursor-pointer border border-black/5"
                    aria-label="Next AR App"
                >
                    <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Main Viewport Carousel -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
        class="relative w-full h-95 sm:h-102.5 md:h-112.5 max-h-[62vh] backdrop-blur-md overflow-hidden cursor-grab active:cursor-grabbing shrink-0"
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
                <div class="w-full h-full shrink-0 flex items-center justify-center ">
                    <div class="w-full h-full flex flex-col md:flex-row items-center justify-between gap-4 overflow-hidden">
                        
                        <!-- LEFT: Clean QR Code Image Panel -->
                        <div class="w-full md:w-68 h-full p-4 flex flex-col justify-between items-center shrink-0">

                            <!-- QR Code Image Stage -->
                            <div class="flex flex-col items-center justify-center my-auto">
                                <div class="relative size-44 sm:size-48 p-2 bg-white border border-black/10 flex items-center justify-center">
                                    <!-- QR Image Element -->
                                    <img
                                        src={app.qrImage}
                                        alt="{app.title} QR Code"
                                        class="w-full h-full object-contain"
                                        onerror={(e) => {
                                            const img = e.currentTarget as HTMLImageElement;
                                            img.style.display = 'none';
                                            const fallback = img.nextElementSibling as HTMLElement;
                                            if (fallback) fallback.classList.remove('hidden');
                                        }}
                                    />
                                </div>
                            </div>

                            <!-- Scan Hint -->
                            <div class="flex items-center gap-1 font-mono text-[9px] text-text/50 uppercase tracking-wider">
                                <span class="material-symbols-outlined text-[13px] text-primary">qr_code_scanner</span>
                                <span>SCAN TO LAUNCH</span>
                            </div>
                        </div>

                        <!-- RIGHT: Preview Video Stage & Info -->
                        <div class="flex-1 w-full h-full flex flex-col justify-betweenoverflow-hidden">
                            <!-- Video Top Header -->
                            <div class="flex items-center justify-between mb-1.5 shrink-0">
                                

                                <!-- Tech Pills -->
                                <div class="hidden sm:flex items-center gap-1 font-mono text-[9px]">
                                    {#each app.tech as t}
                                        <span class="px-2 py-0.5 bg-black/3 border border-black/5 text-text/70">
                                            {t}
                                        </span>
                                    {/each}
                                </div>
                            </div>

                            <!-- Video Frame -->
                            <div class="relative flex-1 w-full bg-slate-900 overflow-hidden group/vid my-1 border border-black/10">
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

                                <!-- Pause/Play Trigger -->
                                <button
                                    onclick={() => toggleVideo(idx)}
                                    class="absolute bottom-2 right-2 size-7 bg-black/60 hover:bg-primary text-white flex items-center justify-center transition cursor-pointer backdrop-blur-md"
                                    aria-label="Toggle Video Playback"
                                >
                                    <span class="material-symbols-outlined text-[15px]">
                                        {videoElements[idx]?.paused ? 'play_arrow' : 'pause'}
                                    </span>
                                </button>
                            </div>

                            <!-- Video Bottom Description -->
                            <div class="mt-1.5 pt-1.5 border-t border-black/5 flex items-center justify-between text-xs shrink-0">
                                <p class="text-text/70 leading-snug max-w-lg text-[11px]">
                                    {app.description}
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            {/each}
        </div>
    </div>

    <!-- Minimal Sharp Tabs Navigation Bar -->
    <div class="grid grid-cols-3 gap-2 mt-7 px-10 shrink-0">
        {#each arApps as app, idx}
            <button
                onclick={() => goToSlide(idx)}
                class="flex items-center justify-between px-3 py-1.5 text-left transition-all duration-200 cursor-pointer {currentIndex === idx ? 'bg-primary text-white shadow-xs' : 'bg-white/70 text-text/70 hover:bg-white hover:text-text border border-black/5'}"
            >
                <div class="flex items-center gap-2 truncate">
                    <span class="material-symbols-outlined text-[15px] {currentIndex === idx ? 'text-white' : 'text-primary'} shrink-0">
                        view_in_ar
                    </span>
                    <span class="text-xs font-bold tracking-tight truncate">{app.title}</span>
                </div>
                <span class="font-mono text-[9px] {currentIndex === idx ? 'text-white/80' : 'text-text/40'} ml-1.5 shrink-0">{app.code}</span>
            </button>
        {/each}
    </div>
</div>
