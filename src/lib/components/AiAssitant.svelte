<script lang="ts">
    import { onDestroy } from "svelte";

    let inputMessage = $state("");
    let isGenerating = $state(false);
    let isSpeaking = $state(false);
    let isAudioPaused = $state(true);
    let isMuted = $state(false);
    let audioCurrentTime = $state(0);
    let audioDuration = $state(0);
    let audioSrc = $state<string | null>(null);
    let lastUserQuery = $state<string | null>(null);
    let statusMessage = $state("Type a question below to speak with Ekson AI.");

    let audioElement = $state<HTMLAudioElement | null>(null);

    const quickPrompts = [
        "Tell me about Ekson's interactive booth experiences.",
        "How does the True Scale 3D configurator work?",
        "What mini-games are available for event booths?",
        "How can Ekson help our brand engage more visitors?",
    ];

    function togglePlayback() {
        if (!audioElement || !audioSrc) return;
        if (audioElement.paused) {
            audioElement.play().catch((err) => {
                console.warn("Play error:", err);
            });
        } else {
            audioElement.pause();
        }
    }

    function toggleMute() {
        isMuted = !isMuted;
        if (audioElement) {
            audioElement.muted = isMuted;
        }
    }

    function replayAudio() {
        if (!audioElement || !audioSrc) return;
        audioElement.currentTime = 0;
        audioElement.play().catch((err) => {
            console.warn("Replay error:", err);
        });
    }

    async function sendTextMessage(textToSend?: string) {
        const text = (textToSend || inputMessage).trim();
        if (!text || isGenerating) return;

        inputMessage = "";
        lastUserQuery = text;
        isGenerating = true;
        statusMessage = "Generating voice response...";

        try {
            // Stop current playback if running
            if (audioElement) {
                audioElement.pause();
            }

            // Call POST /api/chat/speech on EksonServer
            let response = await fetch("/api/chat/speech", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text }),
            }).catch(() => null);

            // Fallback direct port 3000 fetch if proxy unavailable
            if (!response || !response.ok) {
                response = await fetch("http://localhost:3000/api/chat/speech", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: text }),
                });
            }

            if (!response.ok) {
                throw new Error(`Server returned status ${response.status}`);
            }

            const audioBlob = await response.blob();
            if (audioBlob.size > 100) {
                if (audioSrc) {
                    URL.revokeObjectURL(audioSrc);
                }
                const newUrl = URL.createObjectURL(audioBlob);
                audioSrc = newUrl;

                // Trigger playback
                setTimeout(() => {
                    if (audioElement) {
                        audioElement.currentTime = 0;
                        audioElement.muted = isMuted;
                        audioElement.play().then(() => {
                            isSpeaking = true;
                            isAudioPaused = false;
                            statusMessage = "Speaking...";
                        }).catch((err) => {
                            console.warn("Autoplay blocked by browser:", err);
                            isSpeaking = false;
                            isAudioPaused = true;
                            statusMessage = "Click Play to hear voice response.";
                        });
                    }
                }, 60);
            } else {
                statusMessage = "No audio received. Please try again.";
            }
        } catch (error) {
            console.error("Speech call error:", error);
            statusMessage = "Could not connect to voice server. Please verify EksonServer is running.";
        } finally {
            isGenerating = false;
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendTextMessage();
        }
    }

    onDestroy(() => {
        if (audioSrc) {
            URL.revokeObjectURL(audioSrc);
        }
    });
</script>

<!-- Hidden Bound Audio Element with Native Svelte Runes Bindings -->
<audio
    bind:this={audioElement}
    src={audioSrc || ""}
    bind:paused={isAudioPaused}
    bind:muted={isMuted}
    bind:currentTime={audioCurrentTime}
    bind:duration={audioDuration}
    onplay={() => {
        isSpeaking = true;
        statusMessage = "Speaking...";
    }}
    onpause={() => {
        isSpeaking = false;
        statusMessage = "Audio paused.";
    }}
    onended={() => {
        isSpeaking = false;
        statusMessage = "Ready for your next question.";
    }}
    onerror={() => {
        isSpeaking = false;
        statusMessage = "Audio playback ready.";
    }}
></audio>

<div class="relative w-full h-full max-w-4xl mx-auto px-4 md:px-8 py-8 flex flex-col justify-between items-center select-none font-sans overflow-hidden min-h-125">
    <!-- Top Header -->
    <div class="text-center shrink-0">
        <div class="flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-widest text-text/60 mb-1">
            <span class="size-1.5 bg-primary"></span>
            <span>05 / Voice Concierge</span>
        </div>
        <h2 class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-text tracking-tight uppercase">
            Ekson AI Assistant
        </h2>
    </div>

    <!-- Center Interactive Voice Visualizer Stage -->
    <div class="flex-1 flex flex-col items-center justify-center my-auto py-8 gap-6">
        <!-- Dynamic Pulsing Voice Orb -->
        <div class="relative flex items-center justify-center">
            <!-- Ripple Rings -->
            <div class="absolute size-44 sm:size-52 rounded-full border border-primary/20 transition-all duration-700 {isSpeaking ? 'scale-125 opacity-100 animate-ping' : isGenerating ? 'scale-110 opacity-70 animate-pulse' : 'scale-100 opacity-40'}"></div>
            <div class="absolute size-36 sm:size-44 rounded-full border border-primary/30 transition-all duration-500 {isSpeaking ? 'scale-115 opacity-80' : 'scale-100 opacity-20'}"></div>

            <!-- Central Voice Core (Clickable to Toggle Play/Pause) -->
            <button
                onclick={togglePlayback}
                disabled={!audioSrc || isGenerating}
                class="relative size-28 sm:size-34 rounded-full bg-white shadow-xl border border-black/5 flex flex-col items-center justify-center transition-all duration-300 {isSpeaking ? 'scale-105 shadow-primary/25 shadow-2xl ring-4 ring-primary/20 cursor-pointer' : audioSrc ? 'cursor-pointer hover:border-primary/40' : 'cursor-default'}"
                title={audioSrc ? (isSpeaking ? "Click to Pause" : "Click to Play") : "Voice Assistant"}
            >
                <span class="material-symbols-outlined text-[40px] sm:text-[48px] text-primary transition-all {isSpeaking ? 'animate-pulse' : isGenerating ? 'animate-spin' : ''}">
                    {isGenerating ? "progress_activity" : isSpeaking ? "graphic_eq" : audioSrc ? (isAudioPaused ? "play_arrow" : "pause") : "mic"}
                </span>

                {#if isSpeaking}
                    <span class="text-[9px] font-mono font-bold text-primary tracking-widest uppercase mt-0.5 animate-pulse">
                        SPEAKING
                    </span>
                {:else if audioSrc && isAudioPaused}
                    <span class="text-[9px] font-mono font-bold text-text/40 tracking-widest uppercase mt-0.5">
                        PAUSED
                    </span>
                {/if}
            </button>
        </div>

        <!-- Dynamic Status & Query Display -->
        <div class="flex flex-col items-center text-center gap-2.5 max-w-md px-4">
            <p class="text-sm sm:text-base font-bold text-text transition-all tracking-tight">
                {statusMessage}
            </p>

            {#if lastUserQuery}
                <div class="flex items-center gap-1.5 px-3 py-1 bg-white border border-black/5 text-[11px] text-text/60 max-w-sm truncate shadow-xs">
                    <span class="font-bold text-primary font-mono text-[10px]">YOU:</span>
                    <span class="truncate">"{lastUserQuery}"</span>
                </div>
            {/if}

            <!-- Dedicated Voice Control Bar (Play/Pause, Mute, Replay) -->
            <div class="flex items-center gap-2 mt-1">
                <!-- Play / Pause Button -->
                <button
                    onclick={togglePlayback}
                    disabled={!audioSrc || isGenerating}
                    class="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-text border border-black/10 shadow-xs text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <span class="material-symbols-outlined text-[16px] text-primary">
                        {isSpeaking ? "pause" : "play_arrow"}
                    </span>
                    <span>{isSpeaking ? "Pause" : "Play Voice"}</span>
                </button>

                <!-- Replay Button -->
                <button
                    onclick={replayAudio}
                    disabled={!audioSrc || isGenerating}
                    class="px-3 py-1.5 bg-white hover:bg-slate-50 text-text border border-black/10 shadow-xs text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Replay from start"
                >
                    <span class="material-symbols-outlined text-[16px] text-secondary">
                        replay
                    </span>
                    <span>Replay</span>
                </button>

                <!-- Mute / Unmute Button -->
                <button
                    onclick={toggleMute}
                    class="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-text border border-black/10 shadow-xs text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition {isMuted ? 'bg-rose-50 text-rose-600 border-rose-200' : ''}"
                    title={isMuted ? "Unmute Voice" : "Mute Voice"}
                >
                    <span class="material-symbols-outlined text-[16px] {isMuted ? 'text-rose-600' : 'text-text/70'}">
                        {isMuted ? "volume_off" : "volume_up"}
                    </span>
                    <span>{isMuted ? "Muted" : "Mute"}</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Bottom Text Input Section -->
    <div class="w-full max-w-2xl flex flex-col gap-2 shrink-0">
        <!-- Quick Prompts Row -->
        <div class="flex items-center justify-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {#each quickPrompts as prompt}
                <button
                    onclick={() => sendTextMessage(prompt)}
                    disabled={isGenerating}
                    class="px-2.5 py-1 bg-white hover:bg-primary/10 hover:text-primary text-text/70 text-[10px] font-mono whitespace-nowrap transition cursor-pointer border border-black/5 shadow-xs disabled:opacity-50"
                >
                    {prompt}
                </button>
            {/each}
        </div>

        <!-- Clean Text Input Bar -->
        <div class="relative flex items-center bg-white border border-black/10 shadow-md p-1.5 transition-focus-within focus-within:border-primary">
            <span class="material-symbols-outlined text-[20px] text-text/40 ml-2.5 mr-1.5 shrink-0">
                chat
            </span>

            <input
                type="text"
                bind:value={inputMessage}
                onkeydown={handleKeydown}
                disabled={isGenerating}
                placeholder="Type your question for the AI voice assistant..."
                class="flex-1 px-2 py-2 text-xs sm:text-sm font-sans text-text placeholder:text-text/40 bg-transparent focus:outline-none"
            />

            <button
                onclick={() => sendTextMessage()}
                disabled={!inputMessage.trim() || isGenerating}
                class="px-4 sm:px-5 py-2 bg-primary hover:bg-primary/90 text-white font-mono text-xs font-bold uppercase tracking-wider transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer shrink-0"
            >
                <span>{isGenerating ? "Synthesizing..." : "Ask"}</span>
                <span class="material-symbols-outlined text-[14px]">send</span>
            </button>
        </div>
    </div>
</div>