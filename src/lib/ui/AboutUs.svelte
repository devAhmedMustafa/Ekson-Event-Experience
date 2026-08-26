<script lang="ts">

    interface Solution {
        id: string;
        name: string;
        badge: string;
        title: string;
        subtitle: string;
        description: string;
        icon: string;
        image: string;
        features: string[];
    }

    const solutions: Solution[] = [
        {
            id: "ai",
            name: "AI",
            badge: "AI & Neural Voice",
            title: "Intelligent Event Concierge",
            subtitle: "Neural AI Voice & Realtime Visitor Analytics",
            description: "Deploy conversational AI concierges trained on your brand catalog to engage exhibition visitors, answer inquiries, and capture qualified leads 24/7.",
            icon: "psychology",
            image: "/images/solutions/ai.svg",
            features: ["Interactive Voice Assistant", "Instant Lead Qualification", "Visitor Sentiment Analytics"]
        },
        {
            id: "vr",
            name: "VR",
            badge: "Virtual Reality",
            title: "Immersive VR Metaverse",
            subtitle: "Multi-User 1:1 Scale Virtual Showrooms",
            description: "Transport global attendees into photorealistic 1:1 spatial virtual event halls. Enable live avatar walkthroughs and interactive product demos across VR headsets.",
            icon: "view_in_ar",
            image: "/images/solutions/vr.svg",
            features: ["1:1 Spatial Photorealism", "Multi-User Avatar Presence", "Cross-Platform VR Headset Support"]
        },
        {
            id: "3d",
            name: "3D",
            badge: "Interactive 3D WebGL",
            title: "Realtime 3D Spatial Engine",
            subtitle: "Interactive Booth Configurator & WebAR",
            description: "Empower attendees to explore, customize, and navigate true-scale 3D exhibition booths directly in their browser or interactive touch displays.",
            icon: "3d_rotation",
            image: "/images/solutions/3d.svg",
            features: ["First-Person 3D Walkthrough", "Dynamic Color & Logo Branding", "Instant WebAR Viewport"]
        }
    ];

    let activeSolutionIndex = $state(0);
    const activeSolution = $derived(solutions[activeSolutionIndex]);
    const solutionImages = $derived(solutions.map((s) => s.image));

    const metrics = [
        { value: "80+", label: "Specialist Experts" },
        { value: "150+", label: "Global Activations" },
        { value: "1:1", label: "Spatial Metric Scale" },
        { value: "100%", label: "Turnkey Delivery" }
    ];

    function selectSolution(index: number) {
        activeSolutionIndex = index;
    }
</script>

<div class="relative w-full h-full min-h-dvh md:h-screen max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 flex flex-col justify-between select-none overflow-visible md:overflow-hidden">
    

    <!-- Main Container Card (Matches Sketch Layout) -->
    <div class="relative w-full my-auto backdrop-blur-xl p-4 sm:p-8 lg:p-10 overflow-hidden">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-center">
            
            <!-- LEFT COLUMN: Sweeping Orbit Curve & Prominent Image Box -->
            <div class="md:col-span-5 relative flex items-center justify-center min-h-48 sm:min-h-75">

                <!-- Prominent Solution Image Box -->
                <div class="relative z-20 w-40 sm:w-56 h-32 sm:h-48 p-3 sm:p-4 flex flex-col items-center justify-center text-center transition-all duration-500 transform hover:scale-105">
                    <div class="w-full flex items-center justify-center mb-2 sm:mb-3 shadow-inner">
                        <img src={activeSolution.image} alt={activeSolution.name} class="object-contain max-h-24 sm:max-h-36" />
                    </div>
                </div>

            </div>

            <!-- RIGHT COLUMN: Text Lines & Solution Selector Buttons -->
            <div class="md:col-span-7 flex flex-col justify-between space-y-4 sm:space-y-8">
                
                <!-- TOP RIGHT: Text Lines -->
                <div class="space-y-2 sm:space-y-4">
                    <div>
                        <h3 class="text-2xl sm:text-4xl md:text-5xl font-extrabold text-text tracking-tight leading-tight">
                            Who Are We
                        </h3>
                    </div>

                    <p class="text-xs sm:text-sm text-text/75 leading-relaxed pt-1">
                        We're a technology development company
                        delivering innovative, immersive solutions
                        built to help businesses engage, train, and
                        perform better.
                    </p>

                    <!-- Feature Tags -->
                    <p class="text-xs sm:text-sm font-semibold text-primary mt-1">
                        We go beyond XR content, combining the latest
                        technologies to create real, measurable value.    
                    </p>
                </div>

                <!-- BOTTOM RIGHT: Wide Button Container Box -->
                <div class="w-full flex flex-wrap sm:flex-nowrap items-center justify-center sm:justify-end gap-1.5 sm:gap-2">
                    {#each solutions as sol, idx}
                        {@const isActive = activeSolutionIndex === idx}
                        <button
                            type="button"
                            onclick={() => selectSolution(idx)}
                            class="py-2.5 sm:py-3 px-3.5 sm:px-4 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer {isActive ? 'bg-primary text-white shadow-md scale-[1.02]' : 'bg-white/60 text-text/70 hover:text-text hover:bg-white'}"
                        >
                            <span class="material-symbols-rounded text-base">{sol.icon}</span>
                            <span>{sol.name}</span>
                        </button>
                    {/each}
                </div>

            </div>

        </div>
    </div>

    <!-- Bottom Metrics Banner -->
    <div class="w-full bg-white/60 backdrop-blur-xl rounded-3xl border border-black/5 p-3.5 sm:p-5 shadow-sm shrink-0 mt-3 md:mt-0">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-center">
            {#each metrics as m, idx}
                <div class="flex flex-col items-center px-2 {idx % 2 !== 0 ? 'border-l border-black/5 md:border-l' : 'md:border-l md:border-black/5'} {idx === 0 ? 'md:border-l-0' : ''}">
                    <span class="text-lg sm:text-2xl md:text-3xl font-extrabold text-text tracking-tight">
                        {m.value}
                    </span>
                    <span class="text-[9px] sm:text-xs font-medium text-text/50 uppercase tracking-wider mt-0.5 sm:mt-1">
                        {m.label}
                    </span>
                </div>
            {/each}
        </div>
    </div>
</div>