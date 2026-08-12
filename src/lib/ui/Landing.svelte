<script lang="ts">
    import { onMount } from "svelte";
    import BackgroundLanding from "./BackgroundLanding.svelte";
    import BrandCustomizerModal, { type BrandData } from "$lib/components/BrandCustomizerModal.svelte";

    let mouseX = $state(0);
    let mouseY = $state(0);
    let isLoaded = $state(false);
    let isBrandModalOpen = $state(false);
    let hasBrandProfile = $state(false);
    let activeBrandName = $state<string | null>(null);

    const STORAGE_KEY = "ekson_brand_profile";

    function checkBrandProfile() {
        try {
            const saved = sessionStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed: BrandData = JSON.parse(saved);
                if (parsed.companyName) {
                    hasBrandProfile = true;
                    activeBrandName = parsed.companyName;
                    return;
                }
            }
            hasBrandProfile = false;
            activeBrandName = null;
        } catch (e) {
            hasBrandProfile = false;
            activeBrandName = null;
        }
    }

    function handleMouseMove(e: MouseEvent) {
        const { innerWidth, innerHeight } = window;
        mouseX = (e.clientX / innerWidth - 0.5) * 25;
        mouseY = (e.clientY / innerHeight - 0.5) * 25;
    }

    function scrollToExplore() {
        const aboutSection = document.getElementById("about");
        if (aboutSection) {
            aboutSection.scrollIntoView({ behavior: "smooth" });
        }
    }

    onMount(() => {
        isLoaded = true;
        checkBrandProfile();
        window.addEventListener("mousemove", handleMouseMove, { passive: true });
        
        const onBrandUpdated = () => checkBrandProfile();
        window.addEventListener("ekson_brand_updated", onBrandUpdated);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("ekson_brand_updated", onBrandUpdated);
        };
    });
</script>

<div class="relative w-full h-full min-h-dvh md:h-screen flex flex-col justify-between items-center px-4 md:px-8 py-6 sm:py-8 select-none font-sans overflow-hidden">
    <!-- Top Spacer for Floating Navbar -->
    <div class="h-6 sm:h-8"></div>

    <!-- Center Kinetic Title & Subtitle & Brand CTA -->
    <div class="relative z-10 flex flex-col items-center justify-center my-auto text-center max-w-5xl px-2">
        <!-- Main Headline with Mix Blend Difference & Staggered Reveal -->
        <h1
            class="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black text-center text-white tracking-tight leading-[0.95] uppercase transition-all duration-1000 ease-out {isLoaded ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}"
            style="transform: translate3d({mouseX * 0.4}px, {mouseY * 0.4}px, 0);"
        >
            <span class="inline-block hover:tracking-wide transition-all duration-300">
                Ekson Event
            </span>
            <br />
            <span class="inline-block hover:tracking-wide transition-all duration-300">
                Experiences
            </span>
        </h1>

        <!-- Animated Subtitle -->
        <div
            class="mt-4 sm:mt-6 md:mt-8 transition-all duration-1000 delay-300 ease-out {isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}"
        >
            <p class="text-xs sm:text-base md:text-lg font-bold text-text/80 tracking-wide uppercase font-mono flex items-center justify-center gap-1.5 sm:gap-2">
                <span class="w-4 sm:w-10 h-px bg-primary"></span>
                <span>Make your brand impossible to ignore</span>
                <span class="w-4 sm:w-10 h-px bg-primary"></span>
            </p>
        </div>

        <!-- Action Trigger: Try it for your brand -->
        <div
            class="mt-5 sm:mt-7 transition-all duration-1000 delay-400 ease-out {isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}"
        >
            <button
                onclick={() => (isBrandModalOpen = true)}
                class="group relative px-5 sm:px-6 py-2.5 sm:py-3 bg-white/90 hover:bg-white text-text font-mono text-xs sm:text-sm font-bold uppercase tracking-wider rounded-full shadow-lg hover:shadow-xl border border-black/10 hover:border-primary transition-all duration-300 flex items-center gap-2 sm:gap-2.5 cursor-pointer backdrop-blur-md hover:-translate-y-0.5"
            >
                <div class="size-6 sm:size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span class="material-symbols-rounded text-[16px] sm:text-[18px]">auto_awesome</span>
                </div>
                <span>Try it for your brand</span>
                <span class="material-symbols-rounded text-[15px] sm:text-[17px] text-primary group-hover:translate-x-0.5 transition-transform">
                    arrow_forward
                </span>
                {#if hasBrandProfile && activeBrandName}
                    <span class="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] sm:text-[10px] rounded-full border border-emerald-300 font-bold ml-1 truncate max-w-[120px]">
                        {activeBrandName}
                    </span>
                {/if}
            </button>
        </div>
    </div>

    <!-- Bottom Scroll Indicator & Action -->
    <div
        class="z-10 transition-all duration-1000 delay-500 ease-out {isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} pb-2"
    >
        <button
            onclick={scrollToExplore}
            class="group flex flex-col items-center gap-1 cursor-pointer text-text/60 hover:text-primary transition"
            aria-label="Scroll to explore experiences"
        >
            <span class="font-mono text-[9px] uppercase tracking-widest font-bold group-hover:tracking-wider transition-all">
                Scroll to Explore
            </span>
            <div class="size-8 bg-white/80 backdrop-blur-md border border-black/10 rounded-full flex items-center justify-center shadow-xs group-hover:border-primary transition">
                <span class="material-symbols-rounded text-[16px] text-primary animate-bounce">
                    keyboard_arrow_down
                </span>
            </div>
        </button>
    </div>

    <!-- Interactive Background Visual Layer -->
    <div class="absolute inset-0 w-full h-full z-0 pointer-events-none">
        <BackgroundLanding {mouseX} {mouseY} />
    </div>
</div>

<!-- Brand Customization Studio Modal -->
<BrandCustomizerModal
    isOpen={isBrandModalOpen}
    onClose={() => (isBrandModalOpen = false)}
    onSave={(data) => {
        hasBrandProfile = true;
        activeBrandName = data.companyName;
    }}
/>