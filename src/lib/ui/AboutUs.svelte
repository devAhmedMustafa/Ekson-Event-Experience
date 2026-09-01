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
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQbZRVaY-eW6LctUwnZT5LBtlmUcm6gqHvBgcTaWK1-Ow&s=10"
        },
        {
            id: "vr",
            title: "Virtual Reality",
            badge: "Metaverse Booth",
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZe_1PDyf1hDVbqstO2dxymO8GGAEQXhipgkEAdTp5-Q&s=10"
        },
        {
            id: "3d",
            title: "Interactive 3D",
            badge: "WebGL Engine",
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQZUS9ZTkLlAb0hpgJmPohycYthzHf0JVaMB_XrG-2qA&s=10"
        },
        {
            id: "engagement",
            title: "Visitor Engagement",
            badge: "Lead Analytics",
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTBNYFmD8Wr1AbT_ZcgnsAywxZkRwtPEbMsOC1aG4zbZQ&s=10"
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
                Who are <span class="text-transparent bg-clip-text bg-linear-to-r from-primary to-secondary">Kubix</span>
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
            

                <!-- Column 1 (Left Offset Downwards or Standard Stack) -->
                <div class="flex flex-col gap-4 sm:gap-5">
                    <!-- Top Left Card (AI) -->
                    <div class="relative group rounded-3xl overflow-hidden h-44 sm:h-52 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                            <img src={cards[0].image} alt={cards[0].title} class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                    </div>

                    <!-- Bottom Left Card (3D) -->
                    <div class="relative group rounded-3xl overflow-hidden h-44 sm:h-52 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                            <img src={cards[2].image} alt={cards[2].title} class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                    </div>
                </div>

                <!-- Column 2 (Right Stack) -->
                <div class="flex flex-col gap-4 sm:gap-5 mt-4 sm:mt-6">
                    <!-- Top Right Card (VR) -->
                    <div class="relative group rounded-3xl overflow-hidden h-44 sm:h-52 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                            <img src={cards[1].image} alt={cards[1].title} class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                    </div>

                    <!-- Bottom Right Card (Engagement) -->
                    <div class="relative group rounded-3xl overflow-hidden h-44 sm:h-52 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                            <img src={cards[3].image} alt={cards[3].title} class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                    </div>
                </div>

            </div>

        </div>

    </div>
</div>