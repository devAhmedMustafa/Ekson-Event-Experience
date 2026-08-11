<script>
    import Tour360 from "$lib/components/Tour360.svelte";
    import TrueScaleDemo from "$lib/components/TrueScaleDemo.svelte";
    import RealTimeWalking from "./RealTimeWalking.svelte";
    import AR_Apps from "./AR_Apps.svelte";
</script>

<div class="w-screen">
    <Tour360 />
    <RealTimeWalking />
    <TrueScaleDemo />
    <section class="relative w-full h-screen flex flex-col justify-center items-center overflow-hidden">
        <AR_Apps />
    </section>
</div>