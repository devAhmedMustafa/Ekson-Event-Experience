<script lang="ts">
    let doingVR = $state(false);

    function toggleVR() {
        doingVR = !doingVR;   
    }
</script>

<div class="flex flex-col md:flex-row min-h-dvh md:h-screen w-full bg-white select-none font-sans overflow-hidden">
    <!-- Left Narrative Column -->
    <div class="w-full md:w-1/2 p-6 sm:p-10 md:p-14 flex flex-col justify-center my-auto">
        <div class="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-primary font-bold mb-1">
            <span class="size-1.5 bg-primary"></span>
            <span>05 / Interactive Walkthrough</span>
        </div>
        <h2 class="text-2xl sm:text-4xl md:text-5xl font-black text-text tracking-tight uppercase leading-tight mb-3">
            Real-Time Walkthrough
        </h2>
        <p class="text-xs sm:text-sm text-text/70 leading-relaxed max-w-lg">
            Empower booth visitors to explore architectural installations and trade show booths with fluid first-person locomotion and photorealistic rendering.
        </p>

        <div class="flex flex-wrap gap-2 mt-6">
            <span class="px-3 py-1 bg-black/5 border border-black/5 font-mono text-[10px] font-bold uppercase tracking-wider text-text/80">
                60 FPS Locomotion
            </span>
            <span class="px-3 py-1 bg-black/5 border border-black/5 font-mono text-[10px] font-bold uppercase tracking-wider text-text/80">
                Real-Time Lighting
            </span>
            <span class="px-3 py-1 bg-black/5 border border-black/5 font-mono text-[10px] font-bold uppercase tracking-wider text-text/80">
                VR Headset Compatible
            </span>
        </div>
    </div>

    <!-- Right Video Preview Column -->
    <div class="w-full md:w-1/2 h-64 sm:h-80 md:h-full relative overflow-hidden bg-slate-900">
        <video
            class="absolute top-0 left-0 w-full h-full object-cover"
            src="Walkthrough-demo.mp4"
            controls={false}
            autoplay
            muted
            loop
            playsinline
        ></video>

        <button
            class="absolute bottom-4 right-4 bg-primary hover:bg-primary/90 text-white font-mono text-xs font-bold uppercase tracking-wider px-4 py-2 shadow-lg transition flex items-center gap-1.5 cursor-pointer z-20"
            onclick={toggleVR}
        >
            <span class="material-symbols-outlined text-[16px]">
                {doingVR ? "close" : "view_in_ar"}
            </span>
            <span>{doingVR ? 'Exit Demo' : 'Explore Demo'}</span>
        </button>
    </div>

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