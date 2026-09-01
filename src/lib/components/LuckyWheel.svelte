<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { brand } from "$lib/brand.svelte";
    import { fitFont, hexA, createParticles, updateParticles, type CanvasParticle } from "$lib/three/arcade-engine";

    interface Prize {
        label: string;
        win: boolean;
        bg: string;
        textColor: string;
    }

    const SEGMENTS = 8;

    const prizes = $derived<Prize[]>([
        { label: `Free ${brand.name || "Product"} Demo`, win: true, bg: brand.primaryColor, textColor: "#ffffff" },
        { label: "10% Off Pass", win: true, bg: "#ffffff", textColor: brand.darkColor },
        { label: "Branded Swag", win: true, bg: brand.lightTint, textColor: "#010104" },
        { label: "Try Again", win: false, bg: brand.darkColor, textColor: "#ffffff" },
        { label: "Free Trial", win: true, bg: "#f0fdf4", textColor: "#166534" },
        { label: "100 Tokens", win: true, bg: brand.lightTint, textColor: brand.primaryColor },
        { label: "VIP Pass", win: true, bg: "#ffffff", textColor: "#010104" },
        { label: "Try Again", win: false, bg: brand.lightTint, textColor: "#010104" },
    ]);

    let canvasEl = $state<HTMLCanvasElement | null>(null);
    let screenEl = $state<HTMLElement | null>(null);

    let angle = $state(0);
    let velocity = $state(0);
    let isSpinning = $state(false);
    let selectedPrize = $state<string | null>(null);
    let pointerFlick = $state(0);
    let spinsCount = $state(0);
    let winsCount = $state(0);

    let promptText = $state("Tap spin to try your luck");
    let showOverlay = $state(false);
    let lastResult = $state<{ title: string; body: string; win: boolean } | null>(null);

    let animationFrameId: number | null = null;
    let lastTime = 0;
    let particles: CanvasParticle[] = [];

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

    function spin() {
        if (isSpinning) return;
        isSpinning = true;
        showOverlay = false;
        selectedPrize = null;
        spinsCount++;
        velocity = 16 + Math.random() * 9;
        promptText = "Good luck…";
    }

    function land() {
        isSpinning = false;
        velocity = 0;

        const norm = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const index = Math.floor((norm + Math.PI / SEGMENTS) / ((Math.PI * 2) / SEGMENTS)) % SEGMENTS;
        const prize = prizes[index];
        selectedPrize = prize.label;

        if (prize.win) winsCount++;

        if (canvasEl) {
            const topPadding = 44;
            const bottomPadding = 64;
            const availH = Math.max(100, canvasEl.height - topPadding - bottomPadding);
            const cy = topPadding + availH / 2;
            particles = createParticles(canvasEl.width / 2, cy, brand.primaryColor || "#4abbff", 24);
        }

        promptText = "";
        lastResult = {
            title: prize.win ? prize.label : "So close",
            body: prize.win ? `Claim it at the ${brand.name || "exhibition"} stand.` : "Nothing that time — give the wheel another go.",
            win: prize.win
        };
        showOverlay = true;
    }

    function render(now: number) {
        if (!canvasEl) return;
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;

        const ctx = canvasEl.getContext("2d");
        if (!ctx) return;

        const w = canvasEl.width;
        const h = canvasEl.height;
        const topPadding = 44;
        const bottomPadding = 64;
        const availH = Math.max(100, h - topPadding - bottomPadding);
        const cx = w / 2;
        const cy = topPadding + availH / 2;
        const radius = Math.max(40, Math.min((w - 32) / 2, availH / 2) * 0.88);

        ctx.clearRect(0, 0, w, h);

        // Update physics spin
        if (isSpinning) {
            angle -= velocity * dt;
            velocity *= Math.pow(0.36, dt);
            if (velocity < 0.22) land();
        } else if (spinsCount === 0) {
            angle -= dt * 0.12;
        }

        // Pointer flicking
        const pegPhase = (angle * SEGMENTS) / (Math.PI * 2);
        pointerFlick = Math.sin(pegPhase * Math.PI * 2) * Math.min(12, Math.abs(velocity) * 1.5);

        // Draw Wheel Face
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);

        // Outer Rim Shadow
        ctx.save();
        ctx.shadowColor = "rgba(16,19,26,.28)";
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 12;
        ctx.beginPath();
        ctx.arc(0, 0, radius + 14, 0, Math.PI * 2);
        ctx.fillStyle = "#1e293b";
        ctx.fill();
        ctx.restore();

        // Slices
        const step = (Math.PI * 2) / SEGMENTS;
        for (let i = 0; i < SEGMENTS; i++) {
            const a0 = i * step - Math.PI / 2;
            const a1 = a0 + step;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius, a0, a1);
            ctx.closePath();
            ctx.fillStyle = prizes[i].bg;
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "rgba(255,255,255,.6)";
            ctx.stroke();

            // Label
            ctx.save();
            ctx.rotate(a0 + step / 2);
            ctx.textAlign = "right";
            ctx.textBaseline = "middle";
            ctx.fillStyle = prizes[i].textColor;
            const px = fitFont(ctx, prizes[i].label, radius * 0.58, 20, 700, "monospace");
            ctx.font = `800 ${px}px monospace`;
            ctx.fillText(prizes[i].label, radius * 0.88, 0);
            ctx.restore();
        }

        // Outer Studs
        for (let i = 0; i < SEGMENTS; i++) {
            const a = i * step - Math.PI / 2;
            const px = Math.cos(a) * (radius + 4);
            const py = Math.sin(a) * (radius + 4);
            ctx.beginPath();
            ctx.arc(px, py, 6, 0, Math.PI * 2);
            ctx.fillStyle = "#ffffff";
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "#94a3b8";
            ctx.stroke();
        }

        ctx.restore();

        // Draw Pointer Needle at top edge of wheel
        ctx.save();
        ctx.translate(cx, cy - radius + 2);
        ctx.rotate((pointerFlick * Math.PI) / 180);
        ctx.shadowColor = "rgba(0,0,0,0.4)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 3;
        ctx.beginPath();
        ctx.moveTo(-10, -18);
        ctx.lineTo(10, -18);
        ctx.lineTo(0, 8);
        ctx.closePath();
        ctx.fillStyle = "#f43f5e";
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();
        ctx.restore();

        // Particles
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
    });
</script>

<div class="relative w-full h-full flex flex-col justify-between overflow-hidden bg-slate-950 text-white font-sans select-none" bind:this={screenEl}>
    <!-- Canvas Wheel Stage -->
    <canvas bind:this={canvasEl} class="absolute inset-0 w-full h-full block cursor-pointer z-0" onclick={spin}></canvas>

    <!-- Phone Top HUD Stats Bar Overlay -->
    <div class="absolute top-2.5 left-3 right-11 z-20 flex items-center gap-1.5 pointer-events-none">
        <div class="flex-1 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white text-center flex items-center justify-between">
            <span class="text-[10px] text-white/70 font-medium">Spins</span>
            <strong class="text-xs font-bold">{spinsCount}</strong>
        </div>
        <div class="flex-1 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white text-center flex items-center justify-between">
            <span class="text-[10px] text-white/70 font-medium">Prizes</span>
            <strong class="text-xs font-bold text-emerald-400">{winsCount}</strong>
        </div>
    </div>

    <!-- Phone Prompt Bar at Bottom -->
    {#if promptText && !showOverlay}
        <div class="absolute bottom-13 left-3 right-3 z-20 px-3.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-white text-[11px] font-medium text-center pointer-events-none truncate">
            {promptText}
        </div>
    {/if}

    <!-- Phone Action Spin Button -->
    {#if !isSpinning && !showOverlay}
        <button
            onclick={spin}
            class="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-30 px-7 py-2 rounded-full font-semibold text-xs text-white bg-primary shadow-xl transition hover:scale-105 active:scale-95 cursor-pointer border border-white/20"
        >
            Spin
        </button>
    {/if}

    <!-- Phone Overlay Modal (Win / Loss Result) -->
    {#if showOverlay && lastResult}
        <div class="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white">
            <h4 class="text-2xl font-bold tracking-tight mb-2 {lastResult.win ? 'text-emerald-400' : 'text-white'}">
                {lastResult.title}
            </h4>
            <p class="text-xs text-white/80 leading-relaxed max-w-[22ch] mb-4">
                {lastResult.body}
            </p>
            <button
                onclick={() => { showOverlay = false; promptText = "Tap spin to try your luck"; }}
                class="px-6 py-2.5 rounded-full font-semibold text-xs text-white bg-primary transition hover:scale-105 cursor-pointer border border-white/20"
            >
                Spin again
            </button>
        </div>
    {/if}
</div>
