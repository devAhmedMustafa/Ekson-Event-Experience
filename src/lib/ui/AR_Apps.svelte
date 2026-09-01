<script lang="ts">
    import { brand } from "$lib/brand.svelte";
    import { MERCH, type MerchItem } from "$lib/three/merch";
    import MerchBoxViewer from "$lib/components/MerchBoxViewer.svelte";

    interface ARCardItem extends MerchItem {
        code: string;
        icon: string;
        imageSrc?: string;
    }

    const arApps: ARCardItem[] = [
        {
            ...MERCH[0], // Mug
            code: "AR_01",
            icon: "coffee",
            imageSrc: ""
        },
        {
            ...MERCH[1], // Pen
            code: "AR_02",
            icon: "edit",
            imageSrc: ""
        },
        {
            ...MERCH[2], // Notebook
            code: "AR_03",
            icon: "menu_book",
            imageSrc: ""
        },
        {
            ...MERCH[3], // Tote Bag
            code: "AR_04",
            icon: "shopping_bag",
            imageSrc: ""
        }
    ];

    // Per-model Live Preview activation state
    let liveModels = $state<Record<string, boolean>>({});

    // Dynamic QR code generation for mobile navigation to /ar route
    let originUrl = $state("");
    $effect(() => {
        if (typeof window !== "undefined") {
            originUrl = window.location.origin;
        }
    });

    function getArUrl(modelId: string) {
        return `${originUrl || "https://kubix.com"}/ar?m=${modelId}&name=${encodeURIComponent(brand.name)}&color=${encodeURIComponent(brand.primaryColor)}&dark=${encodeURIComponent(brand.darkColor)}`;
    }

    function getQrCodeUrl(modelId: string) {
        const url = getArUrl(modelId);
        return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`;
    }

    function handleUnlockAr() {
        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("ekson_open_brand_modal"));
        }
    }

    function startLivePreview(modelId: string) {
        if (!brand.logo) {
            handleUnlockAr();
            return;
        }
        liveModels[modelId] = true;
    }

    function stopLivePreview(modelId: string) {
        liveModels[modelId] = false;
    }
</script>

<div class="w-full h-full min-h-dvh lg:h-screen max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-8 flex flex-col justify-between overflow-visible lg:overflow-hidden">
    <!-- Header -->
    <div class="flex items-end justify-between pb-3 border-b border-black/5 shrink-0 w-full mb-3 sm:mb-4">
        <div>
            <h2 class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-text tracking-tight">
                AR <span class="text-transparent bg-clip-text bg-linear-to-r from-primary to-secondary">Items</span>
            </h2>
            <p class="text-xs sm:text-sm text-text/70 mt-1 max-w-xl leading-relaxed">
                Scan QR codes to preview branded 3D giveaways on mobile devices.
            </p>
        </div>
    </div>

    <!-- 4 Quarters Grid (2x2 Screen Division) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6 my-auto w-full flex-1 max-h-none lg:max-h-[82vh] py-2">
        {#each arApps as app}
            <div class="group relative bg-white/70 backdrop-blur-xl border border-black/5 hover:border-black/15 transition-all duration-300 p-4 sm:p-4 md:p-5 rounded-3xl shadow-sm flex flex-col sm:flex-row items-stretch justify-between gap-3.5 sm:gap-4 overflow-hidden">
                
                <!-- Left Column (Desktop: Contains Row 1 & Row 2 | Mobile: Full width stacked rows) -->
                <div class="flex-1 flex flex-col justify-between overflow-hidden min-w-0 w-full gap-3 sm:gap-0">
                    
                    <!-- ROW 1: Title, Tagline & Item Code Badge -->
                    <div class="w-full flex items-start justify-between gap-2">
                        <div class="min-w-0 flex-1">
                            <h3 class="text-base sm:text-base lg:text-lg font-bold text-text tracking-tight truncate">
                                {brand.name} {app.name}
                            </h3>
                            <p class="text-xs font-medium text-primary mt-0.5 truncate">
                                {app.tagline}
                            </p>
                        </div>
                    </div>

                    <!-- ROW 2: Big QR Code Container & Mobile AR Instructions -->
                    <div class="w-full flex items-center justify-start gap-3.5 my-auto py-2.5 px-3 sm:bg-transparent rounded-2xl sm:border-0 sm:p-0 sm:py-2">
                        {#if !brand.logo}
                            <img
                                src={getQrCodeUrl(app.id)}
                                alt="{app.name} QR Code"
                                class="w-full h-full object-contain rounded-lg filter blur-[2px] opacity-35"
                                loading="lazy"
                            />
                            <button
                                onclick={handleUnlockAr}
                                class="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-1 text-center cursor-pointer group/qr"
                                title="Unlock AR Scan"
                            >
                                <span class="material-symbols-rounded text-amber-400 text-base sm:text-lg lg:text-xl mb-0.5 group-hover/qr:scale-110 transition">lock</span>
                                <span class="text-[8px] sm:text-[9px] font-semibold text-white uppercase tracking-wider leading-none">Unlock AR</span>
                            </button>
                        {:else}
                            <img
                                src={getQrCodeUrl(app.id)}
                                alt="{app.name} QR Code"
                                class="w-full h-full object-contain rounded-lg"
                                loading="lazy"
                                decoding="async"
                            />
                        {/if}
                    </div>
                </div>

                <!-- ROW 3: Interactive 3D Stage (Desktop: Right column | Mobile: Full width bottom row) -->
                <div class="w-full sm:w-40 md:w-44 lg:w-52 h-44 sm:h-auto min-h-36 sm:min-h-32 relative overflow-hidden rounded-2xl border border-black/10 shrink-0 group/vid flex flex-col justify-end">
                    {#if !brand.logo}
                        <!-- State 1: Brand logo NOT provided -->
                        <div class="absolute inset-0 bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 flex flex-col items-center justify-center p-2 text-center">
                            <span class="material-symbols-rounded text-2xl sm:text-3xl text-amber-400/80 mb-1">lock</span>
                            <span class="text-xs font-semibold text-white/90 truncate max-w-full px-1">{app.name}</span>
                            <span class="text-[9px] text-white/50 mt-0.5">Logo Required</span>
                        </div>

                        <button
                            onclick={handleUnlockAr}
                            class="absolute inset-0 bg-black/80 opacity-90 sm:opacity-0 group-hover/vid:opacity-100 focus-visible:opacity-100 transition duration-200 flex flex-col items-center justify-center gap-1.5 p-2 text-white cursor-pointer backdrop-blur-xs z-20 text-center"
                        >
                            <span class="material-symbols-rounded text-xl sm:text-2xl text-amber-400">auto_awesome</span>
                            <span class="text-[10px] font-bold uppercase tracking-wider">
                                Upload Logo to Preview
                            </span>
                        </button>
                    {:else if !liveModels[app.id]}
                        <!-- State 2: Brand logo IS provided, standby state waiting for user click -->
                        <div class="absolute inset-0 bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 flex flex-col items-center justify-center p-2 text-center">
                            <span class="material-symbols-rounded text-2xl sm:text-3xl text-primary mb-1">{app.icon}</span>
                            <span class="text-xs font-semibold text-white truncate max-w-full px-1">{app.name}</span>
                        </div>

                        <button
                            onclick={() => startLivePreview(app.id)}
                            class="absolute inset-0 bg-black/75 opacity-90 sm:opacity-0 group-hover/vid:opacity-100 focus-visible:opacity-100 transition duration-200 flex flex-col items-center justify-center gap-1.5 p-2 text-white cursor-pointer backdrop-blur-xs z-20 text-center"
                        >
                            <span class="material-symbols-rounded text-xl sm:text-2xl text-emerald-400">play_arrow</span>
                            <span class="text-[10px] font-bold uppercase tracking-wider">
                                Try 3D Live Preview
                            </span>
                        </button>
                    {:else}
                        <!-- State 3: Brand logo provided + User clicked to Live Preview -->
                        <MerchBoxViewer modelId={app.id} name={app.name} icon={app.icon} />

                        <button
                            onclick={() => stopLivePreview(app.id)}
                            class="absolute top-2 right-2 size-6.5 rounded-full bg-red-500/90 hover:bg-red-600 text-white flex items-center justify-center transition cursor-pointer z-30 shadow-md"
                            title="Stop Live Preview"
                            aria-label="Stop Live Preview"
                        >
                            <span class="material-symbols-rounded text-xs">close</span>
                        </button>
                    {/if}
                </div>
            </div>
        {/each}
    </div>
</div>
