<script lang="ts">
    import { brand } from "$lib/brand.svelte";
    import City360PanoramaModal from "$lib/components/City360PanoramaModal.svelte";

    let isModalOpen = $state(false);

    let exhibitionCity = $derived({
        id: "virtual-exhibition",
        name: brand.name ? `${brand.name} Exhibition` : "Virtual Exhibition",
        country: "360° Cubic Tour",
        description: "360° Virtual Exhibition Panorama",
        placeholders: [
            {
                title: "Main Exhibition Hall",
                url: "/cubic_views/exhibition",
                tag: "Cubic 360°",
                type: "cubic" as const
            }
        ]
    });

    function openPanorama() {
        isModalOpen = true;
    }

    function closePanorama() {
        isModalOpen = false;
    }
</script>

<div class="relative w-full h-full min-h-90 overflow-hidden select-none group/canvas">
    <div class="relative w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden group/image">
        <!-- Preview background image of exhibition -->
        <img
            src="/cubic_views/exhibition/mobile_f.jpg"
            alt="{brand.name || 'Virtual'} Exhibition 360 Panorama"
            class="w-full h-full object-cover transition-transform duration-700 group-hover/image:scale-105"
        />

        <!-- Gradient Backdrop Overlay -->
        <div class="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

        <!-- Card Content / Action Button -->
        <div class="absolute inset-0 z-10 bg-slate-950/30 backdrop-blur-xs opacity-90 group-hover/image:opacity-100 transition-all duration-300 flex flex-col items-center justify-center p-6 text-center">

            <h3 class="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
                Virtual Exhibition Hall
            </h3>
            <p class="text-xs text-white/70 max-w-sm mb-6 leading-relaxed">
                Explore the exhibition space in full 360° interactive cubic panorama.
            </p>

            <button
                onclick={openPanorama}
                class="px-6 py-3 rounded-full font-bold text-xs text-white bg-primary hover:bg-primary/90 shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2.5 cursor-pointer border border-white/20"
                aria-label="Explore 360 Exhibition"
            >
                <span class="material-symbols-rounded text-lg">explore</span>
                <span>Explore 360° Exhibition</span>
            </button>
        </div>
    </div>

    <!-- 360° Panorama Modal -->
    {#if isModalOpen}
        <City360PanoramaModal city={exhibitionCity} onclose={closePanorama} />
    {/if}
</div>
