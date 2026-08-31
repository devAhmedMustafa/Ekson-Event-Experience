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

<div class="grid grid-cols-1 md:grid-cols-2 relative w-full h-full min-h-dvh md:h-screen gap-6 md:gap-8 max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 items-center">
    <div class="flex flex-col justify-between items-start h-full select-none overflow-hidden py-4 sm:py-6">
        <!-- Top Spacer for Fixed Header -->
        <div class="h-14 sm:h-16"></div>

        <!-- Center Hero Title & Subtitle & Brand CTA -->
        <div class="relative z-10 flex flex-col items-start justify-center my-auto text-left max-w-5xl">
            <!-- Main Headline -->
            <h1
                class="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] transition-all duration-1000 ease-out {isLoaded ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}"
            >
                <span
                    class="inline-block text-transparent bg-clip-text transition-all duration-300"
                    style="background-image: linear-gradient(135deg, #010104 0%, var(--brand-secondary, #04547c) 50%, #010104 100%);"
                >
                    The Future Of Event Experiences.
                </span>
            </h1>

            <!-- Animated Subtitle -->
            <div
                class="mt-4 sm:mt-6 max-w-xl transition-all duration-1000 delay-200 ease-out {isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}"
            >
                <p class="text-sm sm:text-base md:text-lg font-medium text-text/70 leading-relaxed">
                    Make your brand impossible to ignore.
                </p>
            </div>

            <!-- Action Trigger: Try it for your brand -->
            <div
                class="mt-6 sm:mt-10 transition-all duration-1000 delay-300 ease-out {isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}"
            >
                <button
                    onclick={() => (isBrandModalOpen = true)}
                    class="group relative px-6 sm:px-7 py-3 sm:py-3.5 bg-black hover:bg-slate-900 text-white text-xs sm:text-sm font-semibold tracking-wide rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-3 cursor-pointer hover:-translate-y-0.5"
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

        <div class="h-4 sm:h-8"></div>
    </div>
    
    <!-- Interactive Background Visual Layer -->
    <div class="w-full h-64 sm:h-80 md:h-[75%] rounded-3xl overflow-hidden shadow-xl border border-black/10 relative">
        <!-- svelte-ignore a11y_media_has_caption -->
        <video class="w-full h-full object-cover" controls src="https://www.pexels.com/download/video/16953737/"></video>
    </div>
</div>


<!-- Brand Customization Studio Modal -->
<BrandCustomizerModal
    isOpen={isBrandModalOpen}
    onClose={() => (isBrandModalOpen = false)}
/>