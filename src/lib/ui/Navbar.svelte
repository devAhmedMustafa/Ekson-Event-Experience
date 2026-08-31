<script lang="ts">
    import { onMount } from "svelte";
    import { brand } from "$lib/brand.svelte";

    interface FeatureItem {
        id: string;
        label: string;
        icon: string;
        description: string;
    }

    const featureItems: FeatureItem[] = [
        { id: "interactive", label: "Spatial Tech", icon: "view_in_ar", description: "360° tours & photorealistic walking" },
        { id: "active-floor", label: "Active Floor", icon: "layers", description: "Interactive projection mapping" },
        { id: "minigames", label: "Mini Games", icon: "joystick", description: "Engaging trade show games" },
        { id: "vr-games", label: "VR Games", icon: "sports_esports", description: "1:1 Virtual Metaverse booths" },
        { id: "ai-assistant", label: "AI Voice", icon: "mic", description: "Neural AI booth concierge" },
        { id: "ar-apps", label: "AR Apps", icon: "qr_code_scanner", description: "WebAR product catalog & 3D" },
        { id: "global-network", label: "Virtual Tours", icon: "language", description: "Worldwide activation coverage" },
    ];

    let activeSection = $state("landing");
    let isFeaturesOpen = $state(false);

    function scrollToSection(id: string) {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: "smooth" });
            activeSection = id;
        }
        isFeaturesOpen = false;
    }

    function toggleFeatures(e: MouseEvent) {
        e.stopPropagation();
        isFeaturesOpen = !isFeaturesOpen;
    }

    function handleWindowClick() {
        if (isFeaturesOpen) {
            isFeaturesOpen = false;
        }
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "Escape" && isFeaturesOpen) {
            isFeaturesOpen = false;
        }
    }

    onMount(() => {
        window.addEventListener("click", handleWindowClick);
        window.addEventListener("keydown", handleKeyDown);

        const observerOptions = {
            root: null,
            rootMargin: "-25% 0px -40% 0px",
            threshold: 0.1,
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    activeSection = entry.target.id;
                }
            });
        }, observerOptions);

        const allIds = ["landing", "plans", ...featureItems.map(item => item.id)];
        allIds.forEach((id) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        return () => {
            window.removeEventListener("click", handleWindowClick);
            window.removeEventListener("keydown", handleKeyDown);
            observer.disconnect();
        };
    });
</script>

<!-- Full-width Top Navbar Header -->
<header class="fixed top-0 left-0 right-0 w-full z-50 bg-white/85 backdrop-blur-xl border-b border-black/5 shadow-xs transition-all duration-300">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-3 flex items-center justify-between gap-4">
        
        <!-- Left: Logo -->
        <button
            onclick={() => scrollToSection('landing')}
            class="flex items-center gap-2.5 group text-left cursor-pointer focus:outline-none"
            aria-label="Go to top"
        >
            <img src="logo.png" alt="Ekson Logo" class="h-9"/>
        </button>

        <!-- Center: Navigation Links -->
        <nav class="flex items-center gap-1.5 sm:gap-3 relative">
            <!-- Features Dropdown Trigger -->
            <div class="relative">
                <button
                    onclick={toggleFeatures}
                    class="px-4 py-2 rounded-full text-xs sm:text-sm font-semibold tracking-wide transition-all duration-200 cursor-pointer flex items-center gap-1.5 {isFeaturesOpen || featureItems.some(i => i.id === activeSection) ? 'bg-primary/10 text-primary font-bold' : 'text-text/75 hover:text-text hover:bg-black/5'}"
                    aria-expanded={isFeaturesOpen}
                    aria-haspopup="true"
                >
                    <span>Features</span>
                    <span class="material-symbols-rounded text-lg transition-transform duration-200 {isFeaturesOpen ? 'rotate-180 text-primary' : 'text-text/50'}">
                        keyboard_arrow_down
                    </span>
                </button>

                <!-- Features Dropdown Menu -->
                {#if isFeaturesOpen}
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div
                        onclick={(e) => e.stopPropagation()}
                        class="absolute top-full left-1/2 -translate-x-1/2 mt-2.5 w-72 sm:w-80 bg-white/95 backdrop-blur-2xl border border-black/10 rounded-2xl shadow-2xl p-2 z-50 grid grid-cols-1 gap-1 animate-in fade-in slide-in-from-top-2 duration-200"
                    >
                        <div class="px-3 py-1.5 border-b border-black/5 flex items-center justify-between mb-1">
                            <span class="font-mono text-[10px] uppercase font-bold text-text/50 tracking-wider">
                                Explore Page Sections
                            </span>
                            <span class="size-1.5 rounded-full bg-primary animate-pulse"></span>
                        </div>

                        {#each featureItems as item}
                            <button
                                onclick={() => scrollToSection(item.id)}
                                class="w-full px-3 py-2 rounded-xl text-left transition flex items-start gap-3 cursor-pointer group {activeSection === item.id ? 'bg-primary/10 text-primary' : 'hover:bg-black/5 text-text'}"
                            >
                                <div class="size-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors {activeSection === item.id ? 'bg-primary text-white' : 'bg-black/5 text-text/60 group-hover:bg-primary/10 group-hover:text-primary'}">
                                    <span class="material-symbols-rounded text-base">{item.icon}</span>
                                </div>
                                <div class="flex flex-col min-w-0">
                                    <span class="text-xs font-bold leading-tight group-hover:text-primary transition-colors">
                                        {item.label}
                                    </span>
                                    <span class="text-[10px] text-text/50 truncate mt-0.5">
                                        {item.description}
                                    </span>
                                </div>
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>

            <!-- Pricings Button (Scrolls to Investment Plans) -->
            <button
                onclick={() => scrollToSection('plans')}
                class="px-4 py-2 rounded-full text-xs sm:text-sm font-semibold tracking-wide transition-all duration-200 cursor-pointer {activeSection === 'plans' ? 'bg-primary/10 text-primary font-bold' : 'text-text/75 hover:text-text hover:bg-black/5'}"
            >
                Pricings
            </button>
            
            <!-- Right: Book a Demo Button (Scrolls to Investment Plans) -->
            <div class="flex items-center gap-3">
                <button
                onclick={() => scrollToSection('plans')}
                class="px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold tracking-wide bg-primary text-white shadow-md shadow-primary/25 hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex items-center gap-1.5"
            >
                <span>Book a demo</span>
                <span class="material-symbols-rounded text-base">arrow_forward</span>
                </button>
            </div>
        </nav>
    </div>
</header>
