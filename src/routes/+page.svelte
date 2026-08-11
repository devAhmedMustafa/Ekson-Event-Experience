<script>
    import Navbar from "$lib/ui/Navbar.svelte";
    import Landing from "$lib/ui/Landing.svelte";
    import AboutUs from "$lib/ui/AboutUs.svelte";
    import InteractionApplications from "$lib/ui/InteractionApplications.svelte";
    import MiniGames from "$lib/ui/MiniGames.svelte";
    import AiAssitant from "$lib/components/AiAssitant.svelte";
    import ARApps from "$lib/ui/AR_Apps.svelte";
    import InvestmentPlans from "$lib/components/InvestmentPlans.svelte";
    import Footer from "$lib/ui/Footer.svelte";
</script>

<svelte:head>
    <title>Ekson Event Experiences</title>
</svelte:head>

<Navbar />

<section id="landing" class="relative w-full h-screen flex flex-col justify-center items-center overflow-hidden">
    <Landing />
</section>

<section id="about" class="relative w-full h-screen flex flex-col justify-center items-center overflow-hidden">
    <AboutUs />
</section>

<section id="interactive">
    <InteractionApplications />
</section>

<section id="minigames" class="relative w-full h-screen flex flex-col justify-center items-center overflow-hidden">
    <MiniGames />
</section>

<section id="ai-assistant" class="relative w-full min-h-screen flex flex-col justify-center items-center overflow-hidden py-8">
    <AiAssitant />
</section>

<section id="ar-apps">
    <ARApps/>
</section>

<section id="plans" class="relative w-full h-screen flex flex-col justify-center items-center overflow-hidden">
    <InvestmentPlans />
</section>

<section id="footer" class="relative w-full h-screen flex flex-col justify-center items-center overflow-hidden">
    <Footer />
</section>