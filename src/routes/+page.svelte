<script>
    import { brand } from "$lib/brand.svelte";
    import Navbar from "$lib/ui/Navbar.svelte";
    import Landing from "$lib/ui/Landing.svelte";
    import AboutUs from "$lib/ui/AboutUs.svelte";
    import InteractionApplications from "$lib/ui/InteractionApplications.svelte";
    import ActiveFloor from "$lib/ui/ActiveFloor.svelte";
    import MiniGames from "$lib/ui/MiniGames.svelte";
    import VRGames from "$lib/ui/VRGames.svelte";
    import AiAssitant from "$lib/components/AiAssitant.svelte";
    import ARApps from "$lib/ui/AR_Apps.svelte";
    import GlobalCoverage from "$lib/ui/GlobalCoverage.svelte";
    import InvestmentPlans from "$lib/components/InvestmentPlans.svelte";
    import Footer from "$lib/ui/Footer.svelte";
    import RealTimeWalking from "$lib/ui/RealTimeWalking.svelte";
</script>

<svelte:head>
    <title>{brand.name} Event Experiences</title>
</svelte:head>

<Navbar />

<section id="landing" class="relative w-full min-h-dvh md:h-screen flex flex-col justify-center items-center overflow-x-hidden md:overflow-hidden">
    <Landing />
</section>

<section id="about" class="relative w-full min-h-dvh md:h-screen flex flex-col justify-center items-center overflow-x-hidden md:overflow-hidden py-4 sm:py-6">
    <AboutUs />
</section>

<!-- NO overflow-hidden on interactive section so position:sticky works for Tour360 & TrueScaleDemo, but overflow-x-hidden prevents horizontal scrollbars -->
<section id="interactive" class="relative w-full overflow-x-hidden">
    <InteractionApplications />
</section>

<section id="active-floor" class="relative w-full flex flex-col justify-center items-center overflow-x-hidden md:overflow-hidden py-4 sm:py-6">
    <ActiveFloor />
</section>

<section id="vr-games" class="relative w-full min-h-dvh md:h-screen flex flex-col justify-center items-center overflow-x-hidden md:overflow-hidden py-4 sm:py-6">
    <VRGames />
</section>

<section id="real-time-walking" class="relative w-full min-h-dvh md:h-screen flex flex-col justify-center items-center overflow-x-hidden md:overflow-hidden py-4 sm:py-6">
    <RealTimeWalking />
</section>

<section id="minigames" class="relative w-full min-h-dvh md:h-screen flex flex-col justify-center items-center overflow-x-hidden md:overflow-hidden py-4 sm:py-6">
    <MiniGames />
</section>


<section id="ai-assistant" class="relative w-full min-h-dvh md:h-screen flex flex-col justify-center items-center overflow-x-hidden md:overflow-hidden py-4 sm:py-6">
    <AiAssitant />
</section>

<section id="ar-apps" class="relative w-full min-h-dvh md:h-screen flex flex-col justify-center items-center overflow-x-hidden md:overflow-hidden py-3 sm:py-6">
    <ARApps />
</section>

<section id="plans" class="relative w-full min-h-dvh md:h-screen flex flex-col justify-center items-center overflow-x-hidden md:overflow-hidden py-4 sm:py-6">
    <InvestmentPlans />
</section>

<section id="footer" class="relative w-full min-h-dvh md:h-screen flex flex-col justify-center items-center overflow-x-hidden md:overflow-hidden py-4 sm:py-6">
    <Footer />
</section>