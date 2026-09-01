<script lang="ts">
    import { onMount } from "svelte";

    let newsletterEmail = $state("");
    let newsletterSubscribed = $state(false);

    let contactName = $state("");
    let contactEmail = $state("");
    let contactPhone = $state("");
    let contactMessage = $state("");

    let isContactSubmitting = $state(false);
    let contactSuccess = $state(false);
    let contactError = $state("");

    onMount(() => {
        function handleOpenContactForm(e: Event) {
            const customEvent = e as CustomEvent;
            if (customEvent.detail?.message) {
                contactMessage = customEvent.detail.message;
            }
            contactSuccess = false;
            contactError = "";

            const el = document.getElementById("contact-form") || document.getElementById("footer");
            if (el) {
                el.scrollIntoView({ behavior: "smooth" });
            }

            setTimeout(() => {
                const msgInput = document.getElementById("contact-message") as HTMLTextAreaElement | null;
                if (msgInput) {
                    msgInput.focus();
                    const len = msgInput.value.length;
                    msgInput.setSelectionRange(len, len);
                }
            }, 300);
        }

        window.addEventListener("ekson_open_contact_form", handleOpenContactForm);
        return () => {
            window.removeEventListener("ekson_open_contact_form", handleOpenContactForm);
        };
    });

    function handleNewsletterSubmit(e: SubmitEvent) {
        e.preventDefault();
        if (newsletterEmail.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newsletterEmail.trim())) {
            newsletterSubscribed = true;
            newsletterEmail = "";
        }
    }

    async function handleContactSubmit(e: SubmitEvent) {
        e.preventDefault();
        contactError = "";
        contactSuccess = false;

        const name = contactName.trim();
        const email = contactEmail.trim();
        const phone = contactPhone.trim();
        const message = contactMessage.trim();

        if (!name) {
            contactError = "Please enter your name.";
            return;
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            contactError = "Please enter a valid email address.";
            return;
        }
        if (!phone) {
            contactError = "Please enter your phone number.";
            return;
        }
        if (!message) {
            contactError = "Please enter your message.";
            return;
        }

        isContactSubmitting = true;

        const payload = { name, email, phone, message };
        const serverUrl = (import.meta.env.VITE_SERVER_URL || '').replace(/\/+$/, '');

        try {
            let response = await fetch(`${serverUrl}/api/contact`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            }).catch(() => null);

            if (!response || !response.ok) {
                response = await fetch("/api/contact", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
            }

            const data = await response.json();

            if (!response.ok || !data.success) {
                const errDetail = data.error || (data.details && data.details.join(", ")) || "Submission failed.";
                throw new Error(errDetail);
            }

            contactSuccess = true;
            contactName = "";
            contactEmail = "";
            contactPhone = "";
            contactMessage = "";
        } catch (err: any) {
            console.error("Contact form error:", err);
            contactError = err.message || "Failed to submit message. Please try again.";
        } finally {
            isContactSubmitting = false;
        }
    }

    function resetContactForm() {
        contactSuccess = false;
        contactError = "";
    }

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
</script>

<div class="relative w-full h-full min-h-dvh max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-8 flex flex-col justify-between overflow-visible">
    <!-- Top Headline Section -->
    <div class="relative z-10 flex items-end justify-between pb-3 border-b border-black/5 shrink-0 w-full mt-12 sm:mt-16">
        <div>
            <h2 class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-text tracking-tight">
                Build the Future of Events
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

    <!-- Middle Main Section: Directory Grid & Contact Us Form -->
    <div class="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 my-auto py-6 shrink-0">
        <!-- Left Side: Directory Grid (Columns 1-6 on lg) -->
        <div class="lg:col-span-6 grid grid-cols-2 gap-6 sm:gap-8 my-auto">
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

            <!-- Direct Contact Info -->
            <div class="flex flex-col gap-2 col-span-2 sm:col-span-1">
                <span class="text-xs font-semibold text-text/40 uppercase tracking-widest">
                    Contact Info
                </span>
                <div class="space-y-2 text-xs text-text/80">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-rounded text-base text-primary shrink-0">mail</span>
                        <a href="mailto:events@kubix.com" class="hover:text-primary transition">
                            events@kubix.com
                        </a>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-rounded text-base text-primary shrink-0">call</span>
                        <span>+966 11 000 0000</span>
                    </div>
                </div>
            </div>

            <!-- Newsletter -->
            <div class="flex flex-col gap-2 col-span-2 sm:col-span-1">
                <span class="text-xs font-semibold text-text/40 uppercase tracking-widest">
                    Newsletter
                </span>
                <p class="text-xs text-text/70 leading-relaxed">
                    Updates on spatial tech & booth gamification.
                </p>

                {#if newsletterSubscribed}
                    <div class="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-xl flex items-center gap-2">
                        <span class="material-symbols-rounded text-base">check_circle</span>
                        <span>Subscribed!</span>
                    </div>
                {:else}
                    <form onsubmit={handleNewsletterSubmit} class="flex items-center gap-2 mt-1">
                        <input
                            type="email"
                            bind:value={newsletterEmail}
                            placeholder="your@email.com"
                            required
                            class="flex-1 min-w-0 px-3 py-1.5 text-xs text-text bg-white border border-black/10 rounded-full focus:outline-none focus:border-primary shadow-xs"
                        />
                        <button
                            type="submit"
                            class="px-3 py-1.5 bg-black hover:bg-slate-900 text-white text-xs font-semibold rounded-full transition cursor-pointer shrink-0"
                        >
                            Join
                        </button>
                    </form>
                {/if}
            </div>
        </div>

        <!-- Right Side: Contact Us Form Card (Columns 7-12 on lg) -->
        <div id="contact-form" class="lg:col-span-6">
            <div class="bg-white/50 backdrop-blur-md border border-black/5 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full">
                <div>
                    <div class="flex items-center justify-between gap-2 mb-2">
                        <div class="flex items-center gap-2">
                            <span class="material-symbols-rounded text-xl text-primary">send</span>
                            <h3 class="text-sm font-bold text-text uppercase tracking-wider">
                                Contact Us
                            </h3>
                        </div>
                    </div>
                    <p class="text-xs text-text/70 leading-relaxed mb-4">
                        Send us a message and our team will get back to you shortly.
                    </p>

                    {#if contactSuccess}
                        <div class="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex flex-col gap-2 my-2">
                            <div class="flex items-center gap-2 text-emerald-700 font-semibold text-xs">
                                <span class="material-symbols-rounded text-lg">check_circle</span>
                                <span>Message Sent Successfully!</span>
                            </div>
                            <p class="text-xs text-emerald-700/90 leading-relaxed">
                                Thank you for contacting us. We have received your inquiry and will reach out to you soon.
                            </p>
                            <button
                                type="button"
                                onclick={resetContactForm}
                                class="mt-2 self-start px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-full transition cursor-pointer flex items-center gap-1"
                            >
                                <span class="material-symbols-rounded text-sm">add</span>
                                <span>Send Another Message</span>
                            </button>
                        </div>
                    {:else}
                        <form onsubmit={handleContactSubmit} class="space-y-3">
                            {#if contactError}
                                <div class="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl flex items-start gap-2">
                                    <span class="material-symbols-rounded text-base text-rose-500 shrink-0 mt-0.5">error</span>
                                    <span class="leading-tight">{contactError}</span>
                                </div>
                            {/if}

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label for="contact-name" class="block text-[11px] font-semibold text-text/70 mb-1">
                                        Your Name <span class="text-rose-500">*</span>
                                    </label>
                                    <input
                                        id="contact-name"
                                        type="text"
                                        bind:value={contactName}
                                        placeholder="John Doe"
                                        required
                                        disabled={isContactSubmitting}
                                        class="w-full px-3.5 py-2 text-xs text-text bg-white border border-black/10 rounded-xl focus:outline-none focus:border-primary shadow-xs disabled:opacity-60"
                                    />
                                </div>
                                <div>
                                    <label for="contact-phone" class="block text-[11px] font-semibold text-text/70 mb-1">
                                        Phone Number <span class="text-rose-500">*</span>
                                    </label>
                                    <input
                                        id="contact-phone"
                                        type="tel"
                                        bind:value={contactPhone}
                                        placeholder="+966 50 000 0000"
                                        required
                                        disabled={isContactSubmitting}
                                        class="w-full px-3.5 py-2 text-xs text-text bg-white border border-black/10 rounded-xl focus:outline-none focus:border-primary shadow-xs disabled:opacity-60"
                                    />
                                </div>
                            </div>

                            <div>
                                <label for="contact-email" class="block text-[11px] font-semibold text-text/70 mb-1">
                                    Email Address <span class="text-rose-500">*</span>
                                </label>
                                <input
                                    id="contact-email"
                                    type="email"
                                    bind:value={contactEmail}
                                    placeholder="john@company.com"
                                    required
                                    disabled={isContactSubmitting}
                                    class="w-full px-3.5 py-2 text-xs text-text bg-white border border-black/10 rounded-xl focus:outline-none focus:border-primary shadow-xs disabled:opacity-60"
                                />
                            </div>

                            <div>
                                <label for="contact-message" class="block text-[11px] font-semibold text-text/70 mb-1">
                                    Message / Notes <span class="text-rose-500">*</span>
                                </label>
                                <textarea
                                    id="contact-message"
                                    rows="3"
                                    bind:value={contactMessage}
                                    placeholder="Tell us about your event requirements..."
                                    required
                                    disabled={isContactSubmitting}
                                    class="w-full px-3.5 py-2 text-xs text-text bg-white border border-black/10 rounded-xl focus:outline-none focus:border-primary shadow-xs resize-none disabled:opacity-60"
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={isContactSubmitting}
                                class="w-full py-2.5 bg-black hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                            >
                                {#if isContactSubmitting}
                                    <span class="material-symbols-rounded text-sm animate-spin">progress_activity</span>
                                    <span>Sending Message...</span>
                                {:else}
                                    <span class="material-symbols-rounded text-sm">send</span>
                                    <span>Send Message</span>
                                {/if}
                            </button>
                        </form>
                    {/if}
                </div>
            </div>
        </div>
    </div>

    <!-- Reference Style Huge Brand Title at Footer Bottom -->
    <div class="relative z-10 w-full pt-4 border-t border-black/5 flex flex-col items-center justify-center shrink-0">
        <h1 class="text-5xl sm:text-7xl md:text-9xl font-black tracking-tighter text-text/90 uppercase text-center leading-none">
            KUBIX
        </h1>
        <div class="w-full flex flex-col sm:flex-row items-center justify-between gap-2 mt-4 text-xs text-text/50 font-medium">
            <span>© {new Date().getFullYear()} KUBIX Technology. All rights reserved.</span>
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

