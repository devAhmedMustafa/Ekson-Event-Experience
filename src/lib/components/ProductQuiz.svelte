<script lang="ts">
    import { onMount } from "svelte";
    import { brand } from "$lib/brand.svelte";

    interface QuizQuestion {
        id: number;
        question: string;
        options: string[];
        correctIndex: number;
        explanation: string;
    }

    const LETTERS = ["A", "B", "C", "D"];

    function generateSmartBrandFallback(bName: string, bDesc: string): QuizQuestion[] {
        const cleanDesc = (bDesc || "").replace(/\r?\n|\r/g, " ").trim();
        const shortDesc = cleanDesc.length > 60 ? cleanDesc.slice(0, 60) + "..." : cleanDesc || "Interactive 3D WebGL event showcase";

        return [
            {
                id: 1,
                question: `What is the core focus of ${bName}?`,
                options: [
                    `${shortDesc}`,
                    "Manual print booklets only",
                    "Offline static exhibits",
                    "Analog catalog distribution"
                ],
                correctIndex: 0,
                explanation: `${bName} provides ${shortDesc}`
            },
            {
                id: 2,
                question: `How are ${bName}'s spatial elements customized?`,
                options: [
                    "Vinyl stickers",
                    "Real-Time Dynamic Color & Logo Bindings",
                    "Manual spray painting",
                    "Fixed offline templates"
                ],
                correctIndex: 1,
                explanation: `${bName} utilizes real-time state reactivity to update logos and accent colors dynamically.`
            },
            {
                id: 3,
                question: `What mode enables 1:1 scale navigation of ${bName} stands?`,
                options: [
                    "2D Blueprint Mode",
                    "First-Person Real-Time Walkthrough",
                    "Static Snapshot",
                    "Aerial Orbit"
                ],
                correctIndex: 1,
                explanation: "First-Person Mode allows visitors to explore stands at true 1:1 metric human scale."
            },
            {
                id: 4,
                question: `What key value differentiates ${bName}?`,
                options: [
                    "Long setup latency",
                    "Interactive 3D WebGL experience with instant brand customization",
                    "High print brochure costs",
                    "Limited static views"
                ],
                correctIndex: 1,
                explanation: `Interactive spatial demonstrations provide maximum engagement for ${bName}'s visitors.`
            }
        ];
    }

    let questions = $state<QuizQuestion[]>(generateSmartBrandFallback(brand.name, brand.description));
    let isLoadingQuiz = $state(false);

    let currentQIndex = $state(0);
    let selectedOptionIndex = $state<number | null>(null);
    let isAnswered = $state(false);
    let score = $state(0);
    let correctCount = $state(0);
    let isQuizComplete = $state(false);

    let showOverlay = $state(true);
    let overlayTitle = $state("Product Quiz");
    let overlayBody = $state(`Four questions about ${brand.name || "the brand"}. Answer correctly to earn points.`);
    let overlayCta = $state("Start");

    const currentQuestion = $derived(questions[currentQIndex] || questions[0]);

    function selectOption(index: number) {
        if (isAnswered) return;
        selectedOptionIndex = index;
        isAnswered = true;

        if (index === currentQuestion.correctIndex) {
            score += 25;
            correctCount += 1;
        }

        setTimeout(() => {
            nextQuestion();
        }, 2000);
    }

    function nextQuestion() {
        if (currentQIndex < questions.length - 1) {
            currentQIndex += 1;
            selectedOptionIndex = null;
            isAnswered = false;
        } else {
            finishQuiz();
        }
    }

    function finishQuiz() {
        isQuizComplete = true;
        showOverlay = true;
        overlayTitle = `${score} / 100 points`;
        overlayBody = `You got ${correctCount} of ${questions.length} correct. Ask the attendant if you want to learn more about ${brand.name || "our products"}.`;
        overlayCta = "Retake quiz";
    }

    function resetQuiz() {
        currentQIndex = 0;
        selectedOptionIndex = null;
        isAnswered = false;
        score = 0;
        correctCount = 0;
        isQuizComplete = false;
        showOverlay = false;
    }
</script>

<div class="relative w-full h-full flex flex-col justify-between overflow-hidden bg-slate-950 text-white font-sans select-none p-3.5">
    <!-- Phone Top HUD Stats Bar Overlay -->
    <div class="pt-8 pr-9 flex items-center gap-1.5 z-20 pointer-events-none">
        <div class="flex-1 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white text-center flex items-center justify-between">
            <span class="text-[10px] text-white/70 font-medium">Question</span>
            <strong class="text-xs font-bold">{currentQIndex + 1} / {questions.length}</strong>
        </div>
        <div class="flex-1 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white text-center flex items-center justify-between">
            <span class="text-[10px] text-white/70 font-medium">Score</span>
            <strong class="text-xs font-bold text-emerald-400">{score} PTS</strong>
        </div>
    </div>

    <!-- Quiz Active Screen Viewport -->
    {#if !showOverlay}
        <div class="my-auto py-2 flex flex-col gap-2.5 z-10 overflow-y-auto max-h-[300px] scrollbar-none">
            <h4 class="text-xs font-bold leading-snug font-sans text-white">
                {currentQuestion.question}
            </h4>

            <!-- Options List (Vertical stacked inside iPhone phone screen) -->
            <div class="flex flex-col gap-1.5">
                {#each currentQuestion.options as option, idx}
                    {@const isSelected = selectedOptionIndex === idx}
                    {@const isCorrect = idx === currentQuestion.correctIndex}
                    
                    <button
                        onclick={() => selectOption(idx)}
                        disabled={isAnswered}
                        class="p-2.5 text-left transition-all flex items-center gap-2 border cursor-pointer rounded-2xl disabled:cursor-default text-[11px] font-sans {isAnswered
                            ? isCorrect
                                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                                : isSelected
                                  ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                                  : 'bg-white/5 border-white/5 text-white/30'
                            : 'bg-white/10 hover:bg-white/20 border-white/10 text-white'}"
                    >
                        <span class="size-5 shrink-0 flex items-center justify-center font-bold text-[10px] rounded-full {isAnswered && isCorrect ? 'bg-emerald-500 text-white' : isAnswered && isSelected ? 'bg-rose-500 text-white' : 'bg-white/20 text-white'}">
                            {LETTERS[idx]}
                        </span>
                        <span class="leading-tight truncate">{option}</span>
                    </button>
                {/each}
            </div>

            {#if isAnswered}
                <div class="p-2.5 bg-white/10 border-l-2 rounded-r-xl text-[10px] leading-relaxed font-sans {selectedOptionIndex === currentQuestion.correctIndex ? 'border-l-emerald-400 text-emerald-200' : 'border-l-rose-400 text-rose-200'}">
                    {currentQuestion.explanation}
                </div>
            {/if}
        </div>
    {/if}

    <!-- Phone Prompt Bar at Bottom -->
    {#if !showOverlay}
        <div class="mb-4 z-20 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-white/10 text-white/70 text-[10px] font-medium text-center pointer-events-none">
            {isAnswered ? "Next question loading..." : "Pick an answer"}
        </div>
    {/if}

    <!-- Phone Overlay Modal (Start / Quiz Result) -->
    {#if showOverlay}
        <div class="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white">
            <h4 class="text-2xl font-bold tracking-tight mb-2 text-emerald-400">
                {overlayTitle}
            </h4>
            <p class="text-xs text-white/80 leading-relaxed max-w-[22ch] mb-4">
                {overlayBody}
            </p>
            <button
                onclick={resetQuiz}
                class="px-6 py-2.5 rounded-full font-semibold text-xs text-white transition hover:scale-105 cursor-pointer border border-white/20"
                style="background-color: {brand.primaryColor || '#009dd6'};"
            >
                {overlayCta}
            </button>
        </div>
    {/if}
</div>
