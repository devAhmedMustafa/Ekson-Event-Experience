<script lang="ts">
    import { onMount } from "svelte";

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

<div class="relative w-full h-full min-h-dvh md:h-screen gap-6 md:gap-8 max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 items-center">
    <div class="flex flex-col justify-between items-center h-full overflow-hidden py-4 sm:py-6">

        <!-- Center Hero Title & Subtitle & Brand CTA -->
        <div class="relative z-10 flex flex-col items-center justify-center my-auto max-w-5xl">
            <!-- Main Headline -->
            <h1
                class="text-center text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] transition-all duration-1000 ease-out {isLoaded ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}"
            >
                <span
                    class="inline-block text-transparent bg-clip-text transition-all duration-300"
                    style="background-image: linear-gradient(135deg, #f1f1f4 0%, var(--brand-primary, #ffa349) 50%, #f1f1f4 100%);"
                >
                    The Future Of Event Experiences.
                </span>
            </h1>

            <div
                class="mt-4 sm:mt-6 max-w-xl transition-all duration-1000 delay-200 ease-out {isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}"
            >
                <p class="text-sm sm:text-base md:text-lg font-medium text-white/70 leading-relaxed">
                    Make your brand impossible to ignore.
                </p>
            </div>
        </div>

        <!-- Animated Scroll Down Button at Bottom -->
        <div class="relative z-10 pb-2 sm:pb-4 transition-all duration-1000 delay-500 ease-out {isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}">
            <button
                onclick={scrollToExplore}
                class="group flex flex-col items-center gap-2 text-white/80 hover:text-white transition-all cursor-pointer focus:outline-none"
                aria-label="Scroll down to explore"
            >
                <span class="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest text-white/60 group-hover:text-primary transition-colors">
                    Scroll Down
                </span>
                <div class="size-9 sm:size-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg group-hover:bg-primary group-hover:border-primary group-hover:scale-110 transition-all duration-300 animate-bounce">
                    <span class="material-symbols-rounded text-xl group-hover:translate-y-0.5 transition-transform">
                        keyboard_arrow_down
                    </span>
                </div>
            </button>
        </div>
    </div>
    
</div>

<!-- Interactive Background Visual Layer -->
<div class="absolute h-full w-full overflow-hidden border border-black/10 -z-10">
    <!-- svelte-ignore a11y_media_has_caption -->
    <video class="w-full h-full object-cover" autoplay muted src="https://pixabay.com/videos/download/x-371424_medium.mp4"></video>
    <div class="absolute inset-0 bg-linear-to-t from-black/80 to-transparent"></div>
</div>