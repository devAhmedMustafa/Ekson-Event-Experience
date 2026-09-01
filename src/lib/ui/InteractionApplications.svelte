<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import Tour360 from "$lib/components/Tour360.svelte";
    import RealTimeWalking from "./RealTimeWalking.svelte";

    const workflowSteps = [
        {
            step: "01",
            title: "SITE SURVEY",
            subtitle: "Area Evaluation & Mapping",
            description: "Evaluate area, scan spatial boundaries, and map 360° high-precision capture strategy.",
            icon: "location_searching"
        },
        {
            step: "02",
            title: "ON-SITE CAPTURE",
            subtitle: "High-Precision 8K Imaging",
            description: "Execute 360° high-precision imaging using professional 8K spatial cameras.",
            icon: "photo_camera"
        },
        {
            step: "03",
            title: "POST-PROCESSING",
            subtitle: "HDR Color & Stitching",
            description: "Advanced image stitching, HDR color calibration, and spatial enhancement.",
            icon: "auto_fix_high"
        },
        {
            step: "04",
            title: "TOUR BUILDING",
            subtitle: "Hotspots & Spatial Navigation",
            description: "Setup interactive info hotspots, multimedia popups, and smooth room navigation.",
            icon: "3d_rotation"
        },
        {
            step: "05",
            title: "QA & LAUNCH",
            subtitle: "Turnkey Delivery & Support",
            description: "Deliver final web link, QR code generator, web embed code, and 24/7 technical support.",
            icon: "rocket_launch"
        }
    ];

    const pricingPlans = [
        {
            tier: "Starter Space",
            area: "Up to 20 m²",
            badge: null,
            features: [
                "Standard 8K 360° capture",
                "1-Year cloud hosting",
                "Basic info hotspots",
                "Web embed code"
            ]
        },
        {
            tier: "Medium Venue",
            area: "100 m² (5× 20m²)",
            badge: "Popular",
            features: [
                "Full 360° venue capture",
                "Custom navigation path",
                "Brand logo overlay",
                "QR code generator"
            ]
        },
        {
            tier: "Large Exhibition",
            area: "200 m² (10× 20m²)",
            badge: "Pro HDR",
            features: [
                "Pro HDR 360° capture",
                "Multi-room floor plan",
                "Interactive video pop-ups",
                "Priority technical support"
            ]
        },
        {
            tier: "Enterprise",
            area: "500+ m²",
            badge: "Custom",
            features: [
                "Multi-site venue capture",
                "3D LiDAR spatial model",
                "Analytics dashboard",
                "Custom UI & REST API"
            ]
        }
    ];

    const SLIDE_DURATION = 4000; // 4 seconds per feature
    let currentStepIndex = $state(0);
    let progressPercent = $state(0);
    let isPaused = $state(false);

    let animFrameId: number | null = null;
    let startTime: number = 0;

    function startTimer() {
        stopTimer();
        startTime = performance.now();
        progressPercent = 0;
        runTimerLoop();
    }

    function runTimerLoop() {
        const update = (now: number) => {
            if (isPaused) {
                // Adjust startTime while paused so timer resumes seamlessly from current progress
                startTime = now - (progressPercent / 100) * SLIDE_DURATION;
                animFrameId = requestAnimationFrame(update);
                return;
            }

            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / SLIDE_DURATION);
            progressPercent = progress * 100;

            if (progress >= 1) {
                currentStepIndex = (currentStepIndex + 1) % workflowSteps.length;
                startTimer();
            } else {
                animFrameId = requestAnimationFrame(update);
            }
        };

        animFrameId = requestAnimationFrame(update);
    }

    function stopTimer() {
        if (animFrameId !== null) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        }
    }

    function setStep(index: number) {
        currentStepIndex = index;
        startTimer();
    }

    function nextStep() {
        currentStepIndex = (currentStepIndex + 1) % workflowSteps.length;
        startTimer();
    }

    function prevStep() {
        currentStepIndex = (currentStepIndex - 1 + workflowSteps.length) % workflowSteps.length;
        startTimer();
    }

    onMount(() => {
        startTimer();
    });

    onDestroy(() => {
        stopTimer();
    });
</script>

<div class="w-full flex flex-col">
    
    <!-- Main Section Viewport -->
    <div class="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col justify-between">
        
        <!-- TOP ROW (2 Columns): Left = Minimal Feature Card Slider | Right = The Pano -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-stretch flex-1 my-auto min-h-100 max-h-[58vh]">
            
            <!-- LEFT BOX: FEATURE CARD AUTO SLIDER (4s per feature with progress indicator line) -->
            <div
                class="p-5 sm:p-6 flex flex-col justify-between h-full relative overflow-hidden group select-none "
                role="region"
                aria-label="360 Tour Features Auto Slider"
                onmouseenter={() => (isPaused = true)}
                onmouseleave={() => (isPaused = false)}
            >
                <!-- Card Header Area -->
                <div class="relative z-10 shrink-0 flex items-center justify-between pb-2">
                    <h2 class="text-4xl sm:text-5xl font-black text-text tracking-tight">
                        360° <span class="text-transparent bg-clip-text bg-linear-to-r from-primary to-sky-800">Tours</span>
                    </h2>
                </div>

                <!-- Segmented Line Progress Indicators (Shows remaining time for feature slide) -->
                <div class="grid grid-cols-5 gap-1.5 w-full shrink-0 my-3">
                    {#each workflowSteps as _, idx}
                        <button
                            onclick={() => setStep(idx)}
                            class="h-1.5 rounded-full bg-black/10 overflow-hidden cursor-pointer transition-all hover:h-2 focus:outline-none"
                            aria-label="Go to step {idx + 1}"
                        >
                            <div
                                class="h-full bg-primary transition-all duration-75 ease-linear"
                                style="width: {idx < currentStepIndex ? '100%' : idx === currentStepIndex ? `${progressPercent}%` : '0%'};"
                            ></div>
                        </button>
                    {/each}
                </div>

                <!-- Card Body Content -->
                <div class="relative z-10 flex-1 flex flex-col justify-center my-2 space-y-3 transition-all duration-300">
                    <div class="flex items-center gap-3">
                        <div class="size-11 sm:size-12 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
                            <span class="material-symbols-rounded text-2xl">{workflowSteps[currentStepIndex].icon}</span>
                        </div>
                        <div class="flex flex-col">
                            <span class="text-[10px] font-extrabold uppercase tracking-widest text-primary font-mono">
                                {workflowSteps[currentStepIndex].subtitle}
                            </span>
                            <h3 class="text-lg sm:text-xl font-black text-text tracking-tight">
                                {workflowSteps[currentStepIndex].title}
                            </h3>
                        </div>
                    </div>

                    <p class="text-xs sm:text-sm text-text/80 leading-relaxed font-medium pl-1 min-h-12">
                        {workflowSteps[currentStepIndex].description}
                    </p>
                </div>

                <!-- Step Navigation Controls & Pills -->
                <div class="relative z-10 shrink-0 pt-3 border-t border-black/10 flex items-center justify-between gap-1.5">
                    <div class="flex items-center gap-1.5 py-1">
                        {#each workflowSteps as stepItem, idx}
                            <button
                                onclick={() => setStep(idx)}
                                class="px-2.5 py-1 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 {idx === currentStepIndex ? 'bg-primary text-white shadow-md scale-105' : 'bg-black/5 hover:bg-black/10 text-text/70'}"
                                title={stepItem.title}
                            >
                                <span>{stepItem.step}</span>
                                {#if idx === currentStepIndex}
                                    <span class="text-[10px] font-sans truncate max-w-24 hidden sm:inline">{stepItem.title}</span>
                                {/if}
                            </button>
                        {/each}
                    </div>
                    <div class="flex items-center gap-1 shrink-0">
                        <button
                            onclick={prevStep}
                            class="p-1.5 rounded-lg bg-black/5 hover:bg-black/10 text-text/70 hover:text-text transition cursor-pointer"
                            title="Previous Feature"
                            aria-label="Previous Feature"
                        >
                            <span class="material-symbols-rounded text-sm">chevron_left</span>
                        </button>
                        <button
                            onclick={nextStep}
                            class="p-1.5 rounded-lg bg-black/5 hover:bg-black/10 text-text/70 hover:text-text transition cursor-pointer"
                            title="Next Feature"
                            aria-label="Next Feature"
                        >
                            <span class="material-symbols-rounded text-sm">chevron_right</span>
                        </button>
                    </div>
                </div>

            </div>

                <!-- RIGHT BOX: THE PANO (360 Image Viewport) -->
                <div class="w-full h-full relative overflow-hidden rounded-3xl border border-black/10 shadow-md">
                    <Tour360 />
                </div>

            </div>

            <!-- BOTTOM ROW (Full Width across both columns): PRICING CARDS -->
            <div class="w-full space-y-2 pt-10 shrink-0">
                <div class="flex items-center justify-between px-1 pt-2.5">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-rounded text-primary text-base">sell</span>
                        <h3 class="font-mono text-xs font-bold text-text uppercase tracking-wider">
                            360° Tour Area Pricing Scope
                        </h3>
                    </div>
                    <span class="text-[9.5px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Area-Based Pricing
                    </span>
                </div>

                <!-- 4-Column Standard Pricing Component Cards -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {#each pricingPlans as plan}
                        <div class="p-3.5 rounded-3xl bg-white/60 hover:bg-white/90 border {plan.badge === 'Popular' ? 'border-primary ring-2 ring-primary/20 bg-white/90 shadow-md' : 'border-black/10'} shadow-sm flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5">
                            <div>
                                <div class="flex items-center justify-between mb-1.5">
                                    <h4 class="text-xs font-black text-text tracking-tight">{plan.tier}</h4>
                                    {#if plan.badge}
                                        <span class="text-[8.5px] font-bold text-white bg-primary px-2 py-0.5 rounded-full uppercase shadow-2xs">
                                            {plan.badge}
                                        </span>
                                    {/if}
                                </div>
                                <div class="font-mono text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg w-fit mb-2">
                                    {plan.area}
                                </div>
                                <ul class="space-y-1 text-[11px] text-text/75">
                                    {#each plan.features as feat}
                                        <li class="flex items-center gap-1.5">
                                            <span class="material-symbols-rounded text-emerald-500 text-xs shrink-0">check_circle</span>
                                            <span class="truncate">{feat}</span>
                                        </li>
                                    {/each}
                                </ul>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>

        </div>
</div>