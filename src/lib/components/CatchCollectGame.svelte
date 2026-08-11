<script lang="ts">
    import { onDestroy } from "svelte";

    interface FallingItem {
        id: number;
        x: number;
        y: number;
        speed: number;
        icon: string;
        points: number;
        isHazard?: boolean;
    }

    interface FloatingScore {
        id: number;
        x: number;
        y: number;
        text: string;
        color: string;
    }

    let isPlaying = $state(false);
    let isGameOver = $state(false);
    let score = $state(0);
    let highScore = $state(0);
    let timeLeft = $state(20);
    let basketX = $state(50);
    let basketGlow = $state(false);
    let items = $state<FallingItem[]>([]);
    let popups = $state<FloatingScore[]>([]);

    let gameLoopId: number | null = null;
    let timerInterval: number | null = null;
    let nextItemId = 0;
    let nextPopupId = 0;
    let gameArea: HTMLElement | null = null;
    let basketEl: HTMLElement | null = null;

    const ITEM_TYPES = [
        { icon: "diamond", points: 150, isHazard: false, weight: 3 },
        { icon: "star", points: 100, isHazard: false, weight: 4 },
        { icon: "token", points: 250, isHazard: false, weight: 2 },
        { icon: "emergency", points: -100, isHazard: true, weight: 2 },
    ];

    function spawnItem() {
        const totalWeight = ITEM_TYPES.reduce((acc, cur) => acc + cur.weight, 0);
        let random = Math.random() * totalWeight;
        let selected = ITEM_TYPES[0];
        for (const item of ITEM_TYPES) {
            if (random < item.weight) {
                selected = item;
                break;
            }
            random -= item.weight;
        }

        const newItem: FallingItem = {
            id: ++nextItemId,
            x: Math.floor(Math.random() * 76) + 12,
            y: -24,
            speed: Math.random() * 1.2 + 2.4,
            icon: selected.icon,
            points: selected.points,
            isHazard: selected.isHazard,
        };
        items.push(newItem);
    }

    function addPopup(x: number, y: number, text: string, color: string) {
        const id = ++nextPopupId;
        popups.push({ id, x, y, text, color });
        setTimeout(() => {
            popups = popups.filter((p) => p.id !== id);
        }, 600);
    }

    function triggerCatch(item: FallingItem, catchY: number) {
        score = Math.max(0, score + item.points);
        addPopup(
            item.x,
            catchY - 24,
            item.points > 0 ? `+${item.points}` : `${item.points}`,
            item.isHazard ? "text-rose-600" : "text-emerald-600"
        );
        basketGlow = true;
        setTimeout(() => {
            basketGlow = false;
        }, 140);
    }

    function startGame() {
        isPlaying = true;
        isGameOver = false;
        score = 0;
        timeLeft = 20;
        items = [];
        popups = [];
        basketX = 50;

        let spawnCounter = 0;

        timerInterval = window.setInterval(() => {
            timeLeft -= 1;
            if (timeLeft <= 0) {
                endGame();
            }
        }, 1000);

        const loop = () => {
            if (!isPlaying) return;

            spawnCounter++;
            if (spawnCounter % 28 === 0) {
                spawnItem();
            }

            let basketY = 320;
            let basketHalfWidthPercent = 10;
            let gameHeight = 380;

            if (gameArea && basketEl) {
                const gameRect = gameArea.getBoundingClientRect();
                const basketRect = basketEl.getBoundingClientRect();
                basketY = basketRect.top - gameRect.top;
                basketHalfWidthPercent = ((basketRect.width / gameRect.width) * 100) / 2;
                gameHeight = gameRect.height;
            }

            items = items
                .map((item) => ({ ...item, y: item.y + item.speed }))
                .filter((item) => {
                    const itemBottomY = item.y + 24;
                    if (itemBottomY >= basketY && item.y <= basketY + 16) {
                        if (Math.abs(item.x - basketX) <= basketHalfWidthPercent + 2) {
                            triggerCatch(item, basketY);
                            return false;
                        }
                    }
                    return item.y < gameHeight + 30;
                });

            gameLoopId = requestAnimationFrame(loop);
        };

        gameLoopId = requestAnimationFrame(loop);
    }

    function endGame() {
        isPlaying = false;
        isGameOver = true;
        if (timerInterval) clearInterval(timerInterval);
        if (gameLoopId) cancelAnimationFrame(gameLoopId);
        if (score > highScore) {
            highScore = score;
        }
    }

    function handleMouseMove(e: MouseEvent) {
        if (!isPlaying || !gameArea) return;
        const rect = gameArea.getBoundingClientRect();
        const relativeX = e.clientX - rect.left;
        const percent = (relativeX / rect.width) * 100;
        basketX = Math.max(10, Math.min(90, percent));
    }

    function handleTouchMove(e: TouchEvent) {
        if (!isPlaying || !gameArea) return;
        const rect = gameArea.getBoundingClientRect();
        const relativeX = e.touches[0].clientX - rect.left;
        const percent = (relativeX / rect.width) * 100;
        basketX = Math.max(10, Math.min(90, percent));
    }

    onDestroy(() => {
        if (timerInterval) clearInterval(timerInterval);
        if (gameLoopId) cancelAnimationFrame(gameLoopId);
    });
</script>

<div class="w-full h-full flex flex-col md:flex-row items-center justify-between p-2 sm:p-4 md:p-6 gap-3 md:gap-6 select-none font-sans overflow-hidden">
    <!-- BIG INTERACTIVE MAIN STAGE (ARCADE CANVAS - FULL ON MOBILE) -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        bind:this={gameArea}
        onmousemove={handleMouseMove}
        ontouchmove={handleTouchMove}
        class="flex-1 w-full h-full relative bg-slate-100 overflow-hidden flex flex-col justify-between p-2.5 sm:p-3 border border-black/5 font-mono"
    >
        <!-- Top HUD -->
        <div class="flex items-center justify-between z-20 text-xs font-bold">
            <div class="flex items-center gap-1.5 px-2.5 py-1 bg-white text-text shadow-xs border border-black/5">
                <span class="text-primary font-mono font-bold text-[10px] sm:text-xs">SCORE:</span>
                <span class="text-xs sm:text-sm font-black font-mono">{score.toString().padStart(4, "0")}</span>
            </div>

            <div class="flex items-center gap-1 px-2.5 py-1 {timeLeft <= 5 ? 'bg-rose-600 text-white animate-pulse' : 'bg-white text-text border border-black/5 shadow-xs'} text-[10px] sm:text-xs">
                <span class="material-symbols-outlined text-[14px] {timeLeft <= 5 ? 'text-white' : 'text-primary'}">timer</span>
                <span>{timeLeft}S</span>
            </div>
        </div>

        <!-- Falling Geometric Items Area -->
        <div class="absolute inset-0 pointer-events-none overflow-hidden">
            {#each items as item (item.id)}
                <div
                    class="absolute size-6 transform -translate-x-1/2 will-change-transform flex items-center justify-center {item.isHazard ? 'text-rose-600' : 'text-primary'} drop-shadow-sm"
                    style="left: {item.x}%; top: {item.y}px;"
                >
                    <span class="material-symbols-outlined text-[22px] sm:text-[24px]">
                        {item.icon}
                    </span>
                </div>
            {/each}

            <!-- Floating Popups -->
            {#each popups as pop (pop.id)}
                <div
                    class="absolute text-xs font-black {pop.color} font-mono animate-bounce drop-shadow-sm"
                    style="left: {pop.x}%; top: {pop.y}px;"
                >
                    {pop.text}
                </div>
            {/each}

            <!-- Sharp Laser Catch Bar -->
            <div
                bind:this={basketEl}
                class="absolute bottom-4 sm:bottom-5 -translate-x-1/2 h-2.5 w-20 sm:w-24 bg-gradient-to-r from-primary via-cyan-400 to-primary transition-all duration-75 {basketGlow ? 'shadow-[0_0_20px_#009dd6] scale-y-125' : 'shadow-[0_0_10px_rgba(0,157,214,0.4)]'}"
                style="left: {basketX}%;"
            ></div>
        </div>

        <!-- Inactive / Game Over Overlay Screens -->
        {#if !isPlaying && !isGameOver}
            <div class="absolute inset-0 z-30 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center gap-2 sm:gap-2.5 p-4 text-center">
                <span class="material-symbols-outlined text-[36px] sm:text-[40px] text-primary">
                    token
                </span>
                <h4 class="text-base sm:text-lg font-bold text-text uppercase tracking-wider">Catch & Collect</h4>
                <p class="text-[10px] sm:text-xs text-text/60 max-w-xs leading-tight">
                    INTERCEPT FALLING TOKENS. EVADE HAZARD SIGNALS.
                </p>
                <button
                    onclick={startGame}
                    class="mt-1 px-4 sm:px-5 py-1.5 sm:py-2 bg-primary text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition shadow-md shadow-primary/25 cursor-pointer"
                >
                    Start Game (20s)
                </button>
            </div>
        {:else if isGameOver}
            <div class="absolute inset-0 z-30 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-4 text-center">
                <span class="material-symbols-outlined text-[28px] sm:text-[32px] text-emerald-600">
                    verified
                </span>
                <h4 class="text-[10px] uppercase tracking-widest text-text/60">Session Complete</h4>
                <div class="text-2xl sm:text-3xl font-black text-primary my-0.5">{score} <span class="text-xs font-normal text-text/40">PTS</span></div>
                {#if highScore > 0}
                    <span class="text-[10px] sm:text-xs text-text/60">BEST: <b class="text-secondary">{highScore} PTS</b></span>
                {/if}
                <button
                    onclick={startGame}
                    class="mt-1 px-4 sm:px-5 py-1.5 sm:py-2 bg-primary text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition cursor-pointer shadow-md"
                >
                    Play Again
                </button>
            </div>
        {/if}

        <div class="z-20 text-left">
            <span class="text-[8px] sm:text-[9px] text-text/40 tracking-widest uppercase">TOUCH / MOVE CURSOR TO STEER</span>
        </div>
    </div>

    <!-- DESKTOP DESCRIPTION WINDOW (HIDDEN ON MOBILE) -->
    <div class="hidden md:flex w-68 shrink-0 bg-white p-4 shadow-xs border border-black/5 flex-col justify-between h-full font-sans">
        <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between font-mono text-[9px] text-text/50 uppercase tracking-widest">
                <div class="flex items-center gap-1">
                    <span class="size-1.5 bg-primary"></span>
                    <span>MODULE // 04</span>
                </div>
                <span class="text-primary font-bold">60 FPS</span>
            </div>

            <h3 class="text-base font-extrabold uppercase tracking-tight text-text flex items-center justify-between">
                <span>Catch & Collect</span>
                <span class="material-symbols-outlined text-[18px] text-primary">token</span>
            </h3>

            <p class="text-xs text-text/70 leading-relaxed">
                Kinetic arcade collection system tailored for gesture kiosks, touch displays and trade show engagement.
            </p>

            <div class="grid grid-cols-2 gap-2 pt-2 mt-1 border-t border-black/5 font-mono text-[10px]">
                <div class="p-1.5 bg-black/[0.02] flex flex-col">
                    <span class="text-text/40 text-[8px] uppercase">INPUT</span>
                    <span class="font-bold text-text">TOUCH/OPTICAL</span>
                </div>
                <div class="p-1.5 bg-black/[0.02] flex flex-col">
                    <span class="text-text/40 text-[8px] uppercase">RATE</span>
                    <span class="font-bold text-primary">DYNAMIC</span>
                </div>
            </div>
        </div>

        <button
            onclick={startGame}
            class="mt-3 w-full py-2 bg-primary hover:bg-primary/90 text-white font-mono text-[11px] font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
        >
            <span class="material-symbols-outlined text-[14px]">play_arrow</span>
            <span>{isPlaying ? "Restart Game" : "Launch Arcade"}</span>
        </button>
    </div>
</div>
