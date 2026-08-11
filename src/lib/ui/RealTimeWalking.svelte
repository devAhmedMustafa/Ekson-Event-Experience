<script>
    let doingVR = $state(false);

    function toggleVR() {
        doingVR = !doingVR;   
    }
</script>


<div class="w-1/2 p-8 flex flex-col justify-center">
    <h2 class="text-6xl font-bold mb-4">
        Real-Time Walkthrough
    </h2>
    <p>
        This is a simple real-time walkthrough component.
        Lurem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
    </p>

    <ul class="flex gap-2 mt-6">
        <li>Feature 1</li>
        <li>Feature 2</li>
        <li>Feature 3</li>
    </ul>
</div>

<div class="w-1/2 relative">
    <video
        class="absolute top-0 left-0 w-full h-full object-cover"
        src="Walkthrough-demo.mp4"
        controls={false}
        autoplay
        muted
        loop
    ></video>

    <button
        class="absolute bottom-4 right-4 bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-600 z-100"
        onclick={toggleVR}
    >
        {doingVR ? 'Exit VR' : 'Enter VR'}
    </button>
</div>

{#if doingVR}
<div class="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
    <iframe
        class="w-full h-screen"
        src="https://www.youtube.com/embed/dQw4w9WgXcQ"
        title="YouTube video player"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
    ></iframe>
</div>
{/if}