<script lang="ts">
    import { onMount } from "svelte";
    import BackgroundLanding from "./BackgroundLanding.svelte";

    let mouseX = $state(0);
    let mouseY = $state(0);
    let isLoaded = $state(false);

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
        return () => window.removeEventListener("mousemove", handleMouseMove);
    });
</script>

<div class="relative w-full h-full min-h-dvh md:h-screen flex flex-col justify-between items-center px-4 md:px-8 py-6 sm:py-8 select-none font-sans overflow-hidden">
    <!-- Top Spacer for Floating Navbar -->
    <div class="h-6 sm:h-8"></div>

    <!-- Center Kinetic Title & Subtitle -->
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
            <div class="size-7 bg-white/80 backdrop-blur-md border border-black/10 flex items-center justify-center shadow-xs group-hover:border-primary transition">
                <span class="material-symbols-outlined text-[16px] text-primary animate-bounce">
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