<script lang="ts">

    interface FeatureItem {
        id: string;
        title: string;
        icon: string;
    }

    const features: FeatureItem[] = [
        { id: "movement", title: "ACTIVE MOVEMENT", icon: "directions_run" },
        { id: "learning", title: "LEARNING THROUGH PLAY", icon: "psychology" },
        { id: "games", title: "INTERACTIVE GAMES", icon: "sports_esports" },
        { id: "all-ages", title: "ENGAGING FOR ALL AGES", icon: "groups" }
    ];

    let activeFeatureIndex = $state<number | null>(null);
</script>

<div class="relative w-full h-full min-h-dvh md:h-screen max-w-6xl mx-auto px-4 sm:px-6 md:px-8 sm:py-8 flex flex-col justify-between overflow-hidden">

    <!-- Main Container Card -->
    <div class="relative w-full my-auto backdrop-blur-xl overflow-hidden flex-1 flex flex-col justify-center">

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center relative z-10 pt-4">
            
            <!-- LEFT COLUMN: Text Content & Feature Badges -->
            <div class="lg:col-span-5 flex flex-col justify-between space-y-5 sm:space-y-6">
                
                <!-- Main Header & Subtitle -->
                <div>
                    <h2 class="text-4xl sm:text-5xl lg:text-6xl font-black text-text tracking-tight uppercase leading-none">
                        ACTIVE<br />
                        <span class="text-transparent bg-clip-text bg-linear-to-r from-primary to-secondary">FLOOR.</span>
                    </h2>
                    <p class="text-sm sm:text-base font-extrabold text-text/80 tracking-wider uppercase mt-3">
                        MOVE. PLAY. LEARN.
                    </p>
                </div>

                <!-- Paragraph Descriptions -->
                <div class="space-y-3 text-xs sm:text-sm text-text/75 leading-relaxed">
                    <p>
                        ActiveFloor is an interactive floor solution that combines movement and learning. Youth physically move on the floor and interact with games and tasks that stimulate both body and mind.
                    </p>
                    <p class="font-medium text-text/90">
                        With ActiveFloor, you can make fun and engaging – and it all happens through play and movement!
                    </p>
                </div>

                <!-- 4 Feature Badges Grid (Icon + Label) -->
                <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 pt-2">
                    {#each features as feat, idx}
                        <button
                            type="button"
                            onmouseenter={() => (activeFeatureIndex = idx)}
                            onmouseleave={() => (activeFeatureIndex = null)}
                            class="group relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 text-center {activeFeatureIndex === idx ? 'bg-primary text-white border-primary shadow-md scale-105' : 'bg-white/80 border-black/10 text-text hover:border-primary/50 hover:bg-white'}"
                        >
                            <div class="size-11 rounded-full flex items-center justify-center border transition-colors mb-2 {activeFeatureIndex === idx ? 'bg-white/20 border-white/40 text-white' : 'bg-primary/10 border-primary/20 text-primary group-hover:bg-primary group-hover:text-white'}">
                                <span class="material-symbols-rounded text-xl sm:text-2xl">{feat.icon}</span>
                            </div>
                            <span class="text-[10px] sm:text-[11px] font-extrabold leading-tight tracking-tight uppercase">
                                {feat.title}
                            </span>
                        </button>
                    {/each}
                </div>

            </div>

            <!-- RIGHT COLUMN: Shaped Layout Frame with Active Floor Image -->
            <div class="lg:col-span-7 relative flex items-center justify-center w-full min-h-75 sm:min-h-95 lg:min-h-110">
                
                <!-- Slide-matching Custom Tech Frame Container -->
                <div class="relative w-full h-full rounded-4xl p-2 bg-linear-to-br from-primary/30 via-slate-200/50 to-primary/10 border border-primary/30 shadow-xl overflow-hidden group">

                    <!-- Inner Image Container with Soft Shadow & Rounded Corners -->
                    <div class="relative w-full h-80 sm:h-100 lg:h-107.5 rounded-3xl overflow-hidden bg-slate-900 shadow-inner flex items-center justify-center">
                        <img
                            src="/images/active_floor.png"
                            alt="Active Floor Interactive Projection Game"
                            class="w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-105"
                        />

                        <!-- Subtle Lighting Gradient Overlay -->
                        <div class="absolute inset-0 bg-linear-to-t from-slate-950/40 via-transparent to-black/10 pointer-events-none"></div>
                    </div>
                </div>

            </div>

        </div>

    </div>

</div>
