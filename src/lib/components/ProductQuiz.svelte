<script lang="ts">
    interface QuizQuestion {
        id: number;
        question: string;
        options: string[];
        correctIndex: number;
        explanation: string;
    }

    const questions: QuizQuestion[] = [
        {
            id: 1,
            question: "Which feature maximizes trade show booth visitor retention?",
            options: [
                "Passive brochure handouts",
                "Interactive gamified kiosks & live leaderboards",
                "Static printed backdrop walls",
                "Pre-recorded non-interactive video loops"
            ],
            correctIndex: 1,
            explanation: "Interactive kiosks increase visitor dwell time by up to 340% and capture 4x more qualified leads."
        },
        {
            id: 2,
            question: "What is the primary benefit of real-time 3D booth configurators?",
            options: [
                "Instant photorealistic spatial previews with true scale",
                "Higher printing costs",
                "Requires physical scale models",
                "Limited view angles"
            ],
            correctIndex: 0,
            explanation: "Real-time 3D allows stakeholders to inspect booths from any isometric or first-person perspective before fabrication."
        },
        {
            id: 3,
            question: "How do synchronized live leaderboards drive event competition?",
            options: [
                "By hiding participant scores",
                "Through low-latency WebSocket live rank streaming across displays",
                "By updating scores once a week",
                "Manual chalkboard scoring"
            ],
            correctIndex: 1,
            explanation: "WebSocket-driven live leaderboards broadcast scores in under 12ms to all venue displays, sparking viral engagement."
        },
        {
            id: 4,
            question: "What average latency makes reaction-time mini-games feel instant?",
            options: [
                "500 to 1000 milliseconds",
                "Sub-5 millisecond capacitive response",
                "3 to 5 seconds",
                "Over 1 minute"
            ],
            correctIndex: 1,
            explanation: "High-precision 1000Hz polling ensures zero perceived input lag on touchscreen and buzzer setups."
        }
    ];

    let currentQIndex = $state(0);
    let selectedOptionIndex = $state<number | null>(null);
    let isAnswered = $state(false);
    let score = $state(0);
    let isQuizComplete = $state(false);

    const currentQuestion = $derived(questions[currentQIndex]);

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
    <div class="flex-1 w-full h-full flex flex-col justify-between p-2.5 sm:p-3.5 md:p-4 bg-white/40 border border-black/5 overflow-hidden font-mono">
        {#if !isQuizComplete}
            <!-- Question Header HUD -->
            <div class="flex items-center justify-between pb-1.5 sm:pb-2 border-b border-black/5 shrink-0 text-xs">
                <div class="flex items-center gap-1.5 sm:gap-2">
                    <span class="px-2 py-0.5 bg-primary text-white font-bold text-[9px] sm:text-[10px] uppercase tracking-wider">
                        Q_0{currentQIndex + 1} / 0{questions.length}
                    </span>
                    <span class="text-text/50 font-mono text-[9px] sm:text-[11px] hidden xs:inline">KNOWLEDGE TEST</span>
                </div>
                <div class="flex items-center gap-1 font-bold text-secondary text-[10px] sm:text-[11px]">
                    <span class="material-symbols-outlined text-[13px] sm:text-[14px] text-primary">stars</span>
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
                            class="p-2 sm:p-2.5 text-left text-xs transition-all flex items-start gap-2 border cursor-pointer disabled:cursor-default {isAnswered
                                ? isCorrect
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                                    : isSelected
                                      ? 'bg-rose-50 border-rose-500 text-rose-950'
                                      : 'bg-white/60 border-black/5 text-text/40 opacity-60'
                                : 'bg-white hover:bg-slate-50 border-black/5 text-text hover:border-primary/50 shadow-xs'}"
                        >
                            <span class="size-4 shrink-0 flex items-center justify-center font-bold text-[9px] sm:text-[10px] {isAnswered && isCorrect ? 'bg-emerald-500 text-white' : isAnswered && isSelected ? 'bg-rose-500 text-white' : 'bg-black/5 text-text/60'}">
                                {String.fromCharCode(65 + idx)}
                            </span>
                            <span class="font-sans text-[10px] sm:text-[11px] leading-tight select-none">{option}</span>
                        </button>
                    {/each}
                </div>

                {#if isAnswered}
                    <div class="mt-2 p-1.5 sm:p-2 bg-slate-50 border-l-2 {selectedOptionIndex === currentQuestion.correctIndex ? 'border-l-emerald-500 text-emerald-900' : 'border-l-rose-500 text-rose-900'} text-[10px] sm:text-[11px] font-sans flex items-start gap-1.5">
                        <span class="material-symbols-outlined text-[14px] sm:text-[15px] shrink-0 {selectedOptionIndex === currentQuestion.correctIndex ? 'text-emerald-600' : 'text-rose-600'}">
                            {selectedOptionIndex === currentQuestion.correctIndex ? 'check_circle' : 'info'}
                        </span>
                        <p class="leading-tight">{currentQuestion.explanation}</p>
                    </div>
                {/if}
            </div>

            <!-- Footer Action Controls -->
            <div class="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-black/5 shrink-0">
                <span class="text-[8px] sm:text-[9px] text-text/40 uppercase tracking-wider">
                    {isAnswered ? "LOCKED" : "TAP AN OPTION"}
                </span>

                {#if isAnswered}
                    <button
                        onclick={nextQuestion}
                        class="px-3 sm:px-4 py-1 sm:py-1.5 bg-primary hover:bg-primary/90 text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                        <span>{currentQIndex < questions.length - 1 ? "Next" : "Results"}</span>
                        <span class="material-symbols-outlined text-[13px] sm:text-[14px]">arrow_forward</span>
                    </button>
                {/if}
            </div>
        {:else}
            <!-- Final Results Stage -->
            <div class="w-full h-full flex flex-col items-center justify-center p-3 sm:p-4 text-center font-sans">
                <span class="material-symbols-outlined text-[36px] sm:text-[44px] text-primary mb-0.5">
                    psychology
                </span>
                <span class="font-mono text-[9px] sm:text-[10px] text-text/50 uppercase tracking-widest">ASSESSMENT COMPLETE</span>
                <h4 class="text-lg sm:text-2xl font-black uppercase text-text tracking-tight mt-0.5">
                    Product Mastery Score
                </h4>

                <div class="text-3xl sm:text-4xl font-black text-secondary font-mono my-1 sm:my-2">
                    {score} <span class="text-xs sm:text-sm font-normal text-text/40">/ 1000 PTS</span>
                </div>

                <div class="p-2 sm:p-2.5 bg-white border border-black/5 shadow-xs max-w-sm w-full mb-2 sm:mb-3 text-left">
                    <div class="flex items-center justify-between text-[10px] sm:text-[11px] font-mono mb-0.5">
                        <span class="text-text/50">RECOMMENDATION:</span>
                        <span class="font-bold text-primary">TIER 1 SPATIAL TECH</span>
                    </div>
                    <p class="text-[11px] sm:text-xs text-text/70 leading-relaxed font-sans">
                        Deploy Ekson 3D Virtual Tour & Synchronized Leaderboards for peak booth ROI.
                    </p>
                </div>

                <button
                    onclick={restartQuiz}
                    class="px-5 sm:px-6 py-1.5 sm:py-2 bg-primary hover:bg-primary/90 text-white font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-primary/20"
                >
                    <span class="material-symbols-outlined text-[15px]">replay</span>
                    <span>Retake Quiz</span>
                </button>
            </div>
        {/if}
    </div>

    <!-- DESKTOP DESCRIPTION WINDOW (HIDDEN ON MOBILE) -->
    <div class="hidden md:flex w-68 shrink-0 bg-white p-4 shadow-xs border border-black/5 flex-col justify-between h-full font-sans">
        <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between font-mono text-[9px] text-text/50 uppercase tracking-widest">
            
                <span class="text-primary font-bold">INTERACTIVE</span>
            </div>

            <h3 class="text-base font-extrabold uppercase tracking-tight text-text flex items-center justify-between">
                <span>Product Quiz</span>
                <span class="material-symbols-outlined text-[18px] text-primary">quiz</span>
            </h3>

            <p class="text-xs text-text/70 leading-relaxed">
                Smart interactive trivia & discovery engine designed to educate booth visitors on product value props.
            </p>

            <div class="grid grid-cols-2 gap-2 pt-2 mt-1 border-t border-black/5 font-mono text-[10px]">
                <div class="p-1.5 bg-black/[0.02] flex flex-col">
                    <span class="text-text/40 text-[8px] uppercase">ITEMS</span>
                    <span class="font-bold text-text">4 PROMPTS</span>
                </div>
                <div class="p-1.5 bg-black/[0.02] flex flex-col">
                    <span class="text-text/40 text-[8px] uppercase">ANALYTICS</span>
                    <span class="font-bold text-primary">INSTANT</span>
                </div>
            </div>
        </div>

        <button
            onclick={restartQuiz}
            class="mt-3 w-full py-2 bg-primary hover:bg-primary/90 text-white font-mono text-[11px] font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
        >
            <span class="material-symbols-outlined text-[14px]">replay</span>
            <span>{isQuizComplete ? "Restart Quiz" : "Reset Test"}</span>
        </button>
    </div>
</div>
