<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { brand } from "$lib/brand.svelte";
    import { createParticles, updateParticles, type CanvasParticle } from "$lib/three/arcade-engine";

    interface FallingChip {
        id: number;
        x: number;
        y: number;
        vy: number;
        spin: number;
        rotation: number;
        hazard: boolean;
        size: number;
        alive: boolean;
    }

    const START_LIVES = 3;

    let canvasEl = $state<HTMLCanvasElement | null>(null);
    let screenEl = $state<HTMLElement | null>(null);

    let isRunning = $state(false);
    let showOverlay = $state(true);

    let score = $state(0);
    let caughtCount = $state(0);
    let lives = $state(START_LIVES);

    let overlayTitle = $state("Catch & Collect");
    let overlayBody = $state(`Catch every ${brand.name || "product"} that drops. Miss three, or catch a dud, and the round ends.`);
    let overlayCta = $state("Start");

    let basketX = 0;
    let targetBasketX = 0;
    let basketTilt = 0;
    let basketWidth = 85;
    let basketHeight = 65;

    let chips: FallingChip[] = [];
    let particles: CanvasParticle[] = [];

    let animationFrameId: number | null = null;
    let lastTime = 0;
    let elapsed = 0;
    let spawnIn = 0;
    let nextChipId = 0;
    let keys = new Set<string>();

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

    function drawToteBag(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, tilt: number) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(tilt);

        const bodyTop = -h * 0.1;
        const bodyBottom = h * 0.9;
        const topHalf = w * 0.48;
        const bottomHalf = w * 0.4;

        // Straps
        ctx.strokeStyle = "#cdd2dc";
        ctx.lineWidth = w * 0.075;
        ctx.lineCap = "round";
        for (const dir of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(dir * topHalf * 0.6, bodyTop);
            ctx.quadraticCurveTo(dir * topHalf * 0.48, bodyTop - h * 0.55, dir * topHalf * 0.12, bodyTop - h * 0.45);
            ctx.stroke();
        }

        // Tote Body
        ctx.save();
        ctx.shadowColor = "rgba(16,19,26,.24)";
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 8;
        ctx.beginPath();
        ctx.moveTo(-topHalf, bodyTop);
        ctx.lineTo(topHalf, bodyTop);
        ctx.lineTo(bottomHalf, bodyBottom - 6);
        ctx.quadraticCurveTo(bottomHalf, bodyBottom, bottomHalf - 8, bodyBottom);
        ctx.lineTo(-bottomHalf + 8, bodyBottom);
        ctx.quadraticCurveTo(-bottomHalf, bodyBottom, -bottomHalf, bodyBottom - 6);
        ctx.closePath();
        ctx.fillStyle = "#f4f1e8";
        ctx.fill();
        ctx.restore();

        // Hem
        ctx.fillStyle = "rgba(16,19,26,.09)";
        ctx.fillRect(-topHalf, bodyTop, topHalf * 2, 8);

        // Accent Band
        ctx.fillStyle = brand.primaryColor || "#009dd6";
        ctx.fillRect(-bottomHalf + 4, bodyBottom - 18, bottomHalf * 2 - 8, 8);

        // Logo / Name
        if (logoImg) {
            const box = w * 0.48;
            ctx.drawImage(logoImg, -box / 2, bodyTop + 12, box, box * 0.65);
        } else {
            ctx.fillStyle = brand.primaryColor || "#009dd6";
            ctx.font = "800 22px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText((brand.name || "E")[0].toUpperCase(), 0, bodyTop + 22);
        }

        // Mouth Ellipse
        ctx.beginPath();
        ctx.ellipse(0, bodyTop + 4, topHalf * 0.94, 8, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(16,19,26,.32)";
        ctx.fill();

        ctx.restore();
    }

    function spawnChip() {
        if (!canvasEl) return;
        const w = canvasEl.width;
        const hazard = Math.random() < Math.min(0.34, 0.12 + elapsed * 0.006);
        const margin = 35;

        chips.push({
            id: ++nextChipId,
            x: margin + Math.random() * (w - margin * 2),
            y: 40,
            vy: 180 + Math.random() * 90 + elapsed * 6,
            spin: (Math.random() - 0.5) * 3,
            rotation: 0,
            hazard,
            size: hazard ? 16 : 18,
            alive: true,
        });
    }

    function reset() {
        isRunning = true;
        showOverlay = false;
        score = 0;
        caughtCount = 0;
        lives = START_LIVES;
        elapsed = 0;
        spawnIn = 0.4;
        chips = [];
        particles = [];
        if (canvasEl) {
            basketX = canvasEl.width / 2;
            targetBasketX = canvasEl.width / 2;
        }
        lastTime = performance.now();
    }

    function gameOver() {
        isRunning = false;
        showOverlay = true;
        overlayTitle = `${score} points`;
        overlayBody = `You collected ${caughtCount} × ${brand.name || "product"}. Play again, or ask the attendant what they actually do.`;
        overlayCta = "Play again";
        chips = [];
    }

    function drawChip(ctx: CanvasRenderingContext2D, c: FallingChip) {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rotation);

        const r = c.size;

        if (c.hazard) {
            ctx.shadowColor = "rgba(16,19,26,.25)";
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fillStyle = "#1e293b";
            ctx.fill();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = "#f43f5e";
            ctx.stroke();

            ctx.strokeStyle = "#f43f5e";
            ctx.lineWidth = 4;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(-r * 0.4, -r * 0.4);
            ctx.lineTo(r * 0.4, r * 0.4);
            ctx.moveTo(r * 0.4, -r * 0.4);
            ctx.lineTo(-r * 0.4, r * 0.4);
            ctx.stroke();
        } else {
            ctx.shadowColor = "rgba(16,19,26,.2)";
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fillStyle = "#ffffff";
            ctx.fill();
            ctx.lineWidth = 2.5;
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
        if (!canvasEl || !screenEl) return;
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;

        const ctx = canvasEl.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

        if (isRunning) {
            elapsed += dt;

            // Keyboard navigation
            if (keys.size) {
                const dir = (keys.has("ArrowRight") || keys.has("KeyD") ? 1 : 0) - (keys.has("ArrowLeft") || keys.has("KeyA") ? 1 : 0);
                targetBasketX += dir * 450 * dt;
            }

            const limit = basketWidth / 2 + 10;
            targetBasketX = Math.max(limit, Math.min(canvasEl.width - limit, targetBasketX));

            const prevX = basketX;
            basketX += (targetBasketX - basketX) * Math.min(1, dt * 14);
            basketTilt = Math.max(-0.22, Math.min(0.22, (prevX - basketX) * 0.02));

            // Spawning
            spawnIn -= dt;
            if (spawnIn <= 0) {
                spawnChip();
                spawnIn = Math.max(0.32, 1.05 - elapsed * 0.02);
            }

            const basketY = canvasEl.height - basketHeight - 45;

            // Draw Tote Catcher
            drawToteBag(ctx, basketX, basketY + 30, basketWidth, basketHeight, basketTilt);

            // Update & Draw Chips
            for (let i = chips.length - 1; i >= 0; i--) {
                const c = chips[i];
                if (!c.alive) {
                    chips.splice(i, 1);
                    continue;
                }
                c.y += c.vy * dt;
                c.rotation += c.spin * dt;

                const dx = Math.abs(c.x - basketX);
                const dy = c.y - basketY;

                // Catch Collision with Bag Mouth
                if (dy >= -15 && dy <= 30 && dx <= basketWidth * 0.55) {
                    c.alive = false;
                    particles.push(...createParticles(c.x, c.y, c.hazard ? "#f43f5e" : (brand.primaryColor || "#009dd6"), 16));

                    if (c.hazard) {
                        lives--;
                        if (lives <= 0) gameOver();
                    } else {
                        caughtCount++;
                        score += 15;
                    }
                    chips.splice(i, 1);
                    continue;
                }

                // Missed off floor
                if (c.y > canvasEl.height + 20) {
                    c.alive = false;
                    chips.splice(i, 1);
                    if (!c.hazard) {
                        lives--;
                        if (lives <= 0) gameOver();
                    }
                } else {
                    drawChip(ctx, c);
                }
            }
        }

        if (particles.length > 0) {
            updateParticles(particles, dt, ctx);
        }

        animationFrameId = requestAnimationFrame(render);
    }

    function handlePointerMove(clientX: number) {
        if (!screenEl || !canvasEl) return;
        const rect = screenEl.getBoundingClientRect();
        targetBasketX = clientX - rect.left;
    }

    function onMouseMove(e: MouseEvent) {
        if (!isRunning) return;
        handlePointerMove(e.clientX);
    }

    function onTouchMove(e: TouchEvent) {
        if (!isRunning || e.touches.length === 0) return;
        handlePointerMove(e.touches[0].clientX);
    }

    function onKeyDown(e: KeyboardEvent) {
        if (["ArrowLeft", "ArrowRight", "KeyA", "KeyD"].includes(e.code)) {
            keys.add(e.code);
        }
    }

    function onKeyUp(e: KeyboardEvent) {
        keys.delete(e.code);
    }

    function resizeCanvas() {
        if (!canvasEl || !screenEl) return;
        const rect = screenEl.getBoundingClientRect();
        canvasEl.width = rect.width;
        canvasEl.height = rect.height;
        basketWidth = Math.max(75, Math.min(105, rect.width * 0.24));
    }

    onMount(() => {
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);
        lastTime = performance.now();
        animationFrameId = requestAnimationFrame(render);
    });

    onDestroy(() => {
        window.removeEventListener("resize", resizeCanvas);
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
    });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="relative w-full h-full flex flex-col justify-between overflow-hidden bg-slate-950 text-white font-sans select-none cursor-grab active:cursor-grabbing"
    bind:this={screenEl}
    onmousemove={onMouseMove}
    ontouchmove={onTouchMove}
>
    <!-- Canvas Tote Catcher Viewport -->
    <canvas bind:this={canvasEl} class="absolute inset-0 w-full h-full block z-10"></canvas>

    <!-- Phone Top HUD Stats Bar Overlay -->
    <div class="absolute top-11 left-3.5 right-3.5 z-20 flex items-center gap-2 pointer-events-none">
        <div class="flex-1 px-2.5 py-1.5 rounded-xl bg-slate-900/75 backdrop-blur-md border border-white/10 text-white text-center flex flex-col">
            <span class="text-[8px] font-mono font-bold uppercase text-white/50">Score</span>
            <strong class="font-mono text-sm leading-tight" style="color: {brand.primaryColor || '#009dd6'};">{score}</strong>
        </div>
        <div class="flex-1 px-2.5 py-1.5 rounded-xl bg-slate-900/75 backdrop-blur-md border border-white/10 text-white text-center flex flex-col">
            <span class="text-[8px] font-mono font-bold uppercase text-white/50">Caught</span>
            <strong class="font-mono text-sm leading-tight">{caughtCount}</strong>
        </div>
        <div class="flex-1 px-2.5 py-1.5 rounded-xl bg-slate-900/75 backdrop-blur-md border border-white/10 text-white text-center flex flex-col">
            <span class="text-[8px] font-mono font-bold uppercase text-white/50">Lives</span>
            <strong class="font-mono text-sm leading-tight text-rose-400">{"♥".repeat(Math.max(0, lives)) || "—"}</strong>
        </div>
    </div>

    <!-- Phone Prompt Bar at Bottom -->
    {#if isRunning && !showOverlay}
        <div class="absolute bottom-6 left-3.5 right-3.5 z-20 px-3 py-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/10 text-white text-xs font-semibold text-center pointer-events-none">
            Drag to move the bag
        </div>
    {/if}

    <!-- Phone Overlay Modal (Start / Game Over) -->
    {#if showOverlay}
        <div class="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white animate-fadeIn">
            <h4 class="text-2xl font-black uppercase tracking-tight mb-2 text-emerald-400">
                {overlayTitle}
            </h4>
            <p class="text-xs text-white/80 leading-relaxed max-w-[22ch] mb-4">
                {overlayBody}
            </p>
            <button
                onclick={reset}
                class="px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider text-white transition hover:scale-105 cursor-pointer border border-white/20"
                style="background-color: {brand.primaryColor || '#009dd6'};"
            >
                {overlayCta}
            </button>
        </div>
    {/if}
</div>
