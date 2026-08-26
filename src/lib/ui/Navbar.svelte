<script lang="ts">
    import { onMount } from "svelte";

    interface NavItem {
        id: string;
        label: string;
        icon: string;
    }

    const navItems: NavItem[] = [
        { id: "landing", label: "Home", icon: "home" },
        { id: "about", label: "About Us", icon: "info" },
        { id: "interactive", label: "Spatial Tech", icon: "view_in_ar" },
        { id: "active-floor", label: "Active Floor", icon: "layers" },
        { id: "minigames", label: "Mini Games", icon: "joystick" },
        { id: "vr-games", label: "VR Games", icon: "sports_esports" },
        { id: "ai-assistant", label: "AI Voice", icon: "mic" },
        { id: "ar-apps", label: "AR Apps", icon: "qr_code_scanner" },
        { id: "global-network", label: "Global Network", icon: "language" },
        { id: "plans", label: "Investment Plans", icon: "loyalty" },
    ];

    let activeSection = $state("landing");

    function scrollToSection(id: string) {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: "smooth" });
            activeSection = id;
        }
    }

    onMount(() => {
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

        navItems.forEach((item) => {
            const el = document.getElementById(item.id);
            if (el) observer.observe(el);
        });

        return () => {
            observer.disconnect();
        };
    });
</script>

<!-- Floating Glass Pill Navbar -->
<header class="fixed top-3 sm:top-5 right-3 sm:right-8 z-50 select-none max-w-[95vw]">
    <nav class="flex items-center gap-1 sm:gap-1.5 bg-white/70 backdrop-blur-xl border border-black/5 shadow-lg shadow-black/[0.03] p-1.5 sm:p-2 rounded-full overflow-x-auto scrollbar-none transition-all duration-300">
        {#each navItems as item}
            <button
                onclick={() => scrollToSection(item.id)}
                class="size-8 sm:size-9 md:size-10 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer shrink-0 {activeSection === item.id ? 'bg-primary text-white shadow-md shadow-primary/25 scale-105' : 'bg-transparent text-text/60 hover:text-text hover:bg-black/[0.04]'}"
                title={item.label}
                aria-label={item.label}
            >
                <span class="material-symbols-rounded text-[17px] sm:text-[19px] md:text-[21px]">
                    {item.icon}
                </span>
            </button>
        {/each}
    </nav>
</header>
