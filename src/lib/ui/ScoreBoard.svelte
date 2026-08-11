<script lang="ts">
    interface Player {
        rank: string;
        name: string;
        score: number;
        company: string;
        trend: "up" | "down" | "flat";
    }

    let activeTab = $state<"today" | "allTime">("today");

    let players = $state<Player[]>([
        { rank: "01", name: "Chen. Alex", score: 9840, company: "TechCorp Global", trend: "up" },
        { rank: "02", name: "Miller. Sarah", score: 9420, company: "Vertex Labs", trend: "flat" },
        { rank: "03", name: "Farooq. Omar", score: 9150, company: "Ekson Dynamics", trend: "up" },
        { rank: "04", name: "Rostova. Elena", score: 8790, company: "Nexus Media", trend: "down" },
        { rank: "05", name: "Davis. Liam", score: 8320, company: "Apex Digital Systems", trend: "up" },
    ]);

    function simulateScoreBoost() {
        const randomIndex = Math.floor(Math.random() * players.length);
        players[randomIndex].score += Math.floor(Math.random() * 300) + 100;
        players.sort((a, b) => b.score - a.score);
        players.forEach((p, idx) => (p.rank = `0${idx + 1}`));
    }
</script>

<div class="w-full h-full flex flex-col md:flex-row items-center justify-between p-4 md:p-6 gap-4 md:gap-6 select-none font-sans overflow-hidden">
    <!-- BIG INTERACTIVE MAIN STAGE (LEADERBOARD) -->
    <div class="flex-1 w-full h-full flex flex-col justify-between p-3 bg-white/40 border border-black/5 overflow-hidden font-mono">
        <!-- Table Header & Controls -->
        <div class="flex items-center justify-between pb-2 border-b border-black/5 shrink-0">
            <div class="flex items-center gap-2 text-[11px] uppercase tracking-wider text-text font-bold">
                <span class="size-2 bg-emerald-500 animate-pulse"></span>
                <span>LIVE TOURNAMENT RANKINGS</span>
            </div>
            <div class="flex bg-black/[0.04] text-[10px] font-bold">
                <button
                    onclick={() => (activeTab = "today")}
                    class="px-2.5 py-1 transition cursor-pointer {activeTab === 'today' ? 'bg-white text-text shadow-xs font-black' : 'text-text/60 hover:text-text'}"
                >
                    SESSION
                </button>
                <button
                    onclick={() => (activeTab = "allTime")}
                    class="px-2.5 py-1 transition cursor-pointer {activeTab === 'allTime' ? 'bg-white text-text shadow-xs font-black' : 'text-text/60 hover:text-text'}"
                >
                    ALL_TIME
                </button>
            </div>
        </div>

        <!-- Leaderboard Rows -->
        <div class="space-y-1.5 overflow-y-auto max-h-[260px] my-auto pr-1">
            {#each players as player (player.name)}
                <div class="flex items-center justify-between px-3 py-2 bg-white hover:bg-slate-50 transition text-xs shadow-xs border border-black/[0.03]">
                    <div class="flex items-center gap-3">
                        <span class="text-xs font-black text-text/40">{player.rank}</span>
                        <div class="flex flex-col">
                            <span class="font-bold text-text truncate max-w-[140px] md:max-w-[220px] tracking-tight">{player.name}</span>
                            <span class="text-[9px] text-text/40 uppercase">{player.company}</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 text-right">
                        <div>
                            <span class="font-black text-secondary text-sm font-mono">{player.score.toLocaleString()}</span>
                            <span class="text-[8px] text-text/40 block leading-none">PTS</span>
                        </div>
                        <span class="material-symbols-outlined text-[15px] {player.trend === 'up' ? 'text-emerald-600' : player.trend === 'down' ? 'text-rose-500' : 'text-text/30'}">
                            {player.trend === 'up' ? 'trending_up' : player.trend === 'down' ? 'trending_down' : 'trending_flat'}
                        </span>
                    </div>
                </div>
            {/each}
        </div>

        <div class="text-[9px] text-text/40 uppercase tracking-widest pt-1 border-t border-black/5 shrink-0">
            AUTO-SYNC INTERVAL: 500MS // LATENCY: &lt;12MS
        </div>
    </div>

    <!-- SEPARATE COMPACT DESCRIPTION WINDOW (NO COLLISION) -->
    <div class="w-full md:w-68 shrink-0 bg-white p-4 shadow-xs border border-black/5 flex flex-col justify-between h-auto md:h-full font-sans">
        <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between font-mono text-[9px] text-text/50 uppercase tracking-widest">
                <div class="flex items-center gap-1">
                    <span class="size-1.5 bg-primary"></span>
                    <span>MODULE // 02</span>
                </div>
                <span class="text-emerald-600 font-bold">STREAMING</span>
            </div>

            <h3 class="text-base font-extrabold uppercase tracking-tight text-text flex items-center justify-between">
                <span>Live Leaderboard</span>
                <span class="material-symbols-outlined text-[18px] text-primary">leaderboard</span>
            </h3>

            <p class="text-xs text-text/70 leading-relaxed">
                Multi-display synchronized tournament tracking engine with real-time score streaming.
            </p>

            <div class="grid grid-cols-2 gap-2 pt-2 mt-1 border-t border-black/5 font-mono text-[10px]">
                <div class="p-1.5 bg-black/[0.02] flex flex-col">
                    <span class="text-text/40 text-[8px] uppercase">PROTOCOL</span>
                    <span class="font-bold text-text">WEBSOCKET</span>
                </div>
                <div class="p-1.5 bg-black/[0.02] flex flex-col">
                    <span class="text-text/40 text-[8px] uppercase">DISPLAYS</span>
                    <span class="font-bold text-primary">UNLIMITED</span>
                </div>
            </div>
        </div>

        <button
            onclick={simulateScoreBoost}
            class="mt-3 w-full py-2 bg-primary hover:bg-primary/90 text-white font-mono text-[11px] font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
        >
            <span class="material-symbols-outlined text-[14px]">swap_vert</span>
            <span>Update Live Scores</span>
        </button>
    </div>
</div>
