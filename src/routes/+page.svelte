<script>
    import Tour360 from "$lib/components/Tour360.svelte";
    import AboutUs from "$lib/ui/AboutUs.svelte";
    import Landing from "$lib/ui/Landing.svelte";
    import Values from "$lib/ui/Values.svelte";


</script>

<svelte:head>
    <title>Ekson Event Experiences</title>
</svelte:head>

<section class="relative w-full h-screen flex flex-col justify-center items-center overflow-hidden">
    <Landing/>
</section>

<section class="relative w-full h-screen flex flex-col justify-center items-center overflow-hidden">
    <AboutUs/>
</section>

<section class="w-full p-2 ">
    <Values/>
</section>

<section>
    <Tour360/>
</section>