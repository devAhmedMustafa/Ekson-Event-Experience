<script lang="ts">
    interface Props {
        mouseX?: number;
        mouseY?: number;
    }

    let { mouseX = 0, mouseY = 0 }: Props = $props();
</script>

<div class="relative w-full h-full flex items-center justify-center overflow-hidden pointer-events-none select-none">
    <!-- Ambient Multi-Color Energy Glows -->
    <div class="absolute size-100 sm:size-112 rounded-full bg-primary/60 blur-3xl animate-pulse transition-transform duration-1000" style="transform: translate3d({mouseX * 0.5}px, {mouseY * 0.5}px, 0);"></div>
    <div class="absolute size-72 sm:size-96 rounded-full bg-secondary/15 blur-2xl animate-pulse delay-500 transition-transform duration-1000" style="transform: translate3d({mouseX * -0.5}px, {mouseY * -0.5}px, 0);"></div>

    <!-- Floating & Parallax Land Visual Asset -->
    <div
        class="relative will-change-transform transition-transform duration-500 ease-out flex items-center justify-center"
        style="transform: translate3d({mouseX * -1.4}px, {mouseY * -1.4}px, 0);"
    >
        <img
            src="land.webp"
            alt="Ekson Spatial Technology"
            class="max-w-[85vw] sm:max-w-[70vw] max-h-[58vh] object-contain drop-shadow-[0_25px_40px_rgba(0,157,214,0.18)] animate-float-gentle"
        />
    </div>
</div>

<style>
    @keyframes floatGentle {
        0%, 100% {
            transform: translateY(0px) rotate(0deg) scale(1);
        }
        50% {
            transform: translateY(-12px) rotate(0.8deg) scale(1.02);
        }
    }

    .animate-float-gentle {
        animation: floatGentle 6s ease-in-out infinite;
    }
</style>