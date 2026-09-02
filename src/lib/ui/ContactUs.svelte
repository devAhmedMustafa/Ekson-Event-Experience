<script lang="ts">
    import { onMount } from "svelte";

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

            const el = document.getElementById("contact") || document.getElementById("contact-form");
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
</script>

<div id="contact-form" class="relative w-full h-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col justify-center overflow-visible">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto">
        <!-- Left Column: Contact Information & Headline -->
        <div class="lg:col-span-5 flex flex-col space-y-6">

            <h2 class="text-3xl sm:text-4xl lg:text-5xl font-black text-text tracking-tight leading-[1.1]">
                Let's Build Your Next <span class="text-transparent bg-clip-text bg-linear-to-r from-primary to-secondary">Experience</span>
            </h2>

            <p class="text-xs sm:text-sm text-text/70 leading-relaxed max-w-md">
                Have questions about our 360° spatial tours, WebAR applications, or AI voice concierge? Send us a message and our team will get back to you right away.
            </p>

            <!-- Direct Contact Methods -->
            <div class="space-y-4 pt-2">
                <div class="flex items-center gap-3 p-3.5 rounded-2xl">
                    <div class="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <span class="material-symbols-rounded text-xl">mail</span>
                    </div>
                    <div>
                        <span class="block text-[10px] uppercase font-bold text-text/40 tracking-wider">Email Us</span>
                        <a href="mailto:info@ekson.me" class="text-xs font-semibold text-text hover:text-primary transition">
                            info@ekson.me
                        </a>
                    </div>
                </div>
            </div>
        </div>

        <!-- Right Column: Contact Us Form Card -->
        <div class="lg:col-span-7">
            <div class="bg-white/80 backdrop-blur-md border border-black/10 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between">
                <div>
                    <div class="flex items-center justify-between gap-2 mb-2">
                        <div class="flex items-center gap-2">
                            <span class="material-symbols-rounded text-2xl text-primary">send</span>
                            <h3 class="text-base font-extrabold text-text uppercase tracking-wider">
                                Send a Message
                            </h3>
                        </div>
                    </div>
                    <p class="text-xs text-text/70 leading-relaxed mb-6">
                        Fill in your details below to submit an inquiry directly to the EksonServer endpoint.
                    </p>

                    {#if contactSuccess}
                        <div class="p-6 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex flex-col gap-3 my-2">
                            <div class="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                                <span class="material-symbols-rounded text-2xl">check_circle</span>
                                <span>Message Sent Successfully!</span>
                            </div>
                            <p class="text-xs text-emerald-700/90 leading-relaxed">
                                Thank you for contacting us. We have received your inquiry and will reach out to you soon.
                            </p>
                            <button
                                type="button"
                                onclick={resetContactForm}
                                class="mt-2 self-start px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-full transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                            >
                                <span class="material-symbols-rounded text-base">add</span>
                                <span>Send Another Message</span>
                            </button>
                        </div>
                    {:else}
                        <form onsubmit={handleContactSubmit} class="space-y-4">
                            {#if contactError}
                                <div class="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl flex items-start gap-2">
                                    <span class="material-symbols-rounded text-lg text-rose-500 shrink-0 mt-0.5">error</span>
                                    <span class="leading-tight">{contactError}</span>
                                </div>
                            {/if}

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label for="contact-name" class="block text-xs font-bold text-text/70 mb-1">
                                        Your Name <span class="text-rose-500">*</span>
                                    </label>
                                    <input
                                        id="contact-name"
                                        type="text"
                                        bind:value={contactName}
                                        placeholder="John Doe"
                                        required
                                        disabled={isContactSubmitting}
                                        class="w-full px-4 py-2.5 text-xs text-text bg-white border border-black/15 rounded-xl focus:outline-none focus:border-primary shadow-xs disabled:opacity-60"
                                    />
                                </div>
                                <div>
                                    <label for="contact-phone" class="block text-xs font-bold text-text/70 mb-1">
                                        Phone Number <span class="text-rose-500">*</span>
                                    </label>
                                    <input
                                        id="contact-phone"
                                        type="tel"
                                        bind:value={contactPhone}
                                        placeholder="+20 11 000 0000"
                                        required
                                        disabled={isContactSubmitting}
                                        class="w-full px-4 py-2.5 text-xs text-text bg-white border border-black/15 rounded-xl focus:outline-none focus:border-primary shadow-xs disabled:opacity-60"
                                    />
                                </div>
                            </div>

                            <div>
                                <label for="contact-email" class="block text-xs font-bold text-text/70 mb-1">
                                    Email Address <span class="text-rose-500">*</span>
                                </label>
                                <input
                                    id="contact-email"
                                    type="email"
                                    bind:value={contactEmail}
                                    placeholder="john@company.com"
                                    required
                                    disabled={isContactSubmitting}
                                    class="w-full px-4 py-2.5 text-xs text-text bg-white border border-black/15 rounded-xl focus:outline-none focus:border-primary shadow-xs disabled:opacity-60"
                                />
                            </div>

                            <div>
                                <label for="contact-message" class="block text-xs font-bold text-text/70 mb-1">
                                    Message / Notes <span class="text-rose-500">*</span>
                                </label>
                                <textarea
                                    id="contact-message"
                                    rows="4"
                                    bind:value={contactMessage}
                                    placeholder="Tell us about your event requirements..."
                                    required
                                    disabled={isContactSubmitting}
                                    class="w-full px-4 py-2.5 text-xs text-text bg-white border border-black/15 rounded-xl focus:outline-none focus:border-primary shadow-xs resize-none disabled:opacity-60"
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={isContactSubmitting}
                                class="w-full py-3 bg-black hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                            >
                                {#if isContactSubmitting}
                                    <span class="material-symbols-rounded text-base animate-spin">progress_activity</span>
                                    <span>Sending Message...</span>
                                {:else}
                                    <span class="material-symbols-rounded text-base">send</span>
                                    <span>Send Message</span>
                                {/if}
                            </button>
                        </form>
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>
