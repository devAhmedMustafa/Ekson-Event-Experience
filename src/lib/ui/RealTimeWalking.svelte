<script lang="ts">
    let doingVR = $state(false);

    function toggleVR() {
        doingVR = !doingVR;   
    }
</script>

<div class="relative w-full h-full min-h-[100dvh] md:h-screen max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex flex-col justify-between select-none font-sans overflow-hidden">
    <!-- Top Header (Standardized Alignment) -->
    <div class="flex items-end justify-between pb-2 border-b border-black/5 shrink-0 w-full mb-2 sm:mb-3">
        <div>
            <div class="flex items-center gap-1.5 font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-primary font-bold mb-0.5">
                <span class="size-1.5 bg-primary"></span>
                <span>04 / Spatial Walkthrough</span>
            </div>
            <h2 class="text-xl sm:text-2xl md:text-3xl font-extrabold text-text tracking-tight uppercase">
                Real-Time Walkthrough
            </h2>
            <p class="text-[11px] sm:text-xs text-text/70 mt-0.5 max-w-xl">
                Explore architectural installations and trade show booths with fluid first-person locomotion and photorealistic rendering.
            </p>
        </div>

        <div class="hidden sm:flex items-center gap-2 font-mono text-[10px] text-text/50">
            <span class="size-2 bg-primary rounded-full"></span>
            <span>60 FPS LOCOMOTION</span>
        </div>
    </div>

    <!-- Main Content Area: 2-Column Split matching grid width -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 flex-1 w-full my-auto max-h-[74vh] md:max-h-[78vh] items-stretch overflow-hidden">
        <!-- Left Narrative Card -->
        <div class="bg-white border border-black/10 p-5 sm:p-8 md:p-10 flex flex-col justify-between shadow-xs overflow-hidden">
            <div>
                <span class="font-mono text-[10px] font-bold text-primary uppercase tracking-widest block mb-1">
                    IMMERSIVE LOCOMOTION
                </span>
                <h3 class="text-xl sm:text-2xl md:text-3xl font-black text-text uppercase tracking-tight leading-snug">
                    Seamless Visitor Exploration
                </h3>
                <p class="text-xs sm:text-sm text-text/70 leading-relaxed mt-2.5">
                    Empower booth visitors to freely roam through high-resolution spatial models with full first-person controls, realistic material shaders, and interactive lighting rigs.
                </p>
            </div>

            <div class="flex flex-wrap gap-2 mt-4 pt-4 border-t border-black/5">
                <span class="px-2.5 py-1 bg-black/[0.03] border border-black/5 font-mono text-[10px] font-bold uppercase tracking-wider text-text/80">
                    60 FPS Smooth Engine
                </span>
                <span class="px-2.5 py-1 bg-black/[0.03] border border-black/5 font-mono text-[10px] font-bold uppercase tracking-wider text-text/80">
                    Ray-Traced Ambient Light
                </span>
                <span class="px-2.5 py-1 bg-black/[0.03] border border-black/5 font-mono text-[10px] font-bold uppercase tracking-wider text-text/80">
                    VR Headset Ready
                </span>
            </div>
        </div>

        <!-- Right Video Preview Column -->
        <div class="relative overflow-hidden bg-slate-900 border border-black/10 shadow-xs h-60 sm:h-72 md:h-full min-h-[160px]">
            <!-- svelte-ignore a11y_media_has_caption -->
            <video
                class="absolute inset-0 w-full h-full object-cover"
                src="Walkthrough-demo.mp4"
                autoplay
                muted
                loop
                playsinline
            ></video>

            <!-- Launch VR Demo Overlay Button -->
            <button
                class="absolute bottom-3 right-3 bg-primary hover:bg-primary/90 text-white font-mono text-[11px] font-bold uppercase tracking-wider px-3.5 py-2 shadow-lg transition flex items-center gap-1.5 cursor-pointer z-20"
                onclick={toggleVR}
            >
                <span class="material-symbols-outlined text-[16px]">
                    {doingVR ? "close" : "view_in_ar"}
                </span>
                <span>{doingVR ? 'Exit Demo' : 'Launch Walkthrough'}</span>
            </button>
        </div>
    </div>

    <!-- VR Fullscreen Modal -->
    {#if doingVR}
        <div class="fixed inset-0 bg-black/85 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div class="relative w-full max-w-4xl h-[70vh] bg-black border border-white/10 shadow-2xl overflow-hidden">
                <button
                    onclick={toggleVR}
                    class="absolute top-3 right-3 size-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition cursor-pointer z-10"
                    aria-label="Close demo"
                >
                    <span class="material-symbols-outlined text-[18px]">close</span>
                </button>
                <iframe
                    class="w-full h-full"
                    src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                    title="Real-Time Walkthrough Player"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                ></iframe>
            </div>
        </div>
    {/if}
</div>