<script lang="ts">
    import { brand } from "$lib/brand.svelte";
    import { MERCH, type MerchItem } from "$lib/three/merch";

    interface ARCardItem extends MerchItem {
        code: string;
        icon: string;
    }

    const arApps: ARCardItem[] = [
        {
            ...MERCH[0], // Mug
            code: "AR_01",
            icon: "coffee"
        },
        {
            ...MERCH[1], // Pen
            code: "AR_02",
            icon: "edit"
        },
        {
            ...MERCH[2], // Notebook
            code: "AR_03",
            icon: "menu_book"
        },
        {
            ...MERCH[3], // Tote Bag
            code: "AR_04",
            icon: "shopping_bag"
        }
    ];

    // Dynamic QR code generation for mobile navigation to /ar route
    let originUrl = $state("");
    $effect(() => {
        if (typeof window !== "undefined") {
            originUrl = window.location.origin;
        }
    });

    function getArUrl(modelId: string) {
        return `${originUrl || "https://ekson.com"}/ar?m=${modelId}&name=${encodeURIComponent(brand.name)}&color=${encodeURIComponent(brand.primaryColor)}&dark=${encodeURIComponent(brand.darkColor)}`;
    }

    function getQrCodeUrl(modelId: string) {
        const url = getArUrl(modelId);
        return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`;
    }
</script>

<div class="w-full h-full min-h-dvh md:h-screen max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex flex-col justify-between select-none font-sans overflow-hidden">
    <!-- Clean Minimal Header -->
    <div class="flex items-end justify-between pb-2 border-b border-black/5 shrink-0 w-full mb-2 sm:mb-3">
        <div>
            <div class="flex items-center gap-1.5 font-mono text-[9px] sm:text-[10px] uppercase tracking-widest font-bold mb-0.5" style="color: {brand.primaryColor};">
                <span class="size-1.5 rounded-full" style="background-color: {brand.primaryColor};"></span>
                <span>07 / Spatial Lens</span>
            </div>
            <h2 class="text-xl sm:text-2xl md:text-3xl font-extrabold text-text tracking-tight uppercase">
                AR & 3D Merchandise Suite
            </h2>
            <p class="text-[11px] sm:text-xs text-text/70 mt-0.5 max-w-xl">
                Real-world 1:1 metric scale giveaways imprinted with your brand mark and deducted colors.
            </p>
        </div>

        <div class="hidden sm:flex items-center gap-2 font-mono text-[10px] text-text/50">
            <span class="size-2 rounded-full animate-pulse" style="background-color: {brand.primaryColor};"></span>
            <span>MOBILE SCAN & 3D PREVIEW READY</span>
        </div>
    </div>

    <!-- 4 Quarters Grid (2x2 Screen Division) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5 my-auto w-full flex-1 max-h-[82vh] py-1">
        {#each arApps as app}
            <div class="group relative bg-white border border-black/10 hover:border-black/25 transition-all duration-200 p-3 sm:p-4 rounded-2xl shadow-xs flex flex-row items-stretch justify-between gap-3 sm:gap-4 overflow-hidden ring-1 ring-black/5">
                
                <!-- Left Details & Big QR Code Panel -->
                <div class="flex-1 flex flex-col justify-between overflow-hidden">
                    <!-- Title & Tagline -->
                    <div>
                        <div class="flex items-center justify-between font-mono text-[8px] sm:text-[9px] text-text/50 uppercase tracking-wider mb-0.5">
                            <span class="font-bold" style="color: {brand.primaryColor};">{app.code}</span>
                            <span class="text-emerald-600 font-semibold">
                                LIVE 3D PREVIEW
                            </span>
                        </div>
                        <h3 class="text-xs sm:text-sm md:text-base font-black text-text uppercase tracking-tight truncate">
                            {brand.name} {app.name}
                        </h3>
                        <p class="text-[9px] sm:text-[10px] font-mono font-bold leading-none mt-0.5 truncate" style="color: {brand.primaryColor};">
                            {app.tagline}
                        </p>
                    </div>

                    <!-- Center Big QR Code & Scan Instructions -->
                    <div class="flex items-center gap-2.5 sm:gap-3 my-auto py-1">
                        <!-- High-Resolution QR Container linking to /ar?m=... -->
                        <div class="relative size-20 sm:size-24 md:size-28 lg:size-30 p-2 bg-white border border-black/15 rounded-xl shrink-0 shadow-sm flex items-center justify-center">
                            <img
                                src={getQrCodeUrl(app.id)}
                                alt="{app.name} QR Code"
                                class="w-full h-full object-contain rounded-md"
                                loading="lazy"
                                decoding="async"
                            />
                        </div>
                    </div>

                </div>

                <!-- Right Interactive 3D Teaser Stage -->
                <div class="w-28 sm:w-36 md:w-44 lg:w-52 h-full min-h-25 relative bg-slate-950 overflow-hidden rounded-xl border border-black/10 shrink-0 group/vid flex flex-col justify-between p-2">
                    <!-- Visual 3D Merch Teaser Badge -->
                    <div class="absolute inset-0 bg-linear-to-br from-slate-900 to-slate-950 flex flex-col items-center justify-center p-2 text-center">
                        <div class="size-11 sm:size-13 rounded-2xl flex items-center justify-center shadow-lg border border-white/10 mb-1" style="background-color: {brand.darkColor};">
                            <span class="material-symbols-rounded text-[22px] sm:text-[26px] text-white">
                                {app.icon}
                            </span>
                        </div>
                        <span class="text-[9px] sm:text-[10px] font-bold text-white uppercase tracking-wider font-mono truncate max-w-full px-1">
                            {brand.name} {app.name}
                        </span>
                        <span class="text-[7px] sm:text-[8px] text-white/60 font-mono truncate max-w-full px-1">
                            {app.blurb.split(',')[0]}
                        </span>
                    </div>

                    <!-- Hover Launch Overlay linking to /ar?m=... -->
                    <a
                        href={getArUrl(app.id)}
                        class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition duration-200 flex flex-col items-center justify-center gap-1 text-white cursor-pointer backdrop-blur-xs"
                        aria-label="Open 3D {app.name} Preview"
                    >
                        <span class="material-symbols-rounded text-[22px]" style="color: {brand.primaryColor};">
                            open_in_full
                        </span>
                        <span class="text-[8px] font-mono font-bold uppercase tracking-wider">
                            Open 3D Preview
                        </span>
                    </a>
                </div>
            </div>
        {/each}
    </div>

    <!-- Bottom Status Bar -->
    <div class="flex items-center justify-between text-[9px] font-mono text-text/50 pt-1 border-t border-black/5 shrink-0">
        <span>SCAN QR WITH SMARTPHONE CAMERA TO LAUNCH DIRECT 3D PREVIEW</span>
        <span class="hidden sm:inline">1:1 REAL-WORLD SCALE · 4 BESPOKE GIVEAWAY ITEMS</span>
    </div>
</div>
