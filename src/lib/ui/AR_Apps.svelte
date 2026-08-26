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
        return `${originUrl || "https://ekson.com"}/ar?m=${modelId}&name=${encodeURIComponent(brand.name)}&color=${encodeURIComponent(brand.primaryColor)}&dark=${encodeURIComponent(brand.darkColor)}`;
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

<div class="w-full h-full min-h-dvh md:h-screen max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-8 flex flex-col justify-between select-none overflow-visible md:overflow-hidden">
    <!-- Header -->
    <div class="flex items-end justify-between pb-3 border-b border-black/5 shrink-0 w-full mb-3 sm:mb-4">
        <div>

            <h2 class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-text tracking-tight">
                AR Giveaway Items
            </h2>
            <p class="text-xs sm:text-sm text-text/70 mt-1 max-w-xl leading-relaxed">
                Scan QR codes to preview branded 3D giveaways on mobile devices.
            </p>
        </div>
    </div>

    <!-- 4 Quarters Grid (2x2 Screen Division) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 my-auto w-full flex-1 max-h-none md:max-h-[82vh] py-2">
        {#each arApps as app}
            <div class="group relative bg-white/70 backdrop-blur-xl border border-black/5 hover:border-black/15 transition-all duration-300 p-4 sm:p-5 rounded-3xl shadow-sm flex flex-row items-stretch justify-between gap-3 sm:gap-4 overflow-hidden">
                
                <!-- Left Details & Big QR Code Panel -->
                <div class="flex-1 flex flex-col justify-between overflow-hidden">
                    <!-- Title & Tagline -->
                    <div>
                        <h3 class="text-sm sm:text-lg font-bold text-text tracking-tight truncate">
                            {brand.name} {app.name}
                        </h3>
                        <p class="text-[11px] sm:text-xs font-medium text-primary mt-0.5 truncate">
                            {app.tagline}
                        </p>
                    </div>

                    <!-- Center Big QR Code Container -->
                    <div class="flex items-center gap-3 my-auto py-2">
                        <div class="relative size-20 sm:size-28 p-1.5 sm:p-2 bg-white border border-black/10 rounded-2xl shrink-0 shadow-sm flex items-center justify-center overflow-hidden">
                            {#if !brand.logo}
                                <img
                                    src={getQrCodeUrl(app.id)}
                                    alt="{app.name} QR Code"
                                    class="w-full h-full object-contain rounded-lg filter blur-[2px] opacity-35"
                                    loading="lazy"
                                />
                                <button
                                    onclick={handleUnlockAr}
                                    class="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center p-1 text-center cursor-pointer group/qr"
                                    title="Unlock AR Scan"
                                >
                                    <span class="material-symbols-rounded text-amber-400 text-lg sm:text-xl mb-0.5 group-hover/qr:scale-110 transition">lock</span>
                                    <span class="text-[8px] sm:text-[9px] font-semibold text-white uppercase tracking-wider">Unlock AR</span>
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
                </div>

                <!-- Right Interactive 3D Stage (In-Place 3D Live Preview) -->
                <div class="w-28 sm:w-44 md:w-52 h-full min-h-32 sm:min-h-28 relative overflow-hidden rounded-2xl border border-black/10 shrink-0 group/vid flex flex-col justify-end">
                    {#if !brand.logo}
                        <!-- State 1: Brand logo NOT provided -->
                        <div class="absolute inset-0 bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 flex flex-col items-center justify-center p-2 text-center">
                            <span class="material-symbols-rounded text-3xl text-amber-400/80 mb-1">lock</span>
                            <span class="text-xs font-semibold text-white/90">{app.name}</span>
                            <span class="text-[9px] text-white/50 mt-0.5">Logo Required</span>
                        </div>

                        <button
                            onclick={handleUnlockAr}
                            class="absolute inset-0 bg-black/80 opacity-0 group-hover/vid:opacity-100 transition duration-200 flex flex-col items-center justify-center gap-1.5 p-2 text-white cursor-pointer backdrop-blur-xs z-20 text-center"
                        >
                            <span class="material-symbols-rounded text-2xl text-amber-400">auto_awesome</span>
                            <span class="text-[10px] font-bold uppercase tracking-wider">
                                Upload Logo to Preview
                            </span>
                        </button>
                    {:else if !liveModels[app.id]}
                        <!-- State 2: Brand logo IS provided, standby state waiting for user click -->
                        <div class="absolute inset-0 bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 flex flex-col items-center justify-center p-2 text-center">
                            <span class="material-symbols-rounded text-3xl text-primary mb-1">{app.icon}</span>
                            <span class="text-xs font-semibold text-white">{app.name}</span>
                        </div>

                        <button
                            onclick={() => startLivePreview(app.id)}
                            class="absolute inset-0 bg-black/75 opacity-0 group-hover/vid:opacity-100 transition duration-200 flex flex-col items-center justify-center gap-1.5 p-2 text-white cursor-pointer backdrop-blur-xs z-20 text-center"
                        >
                            <span class="material-symbols-rounded text-2xl text-emerald-400">play_arrow</span>
                            <span class="text-[10px] font-bold uppercase tracking-wider">
                                Try 3D Live Preview
                            </span>
                        </button>
                    {:else}
                        <!-- State 3: Brand logo provided + User clicked to Live Preview -->
                        <MerchBoxViewer modelId={app.id} name={app.name} icon={app.icon} />

                        <button
                            onclick={() => stopLivePreview(app.id)}
                            class="absolute top-2 right-2 size-6 rounded-full bg-red-500/80 hover:bg-red-600 text-white flex items-center justify-center transition cursor-pointer z-30 shadow-md"
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
