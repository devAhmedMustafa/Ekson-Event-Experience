<script lang="ts">
    interface AddonItem {
        id: string;
        title: string;
        price: string;
        icon: string;
        description: string;
    }

    interface StarterFeature {
        label: string;
        icon: string;
    }

    const addons: AddonItem[] = [
        {
            id: "extra-experience",
            title: "Extra Interactive Experience",
            price: "$499",
            icon: "touch_app",
            description: "Add another interactive booth challenge, minigame, or kiosk experience."
        },
        {
            id: "extra-screen",
            title: "Extra Screen / Device License",
            price: "$199",
            icon: "desktop_windows",
            description: "License for an additional touchscreen kiosk, tablet, or mobile display."
        },
        {
            id: "ai-language",
            title: "Additional AI Assistant Language",
            price: "$299",
            icon: "translate",
            description: "Expand AI voice concierge capabilities to support another language fluently."
        },
        {
            id: "onsite-tech",
            title: "On-Site Technician (Per-Day)",
            price: "$399",
            icon: "engineering",
            description: "Dedicated spatial tech engineer on-site for setup, live monitoring, and support."
        },
        {
            id: "custom-3d",
            title: "Custom 3D Model Creation",
            price: "from $599",
            icon: "view_in_ar",
            description: "Bespoke photorealistic 3D modeling and texturing for your products or merchandise."
        },
        {
            id: "reward-integration",
            title: "Branded Prize / Reward Integration",
            price: "$249",
            icon: "card_giftcard",
            description: "Custom digital prize distribution, instant coupon codes, and lead capture system."
        },
        {
            id: "social-wall",
            title: "Live Social Media Wall",
            price: "$699",
            icon: "feed",
            description: "Real-time attendee photo wall, live hashtag stream, and interactive leaderboard display."
        }
    ];

    const starterIncludes: StarterFeature[] = [
        { label: "1 Mini Game", icon: "sports_esports" },
        { label: "1 Event Day", icon: "calendar_today" },
        { label: "Self-Service Setup", icon: "build" },
        { label: "Basic Branded Screen", icon: "desktop_windows" }
    ];

    function handleTrialContact() {
        if (typeof window !== "undefined") {
            window.dispatchEvent(
                new CustomEvent("ekson_open_contact_form", {
                    detail: { message: "I'm interested in testing the Starter Trial Plan..." }
                })
            );
        }
    }
</script>

<div class="relative w-full h-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col overflow-visible">
    <!-- Header -->
    <div class="flex items-start mb-6 sm:mb-8 pb-3 border-b border-black/5 shrink-0 w-full flex-col">
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-black text-text tracking-tight leading-tight">
            Optional <span class="text-transparent bg-clip-text bg-linear-to-r from-primary to-secondary">Addons</span>
        </h2>
        <p class="text-xs sm:text-sm text-text/70 mt-1 max-w-xl leading-relaxed">
            Customize your spatial tech package with specialized upgrades, extra device licenses, multilingual AI, and on-site technical support.
        </p>
    </div>

    <!-- Clean Vertical List Preview -->
    <div class="w-full flex flex-col divide-y divide-black/10 border-b border-black/10">
        {#each addons as addon (addon.id)}
            <div class="py-4 sm:py-4.5 flex items-center justify-between gap-4 group hover:bg-black/2 px-2 sm:px-4 transition-colors rounded-xl">
                <div class="flex items-center gap-3.5 sm:gap-5 min-w-0">
                    <!-- Icon -->
                    <div class="size-10 sm:size-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors shadow-xs">
                        <span class="material-symbols-rounded text-xl sm:text-2xl">{addon.icon}</span>
                    </div>

                    <!-- Title & Description -->
                    <div class="flex flex-col min-w-0">
                        <h3 class="text-sm sm:text-base font-bold text-text tracking-tight group-hover:text-primary transition-colors truncate">
                            {addon.title}
                        </h3>
                        <p class="text-xs text-text/65 mt-0.5 leading-normal">
                            {addon.description}
                        </p>
                    </div>
                </div>

                <!-- Price Tag -->
                <div class="shrink-0 text-right pl-2">
                    <span class="text-sm sm:text-base font-black text-primary tracking-tight font-mono">
                        {addon.price}
                    </span>
                </div>
            </div>
        {/each}
    </div>

    <!-- Polished Starter Trial Plan Card -->
    <div class="mt-8 sm:mt-10 relative w-full bg-white/80 backdrop-blur-xl border border-primary/20 rounded-3xl p-6 sm:p-7 md:p-8 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col gap-6">
        <!-- Ambient Decorative Glow -->
        <div class="absolute -top-16 -right-16 size-48 rounded-full bg-linear-to-br from-primary/15 to-secondary/15 blur-2xl pointer-events-none"></div>

        <!-- Top Row: Icon, Title & Price Tag -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 pb-5 relative z-10">
            <div class="flex items-start sm:items-center gap-4">
                <div class="size-12 sm:size-13 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-2xs">
                    <span class="material-symbols-rounded text-2xl sm:text-3xl">rocket_launch</span>
                </div>
                <div>
                    <h3 class="text-xl sm:text-2xl font-black text-text tracking-tight">
                        Starter Trial Plan
                    </h3>
                </div>
            </div>

            <!-- Price Tag -->
            <div class="shrink-0 flex items-center">
                <div class="px-4 py-2 rounded-2xl text-right">
                    <span class="text-[10px] font-mono font-bold text-text/50 uppercase tracking-wider block leading-none">Starting At</span>
                    <span class="text-xl sm:text-2xl font-black text-primary font-mono leading-tight">$499</span>
                </div>
            </div>
        </div>

        <!-- Middle Row: Description & CTA -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
            <p class="text-xs sm:text-sm text-text/75 leading-relaxed font-medium max-w-xl">
                A lightweight entry option for brands that want to test interactive engagement before committing to a larger package.
            </p>

            <!-- CTA Button -->
            <button
                onclick={handleTrialContact}
                class="px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm text-white bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer border border-white/20 shrink-0"
            >
                <span>Request Trial Plan</span>
                <span class="material-symbols-rounded text-base">arrow_forward</span>
            </button>
        </div>

        <!-- Bottom Row: Includes List -->
        <div class="pt-3 border-t border-black/5 flex flex-col sm:flex-row sm:items-center gap-3 relative z-10">
            <span class="font-mono text-[10px] sm:text-[11px] font-bold text-text/60 uppercase tracking-widest shrink-0">Includes:</span>
            <div class="flex flex-wrap items-center gap-2 sm:gap-2.5">
                {#each starterIncludes as item}
                    <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-black/10 text-xs font-semibold text-text shadow-2xs hover:border-primary/30 transition-colors">
                        <span class="material-symbols-rounded text-base text-primary">{item.icon}</span>
                        <span>{item.label}</span>
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>
