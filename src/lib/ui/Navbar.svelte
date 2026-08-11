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
        { id: "minigames", label: "Mini Games", icon: "sports_esports" },
        { id: "ai-assistant", label: "AI Voice", icon: "mic" },
        { id: "ar-apps", label: "AR Apps", icon: "qr_code_scanner" },
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

<!-- Top Right Horizontal Icon Navbar -->
<header class="fixed top-3 sm:top-4 right-3 sm:right-6 z-50 select-none font-sans">
    <nav class="flex items-center gap-1 bg-white/85 backdrop-blur-md border border-black/10 shadow-sm p-1">
        {#each navItems as item}
            <button
                onclick={() => scrollToSection(item.id)}
                class="size-8 sm:size-9 flex items-center justify-center transition-all duration-200 cursor-pointer {activeSection === item.id ? 'bg-primary text-white shadow-xs' : 'bg-transparent text-text/60 hover:text-text hover:bg-black/[0.04]'}"
                title={item.label}
                aria-label={item.label}
            >
                <span class="material-symbols-outlined text-[18px] sm:text-[20px]">
                    {item.icon}
                </span>
            </button>
        {/each}
    </nav>
</header>
