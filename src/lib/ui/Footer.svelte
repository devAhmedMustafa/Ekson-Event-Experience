<script lang="ts">
    let newsletterEmail = $state("");
    let newsletterSubscribed = $state(false);

    function handleNewsletterSubmit(e: SubmitEvent) {
        e.preventDefault();
        if (newsletterEmail.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newsletterEmail.trim())) {
            newsletterSubscribed = true;
            newsletterEmail = "";
        }
    }

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
</script>

<div class="relative w-full h-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col justify-between overflow-visible mt-auto">
    <!-- Top Headline Section -->
    <div class="relative z-10 flex items-end justify-between pb-3 border-b border-black/5 shrink-0 w-full">
        <div>
            <h2 class="text-3xl sm:text-4xl lg:text-5xl font-black text-text tracking-tight leading-tight">
                Build the Future of <span class="text-transparent bg-clip-text bg-linear-to-r from-primary to-secondary">Events</span>
            </h2>
            <p class="text-xs sm:text-sm text-text/70 mt-1 max-w-xl leading-relaxed">
                Transform your booth into an interactive destination.
            </p>
        </div>

        <!-- Back to Top Button -->
        <button
            onclick={scrollToTop}
            class="px-4 py-2 bg-white/70 hover:bg-white text-text text-xs font-semibold rounded-full border border-black/5 shadow-xs flex items-center gap-2 cursor-pointer transition shrink-0"
        >
            <span>Back to Top</span>
            <span class="material-symbols-rounded text-base text-primary">arrow_upward</span>
        </button>
    </div>

    <!-- 4-Column Directory Grid -->
    <div class="relative z-10 grid grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 my-auto py-4 shrink-0">
        <!-- Col 1: Solutions -->
        <div class="flex flex-col gap-2">
            <span class="text-xs font-semibold text-text/40 uppercase tracking-widest">
                Solutions
            </span>
            <ul class="space-y-1.5 text-xs text-text/80 font-medium">
                <li><a href="#interactive" class="hover:text-primary transition">360° Spatial Tours</a></li>
                <li><a href="#interactive" class="hover:text-primary transition">True Scale 3D Demo</a></li>
                <li><a href="#ar-apps" class="hover:text-primary transition">WebAR Applications</a></li>
                <li><a href="#minigames" class="hover:text-primary transition">Mini-Games Suite</a></li>
                <li><a href="#ai-assistant" class="hover:text-primary transition">AI Voice Concierge</a></li>
            </ul>
        </div>

        <!-- Col 2: Capabilities -->
        <div class="flex flex-col gap-2">
            <span class="text-xs font-semibold text-text/40 uppercase tracking-widest">
                Capabilities
            </span>
            <ul class="space-y-1.5 text-xs text-text/80 font-medium">
                <li><span>Real-Time WebXR</span></li>
                <li><span>Interactive Displays</span></li>
                <li><span>Hardware Integration</span></li>
                <li><span>Leaderboards & Analytics</span></li>
                <li><span>Turnkey Event Delivery</span></li>
            </ul>
        </div>

        <!-- Col 3: Direct Contact -->
        <div class="flex flex-col gap-2">
            <span class="text-xs font-semibold text-text/40 uppercase tracking-widest">
                Contact
            </span>
            <div class="space-y-2 text-xs text-text/80">
                <div class="flex items-center gap-2">
                    <span class="material-symbols-rounded text-base text-primary shrink-0">mail</span>
                    <a href="mailto:info@ekson.me" class="hover:text-primary transition">
                        info@ekson.me
                    </a>
                </div>
                <div class="flex items-center gap-2">
                    <span class="material-symbols-rounded text-base text-primary shrink-0">call</span>
                    <span>+20 11 000 0000</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Reference Style Huge Brand Title at Footer Bottom -->
    <div class="relative z-10 w-full pt-4 border-t border-black/5 flex flex-col items-center justify-center shrink-0">
        
        <div class="w-full flex flex-col sm:flex-row items-center justify-between gap-2 mt-4 text-xs text-text/50 font-medium">
            <span>© {new Date().getFullYear()} EKSON Technology. All rights reserved.</span>
            
        </div>
    </div>
</div>
