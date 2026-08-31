<script lang="ts">
    interface FeatureCard {
        id: string;
        title: string;
        badge: string;
        image: string;
    }

    const cards: FeatureCard[] = [
        {
            id: "ai",
            title: "Neural AI Voice",
            badge: "AI Concierge",
            image: "/images/solutions/ai.svg"
        },
        {
            id: "vr",
            title: "Virtual Reality",
            badge: "Metaverse Booth",
            image: "/images/solutions/vr.svg"
        },
        {
            id: "3d",
            title: "Interactive 3D",
            badge: "WebGL Engine",
            image: "/images/solutions/3d.svg"
        },
        {
            id: "engagement",
            title: "Visitor Engagement",
            badge: "Lead Analytics",
            image: "/images/solutions/engagement.svg"
        }
    ];

    function scrollToSection(id: string) {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
    }
</script>

<div class="relative w-full h-full min-h-dvh md:h-screen max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 flex flex-col justify-center overflow-visible md:overflow-hidden">
    <div class="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 lg:gap-12 items-center my-auto">
        
        <!-- LEFT COLUMN: Headline, Badge, Copy, Dual CTA Buttons & Feature Badges -->
        <div class="md:col-span-6 flex flex-col items-start justify-center space-y-5 sm:space-y-6">
            

            <!-- Staggered Large Headline -->
            <h2 class="text-3xl sm:text-5xl lg:text-6xl font-black text-text tracking-tight leading-[1.08]">
                Who are
                
                <img src="logo_name.png" alt="Ekson name" class="w-45 inline -translate-y-1 ml-1">
                
            </h2>

            <!-- Paragraph Description -->
            <p class="text-xs sm:text-sm md:text-base text-text/70 leading-relaxed max-w-lg">
                We're a technology development company
                delivering innovative, immersive solutions
                built to help businesses engage, train, and
                perform better.


                We go beyond XR content, combining the latest
                technologies to create real, measurable value.
            </p>

        </div>

        <!-- RIGHT COLUMN: Asymmetric Image Collage Layout matching media_1788172522861.png -->
        <div class="md:col-span-6 relative w-full flex items-center justify-center">
            
            <!-- Grid Container with Offset Cards -->
            <div class="grid grid-cols-2 gap-4 sm:gap-5 w-full max-w-md md:max-w-none relative">
                
                <!-- Floating Analytics Badge Widget -->
                <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-white/95 backdrop-blur-xl border border-black/10 shadow-2xl rounded-2xl p-3 flex items-center gap-3 transform hover:scale-105 transition-transform pointer-events-none">
                    <div class="size-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                        <span class="material-symbols-rounded text-xl">trending_up</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-[10px] text-text/50 font-bold uppercase tracking-wider">Team Growth</span>
                        <span class="text-base font-black text-text">+34%</span>
                    </div>
                </div>

                <!-- Column 1 (Left Offset Downwards or Standard Stack) -->
                <div class="flex flex-col gap-4 sm:gap-5">
                    <!-- Top Left Card (AI) -->
                    <div class="relative group bg-white/80 backdrop-blur-xl border border-black/10 shadow-md rounded-3xl p-4 overflow-hidden h-44 sm:h-52 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                            <img src={cards[0].image} alt={cards[0].title} class="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-110" />
                    </div>

                    <!-- Bottom Left Card (3D) -->
                    <div class="relative group bg-white/80 backdrop-blur-xl border border-black/10 shadow-md rounded-3xl p-4 overflow-hidden h-44 sm:h-52 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                            <img src={cards[2].image} alt={cards[2].title} class="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-110" />
                    </div>
                </div>

                <!-- Column 2 (Right Stack) -->
                <div class="flex flex-col gap-4 sm:gap-5 mt-4 sm:mt-6">
                    <!-- Top Right Card (VR) -->
                    <div class="relative group bg-white/80 backdrop-blur-xl border border-black/10 shadow-md rounded-3xl p-4 overflow-hidden h-44 sm:h-52 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                            <img src={cards[1].image} alt={cards[1].title} class="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-110" />
                    </div>

                    <!-- Bottom Right Card (Engagement) -->
                    <div class="relative group bg-white/80 backdrop-blur-xl border border-black/10 shadow-md rounded-3xl p-4 overflow-hidden h-44 sm:h-52 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                            <img src={cards[3].image} alt={cards[3].title} class="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-110" />
                    </div>
                </div>

            </div>

        </div>

    </div>
</div>