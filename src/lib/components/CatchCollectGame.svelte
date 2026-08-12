<script lang="ts">
    import { onMount, onDestroy } from "svelte";

    interface FallingItem {
        id: number;
        x: number;
        y: number;
        speed: number;
        type: "diamond" | "star" | "token" | "hazard";
        points: number;
        size: number;
        rotation: number;
        rotSpeed: number;
    }

    interface FloatingScore {
        id: number;
        x: number;
        y: number;
        text: string;
        color: string;
        alpha: number;
        vy: number;
    }

    interface Particle {
        x: number;
        y: number;
        pad?: number;
        vx: number;
        vy: number;
        color: string;
        alpha: number;
        size: number;
    }

    let isPlaying = $state(false);
    let isGameOver = $state(false);
    let score = $state(0);
    let highScore = $state(0);
    let timeLeft = $state(20);

    let brandLogoData = $state<string | null>(null);
    let brandName = $state<string | null>(null);
    let brandLogoImg: HTMLImageElement | null = null;
    let brandLogoLoaded = false;

    const STORAGE_KEY = "ekson_brand_profile";

    function loadBrandProfile() {
        try {
            const saved = sessionStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                brandLogoData = parsed.brandLogo || null;
                brandName = parsed.companyName || null;

                if (brandLogoData) {
                    const img = new Image();
                    img.onload = () => {
                        brandLogoImg = img;
                        brandLogoLoaded = true;
                    };
                    img.src = brandLogoData;
                    return;
                }
            }
            brandLogoData = null;
            brandName = null;
            brandLogoImg = null;
            brandLogoLoaded = false;
        } catch (e) {
            brandLogoData = null;
            brandName = null;
            brandLogoImg = null;
            brandLogoLoaded = false;
        }
    }

    let canvasEl: HTMLCanvasElement | null = null;
    let containerEl: HTMLElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;

    let basketX = 0;
    let targetBasketX = 0;
    let basketWidth = 90;
    const basketHeight = 10;
    let basketGlowTimer = 0;

    let items: FallingItem[] = [];
    let popups: FloatingScore[] = [];
    let particles: Particle[] = [];

    let gameLoopId: number | null = null;
    let timerInterval: number | null = null;
    let lastTime = 0;
    let spawnTimer = 0;
    let nextItemId = 0;
    let nextPopupId = 0;

    let canvasWidth = 400;
    let canvasHeight = 360;
    let dpr = 1;

    const ITEM_CONFIGS = [
        { type: "diamond" as const, points: 150, weight: 3, speedMin: 180, speedMax: 260 },
        { type: "star" as const, points: 100, weight: 4, speedMin: 160, speedMax: 230 },
        { type: "token" as const, points: 250, weight: 2, speedMin: 200, speedMax: 300 },
        { type: "hazard" as const, points: -100, weight: 2.5, speedMin: 170, speedMax: 250 },
    ];

    function resizeCanvas() {
        if (!containerEl || !canvasEl) return;
        const rect = containerEl.getBoundingClientRect();
        canvasWidth = rect.width;
        canvasHeight = rect.height;
        dpr = Math.min(window.devicePixelRatio || 1, 2);

        canvasEl.width = canvasWidth * dpr;
        canvasEl.height = canvasHeight * dpr;
        canvasEl.style.width = `${canvasWidth}px`;
        canvasEl.style.height = `${canvasHeight}px`;

        basketWidth = Math.max(70, Math.min(110, canvasWidth * 0.22));

        if (ctx) {
            ctx.scale(dpr, dpr);
        }
    }

    function spawnItem() {
        const totalWeight = ITEM_CONFIGS.reduce((acc, cur) => acc + cur.weight, 0);
        let random = Math.random() * totalWeight;
        let selected = ITEM_CONFIGS[0];
        for (const item of ITEM_CONFIGS) {
            if (random < item.weight) {
                selected = item;
                break;
            }
            random -= item.weight;
        }

        const margin = 30;
        const x = Math.random() * (canvasWidth - margin * 2) + margin;
        const speed = Math.random() * (selected.speedMax - selected.speedMin) + selected.speedMin;

        items.push({
            id: ++nextItemId,
            x,
            y: -20,
            speed,
            type: selected.type,
            points: selected.points,
            size: selected.type === "hazard" ? 14 : 12,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 4,
        });
    }

    function addPopup(x: number, y: number, text: string, color: string) {
        popups.push({
            id: ++nextPopupId,
            x,
            y,
            text,
            color,
            alpha: 1.0,
            vy: -40,
        });
    }

    function createExplosion(x: number, y: number, color: string, count = 8) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 80 + 30;
            particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color,
                alpha: 1.0,
                size: Math.random() * 3 + 2,
            });
        }
    }

    function triggerCatch(item: FallingItem, catchY: number) {
        score = Math.max(0, score + item.points);
        const isHazard = item.type === "hazard";
        const color = isHazard ? "#e11d48" : "#059669";
        const popupText = item.points > 0 ? `+${item.points}` : `${item.points}`;

        addPopup(item.x, catchY - 15, popupText, color);
        createExplosion(item.x, catchY, isHazard ? "#f43f5e" : "#009dd6", isHazard ? 12 : 8);
        basketGlowTimer = 0.2;
    }

    function startGame() {
        isPlaying = true;
        isGameOver = false;
        score = 0;
        timeLeft = 20;
        items = [];
        popups = [];
        particles = [];
        spawnTimer = 0;
        basketX = canvasWidth / 2;
        targetBasketX = canvasWidth / 2;
        lastTime = performance.now();

        if (timerInterval) clearInterval(timerInterval);
        timerInterval = window.setInterval(() => {
            if (!isPlaying) return;
            timeLeft -= 1;
            if (timeLeft <= 0) {
                endGame();
            }
        }, 1000);
    }

    function endGame() {
        isPlaying = false;
        isGameOver = true;
        if (timerInterval) clearInterval(timerInterval);
        if (score > highScore) {
            highScore = score;
        }
    }

    function handlePointerMove(clientX: number) {
        if (!containerEl) return;
        const rect = containerEl.getBoundingClientRect();
        const relativeX = clientX - rect.left;
        targetBasketX = Math.max(basketWidth / 2, Math.min(canvasWidth - basketWidth / 2, relativeX));
    }

    function onMouseMove(e: MouseEvent) {
        if (!isPlaying) return;
        handlePointerMove(e.clientX);
    }

    function onTouchMove(e: TouchEvent) {
        if (!isPlaying || e.touches.length === 0) return;
        handlePointerMove(e.touches[0].clientX);
    }

    function drawDiamond(c: CanvasRenderingContext2D, x: number, y: number, size: number) {
        c.save();
        c.translate(x, y);
        c.fillStyle = "#009dd6";
        c.strokeStyle = "#ffffff";
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(0, -size);
        c.lineTo(size, 0);
        c.lineTo(0, size);
        c.lineTo(-size, 0);
        c.closePath();
        c.fill();
        c.stroke();

        c.fillStyle = "rgba(255, 255, 255, 0.4)";
        c.beginPath();
        c.moveTo(0, -size);
        c.lineTo(size * 0.5, 0);
        c.lineTo(0, size * 0.5);
        c.lineTo(-size * 0.5, 0);
        c.closePath();
        c.fill();
        c.restore();
    }

    function drawStar(c: CanvasRenderingContext2D, x: number, y: number, size: number, rot: number) {
        c.save();
        c.translate(x, y);
        c.rotate(rot);
        c.fillStyle = "#f59e0b";
        c.strokeStyle = "#ffffff";
        c.lineWidth = 1.2;
        c.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
            const innerAngle = angle + Math.PI / 5;
            const rOuter = size;
            const rInner = size * 0.45;
            if (i === 0) {
                c.moveTo(Math.cos(angle) * rOuter, Math.sin(angle) * rOuter);
            } else {
                c.lineTo(Math.cos(angle) * rOuter, Math.sin(angle) * rOuter);
            }
            c.lineTo(Math.cos(innerAngle) * rInner, Math.sin(innerAngle) * rInner);
        }
        c.closePath();
        c.fill();
        c.stroke();
        c.restore();
    }

    function drawToken(c: CanvasRenderingContext2D, x: number, y: number, size: number) {
        c.save();
        c.translate(x, y);
        c.fillStyle = "#10b981";
        c.strokeStyle = "#ffffff";
        c.lineWidth = 1.5;
        c.beginPath();
        c.arc(0, 0, size, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        c.fillStyle = "rgba(255, 255, 255, 0.9)";
        c.font = `bold ${Math.round(size * 1.1)}px monospace`;
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText("E", 0, 1);
        c.restore();
    }

    function drawBrandCollectable(
        c: CanvasRenderingContext2D,
        x: number,
        y: number,
        size: number,
        rot: number,
        type: "diamond" | "star" | "token"
    ) {
        if (!brandLogoImg || !brandLogoLoaded) {
            if (type === "diamond") {
                drawDiamond(c, x, y, size);
            } else if (type === "star") {
                drawStar(c, x, y, size, rot);
            } else {
                drawToken(c, x, y, size);
            }
            return;
        }

        c.save();
        c.translate(x, y);
        c.rotate(rot * 0.4); // Controlled rotation so brand logo is clearly visible

        let ringColor = "#009dd6";
        let badgeRadius = size * 1.35;
        let ringWidth = 2;

        if (type === "star") {
            ringColor = "#f59e0b";
            badgeRadius = size * 1.3;
        } else if (type === "token") {
            ringColor = "#10b981";
            badgeRadius = size * 1.45;
            ringWidth = 2.5;
        }

        // Circular background with subtle shadow
        c.fillStyle = "#ffffff";
        c.beginPath();
        c.arc(0, 0, badgeRadius, 0, Math.PI * 2);
        c.fill();

        // Outer Tier Border
        c.strokeStyle = ringColor;
        c.lineWidth = ringWidth;
        c.stroke();

        // Clip and draw brand logo centered
        c.save();
        c.beginPath();
        c.arc(0, 0, badgeRadius - 1.5, 0, Math.PI * 2);
        c.clip();

        const imgSize = (badgeRadius - 2) * 2;
        c.drawImage(brandLogoImg, -imgSize / 2, -imgSize / 2, imgSize, imgSize);
        c.restore();

        // Top Glass Accent
        c.beginPath();
        c.arc(0, 0, badgeRadius - 1, Math.PI * 1.2, Math.PI * 1.8);
        c.strokeStyle = "rgba(255, 255, 255, 0.85)";
        c.lineWidth = 1.2;
        c.stroke();

        c.restore();
    }

    function drawHazard(c: CanvasRenderingContext2D, x: number, y: number, size: number, rot: number) {
        c.save();
        c.translate(x, y);
        c.rotate(rot);
        c.fillStyle = "#ef4444";
        c.strokeStyle = "#ffffff";
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(0, -size * 1.1);
        c.lineTo(size, size * 0.9);
        c.lineTo(-size, size * 0.9);
        c.closePath();
        c.fill();
        c.stroke();

        c.fillStyle = "#ffffff";
        c.font = `bold ${Math.round(size * 0.9)}px sans-serif`;
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText("!", 0, 2);
        c.restore();
    }

    function renderLoop(now: number) {
        if (!ctx) return;

        // Frame-rate independent delta time (clamped to prevent huge jumps on tab switch)
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;

        // Clear canvas
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Draw subtle background grid
        ctx.strokeStyle = "rgba(0, 0, 0, 0.03)";
        ctx.lineWidth = 1;
        const gridSize = 30;
        for (let x = 0; x < canvasWidth; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvasHeight);
            ctx.stroke();
        }
        for (let y = 0; y < canvasHeight; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvasWidth, y);
            ctx.stroke();
        }

        if (isPlaying) {
            // Smoothly interpolate basket position toward mouse/touch target
            basketX += (targetBasketX - basketX) * Math.min(1.0, dt * 25);

            // Time-based spawning (Independent of display refresh rate)
            spawnTimer += dt;
            const spawnInterval = 0.42; // spawn every 420ms
            if (spawnTimer >= spawnInterval) {
                spawnItem();
                spawnTimer = 0;
            }

            // Basket vertical coordinates
            const basketY = canvasHeight - 28;
            const basketHalf = basketWidth / 2;

            // Update & draw falling items
            items = items.filter((item) => {
                item.y += item.speed * dt;
                item.rotation += item.rotSpeed * dt;

                // Collision detection with catcher bar
                if (item.y >= basketY - 14 && item.y <= basketY + basketHeight + 4) {
                    if (Math.abs(item.x - basketX) <= basketHalf + item.size * 0.8) {
                        triggerCatch(item, basketY);
                        return false;
                    }
                }

                // Render item: Diamond, Star, Token use Brand Logo, Hazard uses Red Triangle
                if (item.type === "diamond") {
                    drawBrandCollectable(ctx!, item.x, item.y, item.size, item.rotation, "diamond");
                } else if (item.type === "star") {
                    drawBrandCollectable(ctx!, item.x, item.y, item.size, item.rotation, "star");
                } else if (item.type === "token") {
                    drawBrandCollectable(ctx!, item.x, item.y, item.size, item.rotation, "token");
                } else {
                    drawHazard(ctx!, item.x, item.y, item.size, item.rotation);
                }

                return item.y < canvasHeight + 30;
            });

            // Update & draw particles
            particles = particles.filter((p) => {
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.alpha -= dt * 2.2;

                if (p.alpha <= 0) return false;

                ctx!.save();
                ctx!.globalAlpha = p.alpha;
                ctx!.fillStyle = p.color;
                ctx!.beginPath();
                ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx!.fill();
                ctx!.restore();

                return true;
            });

            // Update & draw floating score popups
            popups = popups.filter((pop) => {
                pop.y += pop.vy * dt;
                pop.alpha -= dt * 1.6;

                if (pop.alpha <= 0) return false;

                ctx!.save();
                ctx!.globalAlpha = pop.alpha;
                ctx!.fillStyle = pop.color;
                ctx!.font = "bold 13px monospace";
                ctx!.textAlign = "center";
                ctx!.fillText(pop.text, pop.x, pop.y);
                ctx!.restore();

                return true;
            });

            // Draw laser catcher bar with glow effect
            if (basketGlowTimer > 0) {
                basketGlowTimer -= dt;
            }

            ctx.save();
            const barX = basketX - basketHalf;
            const glow = basketGlowTimer > 0;

            if (glow) {
                ctx.shadowColor = "#009dd6";
                ctx.shadowBlur = 15;
            }

            const gradient = ctx.createLinearGradient(barX, 0, barX + basketWidth, 0);
            gradient.addColorStop(0, "#009dd6");
            gradient.addColorStop(0.5, "#38bdf8");
            gradient.addColorStop(1, "#009dd6");

            ctx.fillStyle = gradient;
            ctx.fillRect(barX, basketY, basketWidth, basketHeight);

            // Top highlight line
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(barX + 4, basketY, basketWidth - 8, 2);
            ctx.restore();
        }

        gameLoopId = requestAnimationFrame(renderLoop);
    }

    onMount(() => {
        loadBrandProfile();
        const onBrandUpdated = () => loadBrandProfile();
        window.addEventListener("ekson_brand_updated", onBrandUpdated);

        if (canvasEl) {
            ctx = canvasEl.getContext("2d");
            resizeCanvas();
            window.addEventListener("resize", resizeCanvas);
            lastTime = performance.now();
            gameLoopId = requestAnimationFrame(renderLoop);
        }

        return () => {
            window.removeEventListener("ekson_brand_updated", onBrandUpdated);
            window.removeEventListener("resize", resizeCanvas);
            if (gameLoopId) cancelAnimationFrame(gameLoopId);
            if (timerInterval) clearInterval(timerInterval);
        };
    });

    onDestroy(() => {
        if (gameLoopId) cancelAnimationFrame(gameLoopId);
        if (timerInterval) clearInterval(timerInterval);
    });
</script>

<div class="w-full h-full flex flex-col md:flex-row items-center justify-between p-2 sm:p-4 md:p-6 gap-3 md:gap-6 select-none font-sans overflow-hidden">
    <!-- BIG INTERACTIVE MAIN STAGE (HIGH-REFRESH CANVAS ENGINE) -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        bind:this={containerEl}
        onmousemove={onMouseMove}
        ontouchmove={onTouchMove}
        class="flex-1 w-full h-full relative bg-slate-100/90 rounded-2xl overflow-hidden flex flex-col justify-between p-2.5 sm:p-3.5 border border-black/5 font-mono cursor-crosshair shadow-xs"
    >
        <!-- Top HUD -->
        <div class="flex items-center justify-between z-20 text-xs font-bold pointer-events-none">
            <div class="flex items-center gap-1.5 px-3 py-1 bg-white text-text shadow-xs border border-black/5 rounded-full">
                <span class="text-primary font-mono font-bold text-[10px] sm:text-xs">SCORE:</span>
                <span class="text-xs sm:text-sm font-black font-mono">{score.toString().padStart(4, "0")}</span>
            </div>

            <div class="flex items-center gap-1 px-3 py-1 rounded-full {timeLeft <= 5 ? 'bg-rose-600 text-white animate-pulse' : 'bg-white text-text border border-black/5 shadow-xs'} text-[10px] sm:text-xs">
                <span class="material-symbols-rounded text-[14px] {timeLeft <= 5 ? 'text-white' : 'text-primary'}">timer</span>
                <span>{timeLeft}S</span>
            </div>
        </div>

        <!-- HTML5 2D Fast Arcade Canvas -->
        <canvas
            bind:this={canvasEl}
            class="absolute inset-0 w-full h-full pointer-events-none"
        ></canvas>

        <!-- Overlay: Start Screen -->
        {#if !isPlaying && !isGameOver}
            <div class="absolute inset-0 z-30 bg-white/92 backdrop-blur-xs flex flex-col items-center justify-center gap-2 sm:gap-2.5 p-4 text-center rounded-2xl">
                {#if brandLogoData}
                    <div class="size-10 sm:size-12 rounded-full bg-white border border-primary/30 p-1 flex items-center justify-center shadow-xs">
                        <img src={brandLogoData} alt="Brand Logo" class="w-full h-full object-contain" />
                    </div>
                {:else}
                    <span class="material-symbols-rounded text-[36px] sm:text-[40px] text-primary">
                        token
                    </span>
                {/if}
                <h4 class="text-base sm:text-lg font-black text-text uppercase tracking-wider">
                    {brandName ? `${brandName} Catch & Collect` : "Catch & Collect"}
                </h4>
                <p class="text-[10px] sm:text-xs text-text/60 max-w-xs leading-tight">
                    {brandLogoData ? `INTERCEPT FALLING ${brandName ? brandName.toUpperCase() : 'BRAND'} LOGO TOKENS. EVADE HAZARDS.` : "INTERCEPT FALLING TOKENS & GEMS. EVADE HAZARDS."}
                </p>
                <div class="flex items-center gap-3 my-1 text-[9px] font-mono text-text/70">
                    <span class="text-primary font-bold">◆ DIAMOND (+150)</span>
                    <span class="text-emerald-600 font-bold">● TOKEN (+250)</span>
                    <span class="text-rose-600 font-bold">▲ HAZARD (-100)</span>
                </div>
                <button
                    onclick={startGame}
                    class="mt-1 px-6 py-2 bg-primary text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-full hover:bg-primary/90 transition shadow-md shadow-primary/25 cursor-pointer"
                >
                    Start Game (20s)
                </button>
            </div>
        {:else if isGameOver}
            <!-- Overlay: Game Over Screen -->
            <div class="absolute inset-0 z-30 bg-white/92 backdrop-blur-xs flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-4 text-center rounded-2xl">
                <span class="material-symbols-rounded text-[28px] sm:text-[32px] text-emerald-600">
                    verified
                </span>
                <h4 class="text-[10px] uppercase tracking-widest text-text/60 font-bold">Session Complete</h4>
                <div class="text-2xl sm:text-3xl font-black text-primary my-0.5">{score} <span class="text-xs font-normal text-text/40">PTS</span></div>
                {#if highScore > 0}
                    <span class="text-[10px] sm:text-xs text-text/60">BEST: <b class="text-secondary">{highScore} PTS</b></span>
                {/if}
                <button
                    onclick={startGame}
                    class="mt-2 px-6 py-2 bg-primary text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-full hover:bg-primary/90 transition cursor-pointer shadow-md"
                >
                    Play Again
                </button>
            </div>
        {/if}

        <div class="z-20 text-left pointer-events-none">
            <span class="text-[8px] sm:text-[9px] text-text/40 tracking-widest uppercase">TOUCH / MOVE CURSOR TO STEER CATCHER</span>
        </div>
    </div>

    <!-- DESKTOP DESCRIPTION WINDOW (HIDDEN ON MOBILE) -->
    <div class="hidden md:flex w-68 shrink-0 bg-white p-4 shadow-xs border border-black/5 rounded-2xl flex-col justify-between h-full font-sans">
        <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between font-mono text-[9px] text-text/50 uppercase tracking-widest">
                <div class="flex items-center gap-1">
                    <span class="size-1.5 bg-primary"></span>
                    <span>MODULE // 04</span>
                </div>
                <span class="text-primary font-bold">120+ FPS ENGINE</span>
            </div>

            <h3 class="text-base font-extrabold uppercase tracking-tight text-text flex items-center justify-between">
                <span>Catch & Collect</span>
                <span class="material-symbols-rounded text-[18px] text-primary">token</span>
            </h3>

            <p class="text-xs text-text/70 leading-relaxed">
                Hardware-accelerated kinetic arcade engine with delta-time physics for high-refresh touch kiosks and displays.
            </p>

            <div class="grid grid-cols-2 gap-2 pt-2 mt-1 border-t border-black/5 font-mono text-[10px]">
                <div class="p-1.5 bg-black/[0.02] rounded-lg flex flex-col">
                    <span class="text-text/40 text-[8px] uppercase">RENDER</span>
                    <span class="font-bold text-text">2D CANVAS</span>
                </div>
                <div class="p-1.5 bg-black/[0.02] rounded-lg flex flex-col">
                    <span class="text-text/40 text-[8px] uppercase">TIMING</span>
                    <span class="font-bold text-primary">DELTA-TIME</span>
                </div>
            </div>
        </div>

        <button
            onclick={startGame}
            class="mt-3 w-full py-2 bg-primary hover:bg-primary/90 text-white font-mono text-[11px] font-bold uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
        >
            <span class="material-symbols-rounded text-[14px]">play_arrow</span>
            <span>{isPlaying ? "Restart Game" : "Launch Arcade"}</span>
        </button>
    </div>
</div>
