<script lang="ts">
    import Tour360 from "$lib/components/Tour360.svelte";
    import RealTimeWalking from "./RealTimeWalking.svelte";

    const workflowSteps = [
        {
            step: "01",
            title: "SITE SURVEY",
            description: "Evaluate area & map 360° capture strategy",
        },
        {
            step: "02",
            title: "ON-SITE CAPTURE",
            description: "Execute 360° high-precision imaging",
        },
        {
            step: "03",
            title: "POST-PROCESSING",
            description: "Stitching, HDR color, & image enhancement",
        },
        {
            step: "04",
            title: "TOUR BUILDING",
            description: "Interactive hotspots & navigation setup",
        },
        {
            step: "05",
            title: "QA & LAUNCH",
            description: "Deliver final web link, QR code, & support",
        }
    ];

    const pricingPlans = [
        {
            tier: "Starter Space",
            area: "Up to 20 m²",
            badge: null,
            features: "Standard 8K capture, 1-yr hosting, basic info hotspots, web embed code"
        },
        {
            tier: "Medium Venue",
            area: "100 m² (5× 20m²)",
            badge: "Popular",
            features: "Full 360° capture, custom navigation path, brand logo overlay, QR generator"
        },
        {
            tier: "Large Exhibition",
            area: "200 m² (10× 20m²)",
            badge: "Pro HDR",
            features: "Pro HDR 360° capture, multi-room floor plan, interactive video pop-ups"
        },
        {
            tier: "Enterprise / Multi-Site",
            area: "500+ m²",
            badge: "Custom",
            features: "Full venue capture, 3D LiDAR spatial model, analytics dashboard, custom API"
        }
    ];
</script>

<div class="w-full flex flex-col">
    <!-- Main 360° Captured Virtual Tour Section -->
    <div class="w-full min-h-dvh md:h-screen max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex flex-col justify-between overflow-visible md:overflow-hidden">
        
        <div class="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 flex-1 w-full my-auto max-h-none md:max-h-[84vh] items-stretch overflow-hidden">
            
            <!-- LEFT COLUMN: Housing Title, 5-Step Process & Pricing Plans underneath -->
            <div class="md:col-span-5 p-4 sm:p-5 flex flex-col justify-between h-full overflow-hidden relative group">

                <!-- TOP TITLE & HEADER -->
                <div class="relative z-10 shrink-0 pb-2.5 border-b border-black/10">

                    <!-- Vibrant Standout Title -->
                    <h2 class="text-2xl sm:text-3xl lg:text-4xl font-black text-text tracking-tight leading-tight">
                        360° <span class="text-transparent bg-clip-text bg-linear-to-r from-black to-sky-600  drop-shadow-2xs">Tours</span>
                    </h2>
                    
                    <p class="text-[11px] text-text/75 mt-1 leading-snug font-medium">
                        Photorealistic venue panoramas, capture workflows & area pricing.
                    </p>
                </div>

                <!-- SCROLLABLE CONTENT BODY: PROCESS STEPS + PRICING PLANS DIRECTLY UNDERNEATH -->
                <div class="relative z-10 flex-1 overflow-y-auto scrollbar-none py-2.5 space-y-3.5">
                    
                    <!-- SECTION 1: 5-STEP CAPTURE WORKFLOW -->
                    <div class="space-y-1.5">
                        <div class="flex items-center justify-between px-1">
                            <span class="font-mono text-[9.5px] font-bold text-text/50 uppercase tracking-wider">
                                5-Step Capture Process
                            </span>
                            <span class="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                5-15 Days Turnaround
                            </span>
                        </div>

                        <!-- 5 Clean Cards with Clean Icon Spacing -->
                        <div class="space-y-1.5">
                            {#each workflowSteps as step}
                                <div class="p-2 sm:p-2.5 rounded-2xl  border-black/5 shadow-2xs flex items-center justify-between gap-2.5 transition-all hover:border-primary/30 group/step">
                                    <div class="flex items-center gap-2.5 min-w-0">
                                        <div class="flex flex-col min-w-0">
                                            <h3 class="text-[11px] font-black text-text tracking-wide leading-tight">{step.title}</h3>
                                            <p class="text-[9.5px] text-text/70 leading-tight truncate mt-0.5">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>
                                    <span class="font-mono text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md shrink-0">
                                        {step.step}
                                    </span>
                                </div>
                            {/each}
                        </div>
                    </div>

                    <!-- SECTION 2: PRICING PLANS DIRECTLY UNDERNEATH -->
                    <div class="space-y-1.5 pt-1">
                        <div class="flex items-center justify-between px-1 border-t border-black/10 pt-2.5">
                            <span class="font-mono text-[9.5px] font-bold text-text/50 uppercase tracking-wider">
                                Area Scope Pricing Plans (USD)
                            </span>
                            <span class="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                Area-Based
                            </span>
                        </div>

                        <div class="space-y-1.5">
                            {#each pricingPlans as plan}
                                <div class="p-2 sm:p-2.5 rounded-2xl bg-white/60 hover:bg-white/90 border {plan.badge === 'Popular' ? 'border-primary ring-1 ring-primary/20 bg-white/90 shadow-2xs' : 'border-black/5'} shadow-2xs transition-all">
                                    <div class="flex items-center justify-between">
                                        <span class="text-[11px] font-black text-text tracking-tight">{plan.tier}</span>
                                        <div class="flex items-center gap-1">
                                            <span class="font-mono text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                                {plan.area}
                                            </span>
                                            {#if plan.badge}
                                                <span class="text-[8px] font-bold text-white bg-primary px-1.5 py-0.5 rounded-full uppercase shadow-2xs">
                                                    {plan.badge}
                                                </span>
                                            {/if}
                                        </div>
                                    </div>
                                    <p class="text-[9.5px] text-text/70 leading-tight mt-1">
                                        {plan.features}
                                    </p>
                                </div>
                            {/each}
                        </div>
                    </div>

                </div>

                <!-- FOOTER SUMMARY BADGES -->
                <div class="relative z-10 shrink-0 pt-2 border-t border-black/10 flex items-center justify-between text-[9px] font-mono text-text/60">
                    <div class="flex items-center gap-1">
                        <span class="material-symbols-rounded text-emerald-500 text-xs">verified</span>
                        <span>Turnkey Spatial Capture</span>
                    </div>
                    <span class="text-primary font-bold">8K HDR Panoramas</span>
                </div>

            </div>

            <!-- RIGHT COLUMN: 360 IMAGE VIEWPORT -->
            <div class="md:col-span-7 w-full h-80 sm:h-96 md:h-full relative overflow-hidden rounded-3xl border border-black/10 shadow-md">
                <Tour360 />
            </div>

        </div>

    </div>

    <!-- Real-Time Walking & True Scale 2-Column Section -->
    <RealTimeWalking />
</div>