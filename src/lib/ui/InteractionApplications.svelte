<script>
    import Tour360 from "$lib/components/Tour360.svelte";
    import TrueScaleDemo from "$lib/components/TrueScaleDemo.svelte";
    import RealTimeWalking from "./RealTimeWalking.svelte";
</script>

<div class="w-full flex flex-col">
    <!-- Single Combined Section: 360 Tour (Left Half) & True Scale Demo (Right Half) -->
    <div class="w-full min-h-dvh md:h-screen flex flex-col md:flex-row overflow-hidden border-b border-black/10 p-20 gap-4">
        <!-- 360 Tour - Left Half -->
        <div class="w-full md:w-1/2 h-[50vh] md:h-full relative border-b md:border-b-0 md:border-r border-black/10 overflow-hidden">
            <Tour360 />
        </div>

        <!-- True Scale Demo - Right Half -->
        <div class="w-full md:w-1/2 h-[50vh] md:h-full relative overflow-hidden">
            <TrueScaleDemo />
        </div>
    </div>

    <!-- Real-Time Walking Section -->
    <RealTimeWalking />
</div>