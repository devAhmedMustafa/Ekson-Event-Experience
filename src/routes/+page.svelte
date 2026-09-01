<script>
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
    import ContactUs from "$lib/ui/ContactUs.svelte";
    import Footer from "$lib/ui/Footer.svelte";
    import RealTimeWalking from "$lib/ui/RealTimeWalking.svelte";
</script>

<svelte:head>
    <title>Kubix Event Experiences</title>
</svelte:head>

<Navbar />

<section id="landing" class="relative w-full min-h-dvh mb-30 flex flex-col justify-center items-center overflow-x-hidden py-12 sm:py-16 md:py-20">
    <Landing />
</section>

<section id="about" class="relative w-full flex flex-col justify-center items-center overflow-x-hidden py-12 sm:py-16 md:py-20">
    <AboutUs />
</section>

<section id="interactive" class="relative w-full flex flex-col justify-center items-center overflow-x-hidden py-12 sm:py-16 md:py-20">
    <InteractionApplications />
</section>

<section id="active-floor" class="relative w-full flex flex-col justify-center items-center overflow-x-hidden py-12 sm:py-16 md:py-20">
    <ActiveFloor />
</section>

<section id="vr-games" class="relative w-full flex flex-col justify-center items-center overflow-x-hidden py-12 sm:py-16 md:py-20">
    <VRGames />
</section>

<section id="real-time-walking" class="relative w-full flex flex-col justify-center items-center overflow-x-hidden py-12 sm:py-16 md:py-20">
    <RealTimeWalking />
</section>

<section id="minigames" class="relative w-full flex flex-col justify-center items-center overflow-x-hidden py-12 sm:py-16 md:py-20">
    <MiniGames />
</section>

<section id="ai-assistant" class="relative w-full flex flex-col justify-center items-center overflow-x-hidden py-12 sm:py-16 md:py-20">
    <AiAssitant />
</section>

<section id="ar-apps" class="relative w-full flex flex-col justify-center items-center overflow-x-hidden py-12 sm:py-16 md:py-20">
    <ARApps />
</section>

<section id="plans" class="relative w-full flex flex-col justify-center items-center overflow-x-hidden py-12 sm:py-16 md:py-20">
    <InvestmentPlans />
</section>

<section id="contact" class="relative w-full flex flex-col justify-center items-center overflow-x-hidden py-12 sm:py-16 md:py-20">
    <ContactUs />
</section>

<section id="footer" class="relative w-full min-h-dvh flex flex-col justify-center items-center overflow-x-hidden py-12 sm:py-16 md:py-20">
    <Footer />
</section>