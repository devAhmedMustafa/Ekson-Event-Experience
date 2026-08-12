<script lang="ts">
    interface Plan {
        id: string;
        name: string;
        badgeType: "essential" | "popular" | "enterprise";
        icon: string;
        tagline: string;
        highlightText?: string;
        price: string;
        priceSub: string;
        features: string[];
        isPopular?: boolean;
    }

    const plans: Plan[] = [
        {
            id: "essential",
            name: "ESSENTIAL",
            badgeType: "essential",
            icon: "star",
            tagline: "Perfect for getting started with interactive experiences",
            price: "$1,499",
            priceSub: "One-Time Setup",
            features: [
                "1 Interactive Experience",
                "Standard Features",
                "Basic Analytics",
                "Email Support"
            ]
        },
        {
            id: "popular",
            name: "MOST POPULAR",
            badgeType: "popular",
            icon: "workspace_premium",
            tagline: "Everything you need to",
            highlightText: "engage and grow",
            price: "$2,999",
            priceSub: "One-Time Setup",
            isPopular: true,
            features: [
                "3 Interactive Experiences",
                "Advanced Features",
                "Analytics & Reports",
                "AI Assistant Integration",
                "Priority Support"
            ]
        },
        {
            id: "enterprise",
            name: "ENTERPRISE",
            badgeType: "enterprise",
            icon: "apartment",
            tagline: "Custom solutions for businesses and large-scale projects",
            price: "CUSTOM",
            priceSub: "Custom Pricing",
            features: [
                "Unlimited Experiences",
                "Full Features Suite",
                "Custom Development",
                "Dedicated Project Manager",
                "24/7 Priority Support"
            ]
        }
    ];

    const bottomInclusions = [
        {
            icon: "groups",
            title: "Scalable Solutions",
            subtitle: "Built for your growth"
        },
        {
            icon: "track_changes",
            title: "Measurable Impact",
            subtitle: "Data-driven insights"
        },
        {
            icon: "headset_mic",
            title: "End-to-End Support",
            subtitle: "From idea to execution"
        },
        {
            icon: "language",
            title: "Global Delivery",
            subtitle: "Built for everyone"
        },
        {
            icon: "verified_user",
            title: "Secure & Reliable",
            subtitle: "Enterprise security"
        }
    ];

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

    // Modal state
    let isModalOpen = $state(false);
    let isSubmitting = $state(false);
    let submitSuccess = $state(false);
    let submitError = $state<string | null>(null);

    // Form fields
    let formData = $state({
        name: "",
        email: "",
        phone: "",
        plan: "MOST POPULAR",
        meetingDate: "",
        meetingTime: "10:00 AM UTC"
    });

    // Validation errors state
    let errors = $state<{
        name?: string;
        email?: string;
        phone?: string;
        plan?: string;
        meetingDate?: string;
        meetingTime?: string;
    }>({});

    let touched = $state<{
        name?: boolean;
        email?: boolean;
        phone?: boolean;
        plan?: boolean;
        meetingDate?: boolean;
        meetingTime?: boolean;
    }>({});

    // Min date (today)
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

            case "plan":
                if (!formData.plan.trim()) {
                    errors.plan = "Please select an investment plan";
                    isValid = false;
                } else {
                    errors.plan = undefined;
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
        const fields: (keyof typeof formData)[] = ["name", "email", "phone", "plan", "meetingDate", "meetingTime"];
        let allValid = true;
        for (const f of fields) {
            touched[f] = true;
            if (!validateField(f)) {
                allValid = false;
            }
        }
        return allValid;
    }

    function openModal(planName: string) {
        formData.plan = planName;
        isModalOpen = true;
        submitSuccess = false;
        submitError = null;
    }

    function closeModal() {
        isModalOpen = false;
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
            plan: formData.plan.trim(),
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
                throw new Error(data.error || (data.details && data.details.join(", ")) || "Subscription request failed.");
            }

            submitSuccess = true;
        } catch (err: any) {
            console.error("Plan request error:", err);
            submitError = err.message || "Failed to submit plan request. Please verify connection.";
        } finally {
            isSubmitting = false;
        }
    }
</script>

<div class="relative w-full h-full max-w-6xl mx-auto px-3 sm:px-6 md:px-8 py-3 sm:py-4 select-none font-sans flex flex-col justify-between overflow-hidden">
    <!-- Top Header -->
    <div class="shrink-0 mb-1 sm:mb-2 text-center sm:text-left">
        <div class="flex items-center justify-center sm:justify-start gap-2 font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-primary font-bold mb-0.5">
            <span>Ekson Technology</span>
            <span class="size-1.5 bg-primary"></span>
            <span>07 / Investment Plans</span>
        </div>
        <h2 class="text-xl sm:text-2xl md:text-3xl font-black text-text tracking-tight uppercase">
            Investment Plans
        </h2>
        <p class="text-[10px] sm:text-xs text-text/70 mt-0.5">
            Flexible turnkey solutions for every booth scale.
        </p>
    </div>

    <!-- 3 Pricing Cards Grid (Scrollable on mobile, 3-col on desktop) -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 lg:gap-5 items-stretch my-auto shrink-0 overflow-y-auto max-h-[60vh] md:max-h-none py-1 scrollbar-none">
        {#each plans as plan (plan.id)}
            <div
                class="relative bg-white rounded-2xl flex flex-col justify-between p-3.5 sm:p-4.5 transition-all duration-300 {plan.isPopular
                    ? 'border-2 border-primary shadow-md bg-linear-to-b from-sky-50/60 via-white to-white'
                    : 'border border-black/10 shadow-xs'}"
            >
                <!-- Top Badge Pill -->
                <div class="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span
                        class="px-3 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider shadow-xs {plan.badgeType === 'popular'
                            ? 'bg-primary text-white'
                            : plan.badgeType === 'essential'
                              ? 'bg-secondary text-white'
                              : 'bg-slate-500 text-white'}"
                    >
                        {plan.name}
                    </span>
                </div>

                <div class="flex flex-col h-full justify-between pt-1">
                    <div>
                        <!-- Circular Icon Hub -->
                        <div class="flex justify-center mt-1 mb-1">
                            <div class="size-8 sm:size-10 rounded-full flex items-center justify-center {plan.isPopular ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-secondary'}">
                                <span class="material-symbols-outlined text-[20px] sm:text-[22px]">
                                    {plan.icon}
                                </span>
                            </div>
                        </div>

                        <!-- Tagline -->
                        <p class="text-[10px] sm:text-[11px] text-text/70 text-center min-h-5.5 sm:min-h-6.5 leading-snug px-1">
                            {plan.tagline}
                            {#if plan.highlightText}
                                <span class="text-primary font-bold">{plan.highlightText}</span>
                            {/if}
                        </p>

                        <!-- Price Section -->
                        <div class="text-center my-1.5 py-1 border-y border-black/5">
                            <div class="text-xl sm:text-2xl md:text-3xl font-black text-text tracking-tight font-sans">
                                {plan.price}
                            </div>
                            <span class="text-[9px] sm:text-[10px] font-mono text-text/50 uppercase tracking-wider block">
                                {plan.priceSub}
                            </span>
                        </div>

                        <!-- Features Checklist -->
                        <ul class="space-y-1 sm:space-y-1.5 font-sans text-[10px] sm:text-[11px] text-text/80 my-1.5">
                            {#each plan.features as feat}
                                <li class="flex items-center gap-1.5 sm:gap-2">
                                    <span class="material-symbols-outlined text-[14px] sm:text-[15px] text-primary shrink-0">
                                        check_circle
                                    </span>
                                    <span class="leading-tight font-medium">{feat}</span>
                                </li>
                            {/each}
                        </ul>
                    </div>

                    <!-- Subscribe Button -->
                    <button
                        onclick={() => openModal(plan.name)}
                        class="w-full mt-2 py-1.5 sm:py-2 px-3 rounded-lg text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 {plan.isPopular ? 'bg-primary hover:bg-primary/90 text-white shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-text border border-black/5'}"
                    >
                        <span>Subscribe</span>
                        <span class="material-symbols-outlined text-[14px] sm:text-[15px]">arrow_forward</span>
                    </button>
                </div>
            </div>
        {/each}
    </div>

    <!-- Bottom Highlights: ALL PLANS INCLUDE -->
    <div class="w-full bg-white/70 backdrop-blur-md rounded-xl border border-black/5 p-2 sm:p-2.5 shadow-xs shrink-0 mt-1 sm:mt-2">
        <div class="text-center mb-1">
            <span class="font-mono text-[8px] sm:text-[9px] text-text/50 font-bold uppercase tracking-widest bg-black/3 px-2 py-0.5 rounded-full border border-black/5">
                All Plans Include
            </span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 sm:gap-2 text-left">
            {#each bottomInclusions as item}
                <div class="flex items-start gap-1 sm:gap-1.5">
                    <span class="material-symbols-outlined text-[15px] sm:text-[17px] text-primary shrink-0 mt-0.5">
                        {item.icon}
                    </span>
                    <div class="flex flex-col">
                        <span class="text-[10px] sm:text-[11px] font-bold text-text leading-tight">{item.title}</span>
                        <span class="text-[8px] sm:text-[9px] text-text/50 leading-tight mt-0.5">{item.subtitle}</span>
                    </div>
                </div>
            {/each}
        </div>
    </div>
</div>

<!-- SUBSCRIPTION REQUEST MODAL FORM -->
{#if isModalOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fade-in"
        onclick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
    >
        <div class="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-black/10 overflow-hidden flex flex-col max-h-[92vh]">
            <!-- Modal Header -->
            <div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-black/5 flex items-center justify-between bg-slate-50/50 shrink-0">
                <div>
                    <div class="flex items-center gap-1.5 font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-primary font-bold">
                        <span class="size-1.5 bg-primary"></span>
                        <span>Plan Reservation</span>
                    </div>
                    <h3 class="text-base sm:text-lg font-black text-text uppercase tracking-tight">
                        Subscribe & Schedule Meeting
                    </h3>
                </div>
                <button
                    onclick={closeModal}
                    class="size-7 sm:size-8 rounded-full bg-black/5 hover:bg-black/10 text-text/70 flex items-center justify-center transition cursor-pointer"
                    aria-label="Close modal"
                >
                    <span class="material-symbols-outlined text-[18px]">close</span>
                </button>
            </div>

            <!-- Modal Body -->
            <div class="p-4 sm:p-6 overflow-y-auto">
                {#if submitSuccess}
                    <!-- Success Confirmation Screen -->
                    <div class="flex flex-col items-center text-center py-4 sm:py-6 gap-3">
                        <div class="size-14 sm:size-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                            <span class="material-symbols-outlined text-[32px] sm:text-[36px]">check_circle</span>
                        </div>
                        <h4 class="text-lg sm:text-xl font-bold text-text">Subscription Request Received!</h4>
                        <p class="text-xs text-text/70 max-w-sm">
                            Thank you, <strong class="text-text">{formData.name}</strong>. Your reservation for the <strong class="text-primary">{formData.plan}</strong> has been received. Our team will meet you on <strong class="text-text">{formData.meetingDate} at {formData.meetingTime}</strong>.
                        </p>
                        <button
                            onclick={closeModal}
                            class="mt-3 px-6 py-2 bg-primary hover:bg-primary/90 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-lg shadow-xs cursor-pointer transition"
                        >
                            Done
                        </button>
                    </div>
                {:else}
                    <!-- Subscription Form -->
                    <form onsubmit={handleSubmit} novalidate class="space-y-3">
                        {#if submitError}
                            <div class="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                                <span class="material-symbols-outlined text-[16px] shrink-0">error</span>
                                <span>{submitError}</span>
                            </div>
                        {/if}

                        <!-- Full Name -->
                        <div>
                            <label for="sub-name" class="block font-mono text-[10px] sm:text-[11px] font-bold text-text/70 uppercase mb-0.5">
                                Full Name <span class="text-rose-500">*</span>
                            </label>
                            <input
                                id="sub-name"
                                type="text"
                                bind:value={formData.name}
                                oninput={() => { if (touched.name) validateField("name"); }}
                                onblur={() => { touched.name = true; validateField("name"); }}
                                placeholder="e.g. Bob Smith"
                                class="w-full px-3 py-1.5 sm:py-2 text-xs text-text bg-white border {errors.name && touched.name ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-black/15'} rounded-lg focus:outline-none focus:border-primary"
                            />
                            {#if errors.name && touched.name}
                                <p class="text-[9px] text-rose-600 font-medium mt-0.5">{errors.name}</p>
                            {/if}
                        </div>

                        <!-- Email Address -->
                        <div>
                            <label for="sub-email" class="block font-mono text-[10px] sm:text-[11px] font-bold text-text/70 uppercase mb-0.5">
                                Email Address <span class="text-rose-500">*</span>
                            </label>
                            <input
                                id="sub-email"
                                type="email"
                                bind:value={formData.email}
                                oninput={() => { if (touched.email) validateField("email"); }}
                                onblur={() => { touched.email = true; validateField("email"); }}
                                placeholder="e.g. name@domain.com"
                                class="w-full px-3 py-1.5 sm:py-2 text-xs text-text bg-white border {errors.email && touched.email ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-black/15'} rounded-lg focus:outline-none focus:border-primary"
                            />
                            {#if errors.email && touched.email}
                                <p class="text-[9px] text-rose-600 font-medium mt-0.5">{errors.email}</p>
                            {/if}
                        </div>

                        <!-- Phone Number -->
                        <div>
                            <label for="sub-phone" class="block font-mono text-[10px] sm:text-[11px] font-bold text-text/70 uppercase mb-0.5">
                                Phone Number <span class="text-rose-500">*</span>
                            </label>
                            <input
                                id="sub-phone"
                                type="tel"
                                bind:value={formData.phone}
                                oninput={() => { if (touched.phone) validateField("phone"); }}
                                onblur={() => { touched.phone = true; validateField("phone"); }}
                                placeholder="e.g. +1-555-0100"
                                class="w-full px-3 py-1.5 sm:py-2 text-xs text-text bg-white border {errors.phone && touched.phone ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-black/15'} rounded-lg focus:outline-none focus:border-primary"
                            />
                            {#if errors.phone && touched.phone}
                                <p class="text-[9px] text-rose-600 font-medium mt-0.5">{errors.phone}</p>
                            {/if}
                        </div>

                        <!-- Selected Plan -->
                        <div>
                            <label for="sub-plan" class="block font-mono text-[10px] sm:text-[11px] font-bold text-text/70 uppercase mb-0.5">
                                Selected Plan <span class="text-rose-500">*</span>
                            </label>
                            <select
                                id="sub-plan"
                                bind:value={formData.plan}
                                onchange={() => { touched.plan = true; validateField("plan"); }}
                                class="w-full px-3 py-1.5 sm:py-2 text-xs text-text bg-white border border-black/15 rounded-lg focus:outline-none focus:border-primary"
                            >
                                <option value="ESSENTIAL">ESSENTIAL ($1,499)</option>
                                <option value="MOST POPULAR">MOST POPULAR ($2,999)</option>
                                <option value="ENTERPRISE">ENTERPRISE (CUSTOM)</option>
                            </select>
                        </div>

                        <!-- Meeting Date & Time Slot -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                            <div>
                                <label for="sub-date" class="block font-mono text-[10px] sm:text-[11px] font-bold text-text/70 uppercase mb-0.5">
                                    Meeting Date <span class="text-rose-500">*</span>
                                </label>
                                <input
                                    id="sub-date"
                                    type="date"
                                    min={todayStr}
                                    bind:value={formData.meetingDate}
                                    onchange={() => { touched.meetingDate = true; validateField("meetingDate"); }}
                                    class="w-full px-3 py-1.5 sm:py-2 text-xs text-text bg-white border {errors.meetingDate && touched.meetingDate ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-black/15'} rounded-lg focus:outline-none focus:border-primary"
                                />
                                {#if errors.meetingDate && touched.meetingDate}
                                    <p class="text-[9px] text-rose-600 font-medium mt-0.5">{errors.meetingDate}</p>
                                {/if}
                            </div>

                            <div>
                                <label for="sub-time" class="block font-mono text-[10px] sm:text-[11px] font-bold text-text/70 uppercase mb-0.5">
                                    Time Slot <span class="text-rose-500">*</span>
                                </label>
                                <select
                                    id="sub-time"
                                    bind:value={formData.meetingTime}
                                    onchange={() => { touched.meetingTime = true; validateField("meetingTime"); }}
                                    class="w-full px-3 py-1.5 sm:py-2 text-xs text-text bg-white border border-black/15 rounded-lg focus:outline-none focus:border-primary"
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
                                class="w-full py-2 sm:py-2.5 px-4 bg-primary hover:bg-primary/90 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {#if isSubmitting}
                                    <span class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                                    <span>Submitting Request...</span>
                                {:else}
                                    <span>Confirm Subscription Request</span>
                                    <span class="material-symbols-outlined text-[16px]">send</span>
                                {/if}
                            </button>
                        </div>
                    </form>
                {/if}
            </div>
        </div>
    </div>
{/if}
