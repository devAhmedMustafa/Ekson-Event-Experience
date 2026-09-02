<script lang="ts">
    import { onMount } from "svelte";

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
        { id: "and-more", label: "And More...", icon: "auto_awesome", description: "Custom spatial activations" },
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

        const allIds = ["landing", "plans", "addons", "contact", ...featureItems.map(item => item.id)];
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

    // Demo Modal state
    let isDemoModalOpen = $state(false);
    let isSubmitting = $state(false);
    let submitSuccess = $state(false);
    let submitError = $state<string | null>(null);

    // Form fields
    let formData = $state({
        name: "",
        email: "",
        phone: "",
        meetingDate: "",
        meetingTime: "10:00 AM UTC"
    });

    // Validation errors state
    let errors = $state<{
        name?: string;
        email?: string;
        phone?: string;
        meetingDate?: string;
        meetingTime?: string;
    }>({});

    let touched = $state<{
        name?: boolean;
        email?: boolean;
        phone?: boolean;
        meetingDate?: boolean;
        meetingTime?: boolean;
    }>({});

    const timeSlots = [
        "09:00 AM UTC",
        "10:00 AM UTC",
        "11:00 AM UTC",
        "01:00 PM UTC",
        "02:00 PM UTC",
        "03:00 PM UTC",
        "04:00 PM UTC",
        "05:00 PM UTC"
    ];

    const todayStr = new Date().toISOString().split("T")[0];

    function validateField(field: keyof typeof formData): boolean {
        let isValid = true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        switch (field) {
            case "name":
                if (!formData.name.trim()) {
                    errors.name = "Full name is required";
                    isValid = false;
                } else if (formData.name.trim().length < 2) {
                    errors.name = "Name must be at least 2 characters";
                    isValid = false;
                } else {
                    errors.name = undefined;
                }
                break;

            case "email":
                if (!formData.email.trim()) {
                    errors.email = "Email address is required";
                    isValid = false;
                } else if (!emailRegex.test(formData.email.trim())) {
                    errors.email = "Please enter a valid email address";
                    isValid = false;
                } else {
                    errors.email = undefined;
                }
                break;

            case "phone":
                if (!formData.phone.trim()) {
                    errors.phone = "Phone number is required";
                    isValid = false;
                } else if (formData.phone.trim().replace(/[^0-9]/g, "").length < 7) {
                    errors.phone = "Please enter a valid phone number (min 7 digits)";
                    isValid = false;
                } else {
                    errors.phone = undefined;
                }
                break;

            case "meetingDate":
                if (!formData.meetingDate) {
                    errors.meetingDate = "Please choose a meeting date";
                    isValid = false;
                } else {
                    errors.meetingDate = undefined;
                }
                break;

            case "meetingTime":
                if (!formData.meetingTime) {
                    errors.meetingTime = "Please select a time slot";
                    isValid = false;
                } else {
                    errors.meetingTime = undefined;
                }
                break;
        }

        return isValid;
    }

    function validateAll(): boolean {
        const fields: (keyof typeof formData)[] = ["name", "email", "phone", "meetingDate", "meetingTime"];
        let allValid = true;
        for (const f of fields) {
            touched[f] = true;
            if (!validateField(f)) {
                allValid = false;
            }
        }
        return allValid;
    }

    function openDemoModal() {
        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("ekson_open_contact_form", {
                detail: { message: "I'm interested to book a demo.." }
            }));
        }
    }

    function closeDemoModal() {
        isDemoModalOpen = false;
        submitSuccess = false;
        submitError = null;
        errors = {};
        touched = {};
    }

    async function handleSubmit(e: SubmitEvent) {
        e.preventDefault();
        submitError = null;

        if (!validateAll()) {
            return;
        }

        isSubmitting = true;

        const payload = {
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            plan: "Book a Demo", // placeholder string in request (no plan specified)
            meetingDateTime: `${formData.meetingDate} ${formData.meetingTime}`
        };

        const serverUrl = (import.meta.env.VITE_SERVER_URL || '').replace(/\/+$/, '');

        try {
            let response = await fetch(`${serverUrl}/api/plans/request`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            }).catch(() => null);

            if (!response || !response.ok) {
                response = await fetch("/api/plans/request", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
            }

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || (data.details && data.details.join(", ")) || "Demo request failed.");
            }

            submitSuccess = true;
        } catch (err: any) {
            console.error("Demo request error:", err);
            submitError = err.message || "Failed to submit demo request. Please verify connection.";
        } finally {
            isSubmitting = false;
        }
    }
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
            <div class="size-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center group-hover:scale-105 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-xs">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5 shrink-0">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
            </div>
            <span class="text-xl font-black tracking-tight text-text group-hover:text-primary transition-colors">
                Kubix
            </span>
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
            
            <!-- Right: Book a Demo Button (Opens Demo Modal Form) -->
            <div class="flex items-center gap-3">
                <button
                    onclick={openDemoModal}
                    class="px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold tracking-wide bg-primary text-white shadow-md shadow-primary/25 hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex items-center gap-1.5"
                >
                    <span>Book a demo</span>
                    <span class="material-symbols-rounded text-base">arrow_forward</span>
                </button>
            </div>
        </nav>
    </div>
</header>

<!-- BOOK A DEMO MODAL FORM -->
{#if isDemoModalOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fade-in"
        onclick={(e) => { if (e.target === e.currentTarget) closeDemoModal(); }}
    >
        <div class="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-black/10 overflow-hidden flex flex-col max-h-[92vh]">
            <!-- Modal Header -->
            <div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-black/5 flex items-center justify-between bg-slate-50/50 shrink-0">
                <div>
                    <div class="flex items-center gap-1.5 font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-primary font-bold">
                        <span class="size-1.5 bg-primary"></span>
                        <span>Live Demo Request</span>
                    </div>
                    <h3 class="text-base sm:text-lg font-black text-text uppercase tracking-tight">
                        Book a Live <span class="text-transparent bg-clip-text bg-linear-to-r from-primary to-secondary">Demo</span>
                    </h3>
                </div>
                <button
                    onclick={closeDemoModal}
                    class="size-8 rounded-full bg-black/5 hover:bg-black/10 text-text/70 flex items-center justify-center transition cursor-pointer"
                    aria-label="Close modal"
                >
                    <span class="material-symbols-rounded text-[18px]">close</span>
                </button>
            </div>

            <!-- Modal Body -->
            <div class="p-4 sm:p-6 overflow-y-auto space-y-4">
                {#if submitSuccess}
                    <!-- Success Confirmation Screen -->
                    <div class="flex flex-col items-center text-center py-4 sm:py-6 gap-3">
                        <div class="size-14 sm:size-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                            <span class="material-symbols-rounded text-[32px] sm:text-[36px]">check_circle</span>
                        </div>
                        <h4 class="text-lg sm:text-xl font-bold text-text">Demo Request Received!</h4>
                        <p class="text-xs text-text/70 max-w-sm">
                            Thank you, <strong class="text-text">{formData.name}</strong>. Your request for a live demo has been received. Our team will meet you on <strong class="text-text">{formData.meetingDate} at {formData.meetingTime}</strong>.
                        </p>
                        <button
                            onclick={closeDemoModal}
                            class="mt-3 px-6 py-2 bg-primary hover:bg-primary/90 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-full shadow-xs cursor-pointer transition"
                        >
                            Done
                        </button>
                    </div>
                {:else}
                    <p class="text-xs text-text/70 leading-relaxed">
                        Schedule a live 1-on-1 walkthrough with our spatial tech team to explore our interactive booth experiences, AR/VR games, and AI integrations.
                    </p>

                    <!-- Contact & Demo Request Form -->
                    <form onsubmit={handleSubmit} novalidate class="space-y-3">
                        {#if submitError}
                            <div class="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                                <span class="material-symbols-rounded text-[16px] shrink-0">error</span>
                                <span>{submitError}</span>
                            </div>
                        {/if}

                        <!-- Full Name -->
                        <div>
                            <label for="demo-name" class="block font-mono text-[10px] sm:text-[11px] font-bold text-text/70 uppercase mb-0.5">
                                Full Name <span class="text-rose-500">*</span>
                            </label>
                            <input
                                id="demo-name"
                                type="text"
                                bind:value={formData.name}
                                oninput={() => { if (touched.name) validateField("name"); }}
                                onblur={() => { touched.name = true; validateField("name"); }}
                                placeholder="e.g. Bob Smith"
                                class="w-full px-3.5 py-2 text-xs text-text bg-white border {errors.name && touched.name ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-black/15'} rounded-xl focus:outline-none focus:border-primary"
                            />
                            {#if errors.name && touched.name}
                                <p class="text-[9px] text-rose-600 font-medium mt-0.5">{errors.name}</p>
                            {/if}
                        </div>

                        <!-- Email Address -->
                        <div>
                            <label for="demo-email" class="block font-mono text-[10px] sm:text-[11px] font-bold text-text/70 uppercase mb-0.5">
                                Email Address <span class="text-rose-500">*</span>
                            </label>
                            <input
                                id="demo-email"
                                type="email"
                                bind:value={formData.email}
                                oninput={() => { if (touched.email) validateField("email"); }}
                                onblur={() => { touched.email = true; validateField("email"); }}
                                placeholder="e.g. name@domain.com"
                                class="w-full px-3.5 py-2 text-xs text-text bg-white border {errors.email && touched.email ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-black/15'} rounded-xl focus:outline-none focus:border-primary"
                            />
                            {#if errors.email && touched.email}
                                <p class="text-[9px] text-rose-600 font-medium mt-0.5">{errors.email}</p>
                            {/if}
                        </div>

                        <!-- Phone Number -->
                        <div>
                            <label for="demo-phone" class="block font-mono text-[10px] sm:text-[11px] font-bold text-text/70 uppercase mb-0.5">
                                Phone Number <span class="text-rose-500">*</span>
                            </label>
                            <input
                                id="demo-phone"
                                type="tel"
                                bind:value={formData.phone}
                                oninput={() => { if (touched.phone) validateField("phone"); }}
                                onblur={() => { touched.phone = true; validateField("phone"); }}
                                placeholder="e.g. +1-555-0100"
                                class="w-full px-3.5 py-2 text-xs text-text bg-white border {errors.phone && touched.phone ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-black/15'} rounded-xl focus:outline-none focus:border-primary"
                            />
                            {#if errors.phone && touched.phone}
                                <p class="text-[9px] text-rose-600 font-medium mt-0.5">{errors.phone}</p>
                            {/if}
                        </div>

                        <!-- Meeting Date & Time Slot -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                            <div>
                                <label for="demo-date" class="block font-mono text-[10px] sm:text-[11px] font-bold text-text/70 uppercase mb-0.5">
                                    Meeting Date <span class="text-rose-500">*</span>
                                </label>
                                <input
                                    id="demo-date"
                                    type="date"
                                    min={todayStr}
                                    bind:value={formData.meetingDate}
                                    onchange={() => { touched.meetingDate = true; validateField("meetingDate"); }}
                                    class="w-full px-3.5 py-2 text-xs text-text bg-white border {errors.meetingDate && touched.meetingDate ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-black/15'} rounded-xl focus:outline-none focus:border-primary"
                                />
                                {#if errors.meetingDate && touched.meetingDate}
                                    <p class="text-[9px] text-rose-600 font-medium mt-0.5">{errors.meetingDate}</p>
                                {/if}
                            </div>

                            <div>
                                <label for="demo-time" class="block font-mono text-[10px] sm:text-[11px] font-bold text-text/70 uppercase mb-0.5">
                                    Time Slot <span class="text-rose-500">*</span>
                                </label>
                                <select
                                    id="demo-time"
                                    bind:value={formData.meetingTime}
                                    onchange={() => { touched.meetingTime = true; validateField("meetingTime"); }}
                                    class="w-full px-3.5 py-2 text-xs text-text bg-white border border-black/15 rounded-xl focus:outline-none focus:border-primary"
                                >
                                    {#each timeSlots as slot}
                                        <option value={slot}>{slot}</option>
                                    {/each}
                                </select>
                            </div>
                        </div>

                        <!-- Submit Button -->
                        <div class="pt-1 sm:pt-2">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                class="w-full py-2.5 px-4 bg-primary hover:bg-primary/90 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-full shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {#if isSubmitting}
                                    <span class="material-symbols-rounded text-[16px] animate-spin">progress_activity</span>
                                    <span>Submitting Demo Request...</span>
                                {:else}
                                    <span>Book Live Demo</span>
                                    <span class="material-symbols-rounded text-[16px]">send</span>
                                {/if}
                            </button>
                        </div>
                    </form>
                {/if}
            </div>
        </div>
    </div>
{/if}
