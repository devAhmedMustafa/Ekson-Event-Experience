<script lang="ts">
    import { onMount } from "svelte";
    import { brand, DEFAULT_BRAND, DEFAULT_DESCRIPTION } from "$lib/brand.svelte";

    interface QuizQuestion {
        id: number;
        question: string;
        options: string[];
        correctIndex: number;
        explanation: string;
    }

    const FALLBACK_QUESTIONS: QuizQuestion[] = [
        {
            id: 1,
            question: "What is one of Ekson's primary areas of specialization?",
            options: [
                "Hardware manufacturing",
                "Modern digital platforms",
                "Biochemical research",
                "Traditional print media"
            ],
            correctIndex: 1,
            explanation: "Ekson specializes in modern digital platforms alongside event management and AI automation."
        },
        {
            id: 2,
            question: "Which system does Ekson provide for organizing and monitoring activities?",
            options: [
                "Supply chain logistics and freight tracking",
                "Event management and tracking systems",
                "Fleet tracking and vehicle maintenance",
                "Hospital patient monitoring systems"
            ],
            correctIndex: 1,
            explanation: "The company offers event management and tracking systems as part of its core offerings."
        },
        {
            id: 3,
            question: "What type of workflow automation does Ekson integrate into its solutions?",
            options: [
                "Manual robotic process automation",
                "Smart AI workflow automation",
                "Mechanical conveyor automation",
                "Legacy batch script automation"
            ],
            correctIndex: 1,
            explanation: "Ekson focuses on smart AI workflow automation integrations to enhance digital processes."
        },
        {
            id: 4,
            question: "What type of infrastructure supports Ekson's digital solutions?",
            options: [
                "On-premise legacy mainframes",
                "Scalable cloud backends",
                "Decentralized peer-to-peer nodes only",
                "Air-gapped offline servers"
            ],
            correctIndex: 1,
            explanation: "Ekson's solutions are built with scalable cloud backends to ensure robust performance."
        }
    ];

    function generateSmartBrandFallback(bName: string, bDesc: string): QuizQuestion[] {
        if (bName.toLowerCase() === "ekson") {
            return FALLBACK_QUESTIONS;
        }

        const cleanDesc = bDesc.replace(/\r?\n|\r/g, " ").trim();
        const shortDesc = cleanDesc.length > 70 ? cleanDesc.slice(0, 70) + "..." : cleanDesc;

        return [
            {
                id: 1,
                question: `What is the primary core focus of ${bName}?`,
                options: [
                    `${shortDesc}`,
                    "Legacy manual paper-based filing",
                    "Non-digital analog printing only",
                    "Unrelated industrial agriculture"
                ],
                correctIndex: 0,
                explanation: `${bName} is dedicated to ${shortDesc}`
            },
            {
                id: 2,
                question: `How does ${bName} enhance event and brand engagement?`,
                options: [
                    "By keeping all displays passive and offline",
                    `Through modern digital solutions tailored to ${bName}'s mission`,
                    "By avoiding technology integrations",
                    "Standard brochure distribution without interaction"
                ],
                correctIndex: 1,
                explanation: `${bName} focuses on modern digital and interactive touchpoints to maximize visitor recall.`
            },
            {
                id: 3,
                question: `What value proposition differentiates ${bName} at competitive expos?`,
                options: [
                    "Slow manual execution times",
                    "Limited scalability and fixed static setups",
                    `Innovative capabilities aligned with: "${shortDesc}"`,
                    "Outdated infrastructure"
                ],
                correctIndex: 2,
                explanation: `The distinct strength of ${bName} lies in its innovative approach: ${shortDesc}`
            },
            {
                id: 4,
                question: `What is the best way to experience ${bName}'s spatial showcase?`,
                options: [
                    "Waiting until after the event is over",
                    "Interactive live demonstrations and hands-on digital exploration",
                    "Viewing low-resolution static photos",
                    "Avoiding interactive booths"
                ],
                correctIndex: 1,
                explanation: `Hands-on interactive demonstrations provide the highest ROI and retention for ${bName}'s visitors.`
            }
        ];
    }

    let questions = $state<QuizQuestion[]>(FALLBACK_QUESTIONS);
    let isLoadingQuiz = $state(false);
    let isAiGenerated = $state(false);
    let statusNotice = $state<string | null>(null);

    let currentQIndex = $state(0);
    let selectedOptionIndex = $state<number | null>(null);
    let isAnswered = $state(false);
    let score = $state(0);
    let isQuizComplete = $state(false);

    const currentQuestion = $derived(questions[currentQIndex] || questions[0]);
    const maxScore = $derived(questions.length * 250);

    let activeAbortController: AbortController | null = null;

    function cancelGeneration() {
        if (activeAbortController) {
            activeAbortController.abort();
            activeAbortController = null;
        }
        isLoadingQuiz = false;
        questions = generateSmartBrandFallback(brand.name, brand.description);
        statusNotice = "Loaded offline brand questions.";
        setTimeout(() => { statusNotice = null; }, 3000);
        restartQuiz();
    }

    async function generateDynamicQuiz(targetBrand: string, targetDesc: string, showLoader: boolean = true) {
        if (activeAbortController) {
            activeAbortController.abort();
        }

        const controller = new AbortController();
        activeAbortController = controller;

        if (showLoader) {
            isLoadingQuiz = true;
        }

        const timeoutId = setTimeout(() => {
            controller.abort("Timeout");
        }, 8000);

        const serverUrl = (typeof import.meta !== "undefined" && import.meta.env?.VITE_SERVER_URL)
            ? import.meta.env.VITE_SERVER_URL
            : "http://localhost:3000";

        try {
            let res: Response | null = null;
            
            try {
                res = await fetch("/api/quiz/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        brandName: targetBrand,
                        description: targetDesc
                    }),
                    signal: controller.signal
                });
            } catch (proxyErr) {
                res = await fetch(`${serverUrl}/api/quiz/generate`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        brandName: targetBrand,
                        description: targetDesc
                    }),
                    signal: controller.signal
                });
            }

            clearTimeout(timeoutId);

            if (res && res.ok) {
                const data = await res.json();
                if (data && Array.isArray(data.quiz) && data.quiz.length > 0) {
                    const parsedQuestions: QuizQuestion[] = data.quiz.map((q: any, i: number) => {
                        const choices: string[] = Array.isArray(q.choices)
                            ? q.choices
                            : Array.isArray(q.options)
                              ? q.options
                              : [];

                        let correctIndex = -1;
                        if (typeof q.correctAnswer === "string") {
                            correctIndex = choices.findIndex(
                                (c) => c.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
                            );
                        } else if (typeof q.correctAnswer === "number") {
                            correctIndex = q.correctAnswer;
                        } else if (typeof q.correctIndex === "number") {
                            correctIndex = q.correctIndex;
                        }

                        if (correctIndex < 0 || correctIndex >= choices.length) {
                            correctIndex = 0;
                        }

                        return {
                            id: q.id || i + 1,
                            question: q.question || "Knowledge Question",
                            options: choices,
                            correctIndex,
                            explanation: q.explanation || "Verified by brand intelligence."
                        };
                    });

                    questions = parsedQuestions;
                    isAiGenerated = true;
                    statusNotice = "AI Quiz generated successfully!";
                    setTimeout(() => { statusNotice = null; }, 3000);
                    restartQuiz();
                    return;
                }
            }
            throw new Error("Invalid response format");
        } catch (err: any) {
            clearTimeout(timeoutId);
            console.warn("Using smart fallback questions for quiz:", err?.message || err);
            questions = generateSmartBrandFallback(targetBrand, targetDesc);
            isAiGenerated = false;
            statusNotice = "Active offline knowledge questions loaded.";
            setTimeout(() => { statusNotice = null; }, 3500);
        } finally {
            isLoadingQuiz = false;
            activeAbortController = null;
        }
    }

    onMount(() => {
        questions = generateSmartBrandFallback(brand.name, brand.description);

        const onBrandUpdated = () => {
            generateDynamicQuiz(brand.name, brand.description, true);
        };

        window.addEventListener("ekson_brand_updated", onBrandUpdated);
        return () => {
            if (activeAbortController) activeAbortController.abort();
            window.removeEventListener("ekson_brand_updated", onBrandUpdated);
        };
    });

    function selectOption(index: number) {
        if (isAnswered) return;
        selectedOptionIndex = index;
        isAnswered = true;

        if (index === currentQuestion.correctIndex) {
            score += 250;
        }
    }

    function nextQuestion() {
        if (currentQIndex < questions.length - 1) {
            currentQIndex += 1;
            selectedOptionIndex = null;
            isAnswered = false;
        } else {
            isQuizComplete = true;
        }
    }

    function restartQuiz() {
        currentQIndex = 0;
        selectedOptionIndex = null;
        isAnswered = false;
        score = 0;
        isQuizComplete = false;
    }
</script>

<div class="w-full h-full flex flex-col md:flex-row items-center justify-between p-2 sm:p-4 md:p-6 gap-3 md:gap-6 select-none font-sans overflow-hidden">
    <!-- BIG INTERACTIVE MAIN STAGE (QUIZ ARENA - FULL ON MOBILE) -->
    <div class="flex-1 w-full h-full flex flex-col justify-between p-2.5 sm:p-3.5 md:p-4 bg-white/40 border border-black/5 rounded-2xl overflow-hidden font-mono relative">
        {#if isLoadingQuiz}
            <!-- AI Generating Loading Overlay (With Instant Cancel Button) -->
            <div class="absolute inset-0 z-30 bg-white/94 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center rounded-2xl gap-2.5 animate-fade-in">
                <div class="size-12 sm:size-14 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                    <span class="material-symbols-rounded text-[28px] sm:text-[32px] animate-spin">progress_activity</span>
                </div>
                <div>
                    <span class="font-mono text-[9px] sm:text-[10px] text-primary font-bold uppercase tracking-widest block mb-0.5">
                        GENERATING DYNAMIC AI QUIZ
                    </span>
                    <h4 class="text-sm sm:text-base font-black text-text uppercase tracking-tight">
                        Analyzing {brand.name}
                    </h4>
                </div>
                <p class="text-[10px] sm:text-xs text-text/60 max-w-xs line-clamp-2 px-2">
                    "{brand.description}"
                </p>
                <button
                    onclick={cancelGeneration}
                    class="mt-1 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-text/70 hover:text-text font-mono text-[10px] font-bold uppercase tracking-wider rounded-full transition cursor-pointer border border-black/5"
                >
                    Cancel / Play Offline
                </button>
            </div>
        {/if}

        {#if !isQuizComplete}
            <!-- Question Header HUD -->
            <div class="flex items-center justify-between pb-1.5 sm:pb-2 border-b border-black/5 shrink-0 text-xs">
                <div class="flex items-center gap-1.5 sm:gap-2">
                    <span class="px-2.5 py-0.5 bg-primary text-white font-bold text-[9px] sm:text-[10px] uppercase tracking-wider rounded-full">
                        Q_0{currentQIndex + 1} / 0{questions.length}
                    </span>
                    <span class="text-text/70 font-mono text-[9px] sm:text-[10px] font-bold px-2 py-0.5 bg-white border border-black/5 rounded-full truncate max-w-[120px] sm:max-w-[180px]">
                        {brand.name}
                    </span>
                    {#if isAiGenerated}
                        <span class="text-emerald-700 bg-emerald-50 border border-emerald-300 font-mono text-[8px] font-bold px-1.5 py-0.2 rounded-full hidden sm:inline">
                            AI LIVE
                        </span>
                    {/if}
                    {#if statusNotice}
                        <span class="text-primary font-mono text-[9px] font-semibold animate-pulse hidden md:inline">
                            • {statusNotice}
                        </span>
                    {/if}
                </div>
                <div class="flex items-center gap-1 font-bold text-secondary text-[10px] sm:text-[11px]">
                    <span class="material-symbols-rounded text-[13px] sm:text-[14px] text-primary">stars</span>
                    <span>SCORE: {score} PTS</span>
                </div>
            </div>

            <!-- Question Prompt -->
            <div class="my-auto py-1 overflow-y-auto max-h-[320px]">
                <h4 class="text-xs sm:text-sm md:text-base font-extrabold text-text font-sans leading-snug tracking-tight mb-2 sm:mb-3">
                    {currentQuestion.question}
                </h4>

                <!-- Options List -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                    {#each currentQuestion.options as option, idx}
                        {@const isSelected = selectedOptionIndex === idx}
                        {@const isCorrect = idx === currentQuestion.correctIndex}
                        
                        <button
                            onclick={() => selectOption(idx)}
                            disabled={isAnswered}
                            class="p-2 sm:p-2.5 text-left text-xs transition-all flex items-start gap-2 border cursor-pointer rounded-xl disabled:cursor-default {isAnswered
                                ? isCorrect
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                                    : isSelected
                                      ? 'bg-rose-50 border-rose-500 text-rose-950'
                                      : 'bg-white/60 border-black/5 text-text/40 opacity-60'
                                : 'bg-white hover:bg-slate-50 border-black/5 text-text hover:border-primary/50 shadow-xs'}"
                        >
                            <span class="size-4 shrink-0 flex items-center justify-center font-bold text-[9px] sm:text-[10px] rounded-md {isAnswered && isCorrect ? 'bg-emerald-500 text-white' : isAnswered && isSelected ? 'bg-rose-500 text-white' : 'bg-black/5 text-text/60'}">
                                {String.fromCharCode(65 + idx)}
                            </span>
                            <span class="font-sans text-[10px] sm:text-[11px] leading-tight select-none">{option}</span>
                        </button>
                    {/each}
                </div>

                {#if isAnswered}
                    <div class="mt-2 p-2 sm:p-2.5 bg-slate-50 border-l-2 rounded-r-xl {selectedOptionIndex === currentQuestion.correctIndex ? 'border-l-emerald-500 text-emerald-900' : 'border-l-rose-500 text-rose-900'} text-[10px] sm:text-[11px] font-sans flex items-start gap-1.5 animate-fade-in">
                        <span class="material-symbols-rounded text-[14px] sm:text-[15px] shrink-0 {selectedOptionIndex === currentQuestion.correctIndex ? 'text-emerald-600' : 'text-rose-600'}">
                            {selectedOptionIndex === currentQuestion.correctIndex ? 'check_circle' : 'info'}
                        </span>
                        <p class="leading-tight">{currentQuestion.explanation}</p>
                    </div>
                {/if}
            </div>

            <!-- Footer Action Controls -->
            <div class="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-black/5 shrink-0">
                <span class="text-[8px] sm:text-[9px] text-text/40 uppercase tracking-wider">
                    {isAnswered ? "ANSWER REGISTERED" : "TAP AN OPTION"}
                </span>

                {#if isAnswered}
                    <button
                        onclick={nextQuestion}
                        class="px-3.5 sm:px-4 py-1 sm:py-1.5 bg-primary hover:bg-primary/90 text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-wider rounded-full transition flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                        <span>{currentQIndex < questions.length - 1 ? "Next Question" : "View Results"}</span>
                        <span class="material-symbols-rounded text-[13px] sm:text-[14px]">arrow_forward</span>
                    </button>
                {/if}
            </div>
        {:else}
            <!-- Final Results Stage -->
            <div class="w-full h-full flex flex-col items-center justify-center p-3 sm:p-4 text-center font-sans">
                <span class="material-symbols-rounded text-[36px] sm:text-[44px] text-primary mb-0.5">
                    psychology
                </span>
                <span class="font-mono text-[9px] sm:text-[10px] text-text/50 uppercase tracking-widest">{brand.name} ASSESSMENT COMPLETE</span>
                <h4 class="text-lg sm:text-2xl font-black uppercase text-text tracking-tight mt-0.5">
                    Brand Mastery Score
                </h4>

                <div class="text-3xl sm:text-4xl font-black text-secondary font-mono my-1 sm:my-2">
                    {score} <span class="text-xs sm:text-sm font-normal text-text/40">/ {maxScore} PTS</span>
                </div>

                <div class="p-3 bg-white border border-black/5 rounded-xl shadow-xs max-w-sm w-full mb-2 sm:mb-3 text-left">
                    <div class="flex items-center justify-between text-[10px] sm:text-[11px] font-mono mb-0.5">
                        <span class="text-text/50">PERFORMANCE:</span>
                        <span class="font-bold text-primary">{score >= maxScore * 0.75 ? "HIGH RECALL" : "STANDARD RECALL"}</span>
                    </div>
                    <p class="text-[11px] sm:text-xs text-text/70 leading-relaxed font-sans">
                        Dynamic interactive quizzes reinforce {brand.name}'s core value proposition for exhibition visitors.
                    </p>
                </div>

                <div class="flex items-center gap-2">
                    <button
                        onclick={restartQuiz}
                        class="px-5 py-2 bg-primary hover:bg-primary/90 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-full transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-primary/20"
                    >
                        <span class="material-symbols-rounded text-[15px]">replay</span>
                        <span>Retake Quiz</span>
                    </button>
                    <button
                        onclick={() => generateDynamicQuiz(brand.name, brand.description, true)}
                        disabled={isLoadingQuiz}
                        class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-text font-mono text-xs font-bold uppercase tracking-wider rounded-full transition cursor-pointer flex items-center gap-1.5 border border-black/5"
                    >
                        <span class="material-symbols-rounded text-[15px] {isLoadingQuiz ? 'animate-spin text-primary' : ''}">auto_awesome</span>
                        <span>New Questions</span>
                    </button>
                </div>
            </div>
        {/if}
    </div>

    <!-- DESKTOP DESCRIPTION WINDOW (HIDDEN ON MOBILE) -->
    <div class="hidden md:flex w-68 shrink-0 bg-white p-4 shadow-xs border border-black/5 rounded-2xl flex-col justify-between h-full font-sans">
        <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between font-mono text-[9px] text-text/50 uppercase tracking-widest">
                <span class="text-primary font-bold">AI DYNAMIC</span>
                <span class="text-emerald-600 font-bold">LLAMA-3.3</span>
            </div>

            <h3 class="text-base font-extrabold uppercase tracking-tight text-text flex items-center justify-between">
                <span>Product Quiz</span>
                <span class="material-symbols-rounded text-[18px] text-primary">quiz</span>
            </h3>

            <p class="text-xs text-text/70 leading-relaxed">
                Automated dynamic trivia generated on-the-fly from the active brand profile to educate booth visitors.
            </p>

            <div class="p-2 bg-slate-50 border border-black/5 rounded-xl font-mono text-[9px] text-text/70">
                <div class="flex items-center justify-between font-bold text-text mb-0.5">
                    <span>ACTIVE TARGET</span>
                    <span class="text-primary truncate max-w-[100px]">{brand.name}</span>
                </div>
                <p class="text-[8px] text-text/50 line-clamp-2 leading-tight font-sans">
                    {brand.description}
                </p>
            </div>

            <div class="grid grid-cols-2 gap-2 pt-1 mt-0.5 border-t border-black/5 font-mono text-[10px]">
                <div class="p-1.5 bg-black/[0.02] rounded-lg flex flex-col">
                    <span class="text-text/40 text-[8px] uppercase">ITEMS</span>
                    <span class="font-bold text-text">{questions.length} PROMPTS</span>
                </div>
                <div class="p-1.5 bg-black/[0.02] rounded-lg flex flex-col">
                    <span class="text-text/40 text-[8px] uppercase">ENGINE</span>
                    <span class="font-bold text-primary">REST API</span>
                </div>
            </div>
        </div>

        <div class="flex flex-col gap-1.5 mt-3">
            <button
                onclick={() => generateDynamicQuiz(brand.name, brand.description, true)}
                disabled={isLoadingQuiz}
                class="w-full py-2 bg-primary hover:bg-primary/90 text-white font-mono text-[11px] font-bold uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
                <span class="material-symbols-rounded text-[14px] {isLoadingQuiz ? 'animate-spin' : ''}">auto_awesome</span>
                <span>{isLoadingQuiz ? "Generating AI Quiz..." : "Regenerate AI Quiz"}</span>
            </button>
            <button
                onclick={restartQuiz}
                class="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-text/70 hover:text-text font-mono text-[10px] font-bold uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
            >
                <span class="material-symbols-rounded text-[13px]">replay</span>
                <span>Reset Current Quiz</span>
            </button>
        </div>
    </div>
</div>
