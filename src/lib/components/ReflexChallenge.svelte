<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { brand } from "$lib/brand.svelte";
    import { createParticles, updateParticles, type CanvasParticle } from "$lib/three/arcade-engine";

    interface TargetChip {
        id: number;
        x: number;
        y: number;
        size: number;
        life: number;
        maxLife: number;
        hazard: boolean;
        alive: boolean;
        scale: number;
        rotation: number;
    }

    const ROUND_SECONDS = 30;

    let canvasEl = $state<HTMLCanvasElement | null>(null);
    let screenEl = $state<HTMLElement | null>(null);

    let isRunning = $state(false);
    let showOverlay = $state(true);

    let score = $state(0);
    let timeLeft = $state(ROUND_SECONDS);
    let streak = $state(0);
    let bestStreak = $state(0);
    let hitsCount = $state(0);
    let missesCount = $state(0);

    let overlayTitle = $state("Reflex Speed");
    let overlayBody = $state(`Thirty seconds. Tap every ${brand.name || "brand"} product chip and leave the crosses alone.`);
    let overlayCta = $state("Start");

    let targets: TargetChip[] = [];
    let particles: CanvasParticle[] = [];
    let animationFrameId: number | null = null;
    let timerInterval: number | null = null;
    let lastTime = 0;
    let spawnIn = 0;
    let nextChipId = 0;

    let logoImg: HTMLImageElement | null = null;

    $effect(() => {
        if (brand.logo) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => { logoImg = img; };
            img.src = brand.logo;
        } else {
            logoImg = null;
        }
    });

    function reset() {
        isRunning = true;
        showOverlay = false;
        score = 0;
        timeLeft = ROUND_SECONDS;
        streak = 0;
        bestStreak = 0;
        hitsCount = 0;
        missesCount = 0;
        targets = [];
        particles = [];
        spawnIn = 0.3;
        lastTime = performance.now();

        if (timerInterval) clearInterval(timerInterval);
        timerInterval = window.setInterval(() => {
            if (!isRunning) return;
            timeLeft -= 1;
            if (timeLeft <= 0) {
                finish();
            }
        }, 1000);
    }

    function finish() {
        isRunning = false;
        showOverlay = true;
        if (timerInterval) clearInterval(timerInterval);
        const total = hitsCount + missesCount;
        const accuracy = total > 0 ? Math.round((hitsCount / total) * 100) : 0;
        overlayTitle = `${score} points`;
        overlayBody = `${hitsCount} hits · ${accuracy}% accuracy · best streak ${bestStreak}. Beat it at the ${brand.name || "exhibition"} stand.`;
        overlayCta = "Play again";
        targets = [];
    }

    function spawnTarget() {
        if (!canvasEl) return;
        const w = canvasEl.width;
        const h = canvasEl.height;

        const difficulty = 1 - timeLeft / ROUND_SECONDS;
        const hazard = Math.random() < 0.16 + difficulty * 0.16;
        const maxLife = Math.max(0.65, 1.35 - difficulty * 0.62);
        const chipSize = hazard ? 34 : Math.max(34, 48 - difficulty * 12);

        const marginX = chipSize + 20;
        const topMargin = chipSize + 90;
        const bottomMargin = chipSize + 80;

        const x = marginX + Math.random() * (w - marginX * 2);
        const y = topMargin + Math.random() * (h - topMargin - bottomMargin);

        targets.push({
            id: ++nextChipId,
            x,
            y,
            size: chipSize,
            life: maxLife,
            maxLife,
            hazard,
            alive: true,
            scale: 0.01,
            rotation: (Math.random() - 0.5) * 0.4
        });
    }

    function handleCanvasClick(e: MouseEvent | TouchEvent) {
        if (!isRunning || !canvasEl) return;
        const rect = canvasEl.getBoundingClientRect();
        const clientX = (e as MouseEvent).clientX ?? (e as TouchEvent).touches?.[0]?.clientX ?? 0;
        const clientY = (e as MouseEvent).clientY ?? (e as TouchEvent).touches?.[0]?.clientY ?? 0;
        const clickX = clientX - rect.left;
        const clickY = clientY - rect.top;

        let claimed: TargetChip | null = null;
        for (let i = targets.length - 1; i >= 0; i--) {
            const t = targets[i];
            if (!t.alive) continue;
            const r = (t.size * t.scale) / 1.6;
            const dx = clickX - t.x;
            const dy = clickY - t.y;
            if (dx * dx + dy * dy <= r * r + 100) {
                claimed = t;
                break;
            }
        }

        if (!claimed) {
            streak = 0;
            missesCount++;
            return;
        }

        claimed.alive = false;
        particles.push(...createParticles(claimed.x, claimed.y, claimed.hazard ? "#f43f5e" : (brand.primaryColor || "#009dd6"), 14));

        if (claimed.hazard) {
            streak = 0;
            timeLeft = Math.max(0, timeLeft - 2);
            missesCount++;
        } else {
            hitsCount++;
            streak++;
            bestStreak = Math.max(bestStreak, streak);
            score += 10 + Math.min(20, streak * 2);
        }
    }

    function drawChip(ctx: CanvasRenderingContext2D, t: TargetChip) {
        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.scale(t.scale, t.scale);
        ctx.rotate(t.rotation);

        const r = t.size;

        if (t.hazard) {
            ctx.shadowColor = "rgba(16,19,26,.3)";
            ctx.shadowBlur = 12;
            ctx.shadowOffsetY = 4;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fillStyle = "#1e293b";
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = "#f43f5e";
            ctx.stroke();

            ctx.strokeStyle = "#f43f5e";
            ctx.lineWidth = 5;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(-r * 0.4, -r * 0.4);
            ctx.lineTo(r * 0.4, r * 0.4);
            ctx.moveTo(r * 0.4, -r * 0.4);
            ctx.lineTo(-r * 0.4, r * 0.4);
            ctx.stroke();
        } else {
            ctx.shadowColor = "rgba(16,19,26,.22)";
            ctx.shadowBlur = 14;
            ctx.shadowOffsetY = 6;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fillStyle = "#ffffff";
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = brand.primaryColor || "#009dd6";
            ctx.stroke();

            if (logoImg) {
                const box = r * 1.3;
                ctx.drawImage(logoImg, -box / 2, -box / 2, box, box);
            } else {
                ctx.fillStyle = brand.primaryColor || "#009dd6";
                ctx.font = `800 ${Math.round(r * 0.8)}px sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText((brand.name || "E")[0].toUpperCase(), 0, 1);
            }
        }

        ctx.restore();
    }

    function render(now: number) {
        if (!canvasEl) return;
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;

        const ctx = canvasEl.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

        if (isRunning) {
            spawnIn -= dt;
            const difficulty = 1 - timeLeft / ROUND_SECONDS;
            if (spawnIn <= 0) {
                spawnTarget();
                spawnIn = Math.max(0.22, 0.72 - difficulty * 0.42);
            }

            for (let i = targets.length - 1; i >= 0; i--) {
                const t = targets[i];
                if (!t.alive) {
                    targets.splice(i, 1);
                    continue;
                }
                t.life -= dt;
                const p = t.life / t.maxLife;
                if (p <= 0) {
                    t.alive = false;
                    targets.splice(i, 1);
                    if (!t.hazard) {
                        streak = 0;
                        missesCount++;
                    }
                    continue;
                }

                const grow = Math.min(1, (1 - p) * 6);
                const shrink = p < 0.25 ? p / 0.25 : 1;
                t.scale = grow * shrink;

                drawChip(ctx, t);
            }
        }

        if (particles.length > 0) {
            updateParticles(particles, dt, ctx);
        }

        animationFrameId = requestAnimationFrame(render);
    }

    function resizeCanvas() {
        if (!canvasEl || !screenEl) return;
        const rect = screenEl.getBoundingClientRect();
        canvasEl.width = rect.width;
        canvasEl.height = rect.height;
    }

    onMount(() => {
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);
        lastTime = performance.now();
        animationFrameId = requestAnimationFrame(render);
    });

    onDestroy(() => {
        window.removeEventListener("resize", resizeCanvas);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        if (timerInterval) clearInterval(timerInterval);
    });
</script>

<div class="relative w-full h-full flex flex-col justify-between overflow-hidden bg-slate-950 text-white font-sans select-none" bind:this={screenEl}>
    <!-- Canvas Targets Viewport -->
    <canvas
        bind:this={canvasEl}
        class="absolute inset-0 w-full h-full cursor-pointer z-10"
        onclick={handleCanvasClick}
    ></canvas>

    <!-- Phone Top HUD Stats Bar Overlay -->
    <div class="absolute top-11 left-3.5 right-12 z-20 flex items-center gap-1.5 pointer-events-none">
        <div class="flex-1 px-2 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white text-center flex items-center justify-between">
            <span class="text-[9px] text-white/70 font-medium">Score</span>
            <strong class="text-xs font-bold" style="color: {brand.primaryColor || '#009dd6'};">{score}</strong>
        </div>
        <div class="flex-1 px-2 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white text-center flex items-center justify-between">
            <span class="text-[9px] text-white/70 font-medium">Time</span>
            <strong class="text-xs font-bold">{timeLeft}s</strong>
        </div>
    </div>

    <!-- Phone Prompt Bar at Bottom -->
    {#if isRunning && !showOverlay}
        <div class="absolute bottom-6 left-3.5 right-3.5 z-20 px-3.5 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-white text-xs font-medium text-center pointer-events-none">
            Tap product — avoid crosses
        </div>
    {/if}

    <!-- Phone Overlay Modal (Start / Win Result) -->
    {#if showOverlay}
        <div class="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white">
            <h4 class="text-2xl font-bold tracking-tight mb-2 text-emerald-400">
                {overlayTitle}
            </h4>
            <p class="text-xs text-white/80 leading-relaxed max-w-[22ch] mb-4">
                {overlayBody}
            </p>
            <button
                onclick={reset}
                class="px-6 py-2.5 rounded-full font-semibold text-xs text-white transition hover:scale-105 cursor-pointer border border-white/20"
                style="background-color: {brand.primaryColor || '#009dd6'};"
            >
                {overlayCta}
            </button>
        </div>
    {/if}
</div>
