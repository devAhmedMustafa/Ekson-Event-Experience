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
            tagline: "1:1 World Scale Projection",
            description: "Project a true-scale holographic exhibition booth into physical space with instant floor plane SLAM.",
            qrImage: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2-bSTmiStyCsD1hYTAcOKpw2QAE383gnyKPKNkM6DcQ&s=10",
            videoSrc: "/Walkthrough-demo.mp4",
            tech: ["WebXR", "Plane SLAM"]
        },
        {
            id: "product-lens",
            title: "HoloProduct Dissector",
            code: "AR_02",
            tagline: "Exploded 3D Assembly",
            description: "Inspect 3D components in 6DoF. Explode parts, rotate assemblies, and view real-time callouts.",
            qrImage: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2-bSTmiStyCsD1hYTAcOKpw2QAE383gnyKPKNkM6DcQ&s=10",
            videoSrc: "/Walkthrough-demo.mp4",
            tech: ["6DoF Touch", "Physics PBR"]
        },
        {
            id: "wayfinding",
            title: "Venue AR Wayfinding",
            code: "AR_03",
            tagline: "Indoor Spatial Navigation",
            description: "Overlay dynamic holographic directional paths and venue points of interest with markerless VPS.",
            qrImage: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2-bSTmiStyCsD1hYTAcOKpw2QAE383gnyKPKNkM6DcQ&s=10",
            videoSrc: "/Walkthrough-demo.mp4",
            tech: ["Indoor VPS", "Instant AR"]
        },
        {
            id: "spatial-avatar",
            title: "Holographic Concierge",
            code: "AR_04",
            tagline: "Spatial AI Booth Guide",
            description: "Interactive lifelike 3D holographic spokesperson delivering real-time booth product briefings.",
            qrImage: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2-bSTmiStyCsD1hYTAcOKpw2QAE383gnyKPKNkM6DcQ&s=10",
            videoSrc: "/Walkthrough-demo.mp4",
            tech: ["Spatial Audio", "HoloHost"]
        }
    ];

    let videoElements = $state<(HTMLVideoElement | null)[]>([]);
    let videoPlayingStates = $state<boolean[]>([true, true, true, true]);

    function toggleVideo(idx: number) {
        const vid = videoElements[idx];
        if (!vid) return;
        if (vid.paused) {
            vid.play();
            videoPlayingStates[idx] = true;
        } else {
            vid.pause();
            videoPlayingStates[idx] = false;
        }
    }
</script>

<div class="w-full h-full min-h-dvh md:h-screen max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex flex-col justify-between select-none font-sans overflow-hidden">
    <!-- Clean Minimal Header -->
    <div class="flex items-center justify-between pb-1.5 sm:pb-2 border-b border-black/5 shrink-0">
        <div>
            <div class="flex items-center gap-1.5 font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-primary font-bold mb-0.5">
                <span class="size-1.5 bg-primary"></span>
                <span>08 / SPATIAL LENS</span>
            </div>
            <h2 class="text-lg sm:text-2xl font-black text-text tracking-tight uppercase">
                AR Applications Suite
            </h2>
        </div>

        <div class="hidden sm:flex items-center gap-2 font-mono text-[10px] text-text/50">
            <span class="size-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span>4 LIVE SPATIAL EXPERIENCES</span>
        </div>
    </div>

    <!-- 4 Quarters Grid (2x2 Screen Division) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5 my-auto w-full flex-1 max-h-[82vh] py-1">
        {#each arApps as app, idx}
            <div class="group relative bg-white border border-black/10 hover:border-primary/40 transition-all duration-200 p-2.5 sm:p-3.5 shadow-xs flex flex-row items-stretch justify-between gap-3 sm:gap-4 overflow-hidden">
                
                <!-- Left Details & Big Prominent QR Code Panel -->
                <div class="flex-1 flex flex-col justify-between overflow-hidden">
                    <!-- Title & Tagline -->
                    <div>
                        <div class="flex items-center justify-between font-mono text-[8px] sm:text-[9px] text-text/50 uppercase tracking-wider mb-0.5">
                            <span class="font-bold text-primary">{app.code}</span>
                            <span class="text-emerald-600 font-semibold">WebXR // SLAM</span>
                        </div>
                        <h3 class="text-xs sm:text-sm md:text-base font-black text-text uppercase tracking-tight truncate">
                            {app.title}
                        </h3>
                        <p class="text-[9px] sm:text-[10px] text-primary font-mono font-bold leading-none mt-0.5 truncate">
                            {app.tagline}
                        </p>
                    </div>

                    <!-- Center Big QR Code & Scan Instructions -->
                    <div class="flex items-center gap-2.5 sm:gap-3 my-auto py-1">
                        <!-- Big High-Resolution QR Container -->
                        <div class="relative size-20 sm:size-24 md:size-28 lg:size-32 p-1.5 bg-white border border-black/15 shrink-0 shadow-sm flex items-center justify-center">
                            <img
                                src={app.qrImage}
                                alt="{app.title} QR Code"
                                class="w-full h-full object-contain"
                            />
                        </div>
                        <div class="flex flex-col gap-0.5 sm:gap-1 font-mono text-[8px] sm:text-[9px] text-text/70">
                            <span class="font-bold text-text uppercase tracking-wide">SCAN TO LAUNCH</span>
                            <span class="text-[8px] sm:text-[9px] text-text/50">Point phone camera</span>
                            <div class="flex items-center gap-1 mt-0.5 px-1.5 py-0.5 bg-primary/10 border border-primary/20 text-primary w-fit">
                                <span class="material-symbols-outlined text-[12px] sm:text-[14px]">qr_code_scanner</span>
                                <span class="text-[8px] sm:text-[9px] font-bold uppercase">INSTANT AR</span>
                            </div>
                        </div>
                    </div>

                    <!-- Tech Tags -->
                    <div class="flex items-center gap-1 font-mono text-[8px] sm:text-[9px] text-text/60 overflow-hidden">
                        {#each app.tech as t}
                            <span class="px-1.5 py-0.5 bg-black/3 border border-black/5 truncate font-medium">
                                {t}
                            </span>
                        {/each}
                    </div>
                </div>

                <!-- Right Video Preview Stage (Compact & Proportional) -->
                <div class="w-28 sm:w-36 md:w-44 lg:w-52 h-full min-h-25 relative bg-slate-900 overflow-hidden border border-black/10 shrink-0 group/vid">
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

                    <!-- Play / Pause Overlay Toggle -->
                    <button
                        onclick={() => toggleVideo(idx)}
                        class="absolute bottom-1.5 right-1.5 size-6 bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition cursor-pointer"
                        aria-label="Toggle Video Playback"
                    >
                        <span class="material-symbols-outlined text-[14px]">
                            {videoPlayingStates[idx] ? "pause" : "play_arrow"}
                        </span>
                    </button>
                </div>
            </div>
        {/each}
    </div>

    <!-- Bottom Status Bar -->
    <div class="flex items-center justify-between text-[9px] font-mono text-text/50 pt-1 border-t border-black/5 shrink-0">
        <span>ALL EXPERIENCES COMPATIBLE WITH WEBAR & APPLE QUICKLOOK</span>
        <span class="hidden sm:inline">NO APP DOWNLOAD REQUIRED</span>
    </div>
</div>
