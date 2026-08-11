<script lang="ts">
    import { onDestroy } from "svelte";

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
    let statusMessage = $state("Type a question or tap the mic to speak.");

    let audioElement = $state<HTMLAudioElement | null>(null);
    let mediaRecorder: MediaRecorder | null = null;
    let audioChunks: Blob[] = [];
    let recordTimerInterval: any = null;

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
        isGenerating = true;
        statusMessage = "Generating voice response...";

        const serverUrl = (import.meta.env.VITE_SERVER_URL || '').replace(/\/+$/, '');

        try {
            if (audioElement) {
                audioElement.pause();
            }

            let response = await fetch(`${serverUrl}/api/chat/speech`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text }),
            }).catch(() => null);

            if (!response || !response.ok) {
                response = await fetch("/api/chat/speech", {
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
                triggerAudioPlayback(audioBlob);
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
            statusMessage = "Listening... Speak your question now.";

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
        statusMessage = "Connecting to Ekson Voice AI...";

        const serverUrl = (import.meta.env.VITE_SERVER_URL || '').replace(/\/+$/, '');

        try {
            const formData = new FormData();
            formData.append("audio", blob, "voice-input.webm");
            formData.append("file", blob, "voice-input.webm");
            formData.append("voice", blob, "voice-input.webm");

            let response = await fetch(`${serverUrl}/api/voice/chat`, {
                method: "POST",
                body: formData,
            }).catch(() => null);

            if (!response || !response.ok) {
                response = await fetch("/api/voice/chat", {
                    method: "POST",
                    body: formData,
                });
            }

            if (!response.ok) {
                throw new Error(`Server returned status ${response.status}`);
            }

            // Extract transcript if provided
            const transcriptHeader = response.headers.get("x-user-transcript") || response.headers.get("x-transcript");
            if (transcriptHeader) {
                lastUserQuery = decodeURIComponent(transcriptHeader);
            }

            const contentType = response.headers.get("content-type") || "";

            if (contentType.includes("audio") || contentType.includes("octet-stream")) {
                const audioBlob = await response.blob();
                if (audioBlob.size > 100) {
                    triggerAudioPlayback(audioBlob);
                }
            } else if (contentType.includes("json")) {
                const json = await response.json();
                if (json.transcript) {
                    lastUserQuery = json.transcript;
                }
                if (json.audioUrl) {
                    const audioRes = await fetch(json.audioUrl);
                    triggerAudioPlayback(await audioRes.blob());
                } else if (json.audioBase64 || json.audio) {
                    const b64 = json.audioBase64 || json.audio;
                    const res = await fetch(`data:audio/mp3;base64,${b64}`);
                    triggerAudioPlayback(await res.blob());
                } else if (json.reply || json.text || json.message) {
                    await sendTextMessage(json.reply || json.text || json.message);
                }
            } else {
                const audioBlob = await response.blob();
                if (audioBlob.size > 100) {
                    triggerAudioPlayback(audioBlob);
                }
            }
        } catch (error) {
            console.error("Voice chat error:", error);
            statusMessage = "Could not process voice request. Please verify EksonServer is running.";
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

<div class="relative w-full h-full max-w-4xl mx-auto px-3 sm:px-6 md:px-8 py-4 sm:py-6 flex flex-col justify-between items-center select-none font-sans overflow-hidden min-h-[500px]">
    <!-- Top Header -->
    <div class="text-center shrink-0">
        <div class="flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-widest text-primary font-bold mb-0.5">
            <span class="size-1.5 bg-primary"></span>
            <span>05 / Voice Concierge</span>
        </div>
        <h2 class="text-xl sm:text-3xl md:text-4xl font-black text-text tracking-tight uppercase">
            Ekson AI Assistant
        </h2>
    </div>

    <!-- Center Interactive Voice Visualizer Stage -->
    <div class="flex-1 flex flex-col items-center justify-center my-auto py-3 sm:py-6 gap-4 sm:gap-6">
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
                <span class="material-symbols-outlined text-[32px] sm:text-[40px] md:text-[48px] transition-all {isRecording ? 'text-rose-600 animate-pulse' : isGenerating ? 'text-primary animate-spin' : isSpeaking ? 'text-primary animate-pulse' : 'text-primary'}">
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
        <div class="flex flex-col items-center text-center gap-2 max-w-md px-2">
            <p class="text-xs sm:text-sm md:text-base font-bold text-text transition-all tracking-tight">
                {statusMessage}
            </p>

            {#if lastUserQuery}
                <div class="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-black/5 text-[10px] sm:text-[11px] text-text/60 max-w-xs sm:max-w-sm truncate shadow-xs">
                    <span class="font-bold text-primary font-mono text-[9px] sm:text-[10px]">YOU:</span>
                    <span class="truncate">"{lastUserQuery}"</span>
                </div>
            {/if}

            <!-- Dedicated Voice Control Bar -->
            <div class="flex items-center gap-1.5 sm:gap-2 mt-1">
                <!-- Play / Pause Button -->
                <button
                    onclick={togglePlayback}
                    disabled={!audioSrc || isGenerating || isRecording}
                    class="px-2.5 sm:px-3.5 py-1 sm:py-1.5 bg-white hover:bg-slate-50 text-text border border-black/10 shadow-xs text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <span class="material-symbols-outlined text-[14px] sm:text-[16px] text-primary">
                        {isSpeaking ? "pause" : "play_arrow"}
                    </span>
                    <span>{isSpeaking ? "Pause" : "Play"}</span>
                </button>

                <!-- Replay Button -->
                <button
                    onclick={replayAudio}
                    disabled={!audioSrc || isGenerating || isRecording}
                    class="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-white hover:bg-slate-50 text-text border border-black/10 shadow-xs text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Replay from start"
                >
                    <span class="material-symbols-outlined text-[14px] sm:text-[16px] text-secondary">
                        replay
                    </span>
                    <span class="hidden sm:inline">Replay</span>
                </button>

                <!-- Mute / Unmute Button -->
                <button
                    onclick={toggleMute}
                    class="px-2 sm:px-2.5 py-1 sm:py-1.5 bg-white hover:bg-slate-50 text-text border border-black/10 shadow-xs text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition {isMuted ? 'bg-rose-50 text-rose-600 border-rose-200' : ''}"
                    title={isMuted ? "Unmute Voice" : "Mute Voice"}
                >
                    <span class="material-symbols-outlined text-[14px] sm:text-[16px] {isMuted ? 'text-rose-600' : 'text-text/70'}">
                        {isMuted ? "volume_off" : "volume_up"}
                    </span>
                    <span class="hidden sm:inline">{isMuted ? "Muted" : "Mute"}</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Bottom Input & Microphone Section -->
    <div class="w-full max-w-2xl flex flex-col gap-2 shrink-0">
        <!-- Quick Prompts Row -->
        <div class="flex items-center justify-start sm:justify-center gap-1.5 overflow-x-auto pb-1 scrollbar-none max-w-full">
            {#each quickPrompts as prompt}
                <button
                    onclick={() => sendTextMessage(prompt)}
                    disabled={isGenerating || isRecording}
                    class="px-2 py-1 bg-white hover:bg-primary/10 hover:text-primary text-text/70 text-[9px] sm:text-[10px] font-mono whitespace-nowrap transition cursor-pointer border border-black/5 shadow-xs disabled:opacity-50 shrink-0"
                >
                    {prompt}
                </button>
            {/each}
        </div>

        <!-- Clean Input & Mic Control Bar -->
        <div class="relative flex items-center bg-white border border-black/10 shadow-md p-1 sm:p-1.5 transition-focus-within focus-within:border-primary gap-1">
            <!-- Dedicated Microphone Button -->
            <button
                onclick={toggleRecording}
                disabled={isGenerating}
                class="size-8 sm:size-9 rounded-none flex items-center justify-center transition cursor-pointer shrink-0 {isRecording ? 'bg-rose-600 text-white animate-pulse shadow-sm' : 'bg-black/5 hover:bg-primary hover:text-white text-text/70'}"
                title={isRecording ? "Stop Recording & Send" : "Click to Speak via Microphone"}
                aria-label="Microphone Voice Input"
            >
                <span class="material-symbols-outlined text-[18px] sm:text-[20px]">
                    {isRecording ? "stop" : "mic"}
                </span>
            </button>

            <!-- Text Input Field -->
            <input
                type="text"
                bind:value={inputMessage}
                onkeydown={handleKeydown}
                disabled={isGenerating || isRecording}
                placeholder={isRecording ? "Listening..." : "Ask the AI voice assistant..."}
                class="flex-1 min-w-0 px-2 py-1.5 sm:py-2 text-xs sm:text-sm font-sans text-text placeholder:text-text/40 bg-transparent focus:outline-none"
            />

            <!-- Send Text Button -->
            <button
                onclick={() => sendTextMessage()}
                disabled={!inputMessage.trim() || isGenerating || isRecording}
                class="px-3 sm:px-5 py-1.5 sm:py-2 bg-primary hover:bg-primary/90 text-white font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer shrink-0"
            >
                <span>{isGenerating ? "..." : "Ask"}</span>
                <span class="material-symbols-outlined text-[12px] sm:text-[14px]">send</span>
            </button>
        </div>
    </div>
</div>