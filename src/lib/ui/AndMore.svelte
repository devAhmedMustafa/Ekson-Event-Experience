<script lang="ts">

    function handleContact() {
        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("ekson_open_contact_form", {
                detail: { message: "I'm interested in custom spatial tech activation..." }
            }));
        }
    }
</script>

<div class="relative w-full h-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 overflow-visible">
    <!-- Header -->
    <div class="flex items-start mb-6 sm:mb-8 pb-3 border-b border-black/5 shrink-0 w-full flex-col">
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-black text-text tracking-tight leading-tight">
            And <span class="text-transparent bg-clip-text bg-linear-to-r from-primary to-secondary">More...</span>
        </h2>
        <p class="text-xs sm:text-sm text-text/70 mt-1 max-w-xl leading-relaxed">
            Beyond standard packages, we engineer bespoke spatial tech, kinetic displays, holographic setups, and custom hardware tailored for your event vision.
        </p>
    </div>

    <!-- Full Width and Height Section Image Container -->
    <div class="relative w-full h-[65vh] min-h-120 max-h-187.5 rounded-3xl overflow-hidden border border-black/10 shadow-xl group flex flex-col justify-between p-6 sm:p-8 md:p-10">
        <!-- Full Section Background Image -->
        <img
            src="more_panel.png"
            alt="And More Custom Event Activations"
            class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
        />

        <!-- Gradient Dark Overlay for Contrast & Readability -->
        <div class="absolute inset-0 bg-linear-to-t from-slate-950/90 via-slate-950/45 to-slate-950/25"></div>
        
        <!-- Bottom CTA Footer Bar -->
        <div class="relative z-10 flex flex-col sm:flex-row items-start sm:items-end justify-between mt-auto gap-4 pt-4 border-t border-white/15">
            <div class="max-w-xl">
                <h3 class="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
                    Have a Unique Concept for Your Event?
                </h3>
                <p class="text-xs sm:text-sm text-white/80 mt-1 leading-relaxed font-medium">
                    Our team of engineers design custom interactive hardware and software tailored to your venue dimensions and brand requirements.
                </p>
            </div>

            <button
                onclick={handleContact}
                class="px-6 py-3 rounded-full font-bold text-xs sm:text-sm text-white bg-primary shadow-xl hover:bg-primary/90 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer border border-white/20 shrink-0"
            >
                <span>Request Custom Build</span>
                <span class="material-symbols-rounded text-base">arrow_forward</span>
            </button>
        </div>
    </div>
</div>
