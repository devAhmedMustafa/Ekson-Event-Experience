<script>
    import Landing from "$lib/ui/Landing.svelte";
    import AboutUs from "$lib/ui/AboutUs.svelte";
    import InteractionApplications from "$lib/ui/InteractionApplications.svelte";
    import MiniGames from "$lib/ui/MiniGames.svelte";
    import AiAssitant from "$lib/components/AiAssitant.svelte";
</script>

<svelte:head>
    <title>Ekson Event Experiences</title>
</svelte:head>

<section class="relative w-full h-screen flex flex-col justify-center items-center overflow-hidden">
    <Landing />
</section>

<section class="relative w-full h-screen flex flex-col justify-center items-center overflow-hidden">
    <AboutUs />
</section>

<section>
    <InteractionApplications />
</section>

<section class="relative w-full h-screen flex flex-col justify-center items-center overflow-hidden">
    <MiniGames />
</section>

<section class="relative w-full min-h-screen flex flex-col justify-center items-center overflow-hidden py-8">
    <AiAssitant />
</section>
