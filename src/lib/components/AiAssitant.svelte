<script lang="ts">
    import { onDestroy } from "svelte";
    import { brand } from "$lib/brand.svelte";

    let { imageSrc = "" } = $props();
    let isLive = $state(false);

    function handleTryLive() {
        if (!brand.isCustom) {
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("ekson_open_brand_modal"));
            }
            return;
        }
        isLive = true;
    }

    let inputMessage = $state("");
    let isGenerating = $state(false);
    let isSpeaking = $state(false);
    let isRecording = $state(false);
    let isAudioPaused = $state(true);
    let isMuted = $state(false);
    let recordDuration = $state(0);
    let audioCurrentTime = $state(0);
    let audioDuration = $state(0);
    let audioSrc = $state<string | null>(null);
    let lastUserQuery = $state<string | null>(null);
    let aiReplyText = $state<string | null>(null);
    let statusMessage = $state("Type a question or tap the mic to speak.");

    let audioElement = $state<HTMLAudioElement | null>(null);
    let mediaRecorder: MediaRecorder | null = null;
    let audioChunks: Blob[] = [];
    let recordTimerInterval: any = null;

    const quickPrompts = $derived([
        `Tell me about ${brand.name}'s interactive booth experiences.`,
        `How does the True Scale 3D configurator work for ${brand.name}?`,
        `What mini-games are available for ${brand.name}'s event booth?`,
        `How can ${brand.name} engage more event visitors?`,
    ]);

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

    function triggerAudioPlayback(blob: Blob) {
        if (audioSrc) {
            URL.revokeObjectURL(audioSrc);
        }
        audioSrc = URL.createObjectURL(blob);

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
    }

    // Text query to /api/chat/speech
    async function sendTextMessage(textToSend?: string) {
        const text = (textToSend || inputMessage).trim();
        if (!text || isGenerating) return;

        inputMessage = "";
        lastUserQuery = text;
        aiReplyText = null;
        isGenerating = true;
        statusMessage = `Generating voice response for ${brand.name}...`;

        const serverUrl = (typeof import.meta !== "undefined" && import.meta.env?.VITE_SERVER_URL)
            ? import.meta.env.VITE_SERVER_URL.replace(/\/+$/, '')
            : "http://localhost:3000";

        try {
            if (audioElement) {
                audioElement.pause();
            }

            const payload = {
                message: text,
                brandName: brand.name,
                description: brand.description
            };

            let response: Response | null = null;
            try {
                response = await fetch(`${serverUrl}/api/chat/speech`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            } catch (err) {
                response = await fetch("/api/chat/speech", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            }

            if (!response || !response.ok) {
                throw new Error(`Server returned status ${response?.status || 'unknown'}`);
            }

            const rawAssistantReply =
                response.headers.get("x-assistant-reply") ||
                response.headers.get("x-reply");

            if (rawAssistantReply) {
                try {
                    aiReplyText = decodeURIComponent(rawAssistantReply);
                    statusMessage = aiReplyText;
                } catch (e) {
                    aiReplyText = rawAssistantReply;
                    statusMessage = rawAssistantReply;
                }
            }

            const contentType = response.headers.get("content-type") || "";

            if (contentType.includes("json")) {
                const json = await response.json();
                const reply = json.reply || json.text || json.message;
                if (reply) {
                    aiReplyText = reply;
                    statusMessage = reply;
                }
                if (json.audioUrl) {
                    const audioRes = await fetch(json.audioUrl);
                    triggerAudioPlayback(await audioRes.blob());
                } else if (json.audioBase64 || json.audio) {
                    const b64 = json.audioBase64 || json.audio;
                    const res = await fetch(`data:audio/mp3;base64,${b64}`);
                    triggerAudioPlayback(await res.blob());
                }
            } else {
                const audioBlob = await response.blob();
                if (audioBlob.size > 100) {
                    triggerAudioPlayback(audioBlob);
                } else {
                    statusMessage = aiReplyText || "Voice response received.";
                }
            }
        } catch (error) {
            console.error("Speech call error:", error);
            statusMessage = `Could not connect to voice server. Please verify ${brand.name} voice server is running.`;
        } finally {
            isGenerating = false;
        }
    }

    // Microphone Recording & /api/voice/chat
    async function toggleRecording() {
        if (isRecording) {
            stopRecording();
        } else {
            await startRecording();
        }
    }

    async function startRecording() {
        if (isGenerating) return;
        if (audioElement) audioElement.pause();

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioChunks = [];
            recordDuration = 0;

            let mimeType = "audio/webm";
            if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
                mimeType = "audio/webm;codecs=opus";
            } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
                mimeType = "audio/mp4";
            }

            mediaRecorder = new MediaRecorder(stream, { mimeType });

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                clearInterval(recordTimerInterval);
                const recordedBlob = new Blob(audioChunks, { type: mimeType });
                stream.getTracks().forEach((track) => track.stop());
                await sendVoiceChat(recordedBlob);
            };

            mediaRecorder.start(150);
            isRecording = true;
            statusMessage = `Listening... Speak your question for ${brand.name}.`;

            recordTimerInterval = setInterval(() => {
                recordDuration += 1;
            }, 1000);
        } catch (err) {
            console.error("Microphone access error:", err);
            statusMessage = "Microphone access denied. Please allow microphone permissions.";
            isRecording = false;
        }
    }

    function stopRecording() {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            isRecording = false;
            clearInterval(recordTimerInterval);
            statusMessage = "Processing your voice audio...";
        }
    }

    async function sendVoiceChat(blob: Blob) {
        isGenerating = true;
        lastUserQuery = "Voice Message 🎙️";
        aiReplyText = null;
        statusMessage = `Connecting to ${brand.name} Voice AI...`;

        const serverUrl = (typeof import.meta !== "undefined" && import.meta.env?.VITE_SERVER_URL)
            ? import.meta.env.VITE_SERVER_URL.replace(/\/+$/, '')
            : "http://localhost:3000";

        try {
            const formData = new FormData();
            formData.append("voice", blob, "voice.webm");
            formData.append("audio", blob, "voice.webm");
            formData.append("brandName", brand.name);
            formData.append("description", brand.description);

            let response: Response | null = null;
            try {
                response = await fetch(`${serverUrl}/api/voice/chat`, {
                    method: "POST",
                    body: formData,
                });
            } catch (err) {
                response = await fetch("/api/voice/chat", {
                    method: "POST",
                    body: formData,
                });
            }

            if (!response || !response.ok) {
                throw new Error(`Server returned status ${response?.status || 'unknown'}`);
            }

            // Read transcriptions & AI text from headers:
            const rawUserTranscription =
                response.headers.get("x-user-transcription") ||
                response.headers.get("x-user-transcript") ||
                response.headers.get("x-transcript");

            if (rawUserTranscription) {
                try {
                    lastUserQuery = decodeURIComponent(rawUserTranscription);
                    console.log("You said:", lastUserQuery);
                } catch (e) {
                    lastUserQuery = rawUserTranscription;
                    console.log("You said:", lastUserQuery);
                }
            }

            const rawAssistantReply =
                response.headers.get("x-assistant-reply") ||
                response.headers.get("x-reply");

            if (rawAssistantReply) {
                try {
                    aiReplyText = decodeURIComponent(rawAssistantReply);
                    statusMessage = aiReplyText;
                    console.log("AI replied:", aiReplyText);
                } catch (e) {
                    aiReplyText = rawAssistantReply;
                    statusMessage = rawAssistantReply;
                    console.log("AI replied:", aiReplyText);
                }
            }

            const contentType = response.headers.get("content-type") || "";

            if (contentType.includes("json")) {
                const json = await response.json();
                if (json.transcript) {
                    lastUserQuery = json.transcript;
                }
                const reply = json.reply || json.text || json.message;
                if (reply) {
                    aiReplyText = reply;
                    statusMessage = reply;
                }
                if (json.audioUrl) {
                    const audioRes = await fetch(json.audioUrl);
                    triggerAudioPlayback(await audioRes.blob());
                } else if (json.audioBase64 || json.audio) {
                    const b64 = json.audioBase64 || json.audio;
                    const res = await fetch(`data:audio/mp3;base64,${b64}`);
                    triggerAudioPlayback(await res.blob());
                } else if (reply) {
                    await sendTextMessage(reply);
                }
            } else {
                const audioBlob = await response.blob();
                if (audioBlob.size > 100) {
                    triggerAudioPlayback(audioBlob);
                } else {
                    statusMessage = aiReplyText || "Voice response received.";
                }
            }
        } catch (error) {
            console.error("Voice chat error:", error);
            statusMessage = `Could not process voice request for ${brand.name}. Please verify voice server is running.`;
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
        if (recordTimerInterval) {
            clearInterval(recordTimerInterval);
        }
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
        }
    });
</script>

<!-- Hidden Bound Audio Element -->
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

<div class="relative w-full h-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-8 flex flex-col overflow-visible md:overflow-hidden">
    <!-- Top Header -->
    <div class="flex items-end justify-between pb-3 border-b border-black/5 shrink-0 w-full mb-3">
        <div>

            <h2 class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-text tracking-tight">
                {brand.name} AI Voice Concierge
            </h2>
            <p class="text-xs sm:text-sm text-text/70 mt-1 max-w-xl leading-relaxed">
                Interactive voice guide for your exhibition booth.
            </p>
        </div>

        {#if isLive}
            <button
                onclick={() => isLive = false}
                class="px-4 py-2 rounded-full text-xs font-semibold uppercase transition flex items-center gap-1.5 shadow-sm cursor-pointer bg-red-500 hover:bg-red-600 text-white"
                title="Exit Live Assistant"
            >
                <span class="material-symbols-rounded text-base">close</span>
                <span>Exit Live</span>
            </button>
        {/if}
    </div>

    {#if !isLive}
        <!-- Stage Card & Launch Action -->
        <div class="flex-1 w-full py-4">
            <div class="relative w-full h-[52vh] sm:h-[58vh] md:h-[62vh] max-h-145 rounded-3xl border border-black/5 shadow-sm overflow-hidden bg-slate-900 text-white group/ai-card">
                {#if imageSrc}
                    <img src={imageSrc} alt="{brand.name} AI Voice Assistant" class="w-full h-full object-cover" />
                {:else}
                    <div class="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
                        <div class="size-24 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-5 border border-white/10 shadow-2xl">
                            <span class="material-symbols-rounded text-5xl text-primary">
                                smart_toy
                            </span>
                        </div>
                        <h3 class="text-2xl font-extrabold tracking-tight mb-2">{brand.name} AI Voice Concierge</h3>
                        <p class="text-xs text-white/60 max-w-sm leading-relaxed">Interactive neural voice assistant for booth visitors</p>
                    </div>
                {/if}

                <!-- Hover Overlay with 'Try it live' button -->
                <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-xs opacity-0 hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center p-4">
                    <button
                        onclick={handleTryLive}
                        class="px-7 py-3.5 rounded-full font-semibold text-xs text-white bg-primary shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2.5 cursor-pointer border border-white/20"
                    >
                        <span class="material-symbols-rounded text-lg">
                            {!brand.isCustom ? 'auto_awesome' : 'play_arrow'}
                        </span>
                        <span>{!brand.isCustom ? 'Try for your brand' : 'Try it live'}</span>
                    </button>
                </div>
            </div>
        </div>
    {:else}
        <!-- Center Interactive Voice Visualizer Stage -->
        <div class="flex-1 flex flex-col items-center justify-center py-3 sm:py-6 gap-12 sm:gap-5 mt-20">
            <!-- Dynamic Pulsing Voice Orb -->
            <div class="relative flex items-center justify-center">
                <!-- Ripple Rings -->
                <div class="absolute size-36 sm:size-44 md:size-52 rounded-full border transition-all duration-700 {isRecording ? 'border-rose-400 scale-125 opacity-90 animate-ping' : isSpeaking ? 'border-primary/20 scale-120 opacity-100 animate-ping' : isGenerating ? 'border-primary/20 scale-110 opacity-70 animate-pulse' : 'border-primary/20 scale-100 opacity-40'}"></div>
                <div class="absolute size-28 sm:size-36 md:size-44 rounded-full border transition-all duration-500 {isRecording ? 'border-rose-500 scale-115 opacity-80' : isSpeaking ? 'border-primary/30 scale-110 opacity-80' : 'border-primary/30 scale-100 opacity-20'}"></div>

                <!-- Central Voice Core (Clickable for Play/Pause or Voice Recording) -->
                <button
                    onclick={() => {
                        if (isRecording) {
                            stopRecording();
                        } else if (audioSrc && !isAudioPaused) {
                            togglePlayback();
                        } else {
                            toggleRecording();
                        }
                    }}
                    disabled={isGenerating}
                    class="relative size-24 sm:size-28 md:size-34 rounded-full bg-white shadow-xl border flex flex-col items-center justify-center transition-all duration-300 cursor-pointer {isRecording ? 'border-rose-500 ring-4 ring-rose-400/30 scale-105 shadow-rose-200 shadow-2xl' : isSpeaking ? 'border-primary ring-4 ring-primary/20 scale-105 shadow-primary/25 shadow-2xl' : 'border-black/5 hover:border-primary/40'}"
                    title={isRecording ? "Click to Stop Recording & Send" : isSpeaking ? "Click to Pause" : "Click to Speak"}
                >
                    <span class="material-symbols-rounded text-[32px] sm:text-[40px] md:text-[48px] transition-all {isRecording ? 'text-rose-600 animate-pulse' : isGenerating ? 'text-primary animate-spin' : isSpeaking ? 'text-primary animate-pulse' : 'text-primary'}">
                        {isGenerating ? "progress_activity" : isRecording ? "mic" : isSpeaking ? "graphic_eq" : audioSrc ? (isAudioPaused ? "play_arrow" : "pause") : "mic"}
                    </span>

                    {#if isRecording}
                        <span class="text-[8px] sm:text-[9px] font-mono font-bold text-rose-600 tracking-widest uppercase mt-0.5 animate-pulse">
                            REC {recordDuration}s
                        </span>
                    {:else if isSpeaking}
                        <span class="text-[8px] sm:text-[9px] font-mono font-bold text-primary tracking-widest uppercase mt-0.5 animate-pulse">
                            SPEAKING
                        </span>
                    {:else if audioSrc && isAudioPaused}
                        <span class="text-[8px] sm:text-[9px] font-mono font-bold text-text/40 tracking-widest uppercase mt-0.5">
                            PAUSED
                        </span>
                    {:else}
                        <span class="text-[8px] sm:text-[9px] font-mono font-bold text-text/40 tracking-widest uppercase mt-0.5">
                            TAP TO SPEAK
                        </span>
                    {/if}
                </button>
            </div>

            <!-- Dynamic Status & Query Display -->
            <div class="flex flex-col items-center text-center gap-2 max-w-lg px-2">
                <p class="text-xs sm:text-sm md:text-base font-bold text-text transition-all tracking-tight">
                    {statusMessage}
                </p>

                {#if lastUserQuery}
                    <div class="flex items-center gap-1.5 px-3 py-1 bg-white border border-black/5 text-[10px] sm:text-[11px] text-text/60 max-w-xs sm:max-w-md truncate shadow-xs rounded-full">
                        <span class="font-bold text-primary font-mono text-[9px] sm:text-[10px]">YOU:</span>
                        <span class="truncate">"{lastUserQuery}"</span>
                    </div>
                {/if}

                {#if aiReplyText}
                    <div class="flex items-start gap-1.5 px-3.5 py-2 bg-primary/5 border border-primary/15 text-[10px] sm:text-[11px] text-text/80 max-w-sm sm:max-w-lg shadow-xs rounded-2xl text-left animate-fade-in">
                        <span class="font-bold text-primary font-mono text-[9px] sm:text-[10px] shrink-0 mt-0.5 uppercase">{brand.name} AI:</span>
                        <span class="leading-relaxed line-clamp-3 font-sans">"{aiReplyText}"</span>
                    </div>
                {/if}

                <!-- Dedicated Voice Control Bar -->
                <div class="flex items-center gap-1.5 sm:gap-2 mt-1">
                    <!-- Play / Pause Button -->
                    <button
                        onclick={togglePlayback}
                        disabled={!audioSrc || isGenerating || isRecording}
                        class="px-3 sm:px-4 py-1 sm:py-1.5 bg-white hover:bg-slate-50 text-text border border-black/10 shadow-xs text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider rounded-full flex items-center gap-1 cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <span class="material-symbols-rounded text-[14px] sm:text-[16px] text-primary">
                            {isSpeaking ? "pause" : "play_arrow"}
                        </span>
                        <span>{isSpeaking ? "Pause" : "Play"}</span>
                    </button>

                    <!-- Replay Button -->
                    <button
                        onclick={replayAudio}
                        disabled={!audioSrc || isGenerating || isRecording}
                        class="px-3 sm:px-3.5 py-1 sm:py-1.5 bg-white hover:bg-slate-50 text-text border border-black/10 shadow-xs text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider rounded-full flex items-center gap-1 cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Replay from start"
                    >
                        <span class="material-symbols-rounded text-[14px] sm:text-[16px] text-secondary">
                            replay
                        </span>
                        <span class="hidden sm:inline">Replay</span>
                    </button>

                    <!-- Mute / Unmute Button -->
                    <button
                        onclick={toggleMute}
                        class="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-white hover:bg-slate-50 text-text border border-black/10 shadow-xs text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider rounded-full flex items-center gap-1 cursor-pointer transition {isMuted ? 'bg-rose-50 text-rose-600 border-rose-200' : ''}"
                        title={isMuted ? "Unmute Voice" : "Mute Voice"}
                    >
                        <span class="material-symbols-rounded text-[14px] sm:text-[16px] {isMuted ? 'text-rose-600' : 'text-text/70'}">
                            {isMuted ? "volume_off" : "volume_up"}
                        </span>
                        <span class="hidden sm:inline">{isMuted ? "Muted" : "Mute"}</span>
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>