<script lang="ts">
    import { onMount } from "svelte";

    interface Prize {
        code: string;
        label: string;
        bg: string;
        textColor: string;
    }

    const prizes: Prize[] = [
        { code: "01", label: "VIP ACCESS", bg: "#009dd6", textColor: "#ffffff" },
        { code: "02", label: "50% OFF", bg: "#ffffff", textColor: "#04547c" },
        { code: "03", label: "MERCH KIT", bg: "#ebe9fc", textColor: "#010104" },
        { code: "04", label: "EXP PASS", bg: "#04547c", textColor: "#ffffff" },
        { code: "05", label: "GRAND PRIZE", bg: "#f0fdf4", textColor: "#166534" },
        { code: "06", label: "100 TOKENS", bg: "#e0f2fe", textColor: "#0369a1" },
        { code: "07", label: "MYSTERY BOX", bg: "#ffffff", textColor: "#010104" },
        { code: "08", label: "GUEST PASS", bg: "#ebe9fc", textColor: "#010104" },
    ];

    let currentRotation = $state(0);
    let isSpinning = $state(false);
    let selectedPrize = $state<string | null>(null);
    let brandLogo = $state<string | null>(null);
    let brandName = $state<string | null>(null);

    const STORAGE_KEY = "ekson_brand_profile";

    function loadBrandLogo() {
        try {
            const saved = sessionStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                brandLogo = parsed.brandLogo || null;
                brandName = parsed.companyName || null;
                return;
            }
            brandLogo = null;
            brandName = null;
        } catch (e) {
            brandLogo = null;
            brandName = null;
        }
    }

    onMount(() => {
        loadBrandLogo();
        const onBrandUpdated = () => loadBrandLogo();
        window.addEventListener("ekson_brand_updated", onBrandUpdated);
        return () => window.removeEventListener("ekson_brand_updated", onBrandUpdated);
    });

    const numPrizes = prizes.length;
    const arc = 360 / numPrizes;

    function spin() {
        if (isSpinning) return;
        isSpinning = true;
        selectedPrize = null;

        const extraRotations = (5 + Math.floor(Math.random() * 4)) * 360;
        const randomPrizeIndex = Math.floor(Math.random() * numPrizes);
        const targetDeg = (numPrizes - randomPrizeIndex) * arc - (arc / 2);
        const nextRotation = currentRotation + extraRotations + targetDeg - (currentRotation % 360);

        currentRotation = nextRotation;

        setTimeout(() => {
            isSpinning = false;
            selectedPrize = prizes[randomPrizeIndex].label;
        }, 4000);
    }
</script>

<div class="w-full h-full flex flex-col md:flex-row items-center justify-between p-2 sm:p-4 md:p-6 gap-3 md:gap-6 select-none font-sans overflow-hidden">
    <!-- BIG INTERACTIVE MAIN STAGE (FULL VIEWPORT ON MOBILE) -->
    <div class="flex-1 w-full h-full flex flex-col items-center justify-center relative overflow-hidden bg-white/40 border border-black/5 p-2">
        <!-- Mobile Top Hint -->
        <div class="md:hidden flex items-center justify-between w-full pb-1 text-[10px] font-mono text-text/60">
            <span class="font-bold text-primary">EXP_01 // LUCKY WHEEL</span>
            <span>TAP CENTER TO SPIN</span>
        </div>

        <div class="relative flex items-center justify-center size-56 sm:size-68 md:size-76 my-auto">
            <!-- Top Indicator Needle -->
            <div class="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[18px] border-t-primary drop-shadow-md"></div>

            <!-- Wheel Disc -->
            <div
                class="relative w-full h-full rounded-full overflow-hidden shadow-lg border-2 border-white"
                style="transform: rotate({currentRotation}deg); transition: transform 4s cubic-bezier(0.12, 0.8, 0.2, 1);"
            >
                <svg class="w-full h-full" viewBox="0 0 400 400">
                    {#each prizes as prize, i}
                        {@const startAngle = (i * arc) * (Math.PI / 180)}
                        {@const endAngle = ((i + 1) * arc) * (Math.PI / 180)}
                        {@const x1 = 200 + 200 * Math.cos(startAngle)}
                        {@const y1 = 200 + 200 * Math.sin(startAngle)}
                        {@const x2 = 200 + 200 * Math.cos(endAngle)}
                        {@const y2 = 200 + 200 * Math.sin(endAngle)}
                        {@const midAngle = (i * arc + arc / 2) * (Math.PI / 180)}
                        {@const textX = 200 + 130 * Math.cos(midAngle)}
                        {@const textY = 200 + 130 * Math.sin(midAngle)}
                        {@const textRotation = (i * arc + arc / 2)}

                        <path
                            d="M 200 200 L {x1} {y1} A 200 200 0 0 1 {x2} {y2} Z"
                            fill={prize.bg}
                            stroke="#e2e8f0"
                            stroke-width="1.5"
                        />
                        
                        <text
                            x={textX}
                            y={textY}
                            fill={prize.textColor}
                            font-size="12"
                            font-weight="800"
                            letter-spacing="0.08em"
                            text-anchor="middle"
                            dominant-baseline="central"
                            font-family="monospace"
                            transform="rotate({textRotation + 90}, {textX}, {textY})"
                        >
                            {prize.label}
                        </text>
                    {/each}
                </svg>
            </div>

            <!-- Center Hub Spin Trigger Button with Brand Logo -->
            <button
                onclick={spin}
                disabled={isSpinning}
                class="group absolute size-16 sm:size-20 rounded-full bg-white text-text font-mono text-xs font-bold tracking-widest uppercase flex flex-col items-center justify-center hover:scale-105 transition-all duration-200 disabled:opacity-85 disabled:cursor-not-allowed z-10 shadow-xl border-2 border-primary/40 cursor-pointer overflow-hidden p-1"
                title={brandName ? `${brandName} - Click to Spin` : "Click to Spin"}
            >
                {#if brandLogo}
                    <div class="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-white p-1">
                        <img
                            src={brandLogo}
                            alt={brandName || "Brand Logo"}
                            class="w-full h-full object-contain"
                        />
                        <!-- Spin Hover Overlay -->
                        <div class="absolute inset-0 bg-primary/85 text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 {isSpinning ? 'opacity-100' : ''} transition-opacity duration-200">
                            <span class="material-symbols-rounded text-[16px] sm:text-[18px] {isSpinning ? 'animate-spin' : ''}">sync</span>
                            <span class="text-[8px] font-bold tracking-wider">{isSpinning ? "LOCK" : "SPIN"}</span>
                        </div>
                    </div>
                {:else}
                    <span class="material-symbols-rounded text-[18px] {isSpinning ? 'animate-spin text-primary' : 'text-primary'}">sync</span>
                    <span class="text-[9px] mt-0.5">{isSpinning ? "LOCK" : "SPIN"}</span>
                {/if}
            </button>

            {#if selectedPrize}
                <div class="absolute -top-10 z-30 px-3.5 py-1 bg-white text-emerald-700 font-mono text-[11px] font-bold uppercase tracking-wider rounded-full shadow-md border border-emerald-500/30 animate-bounce flex items-center gap-1">
                    <span class="material-symbols-rounded text-[14px] text-emerald-600">verified</span>
                    <span>AWARD: {selectedPrize}</span>
                </div>
            {/if}
        </div>
    </div>

    <!-- DESKTOP DESCRIPTION WINDOW (HIDDEN ON MOBILE TO PRIORITIZE GAMEPLAY) -->
    <div class="hidden md:flex w-68 shrink-0 bg-white p-4 shadow-xs border border-black/5 rounded-2xl flex-col justify-between h-full">
        <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between font-mono text-[9px] text-text/50 uppercase tracking-widest">
                <span class="text-primary font-bold">READY</span>
            </div>

            <h3 class="text-base font-extrabold uppercase tracking-tight text-text flex items-center justify-between">
                <span>Lucky Wheel</span>
                <span class="material-symbols-rounded text-[18px] text-primary">rotate_right</span>
            </h3>

            <p class="text-xs text-text/70 leading-relaxed">
                Customizable spin-to-win prize engine engineered for booth giveaways and high-frequency visitor capture.
            </p>

            <div class="grid grid-cols-2 gap-2 pt-2 mt-1 border-t border-black/5 font-mono text-[10px]">
                <div class="p-1.5 bg-black/[0.02] rounded-lg flex flex-col">
                    <span class="text-text/40 text-[8px] uppercase">ODDS</span>
                    <span class="font-bold text-text">WEIGHTED</span>
                </div>
                <div class="p-1.5 bg-black/[0.02] rounded-lg flex flex-col">
                    <span class="text-text/40 text-[8px] uppercase">SYNC</span>
                    <span class="font-bold text-primary">REALTIME</span>
                </div>
            </div>
        </div>

        <button
            onclick={spin}
            disabled={isSpinning}
            class="mt-3 w-full py-2 bg-primary hover:bg-primary/90 text-white font-mono text-[11px] font-bold uppercase tracking-wider rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
        >
            <span class="material-symbols-rounded text-[14px]">play_arrow</span>
            <span>{isSpinning ? "Executing..." : "Spin Wheel"}</span>
        </button>
    </div>
</div>
