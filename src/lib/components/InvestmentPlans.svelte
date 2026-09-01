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

    // Selected Plan for modal view
    let selectedPlan = $derived(plans.find((p) => p.name === formData.plan) || plans[1]);

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

<div class="relative w-full h-full min-h-dvh md:h-screen max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-8 flex flex-col overflow-visible md:overflow-hidden">
    <!-- Top Header -->
    <div class="flex items-start mb-10 pb-3 border-b border-black/5 shrink-0 w-full flex-col">
        <h2 class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-text tracking-tight">
            Investment Plans
        </h2>
        <p class="text-xs sm:text-sm text-text/70 mt-1 max-w-xl leading-relaxed">
            Turnkey spatial tech packages tailored for exhibition booths.
        </p>
    </div>

    <!-- 3 Pricing Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-stretch py-6 sm:py-8 scrollbar-none">
        {#each plans as plan (plan.id)}
            <div
                class="relative rounded-3xl flex flex-col justify-between transition-all duration-300 {plan.isPopular
                    ? 'bg-white border-2 border-primary shadow-2xl ring-2 ring-primary/20 scale-105 md:scale-108 -translate-y-2 md:-translate-y-3 z-10 p-7 sm:p-8'
                    : 'bg-white/70 backdrop-blur-xl border border-black/5 shadow-sm hover:shadow-md p-6 sm:p-7'}"
            >
                <!-- Top Badge Pill -->
                {#if plan.isPopular}
                    <div class="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                        <span class="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-primary text-white shadow-lg flex items-center gap-1">
                            <span class="material-symbols-rounded text-sm">star</span>
                            {plan.name}
                        </span>
                    </div>
                {/if}

                <div class="flex flex-col h-full justify-between pt-1">
                    <div>
                        <!-- Header -->
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="{plan.isPopular ? 'text-xl font-extrabold' : 'text-lg font-bold'} text-text tracking-tight">{plan.name}</h3>
                            <div class="{plan.isPopular ? 'size-12 rounded-2xl bg-primary/10 text-primary' : 'size-10 rounded-2xl bg-black/5 text-text/70'} flex items-center justify-center">
                                <span class="material-symbols-rounded {plan.isPopular ? 'text-2xl' : 'text-xl'}">
                                    {plan.icon}
                                </span>
                            </div>
                        </div>

                        <!-- Tagline -->
                        <p class="{plan.isPopular ? 'text-sm font-medium' : 'text-xs'} text-text/70 leading-relaxed mb-4 min-h-10">
                            {plan.tagline}
                            {#if plan.highlightText}
                                <span class="text-primary font-bold">{plan.highlightText}</span>
                            {/if}
                        </p>

                        <!-- Price Section -->
                        <div class="my-3 py-3 border-y border-black/5">
                            <div class="{plan.isPopular ? 'text-4xl font-black text-primary' : 'text-3xl font-extrabold text-text'} tracking-tight">
                                {plan.price}
                            </div>
                            <span class="{plan.isPopular ? 'text-xs font-semibold text-text/60' : 'text-[10px] font-medium text-text/50'} uppercase tracking-wider block mt-0.5">
                                {plan.priceSub}
                            </span>
                        </div>

                        <!-- Features Checklist -->
                        <ul class="{plan.isPopular ? 'space-y-3 text-sm my-5' : 'space-y-2 text-xs my-4'} text-text/80">
                            {#each plan.features as feat}
                                <li class="flex items-center gap-2">
                                    <span class="material-symbols-rounded {plan.isPopular ? 'text-lg text-primary' : 'text-base text-primary'} shrink-0">
                                        check_circle
                                    </span>
                                    <span class="font-medium">{feat}</span>
                                </li>
                            {/each}
                        </ul>
                    </div>

                    <!-- View More Button -->
                    <button
                        onclick={() => openModal(plan.name)}
                        class="w-full mt-4 rounded-full font-semibold tracking-wide transition cursor-pointer flex items-center justify-center gap-2 {plan.isPopular ? 'py-3.5 px-5 text-sm font-bold bg-primary hover:bg-primary/90 text-white shadow-lg' : 'py-3 px-4 text-xs bg-black/5 hover:bg-black/10 text-text border border-black/5'}"
                    >
                        <span>View More</span>
                        <span class="material-symbols-rounded {plan.isPopular ? 'text-lg' : 'text-base'}">arrow_forward</span>
                    </button>
                </div>
            </div>
        {/each}
    </div>

    <!-- Bottom Highlights: ALL PLANS INCLUDE -->
    <div class="relative w-full bg-white/70 backdrop-blur-md rounded-2xl border border-black/5 p-4 sm:p-5 pt-6 sm:pt-7 shadow-sm shrink-0 mt-4 sm:mt-6">
        <!-- Absolute Top Pill Badge -->
        <div class="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
            <span class="font-mono text-[9px] sm:text-[10px] text-text/60 font-bold uppercase tracking-widest bg-white px-3.5 py-1 rounded-full border border-black/10 shadow-xs">
                All Plans Include
            </span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 md:gap-5 items-center">
            {#each bottomInclusions as item}
                <div class="flex items-center gap-2.5">
                    <div class="size-8 sm:size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <span class="material-symbols-rounded text-base sm:text-lg">
                            {item.icon}
                        </span>
                    </div>
                    <div class="flex flex-col text-left">
                        <span class="text-xs font-bold text-text leading-tight">{item.title}</span>
                        <span class="text-[9px] sm:text-[10px] text-text/50 leading-tight mt-0.5">{item.subtitle}</span>
                    </div>
                </div>
            {/each}
        </div>
    </div>
</div>

<!-- PLAN DETAILS & REQUEST MODAL FORM -->
{#if isModalOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fade-in"
        onclick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
    >
        <div class="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-black/10 overflow-hidden flex flex-col max-h-[92vh]">
            <!-- Modal Header -->
            <div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-black/5 flex items-center justify-between bg-slate-50/50 shrink-0">
                <div>
                    <div class="flex items-center gap-1.5 font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-primary font-bold">
                        <span class="size-1.5 bg-primary"></span>
                        <span>Plan Details & Request</span>
                    </div>
                    <h3 class="text-base sm:text-lg font-black text-text uppercase tracking-tight">
                        {formData.plan} PLAN
                    </h3>
                </div>
                <button
                    onclick={closeModal}
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
                        <h4 class="text-lg sm:text-xl font-bold text-text">Plan Request Received!</h4>
                        <p class="text-xs text-text/70 max-w-sm">
                            Thank you, <strong class="text-text">{formData.name}</strong>. Your request for the <strong class="text-primary">{formData.plan}</strong> has been received. Our team will meet you on <strong class="text-text">{formData.meetingDate} at {formData.meetingTime}</strong>.
                        </p>
                        <button
                            onclick={closeModal}
                            class="mt-3 px-6 py-2 bg-primary hover:bg-primary/90 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-full shadow-xs cursor-pointer transition"
                        >
                            Done
                        </button>
                    </div>
                {:else}
                    <!-- Selected Plan Summary Card -->
                    {#if selectedPlan}
                        <div class="p-4 rounded-2xl bg-slate-50/80 border border-black/10 flex flex-col gap-2.5">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <span class="text-sm font-extrabold text-text">{selectedPlan.name}</span>
                                    {#if selectedPlan.isPopular}
                                        <span class="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-primary text-white shadow-xs">Most Popular</span>
                                    {/if}
                                </div>
                                <div class="text-right">
                                    <span class="text-lg font-black text-primary block leading-none">{selectedPlan.price}</span>
                                    <span class="text-[9px] font-medium text-text/50 uppercase tracking-wider">{selectedPlan.priceSub}</span>
                                </div>
                            </div>
                            <p class="text-xs text-text/70 leading-relaxed">
                                {selectedPlan.tagline}
                                {#if selectedPlan.highlightText}
                                    <span class="text-primary font-bold">{selectedPlan.highlightText}</span>
                                {/if}
                            </p>
                            <div class="pt-2 border-t border-black/5">
                                <span class="block font-mono text-[9px] font-bold text-text/50 uppercase tracking-widest mb-1.5">Features Included:</span>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-text/80">
                                    {#each selectedPlan.features as feat}
                                        <span class="flex items-center gap-1.5">
                                            <span class="material-symbols-rounded text-sm text-primary">check_circle</span>
                                            <span>{feat}</span>
                                        </span>
                                    {/each}
                                </div>
                            </div>
                        </div>
                    {/if}

                    <!-- Plan Request & Meeting Form -->
                    <form onsubmit={handleSubmit} novalidate class="space-y-3">
                        {#if submitError}
                            <div class="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                                <span class="material-symbols-rounded text-[16px] shrink-0">error</span>
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
                                class="w-full px-3.5 py-2 text-xs text-text bg-white border {errors.name && touched.name ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-black/15'} rounded-xl focus:outline-none focus:border-primary"
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
                                class="w-full px-3.5 py-2 text-xs text-text bg-white border {errors.email && touched.email ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-black/15'} rounded-xl focus:outline-none focus:border-primary"
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
                                class="w-full px-3.5 py-2 text-xs text-text bg-white border {errors.phone && touched.phone ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-black/15'} rounded-xl focus:outline-none focus:border-primary"
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
                                class="w-full px-3.5 py-2 text-xs text-text bg-white border border-black/15 rounded-xl focus:outline-none focus:border-primary"
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
                                    class="w-full px-3.5 py-2 text-xs text-text bg-white border {errors.meetingDate && touched.meetingDate ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-black/15'} rounded-xl focus:outline-none focus:border-primary"
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
                                    <span>Submitting Request...</span>
                                {:else}
                                    <span>Confirm Subscription Request</span>
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
