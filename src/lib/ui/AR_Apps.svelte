<script lang="ts">
    import { brand } from "$lib/brand.svelte";
    import BrandedMugViewer from "$lib/components/BrandedMugViewer.svelte";

    interface ARApp {
        id: string;
        title: string;
        code: string;
        tagline: string;
        description: string;
        isReady: boolean;
        tech: string[];
    }

    const arApps: ARApp[] = [
        {
            id: "branded-mug",
            title: "Branded Merchandise AR",
            code: "AR_01",
            tagline: "Custom 3D Mug & AR Passthrough",
            description: "Interact with real-time 3D branded ceramic merchandise with live logo imprint, custom glazes, and camera AR placement.",
            isReady: true,
            tech: ["WebAR", "3D PBR", "Camera SLAM"]
        },
        {
            id: "app-2",
            title: "VR Experience 02",
            code: "VR_02",
            tagline: "Immersive Spatial Experience",
            description: "Interactive VR experience arriving next. Features 6DoF interaction and high-fidelity physics shaders.",
            isReady: false,
            tech: ["WebXR", "6DoF Spatial"]
        },
        {
            id: "app-3",
            title: "VR Experience 03",
            code: "VR_03",
            tagline: "Spatial Navigation Hub",
            description: "Virtual reality venue navigation with spatial wayfinding and interactive point-of-interest telemetry.",
            isReady: false,
            tech: ["Spatial VPS", "WebXR"]
        },
        {
            id: "app-4",
            title: "VR Experience 04",
            code: "VR_04",
            tagline: "Interactive Holographic Pod",
            description: "High-definition virtual spatial booth showcase with interactive physics and spatial audio.",
            isReady: false,
            tech: ["Spatial Audio", "HoloPod"]
        }
    ];

    let activeModalAppId = $state<string | null>(null);
    let startInARMode = $state(false);

    function openMugModal(withAR = false) {
        startInARMode = withAR;
        activeModalAppId = "branded-mug";
    }

    function closeModal() {
        activeModalAppId = null;
        startInARMode = false;
    }

    // Dynamic QR code generation for mobile AR
    let currentUrl = $state("");
    $effect(() => {
        if (typeof window !== "undefined") {
            currentUrl = window.location.href;
        }
    });

    const qrCodeUrl = $derived(
        `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(currentUrl || "https://ekson.com")}`
    );
</script>

<div class="w-full h-full min-h-[100dvh] md:h-screen max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex flex-col justify-between select-none font-sans overflow-hidden">
    <!-- Clean Minimal Header -->
    <div class="flex items-end justify-between pb-2 border-b border-black/5 shrink-0 w-full mb-2 sm:mb-3">
        <div>
            <div class="flex items-center gap-1.5 font-mono text-[9px] sm:text-[10px] uppercase tracking-widest font-bold mb-0.5" style="color: {brand.primaryColor};">
                <span class="size-1.5 rounded-full" style="background-color: {brand.primaryColor};"></span>
                <span>07 / Spatial Lens</span>
            </div>
            <h2 class="text-xl sm:text-2xl md:text-3xl font-extrabold text-text tracking-tight uppercase">
                AR & VR Applications Suite
            </h2>
            <p class="text-[11px] sm:text-xs text-text/70 mt-0.5 max-w-xl">
                Instant WebAR model previews, interactive 3D merchandise customizers, and immersive VR experiences.
            </p>
        </div>

        <div class="hidden sm:flex items-center gap-2 font-mono text-[10px] text-text/50">
            <span class="size-2 rounded-full animate-pulse" style="background-color: {brand.primaryColor};"></span>
            <span>WEBAR & QUICKLOOK READY</span>
        </div>
    </div>

    <!-- 4 Quarters Grid (2x2 Screen Division) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5 my-auto w-full flex-1 max-h-[82vh] py-1">
        {#each arApps as app, idx}
            <div class="group relative bg-white border border-black/10 hover:border-black/25 transition-all duration-200 p-3 sm:p-4 rounded-2xl shadow-xs flex flex-row items-stretch justify-between gap-3 sm:gap-4 overflow-hidden {app.isReady ? 'ring-1 ring-black/5' : 'opacity-85'}">
                
                <!-- Left Details & Big QR Code Panel -->
                <div class="flex-1 flex flex-col justify-between overflow-hidden">
                    <!-- Title & Tagline -->
                    <div>
                        <div class="flex items-center justify-between font-mono text-[8px] sm:text-[9px] text-text/50 uppercase tracking-wider mb-0.5">
                            <span class="font-bold" style="color: {brand.primaryColor};">{app.code}</span>
                            <span class="{app.isReady ? 'text-emerald-600' : 'text-text/40'} font-semibold">
                                {app.isReady ? 'LIVE 3D // AR' : 'COMING SOON'}
                            </span>
                        </div>
                        <h3 class="text-xs sm:text-sm md:text-base font-black text-text uppercase tracking-tight truncate">
                            {app.id === 'branded-mug' ? `${brand.name} Branded Mug` : app.title}
                        </h3>
                        <p class="text-[9px] sm:text-[10px] font-mono font-bold leading-none mt-0.5 truncate" style="color: {brand.primaryColor};">
                            {app.tagline}
                        </p>
                    </div>

                    <!-- Center Big QR Code & Scan Instructions -->
                    <div class="flex items-center gap-2.5 sm:gap-3 my-auto py-1">
                        <!-- High-Resolution QR Container -->
                        <div class="relative size-20 sm:size-24 md:size-28 lg:size-30 p-2 bg-white border border-black/15 rounded-xl shrink-0 shadow-sm flex items-center justify-center">
                            <img
                                src={qrCodeUrl}
                                alt="{app.title} QR Code"
                                class="w-full h-full object-contain rounded-md"
                            />
                        </div>
                        <div class="flex flex-col gap-0.5 sm:gap-1 font-mono text-[8px] sm:text-[9px] text-text/70">
                            <span class="font-bold text-text uppercase tracking-wide">SCAN FOR MOBILE AR</span>
                            <span class="text-[8px] sm:text-[9px] text-text/50">Point phone camera</span>
                            <div class="flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full w-fit border" style="background-color: {brand.lightTint}; border-color: {brand.primaryColor}30; color: {brand.primaryColor};">
                                <span class="material-symbols-rounded text-[12px] sm:text-[14px]">qr_code_scanner</span>
                                <span class="text-[8px] sm:text-[9px] font-bold uppercase">INSTANT AR</span>
                            </div>
                        </div>
                    </div>

                    <!-- Action Buttons for App 1 or Tech Tags -->
                    {#if app.id === 'branded-mug'}
                        <div class="flex items-center gap-1.5 font-mono text-[8px] sm:text-[9px]">
                            <button
                                onclick={() => openMugModal(false)}
                                class="px-3 py-1 text-white font-bold uppercase rounded-lg shadow-sm transition hover:opacity-90 cursor-pointer flex items-center gap-1"
                                style="background-color: {brand.primaryColor};"
                            >
                                <span class="material-symbols-rounded text-[13px]">view_in_ar</span>
                                <span>3D Preview</span>
                            </button>
                            <button
                                onclick={() => openMugModal(true)}
                                class="px-2.5 py-1 bg-black/[0.04] hover:bg-black/[0.08] text-text border border-black/10 font-bold uppercase rounded-lg transition cursor-pointer flex items-center gap-1"
                            >
                                <span class="material-symbols-rounded text-[13px]">camera</span>
                                <span>Live AR</span>
                            </button>
                        </div>
                    {:else}
                        <div class="flex items-center gap-1 font-mono text-[8px] sm:text-[9px] text-text/60 overflow-hidden">
                            {#each app.tech as t}
                                <span class="px-2 py-0.5 bg-black/3 border border-black/5 rounded-full truncate font-medium">
                                    {t}
                                </span>
                            {/each}
                        </div>
                    {/if}
                </div>

                <!-- Right Interactive 3D / Preview Stage -->
                <div class="w-28 sm:w-36 md:w-44 lg:w-52 h-full min-h-25 relative bg-slate-950 overflow-hidden rounded-xl border border-black/10 shrink-0 group/vid flex flex-col justify-between p-2">
                    {#if app.id === 'branded-mug'}
                        <!-- Visual 3D Mug Teaser Badge -->
                        <div class="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-950 flex flex-col items-center justify-center p-2 text-center">
                            <!-- Mug Icon with Live Brand Colors -->
                            <div class="size-12 sm:size-14 rounded-2xl flex items-center justify-center shadow-lg border border-white/10 mb-1" style="background-color: {brand.darkColor};">
                                <span class="material-symbols-rounded text-[24px] sm:text-[28px] text-white">
                                    coffee
                                </span>
                            </div>
                            <span class="text-[9px] sm:text-[10px] font-bold text-white uppercase tracking-wider font-mono">
                                {brand.name} Mug
                            </span>
                            <span class="text-[7px] sm:text-[8px] text-white/60 font-mono">
                                Ceramic 3D & AR
                            </span>
                        </div>

                        <!-- Hover Launch Overlay -->
                        <button
                            onclick={() => openMugModal(false)}
                            class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition duration-200 flex flex-col items-center justify-center gap-1 text-white cursor-pointer backdrop-blur-xs"
                            aria-label="Open 3D Mug Customizer"
                        >
                            <span class="material-symbols-rounded text-[22px]" style="color: {brand.primaryColor};">
                                open_in_full
                            </span>
                            <span class="text-[8px] font-mono font-bold uppercase tracking-wider">
                                Launch 3D Studio
                            </span>
                        </button>
                    {:else}
                        <!-- Placeholder for Upcoming VR Apps -->
                        <div class="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center gap-1 p-2 text-center">
                            <span class="material-symbols-rounded text-[24px] text-white/30">
                                vrpano
                            </span>
                            <span class="text-[8px] font-mono font-bold text-white/50 uppercase tracking-wider">
                                VR Experience
                            </span>
                            <span class="text-[7px] font-mono text-white/30">
                                In Queue
                            </span>
                        </div>
                    {/if}
                </div>
            </div>
        {/each}
    </div>

    <!-- Bottom Status Bar -->
    <div class="flex items-center justify-between text-[9px] font-mono text-text/50 pt-1 border-t border-black/5 shrink-0">
        <span>ALL AR/VR EXPERIENCES COMPATIBLE WITH WEBAR & QUICKLOOK</span>
        <span class="hidden sm:inline">PROMPT 1 APPLIED: BRANDED MUG MODEL PREVIEW</span>
    </div>
</div>

<!-- Full Interactive Branded Mug 3D & AR Modal -->
{#if activeModalAppId === 'branded-mug'}
    <div class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
        <div class="relative w-full max-w-4xl h-[78vh] sm:h-[82vh] bg-slate-950 rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
            <BrandedMugViewer onClose={closeModal} initialAR={startInARMode} />
        </div>
    </div>
{/if}
