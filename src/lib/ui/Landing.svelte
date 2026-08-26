<script lang="ts">
    import { onMount } from "svelte";
    import { brand } from "$lib/brand.svelte";
    import BackgroundLanding from "./BackgroundLanding.svelte";
    import BrandCustomizerModal from "$lib/components/BrandCustomizerModal.svelte";

    let mouseX = $state(0);
    let mouseY = $state(0);
    let isLoaded = $state(false);
    let isBrandModalOpen = $state(false);

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
        window.addEventListener("mousemove", handleMouseMove, { passive: true });

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
        };
    });
</script>

<div class="relative w-full h-full min-h-dvh md:h-screen flex flex-col justify-between items-center px-4 md:px-8 py-8 sm:py-12 select-none overflow-hidden">
    <!-- Top Spacer for Floating Navbar -->
    <div class="h-8 sm:h-12"></div>

    <!-- Center Hero Title & Subtitle & Brand CTA -->
    <div class="relative z-10 flex flex-col items-center justify-center my-auto text-center max-w-5xl px-4">


        <!-- Main Headline inspired by reference design -->
        <h1
            class="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-center tracking-tight leading-[1.02] transition-all duration-1000 ease-out {isLoaded ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}"
            style="transform: translate3d({mouseX * 0.3}px, {mouseY * 0.3}px, 0);"
        >
            <span
                class="inline-block text-transparent bg-clip-text transition-all duration-300 drop-shadow-xs"
                style="background-image: linear-gradient(135deg, var(--brand-primary, #009dd6), var(--brand-secondary, #04547c), var(--brand-primary, #009dd6));"
            >
                {brand.name}
            </span>
            <br />
            <span
                class="inline-block text-transparent bg-clip-text transition-all duration-300"
                style="background-image: linear-gradient(135deg, #010104 0%, var(--brand-secondary, #04547c) 50%, #010104 100%);"
            >
                Event Experiences.
            </span>
        </h1>

        <!-- Animated Subtitle -->
        <div
            class="mt-6 sm:mt-8 max-w-xl transition-all duration-1000 delay-200 ease-out {isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}"
        >
            <p class="text-sm sm:text-base md:text-lg font-medium text-text/70 leading-relaxed">
                Elevate exhibition booths with 3D spatial tech, WebAR giveaways, AI voice guide, and interactive gamification.
            </p>
        </div>

        <!-- Action Trigger: Try it for your brand -->
        <div
            class="mt-8 sm:mt-10 transition-all duration-1000 delay-300 ease-out {isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}"
        >
            <button
                onclick={() => (isBrandModalOpen = true)}
                class="group relative px-7 py-3.5 bg-black hover:bg-slate-900 text-white text-xs sm:text-sm font-semibold tracking-wide rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-3 cursor-pointer hover:-translate-y-0.5"
            >
                <span>Try for your brand</span>
                <span class="material-symbols-rounded text-lg text-primary group-hover:translate-x-1 transition-transform">
                    arrow_forward
                </span>
                {#if brand.isCustom}
                    <span class="px-2.5 py-0.5 bg-white/20 text-white text-[10px] rounded-full font-bold ml-1 truncate max-w-30">
                        {brand.name}
                    </span>
                {/if}
            </button>
        </div>
    </div>

    <!-- Bottom Scroll Indicator & Action -->
    <div
        class="z-10 transition-all duration-1000 delay-400 ease-out {isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} pb-4"
    >
        <button
            onclick={scrollToExplore}
            class="group flex flex-col items-center gap-1.5 cursor-pointer text-text/50 hover:text-text transition"
            aria-label="Scroll to explore experiences"
        >
            <span class="text-[10px] font-semibold uppercase tracking-widest text-text/50 group-hover:text-text transition-all">
                Explore Solutions
            </span>
            <div class="size-8 bg-white/70 backdrop-blur-md border border-black/5 rounded-full flex items-center justify-center shadow-xs group-hover:border-black/20 transition">
                <span class="material-symbols-rounded text-base text-text animate-bounce">
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
/>