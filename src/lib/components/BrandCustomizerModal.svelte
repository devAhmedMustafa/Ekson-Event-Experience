<script lang="ts">
    import { onMount } from "svelte";

    interface Props {
        isOpen: boolean;
        onClose: () => void;
        onSave?: (data: BrandData) => void;
    }

    export interface BrandData {
        companyName: string;
        companyDescription: string;
        brandLogo: string | null;
        brandLogoName?: string;
        industry?: string;
        savedAt?: number;
    }

    let { isOpen, onClose, onSave }: Props = $props();

    const STORAGE_KEY = "ekson_brand_profile";

    let companyName = $state("");
    let companyDescription = $state("");
    let brandLogo = $state<string | null>(null);
    let brandLogoName = $state<string>("");
    let industry = $state("Technology & Innovation");

    let isDragging = $state(false);
    let errorMessage = $state<string | null>(null);
    let isSuccess = $state(false);
    let fileInputEl = $state<HTMLInputElement | null>(null);

    const industryOptions = [
        "Technology & AI",
        "Healthcare & Biotech",
        "Real Estate & Architecture",
        "Automotive & Mobility",
        "Finance & FinTech",
        "Energy & Sustainability",
        "Entertainment & Gaming",
        "Other Enterprise"
    ];

    function loadFromSession() {
        try {
            const saved = sessionStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed: BrandData = JSON.parse(saved);
                companyName = parsed.companyName || "";
                companyDescription = parsed.companyDescription || "";
                brandLogo = parsed.brandLogo || null;
                brandLogoName = parsed.brandLogoName || "";
                industry = parsed.industry || "Technology & AI";
            }
        } catch (e) {
            console.error("Failed to read brand data from sessionStorage", e);
        }
    }

    onMount(() => {
        loadFromSession();
    });

    $effect(() => {
        if (isOpen) {
            loadFromSession();
            isSuccess = false;
            errorMessage = null;
        }
    });

    function processImageFile(file: File) {
        errorMessage = null;

        if (!file.type.startsWith("image/")) {
            errorMessage = "Please upload a valid image file (PNG, JPG, SVG, WebP).";
            return;
        }

        // Keep file size < 3MB to avoid sessionStorage quota issues
        if (file.size > 3 * 1024 * 1024) {
            errorMessage = "Image size exceeds 3MB limit. Please choose a smaller image.";
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            if (typeof e.target?.result === "string") {
                brandLogo = e.target.result;
                brandLogoName = file.name;
            }
        };
        reader.onerror = () => {
            errorMessage = "Failed to process image file. Please try again.";
        };
        reader.readAsDataURL(file);
    }

    function handleFileInput(e: Event) {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files[0]) {
            processImageFile(target.files[0]);
        }
    }

    function handleDrop(e: DragEvent) {
        e.preventDefault();
        isDragging = false;
        if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
            processImageFile(e.dataTransfer.files[0]);
        }
    }

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
        isDragging = true;
    }

    function handleDragLeave(e: DragEvent) {
        e.preventDefault();
        isDragging = false;
    }

    function removeLogo() {
        brandLogo = null;
        brandLogoName = "";
        if (fileInputEl) {
            fileInputEl.value = "";
        }
    }

    function handleSave(e: SubmitEvent) {
        e.preventDefault();
        errorMessage = null;

        if (!companyName.trim()) {
            errorMessage = "Please enter your company or brand name.";
            return;
        }

        if (!companyDescription.trim()) {
            errorMessage = "Please provide a brief company or event description.";
            return;
        }

        const data: BrandData = {
            companyName: companyName.trim(),
            companyDescription: companyDescription.trim(),
            brandLogo,
            brandLogoName,
            industry,
            savedAt: Date.now()
        };

        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            window.dispatchEvent(new CustomEvent("ekson_brand_updated", { detail: data }));
            isSuccess = true;
            if (onSave) onSave(data);

            setTimeout(() => {
                isSuccess = false;
                onClose();
            }, 1200);
        } catch (err) {
            errorMessage = "Failed to save to sessionStorage (storage limit may be reached).";
            console.error(err);
        }
    }

    function clearBrandData() {
        try {
            sessionStorage.removeItem(STORAGE_KEY);
            companyName = "";
            companyDescription = "";
            brandLogo = null;
            brandLogoName = "";
            if (fileInputEl) fileInputEl.value = "";
            window.dispatchEvent(new CustomEvent("ekson_brand_updated", { detail: null }));
            errorMessage = null;
            isSuccess = false;
        } catch (e) {
            console.error(e);
        }
    }
</script>

{#if isOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 md:p-6 transition-all duration-300"
        onclick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
        <div
            class="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-black/10 overflow-hidden flex flex-col max-h-[92vh] font-sans"
        >
            <!-- Modal Header -->
            <div class="px-5 sm:px-7 py-4 sm:py-5 border-b border-black/5 flex items-center justify-between bg-slate-50/70 shrink-0">
                <div class="flex items-center gap-2.5">
                    <div class="size-9 sm:size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <span class="material-symbols-rounded text-[20px] sm:text-[22px]">auto_awesome</span>
                    </div>
                    <div>
                        <div class="flex items-center gap-1.5 font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-primary font-bold">
                            <span class="size-1.5 bg-primary rounded-full animate-pulse"></span>
                            <span>Brand Customization Studio</span>
                        </div>
                        <h2 class="text-base sm:text-lg md:text-xl font-extrabold text-text uppercase tracking-tight">
                            Try It For Your Brand
                        </h2>
                    </div>
                </div>

                <button
                    onclick={onClose}
                    class="size-8 sm:size-9 rounded-full bg-black/5 hover:bg-black/10 text-text/70 flex items-center justify-center transition cursor-pointer"
                    aria-label="Close dialog"
                >
                    <span class="material-symbols-rounded text-[18px]">close</span>
                </button>
            </div>

            <!-- Modal Content & Form -->
            <div class="p-5 sm:p-7 overflow-y-auto">
                {#if isSuccess}
                    <!-- Success Animation View -->
                    <div class="flex flex-col items-center text-center py-6 sm:py-8 gap-3 animate-fade-in">
                        <div class="size-16 sm:size-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-sm animate-bounce">
                            <span class="material-symbols-rounded text-[36px] sm:text-[42px]">check_circle</span>
                        </div>
                        <h3 class="text-lg sm:text-xl font-extrabold text-text uppercase">Brand Profile Saved!</h3>
                        <p class="text-xs sm:text-sm text-text/70 max-w-sm">
                            Your brand asset & brief description have been cached in <strong class="text-primary font-mono font-bold">sessionStorage</strong> for your interactive session.
                        </p>
                    </div>
                {:else}
                    <form onsubmit={handleSave} class="space-y-4">
                        {#if errorMessage}
                            <div class="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                                <span class="material-symbols-rounded text-[16px] shrink-0">error</span>
                                <span>{errorMessage}</span>
                            </div>
                        {/if}

                        <!-- Company / Brand Name Field -->
                        <div>
                            <label for="brand-name" class="block font-mono text-[10px] sm:text-[11px] font-bold text-text/70 uppercase mb-1">
                                Company / Brand Name <span class="text-rose-500">*</span>
                            </label>
                            <input
                                id="brand-name"
                                type="text"
                                bind:value={companyName}
                                placeholder="e.g. Acme Spatial Robotics"
                                class="w-full px-3.5 py-2 text-xs sm:text-sm text-text bg-white border border-black/15 rounded-xl focus:outline-none focus:border-primary shadow-xs transition"
                            />
                        </div>

                        <!-- Industry Selector -->
                        <div>
                            <label for="brand-industry" class="block font-mono text-[10px] sm:text-[11px] font-bold text-text/70 uppercase mb-1">
                                Industry Sector
                            </label>
                            <select
                                id="brand-industry"
                                bind:value={industry}
                                class="w-full px-3.5 py-2 text-xs text-text bg-white border border-black/15 rounded-xl focus:outline-none focus:border-primary shadow-xs transition"
                            >
                                {#each industryOptions as opt}
                                    <option value={opt}>{opt}</option>
                                {/each}
                            </select>
                        </div>

                        <!-- Brand Logo / Image Upload Area -->
                        <div>
                            <label for="brand-logo-input" class="block font-mono text-[10px] sm:text-[11px] font-bold text-text/70 uppercase mb-1">
                                Brand Logo / Visual Asset
                            </label>

                            {#if brandLogo}
                                <!-- Image Preview Card -->
                                <div class="relative p-3 bg-slate-50 border border-black/10 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                                    <div class="flex items-center gap-3 min-w-0">
                                        <div class="size-14 sm:size-16 rounded-xl bg-white border border-black/10 p-1.5 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                                            <img
                                                src={brandLogo}
                                                alt="Uploaded Brand Logo"
                                                class="w-full h-full object-contain"
                                            />
                                        </div>
                                        <div class="flex flex-col min-w-0">
                                            <span class="text-xs font-bold text-text truncate">{brandLogoName || "Brand Logo Asset"}</span>
                                            <span class="text-[10px] font-mono text-emerald-600 font-bold flex items-center gap-1">
                                                <span class="material-symbols-rounded text-[12px]">verified</span>
                                                <span>Ready for Preview</span>
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onclick={removeLogo}
                                        class="px-2.5 py-1 text-[11px] font-mono text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition cursor-pointer flex items-center gap-1"
                                    >
                                        <span class="material-symbols-rounded text-[14px]">delete</span>
                                        <span>Remove</span>
                                    </button>
                                </div>
                            {:else}
                                <!-- Dropzone -->
                                <div
                                    ondrop={handleDrop}
                                    ondragover={handleDragOver}
                                    ondragleave={handleDragLeave}
                                    class="relative border-2 border-dashed {isDragging ? 'border-primary bg-primary/5' : 'border-black/15 bg-slate-50/50 hover:bg-slate-50'} rounded-2xl p-4 sm:p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5"
                                >
                                    <input
                                        id="brand-logo-input"
                                        bind:this={fileInputEl}
                                        type="file"
                                        accept="image/png, image/jpeg, image/webp, image/svg+xml"
                                        onchange={handleFileInput}
                                        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div class="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                        <span class="material-symbols-rounded text-[20px]">upload_file</span>
                                    </div>
                                    <p class="text-xs font-bold text-text">
                                        Drag & drop your logo here, or <span class="text-primary underline">browse</span>
                                    </p>
                                    <p class="text-[10px] text-text/50 font-mono">
                                        PNG, JPG, SVG, WebP (Max 3MB)
                                    </p>
                                </div>
                            {/if}
                        </div>

                        <!-- Brief Description Field -->
                        <div>
                            <label for="brand-description" class="block font-mono text-[10px] sm:text-[11px] font-bold text-text/70 uppercase mb-1">
                                Company Brief & Event Objectives <span class="text-rose-500">*</span>
                            </label>
                            <textarea
                                id="brand-description"
                                bind:value={companyDescription}
                                rows="3"
                                placeholder="Describe what your brand does, key products you want to feature, and your event booth goals (e.g. Lead capture, 3D product showcase, interactive mini-games)..."
                                class="w-full px-3.5 py-2.5 text-xs text-text bg-white border border-black/15 rounded-xl focus:outline-none focus:border-primary shadow-xs transition leading-relaxed"
                            ></textarea>
                        </div>

                        <!-- Action Buttons -->
                        <div class="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-black/5">
                            <button
                                type="button"
                                onclick={clearBrandData}
                                class="w-full sm:w-auto px-4 py-2 text-text/60 hover:text-rose-600 font-mono text-xs font-bold uppercase tracking-wider rounded-full transition cursor-pointer"
                            >
                                Reset Data
                            </button>

                            <div class="w-full sm:w-auto flex items-center gap-2">
                                <button
                                    type="button"
                                    onclick={onClose}
                                    class="flex-1 sm:flex-none px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-text font-mono text-xs font-bold uppercase tracking-wider rounded-full transition cursor-pointer"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    class="flex-1 sm:flex-none px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-full shadow-md shadow-primary/25 transition cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    <span>Save & Apply</span>
                                    <span class="material-symbols-rounded text-[16px]">check</span>
                                </button>
                            </div>
                        </div>
                    </form>
                {/if}
            </div>
        </div>
    </div>
{/if}
