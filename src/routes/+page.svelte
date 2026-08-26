<script>
    import { brand } from "$lib/brand.svelte";
    import Navbar from "$lib/ui/Navbar.svelte";
    import Landing from "$lib/ui/Landing.svelte";
    import AboutUs from "$lib/ui/AboutUs.svelte";
    import InteractionApplications from "$lib/ui/InteractionApplications.svelte";
    import MiniGames from "$lib/ui/MiniGames.svelte";
    import VRGames from "$lib/ui/VRGames.svelte";
    import AiAssitant from "$lib/components/AiAssitant.svelte";
    import ARApps from "$lib/ui/AR_Apps.svelte";
    import GlobalCoverage from "$lib/ui/GlobalCoverage.svelte";
    import InvestmentPlans from "$lib/components/InvestmentPlans.svelte";
    import Footer from "$lib/ui/Footer.svelte";
</script>

<svelte:head>
    <title>{brand.name} Event Experiences</title>
</svelte:head>

<Navbar />

<section id="landing" class="relative w-full min-h-dvh md:h-screen flex flex-col justify-center items-center overflow-hidden">
    <Landing />
</section>

<section id="about" class="relative w-full min-h-dvh md:h-screen flex flex-col justify-center items-center overflow-hidden py-4">
    <AboutUs />
</section>

<!-- NO overflow-hidden on interactive section so position:sticky works for Tour360 & TrueScaleDemo, but overflow-x-hidden prevents horizontal scrollbars -->
<section id="interactive" class="relative w-full overflow-x-hidden">
    <InteractionApplications />
</section>

<section id="minigames" class="relative w-full min-h-dvh md:h-screen flex flex-col justify-center items-center overflow-hidden py-4">
    <MiniGames />
</section>

<section id="vr-games" class="relative w-full min-h-dvh md:h-screen flex flex-col justify-center items-center overflow-hidden py-4">
    <VRGames />
</section>

<section id="ai-assistant" class="relative w-full min-h-dvh md:h-screen flex flex-col justify-center items-center overflow-hidden py-4">
    <AiAssitant />
</section>

<section id="ar-apps" class="relative w-full min-h-dvh md:h-screen flex flex-col justify-center items-center overflow-hidden py-3">
    <ARApps />
</section>

<section id="global-network" class="relative w-full min-h-dvh md:h-screen flex flex-col justify-center items-center overflow-hidden py-4">
    <GlobalCoverage />
</section>

<section id="plans" class="relative w-full min-h-dvh md:h-screen flex flex-col justify-center items-center overflow-hidden py-4">
    <InvestmentPlans />
</section>

<section id="footer" class="relative w-full min-h-dvh md:h-screen flex flex-col justify-center items-center overflow-hidden py-4">
    <Footer />
</section>