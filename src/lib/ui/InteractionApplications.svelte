<script>
    import Tour360 from "$lib/components/Tour360.svelte";
    import VideoTour360 from "$lib/components/VideoTour360.svelte";
    import RealTimeWalking from "./RealTimeWalking.svelte";
    import { brand } from "$lib/brand.svelte";

    const workflowSteps = [
        { label: "Site Survey", icon: "location_searching" },
        { label: "On-Site Capture", icon: "photo_camera" },
        { label: "Post-Processing", icon: "auto_fix_high" },
        { label: "Tour Building", icon: "3d_rotation" },
        { label: "QA & Launch", icon: "rocket_launch" },
        { label: "5-15 Days Turnaround Time", icon: "timer" }
    ];
</script>

<div class="w-full flex flex-col">
    <!-- Combined Section: 360° Photo Panorama (Column 1) & 360° Video Panorama (Column 2) -->
    <div class="w-full min-h-dvh md:h-screen max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-8 flex flex-col justify-between select-none overflow-visible md:overflow-hidden">
        <!-- Section Header -->
        <div class="flex items-end justify-between pb-3 border-b border-black/5 shrink-0 w-full mb-3 sm:mb-4">
            <div>
                <h2 class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-text tracking-tight">
                    360° Captured Tours
                </h2>
                <p class="text-xs sm:text-sm text-text/70 mt-1 max-w-xl leading-relaxed">
                    Interactive 360° panoramic venue photos and live 360° video exploration.
                </p>
            </div>
        </div>

        <!-- 50/50 Split 3D Viewports Container (2 Columns) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 flex-1 w-full my-auto max-h-none md:max-h-[78vh] overflow-hidden">
            <!-- Column 1: 360° Photo Panorama (Left Half) -->
            <div class="w-full h-64 sm:h-80 md:h-full relative overflow-hidden rounded-3xl shadow-md">
                <Tour360 />
            </div>

            <!-- Column 2: 360° Video Panorama (Right Half) -->
            <div class="w-full h-64 sm:h-80 md:h-full relative overflow-hidden rounded-3xl shadow-md">
                <VideoTour360 />
            </div>
        </div>

        <!-- Rolling Workflow Ticker -->
        <div class="w-full overflow-hidden mt-3 sm:mt-4 py-1 mask-gradient relative group/ticker select-none">
            <div class="flex whitespace-nowrap animate-marquee group-hover/ticker:[animation-play-state:paused] gap-3">
                <ul class="flex items-center gap-3 shrink-0 adv">
                    {#each workflowSteps as step}
                        <li class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-white shadow-xs border border-white/20 transition-transform duration-200 hover:scale-105 cursor-pointer bg-primary">
                            <span class="material-symbols-rounded text-sm shrink-0">{step.icon}</span>
                            <span>{step.label}</span>
                        </li>
                    {/each}
                </ul>
                <ul class="flex items-center gap-3 shrink-0 adv" aria-hidden="true">
                    {#each workflowSteps as step}
                        <li class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-white shadow-xs border border-white/20 transition-transform duration-200 hover:scale-105 cursor-pointer bg-primary">
                            <span class="material-symbols-rounded text-sm shrink-0">{step.icon}</span>
                            <span>{step.label}</span>
                        </li>
                    {/each}
                </ul>
                <ul class="flex items-center gap-3 shrink-0 adv" aria-hidden="true">
                    {#each workflowSteps as step}
                        <li class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-white shadow-xs border border-white/20 transition-transform duration-200 hover:scale-105 cursor-pointer bg-primary" >
                            <span class="material-symbols-rounded text-sm shrink-0">{step.icon}</span>
                            <span>{step.label}</span>
                        </li>
                    {/each}
                </ul>
            </div>
        </div>
    </div>

    <!-- Real-Time Walking & True Scale 2-Column Section -->
    <RealTimeWalking />
</div>

<style>
    @keyframes marquee {
        0% {
            transform: translateX(0%);
        }
        100% {
            transform: translateX(-33.333%);
        }
    }

    .animate-marquee {
        display: flex;
        width: max-content;
        animation: marquee 42s linear infinite;
    }

    .mask-gradient {
        mask-image: linear-gradient(to right, transparent, black 6%, black 94%, transparent);
        -webkit-mask-image: linear-gradient(to right, transparent, black 6%, black 94%, transparent);
    }
</style>