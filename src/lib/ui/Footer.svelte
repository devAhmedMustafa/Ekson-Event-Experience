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

<div class="relative w-full h-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col justify-between overflow-visible">
    <!-- Top Headline Section -->
    <div class="relative z-10 flex items-end justify-between pb-3 border-b border-black/5 shrink-0 w-full">
        <div>
            <h2 class="text-4xl sm:text-5xl lg:text-6xl font-black text-text tracking-tight leading-tight">
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
    <div class="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 my-auto py-4 shrink-0">
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
                    <a href="mailto:events@ekson.com" class="hover:text-primary transition">
                        events@ekson.com
                    </a>
                </div>
                <div class="flex items-center gap-2">
                    <span class="material-symbols-rounded text-base text-primary shrink-0">call</span>
                    <span>+966 11 000 0000</span>
                </div>
            </div>
        </div>

        <!-- Col 4: Newsletter -->
        <div class="flex flex-col gap-2 col-span-2 lg:col-span-1">
            <span class="text-xs font-semibold text-text/40 uppercase tracking-widest">
                Newsletter
            </span>
            <p class="text-xs text-text/70 leading-relaxed">
                Updates on spatial tech & booth gamification.
            </p>

            {#if newsletterSubscribed}
                <div class="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-2xl flex items-center gap-2">
                    <span class="material-symbols-rounded text-base">check_circle</span>
                    <span>Subscribed successfully!</span>
                </div>
            {:else}
                <form onsubmit={handleNewsletterSubmit} class="flex items-center gap-2 mt-1">
                    <input
                        type="email"
                        bind:value={newsletterEmail}
                        placeholder="your@email.com"
                        required
                        class="flex-1 min-w-0 px-4 py-2 text-xs text-text bg-white border border-black/10 rounded-full focus:outline-none focus:border-primary shadow-xs"
                    />
                    <button
                        type="submit"
                        class="px-4 py-2 bg-black hover:bg-slate-900 text-white text-xs font-semibold rounded-full transition cursor-pointer shrink-0"
                    >
                        Join
                    </button>
                </form>
            {/if}
        </div>
    </div>

    <!-- Reference Style Huge Brand Title at Footer Bottom -->
    <div class="relative z-10 w-full pt-4 border-t border-black/5 flex flex-col items-center justify-center shrink-0">
        <h1 class="text-5xl sm:text-7xl md:text-9xl font-black tracking-tighter text-text/90 uppercase text-center leading-none">
            KUBIX
        </h1>
        <div class="w-full flex flex-col sm:flex-row items-center justify-between gap-2 mt-4 text-xs text-text/50 font-medium">
            <span>© {new Date().getFullYear()} EKSON Technology. All rights reserved.</span>
            <div class="flex items-center gap-4">
                <a href="#landing" class="hover:text-primary transition">Privacy</a>
                <span>•</span>
                <a href="#landing" class="hover:text-primary transition">Terms</a>
                <span>•</span>
                <a href="#landing" class="hover:text-primary transition">Security</a>
            </div>
        </div>
    </div>
</div>
