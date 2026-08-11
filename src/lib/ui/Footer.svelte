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

<div class="relative w-full h-full min-h-[100dvh] md:h-screen max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex flex-col justify-between select-none font-sans overflow-hidden">
    <!-- Huge Watermark Brand Accent in Background -->
    <div class="absolute -bottom-4 -right-4 text-[90px] sm:text-[160px] md:text-[220px] font-black text-black/[0.04] tracking-tighter pointer-events-none select-none z-0">
        EKSON
    </div>

    <!-- Top Headline Section -->
    <div class="relative z-10 flex flex-col sm:flex-row items-start sm:items-end justify-between pb-3 sm:pb-4 border-b border-black/5 shrink-0 gap-3 sm:gap-4">
        <div>
            <div class="flex items-center gap-2 font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-primary font-bold mb-0.5">
                <span class="size-1.5 bg-primary"></span>
                <span>08 / Connect With Us</span>
            </div>
            <h2 class="text-xl sm:text-3xl md:text-4xl font-black text-text tracking-tight uppercase">
                Let's Build the Future of Events
            </h2>
            <p class="text-[11px] sm:text-xs md:text-sm text-text/70 mt-0.5 max-w-xl">
                Ready to transform your exhibition booth into an interactive, high-ROI destination?
            </p>
        </div>

        <!-- Back to Top Button -->
        <button
            onclick={scrollToTop}
            class="px-3 sm:px-3.5 py-1 sm:py-1.5 bg-white hover:bg-slate-50 text-text text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider border border-black/10 shadow-xs flex items-center gap-1.5 cursor-pointer transition shrink-0"
        >
            <span>Back to Top</span>
            <span class="material-symbols-outlined text-[14px] sm:text-[16px] text-primary">arrow_upward</span>
        </button>
    </div>

    <!-- 4-Column Directory Grid (Responsive 2x2 on mobile, 4-col on desktop) -->
    <div class="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 my-auto py-2 shrink-0">
        <!-- Col 1: Solutions Catalog -->
        <div class="flex flex-col gap-1.5 sm:gap-2">
            <span class="font-mono text-[9px] sm:text-[10px] font-bold text-text/40 uppercase tracking-widest">
                Solutions
            </span>
            <ul class="space-y-1 sm:space-y-1.5 text-[11px] sm:text-xs text-text/80 font-medium">
                <li><a href="#interactive" class="hover:text-primary transition">360° Spatial Tours</a></li>
                <li><a href="#interactive" class="hover:text-primary transition">True Scale 3D Demo</a></li>
                <li><a href="#ar-apps" class="hover:text-primary transition">WebAR Applications</a></li>
                <li><a href="#minigames" class="hover:text-primary transition">Mini-Games Suite</a></li>
                <li><a href="#ai-assistant" class="hover:text-primary transition">AI Voice Concierge</a></li>
            </ul>
        </div>

        <!-- Col 2: Studio & Capabilities -->
        <div class="flex flex-col gap-1.5 sm:gap-2">
            <span class="font-mono text-[9px] sm:text-[10px] font-bold text-text/40 uppercase tracking-widest">
                Capabilities
            </span>
            <ul class="space-y-1 sm:space-y-1.5 text-[11px] sm:text-xs text-text/80 font-medium">
                <li><span>Real-Time SLAM & WebXR</span></li>
                <li><span>Interactive Touch Displays</span></li>
                <li><span>Hardware Integration</span></li>
                <li><span>Leaderboard & Analytics</span></li>
                <li><span>Turnkey Event Delivery</span></li>
            </ul>
        </div>

        <!-- Col 3: Direct Contact -->
        <div class="flex flex-col gap-1.5 sm:gap-2">
            <span class="font-mono text-[9px] sm:text-[10px] font-bold text-text/40 uppercase tracking-widest">
                Contact & Studio
            </span>
            <div class="space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs text-text/80">
                <div class="flex items-start gap-1.5">
                    <span class="material-symbols-outlined text-[14px] sm:text-[16px] text-primary shrink-0 mt-0.5">mail</span>
                    <a href="mailto:events@ekson.com" class="hover:text-primary transition font-mono break-all">
                        events@ekson.com
                    </a>
                </div>
                <div class="flex items-start gap-1.5">
                    <span class="material-symbols-outlined text-[14px] sm:text-[16px] text-primary shrink-0 mt-0.5">call</span>
                    <span class="font-mono">+966 11 000 0000</span>
                </div>
                <div class="flex items-start gap-1.5">
                    <span class="material-symbols-outlined text-[14px] sm:text-[16px] text-primary shrink-0 mt-0.5">schedule</span>
                    <span class="text-[10px] sm:text-[11px] text-text/60">Sun-Thu: 09:00-18:00</span>
                </div>
            </div>
        </div>

        <!-- Col 4: Newsletter & Updates -->
        <div class="flex flex-col gap-1.5 sm:gap-2 col-span-2 lg:col-span-1">
            <span class="font-mono text-[9px] sm:text-[10px] font-bold text-text/40 uppercase tracking-widest">
                Newsletter
            </span>
            <p class="text-[10px] sm:text-[11px] text-text/70 leading-snug">
                Receive quarterly updates on spatial tech & booth gamification.
            </p>

            {#if newsletterSubscribed}
                <div class="p-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] sm:text-[11px] font-medium flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[15px]">check_circle</span>
                    <span>Subscribed successfully!</span>
                </div>
            {:else}
                <form onsubmit={handleNewsletterSubmit} class="flex items-center gap-1 mt-0.5">
                    <input
                        type="email"
                        bind:value={newsletterEmail}
                        placeholder="your@email.com"
                        required
                        class="flex-1 min-w-0 px-2.5 py-1 sm:py-1.5 text-[11px] sm:text-xs text-text bg-white border border-black/15 rounded-none focus:outline-none focus:border-primary"
                    />
                    <button
                        type="submit"
                        class="px-3 py-1 sm:py-1.5 bg-primary hover:bg-primary/90 text-white font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition cursor-pointer shrink-0"
                    >
                        Join
                    </button>
                </form>
            {/if}
        </div>
    </div>

    <!-- Bottom Footer Bar -->
    <div class="relative z-10 pt-3 sm:pt-4 border-t border-black/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] sm:text-xs text-text/60 shrink-0 font-mono text-center sm:text-left">
        <div class="flex items-center gap-2">
            <span class="size-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span class="text-[9px] sm:text-[10px] uppercase tracking-wider">ALL SYSTEMS OPERATIONAL</span>
        </div>

        <div class="text-[9px] sm:text-[10px]">
            © {new Date().getFullYear()} EKSON TECHNOLOGY. ALL RIGHTS RESERVED.
        </div>

        <div class="flex items-center gap-3 text-[9px] sm:text-[10px] uppercase">
            <a href="#landing" class="hover:text-primary transition">Privacy</a>
            <span>•</span>
            <a href="#landing" class="hover:text-primary transition">Terms</a>
            <span>•</span>
            <a href="#landing" class="hover:text-primary transition">Security</a>
        </div>
    </div>
</div>
