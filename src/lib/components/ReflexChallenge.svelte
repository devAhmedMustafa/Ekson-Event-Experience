<script lang="ts">
    type GamePhase = "idle" | "waiting" | "ready" | "clicked" | "tooEarly";

    let gamePhase: GamePhase = $state("idle");
    let startTime = $state(0);
    let reactionTime: number | null = $state(null);
    let bestTime: number | null = $state(null);
    let timeoutId: number | null = null;

    function start() {
        gamePhase = "waiting";
        reactionTime = null;
        const delay = Math.floor(Math.random() * 2000) + 1500;
        timeoutId = window.setTimeout(() => {
            gamePhase = "ready";
            startTime = performance.now();
        }, delay);
    }

    function handleClick() {
        if (gamePhase === "waiting") {
            if (timeoutId) clearTimeout(timeoutId);
            gamePhase = "tooEarly";
        } else if (gamePhase === "ready") {
            const time = Math.round(performance.now() - startTime);
            reactionTime = time;
            gamePhase = "clicked";
            if (!bestTime || time < bestTime) {
                bestTime = time;
            }
        }
    }
</script>

<div class="w-full h-full flex flex-col md:flex-row items-center justify-between p-4 md:p-6 gap-4 md:gap-6 select-none font-sans overflow-hidden">
    <!-- BIG INTERACTIVE MAIN STAGE (REFLEX ARENA) -->
    <div class="flex-1 w-full h-full flex flex-col items-center justify-center relative bg-white/40 border border-black/5 overflow-hidden font-mono">
        {#if gamePhase === "idle"}
            <button
                onclick={start}
                class="w-full h-full bg-white text-text p-6 flex flex-col items-center justify-center gap-3 hover:bg-primary hover:text-white transition-colors cursor-pointer group shadow-xs"
            >
                <span class="material-symbols-outlined text-[48px] text-primary group-hover:text-white transition-colors">
                    bolt
                </span>
                <h4 class="text-2xl md:text-3xl font-black uppercase tracking-wider">Reflex Speed</h4>
                <p class="text-xs text-text/60 group-hover:text-white/80 text-center max-w-xs transition-colors">
                    CLICK TO ARM SENSOR. TRIGGER IMMEDIATELY UPON ACTIVATION.
                </p>
                <span class="mt-2 px-5 py-2 bg-text/5 group-hover:bg-white group-hover:text-primary text-text font-bold text-xs uppercase tracking-widest transition-colors">
                    INITIALIZE TEST
                </span>
            </button>
        {:else if gamePhase === "waiting"}
            <button
                onclick={handleClick}
                class="w-full h-full bg-amber-50 text-amber-950 p-6 flex flex-col items-center justify-center gap-3 cursor-pointer"
            >
                <span class="material-symbols-outlined text-[44px] text-amber-600 animate-spin">
                    progress_activity
                </span>
                <h4 class="text-xl md:text-2xl font-bold tracking-widest text-amber-900 uppercase">STANDBY FOR SIGNAL...</h4>
                <p class="text-xs text-amber-700/80">HOLD POSITION — DO NOT TRIGGER</p>
            </button>
        {:else if gamePhase === "ready"}
            <button
                onclick={handleClick}
                class="w-full h-full bg-primary text-white p-6 flex flex-col items-center justify-center gap-2 cursor-pointer animate-pulse shadow-lg"
            >
                <span class="material-symbols-outlined text-[60px]">
                    touch_app
                </span>
                <h4 class="text-4xl md:text-5xl font-black tracking-widest uppercase">TRIGGER NOW!</h4>
            </button>
        {:else if gamePhase === "clicked"}
            <div class="w-full h-full bg-white text-text p-6 flex flex-col items-center justify-center gap-2 text-center shadow-xs">
                <span class="material-symbols-outlined text-[32px] text-emerald-600">
                    timer
                </span>
                <h4 class="text-xs uppercase tracking-widest text-text/50">Measured Reaction Latency</h4>
                <div class="text-5xl md:text-6xl font-black text-secondary my-1">{reactionTime} <span class="text-xl text-text/40 font-normal">MS</span></div>
                {#if bestTime}
                    <span class="text-xs text-text/60">SESSION_BEST: <b class="text-primary">{bestTime} MS</b></span>
                {/if}
                <button
                    onclick={start}
                    class="mt-3 px-5 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-primary/20"
                >
                    <span class="material-symbols-outlined text-[14px]">replay</span>
                    <span>RE-ARM SENSOR</span>
                </button>
            </div>
        {:else if gamePhase === "tooEarly"}
            <div class="w-full h-full bg-rose-50 text-rose-950 p-6 flex flex-col items-center justify-center gap-2 text-center">
                <span class="material-symbols-outlined text-[32px] text-rose-600">
                    warning
                </span>
                <h4 class="text-lg font-bold text-rose-700 uppercase tracking-widest">EARLY TRIGGER DETECTED</h4>
                <p class="text-xs text-rose-600/80 max-w-xs">Input registered prior to optical signal illumination.</p>
                <button
                    onclick={start}
                    class="mt-3 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-md"
                >
                    RESTART SENSOR
                </button>
            </div>
        {/if}
    </div>

    <!-- SEPARATE COMPACT DESCRIPTION WINDOW (NO COLLISION) -->
    <div class="w-full md:w-68 shrink-0 bg-white p-4 shadow-xs border border-black/5 flex flex-col justify-between h-auto md:h-full font-sans">
        <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between font-mono text-[9px] text-text/50 uppercase tracking-widest">
                <div class="flex items-center gap-1">
                    <span class="size-1.5 bg-primary"></span>
                    <span>MODULE // 03</span>
                </div>
                <span class="text-amber-600 font-bold">1.0MS PRECISION</span>
            </div>

            <h3 class="text-base font-extrabold uppercase tracking-tight text-text flex items-center justify-between">
                <span>Reflex Speed</span>
                <span class="material-symbols-outlined text-[18px] text-primary">bolt</span>
            </h3>

            <p class="text-xs text-text/70 leading-relaxed">
                Millisecond-precision response measurement for touch kiosks, arcade buzzers and physical sensors.
            </p>

            <div class="grid grid-cols-2 gap-2 pt-2 mt-1 border-t border-black/5 font-mono text-[10px]">
                <div class="p-1.5 bg-black/[0.02] flex flex-col">
                    <span class="text-text/40 text-[8px] uppercase">SENSOR</span>
                    <span class="font-bold text-text">CAPACITIVE</span>
                </div>
                <div class="p-1.5 bg-black/[0.02] flex flex-col">
                    <span class="text-text/40 text-[8px] uppercase">RATE</span>
                    <span class="font-bold text-primary">1000 HZ</span>
                </div>
            </div>
        </div>

        <button
            onclick={start}
            class="mt-3 w-full py-2 bg-primary hover:bg-primary/90 text-white font-mono text-[11px] font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
        >
            <span class="material-symbols-outlined text-[14px]">replay</span>
            <span>Re-Arm Sensor</span>
        </button>
    </div>
</div>
