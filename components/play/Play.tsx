"use client";

import {
  CPU,
  HUMAN,
  cloneBoard,
  createEmptyBoard,
  dropPiece,
  getDropRow,
  type Board,
  type Difficulty,
  getOutcome,
  getLegalColumns,
} from "@/game-logic";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Home, RotateCcw, Undo2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiUrl } from "@/lib/apiUrl";
import { LAST_SUBMITTED_NAME_KEY, normalizeDisplayName } from "@/lib/displayName";
import { recordMatchOutcome } from "@/lib/localStats";
import { Board as GameBoard } from "@/components/Board";
import { GameOverOverlay } from "@/components/GameOverOverlay";
import { ChangeDifficultyModal } from "@/components/play/ChangeDifficultyModal";
import { ProSidebar } from "@/components/play/ProSidebar";
import { SubmitScoreOverlay } from "@/components/SubmitScoreOverlay";
import { type DailyMeta, dailyKeys } from "@/queries/daily";
import { leaderboardKeys } from "@/queries/leaderboard";
import { useSound } from "@/sound/SoundProvider";

type Terminal =
  | { kind: "human"; cells: { row: number; col: number }[] | null }
  | { kind: "cpu"; cells: { row: number; col: number }[] | null }
  | { kind: "draw"; cells: null };

export type PlayProps = {
  mode?: "arcade" | "daily";
  dailyMeta?: DailyMeta;
};

async function fetchNewGame(): Promise<{ gameId: string; seed: number }> {
  try {
    const r = await fetch(apiUrl("/api/games"), { method: "POST" });
    if (!r.ok) throw new Error("bad");
    return r.json() as Promise<{ gameId: string; seed: number }>;
  } catch {
    const seed = Math.floor(Math.random() * 0x7fffffff);
    return { gameId: "local", seed };
  }
}

function requestCpuMove(
  worker: Worker,
  board: Board,
  difficulty: Difficulty,
  seed: number,
  lastHuman: { r: number; c: number } | null
): Promise<number> {
  return new Promise((resolve, reject) => {
    const onMsg = (e: MessageEvent<{ col: number }>) => {
      worker.removeEventListener("message", onMsg);
      worker.removeEventListener("error", onErr);
      resolve(e.data.col);
    };
    const onErr = () => {
      worker.removeEventListener("message", onMsg);
      worker.removeEventListener("error", onErr);
      reject(new Error("worker"));
    };
    worker.addEventListener("message", onMsg);
    worker.addEventListener("error", onErr);
    worker.postMessage({
      board: board.map((row) => [...row]),
      difficulty,
      seed,
      lastHuman,
    });
  });
}

export function Play({ mode = "arcade", dailyMeta }: PlayProps = {}) {
  if (mode === "daily" && !dailyMeta) {
    throw new Error("Play requires dailyMeta when mode is daily");
  }

  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { playDrop, playWin, playLose } = useSound();
  const workerRef = useRef<Worker | null>(null);
  const recordedEndRef = useRef<string | null>(null);
  const matchEndedAtMsRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<"pick" | "playing">(mode === "daily" ? "playing" : "pick");
  const [difficulty, setDifficulty] = useState<Difficulty>(
    mode === "daily" && dailyMeta ? dailyMeta.difficulty : "medium"
  );
  const [board, setBoard] = useState<Board>(() => createEmptyBoard());
  const [moves, setMoves] = useState<number[]>([]);
  const [seed, setSeed] = useState(mode === "daily" && dailyMeta ? dailyMeta.seed : 0);
  const [gameId, setGameId] = useState<string | null>(() =>
    mode === "daily" && dailyMeta ? `daily:${dailyMeta.date}` : null
  );
  const [busy, setBusy] = useState(false);
  const [highlightCol, setHighlightCol] = useState<number | null>(null);
  const [lastDrop, setLastDrop] = useState<{ row: number; col: number } | null>(null);
  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [focusedCol, setFocusedCol] = useState<number | null>(null);
  const [undoStack, setUndoStack] = useState<{ board: Board; moves: number[] }[]>([]);
  const [hintsOn, setHintsOn] = useState(false);
  const [hintCol, setHintCol] = useState<number | null>(null);
  const [matchStartedAtMs, setMatchStartedAtMs] = useState<number | null>(() =>
    mode === "daily" ? Date.now() : null
  );
  const [proOpen, setProOpen] = useState(false);
  const [pendingDifficulty, setPendingDifficulty] = useState<Difficulty | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => {
      if (searchParams.get("pro") === "1") {
        setProOpen(true);
        return;
      }
      setProOpen(mq.matches);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [searchParams]);

  useEffect(() => {
    const w = new Worker(new URL("../../workers/cpu.worker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = w;
    return () => {
      w.terminate();
      workerRef.current = null;
    };
  }, []);

  const resetToPick = useCallback(() => {
    setPhase("pick");
    setBoard(createEmptyBoard());
    setMoves([]);
    setTerminal(null);
    setSubmitOpen(false);
    setBusy(false);
    setLastDrop(null);
    setUndoStack([]);
    setHintsOn(false);
    setHintCol(null);
    setFocusedCol(null);
    setMatchStartedAtMs(null);
    matchEndedAtMsRef.current = null;
  }, []);

  const restartDailyRound = useCallback(() => {
    if (mode !== "daily" || !dailyMeta) return;
    setBusy(true);
    setBoard(createEmptyBoard());
    setMoves([]);
    setTerminal(null);
    setSubmitOpen(false);
    setLastDrop(null);
    setUndoStack([]);
    setHintsOn(false);
    setHintCol(null);
    setFocusedCol(null);
    matchEndedAtMsRef.current = null;
    setSeed(dailyMeta.seed);
    setDifficulty(dailyMeta.difficulty);
    setGameId(`daily:${dailyMeta.date}`);
    setPhase("playing");
    setMatchStartedAtMs(Date.now());
    setBusy(false);
  }, [mode, dailyMeta]);

  const startMatch = useCallback(async (d: Difficulty) => {
    setDifficulty(d);
    setBusy(true);
    setBoard(createEmptyBoard());
    setMoves([]);
    setTerminal(null);
    setSubmitOpen(false);
    setLastDrop(null);
    setUndoStack([]);
    setHintsOn(false);
    setHintCol(null);
    setFocusedCol(null);
    matchEndedAtMsRef.current = null;
    setPhase("playing");
    try {
      const g = await fetchNewGame();
      setSeed(g.seed);
      setGameId(g.gameId);
      setMatchStartedAtMs(Date.now());
    } finally {
      setBusy(false);
    }
  }, []);

  const handleProDifficulty = useCallback((d: Difficulty) => {
    if (d === difficulty) return;
    setPendingDifficulty(d);
  }, [difficulty]);

  function confirmNewGame() {
    if (mode === "daily") {
      if (phase === "playing" && !terminal) {
        if (!window.confirm("Reset today’s daily puzzle?")) return;
      }
      restartDailyRound();
      return;
    }
    if (phase === "playing" && !terminal) {
      if (!window.confirm("Abandon this match and start over?")) return;
    }
    resetToPick();
  }

  const runOneCpuTurn = useCallback(
    async (b: Board, lh: { r: number; c: number } | null) => {
      const w = workerRef.current;
      if (!w) return;
      const delayMs = 300 + Math.random() * 500;
      await new Promise((r) => setTimeout(r, delayMs));
      const col = await requestCpuMove(w, b, difficulty, seed, lh);
      const row = getDropRow(b, col);
      if (row === null || row < 0) {
        setTerminal({ kind: "draw", cells: null });
        return;
      }
      const after = dropPiece(b, col, CPU);
      if (!after) return;
      setBoard(after);
      playDrop();
      setLastDrop({ row, col });
      setMoves((prev) => [...prev, col]);
      const o = getOutcome(after, row, col, CPU);
      if (o.winner === CPU) {
        setTerminal({ kind: "cpu", cells: o.winningCells });
        return;
      }
      if (o.winner === "draw") {
        setTerminal({ kind: "draw", cells: null });
      }
    },
    [difficulty, seed, playDrop]
  );

  const onColumnClick = useCallback(
    async (col: number) => {
      if (phase !== "playing" || busy || terminal) return;
      const w = workerRef.current;
      if (!w) return;
      const row = getDropRow(board, col);
      if (row === null || row < 0) return;

      setUndoStack((s) => [...s, { board: cloneBoard(board), moves: [...moves] }]);
      setBusy(true);
      try {
        const next = dropPiece(board, col, HUMAN);
        if (!next) return;
        setBoard(next);
        playDrop();
        setLastDrop({ row, col });
        setMoves((prev) => [...prev, col]);
        const hPos = { r: row, c: col };

        const o = getOutcome(next, row, col, HUMAN);
        if (o.winner === HUMAN) {
          matchEndedAtMsRef.current = Date.now();
          setTerminal({ kind: "human", cells: o.winningCells });
          return;
        }
        if (o.winner === "draw") {
          setTerminal({ kind: "draw", cells: null });
          return;
        }

        await runOneCpuTurn(next, hPos);
      } catch (e) {
        console.error(e);
        setTerminal({ kind: "draw", cells: null });
      } finally {
        setBusy(false);
      }
    },
    [phase, busy, terminal, board, moves, runOneCpuTurn, playDrop]
  );

  useEffect(() => {
    if (!terminal) {
      recordedEndRef.current = null;
      return;
    }
    const sig = `${gameId ?? "local"}:${moves.length}:${terminal.kind}`;
    if (recordedEndRef.current === sig) return;
    recordedEndRef.current = sig;
    if (terminal.kind === "human") {
      playWin();
      recordMatchOutcome(difficulty, "win");
    } else if (terminal.kind === "cpu") {
      playLose();
      recordMatchOutcome(difficulty, "loss");
    } else {
      recordMatchOutcome(difficulty, "draw");
    }
  }, [terminal, gameId, moves.length, difficulty, playWin, playLose]);

  const onColumnClickRef = useRef(onColumnClick);
  onColumnClickRef.current = onColumnClick;

  const handleUndo = useCallback(() => {
    if (busy || terminal) return;
    setUndoStack((s) => {
      if (s.length === 0) return s;
      const snap = s[s.length - 1]!;
      setBoard(snap.board);
      setMoves(snap.moves);
      setLastDrop(null);
      return s.slice(0, -1);
    });
  }, [busy, terminal]);

  useEffect(() => {
    if (phase !== "playing" || terminal || busy) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      let col: number | null = null;
      if (e.code.startsWith("Digit") && e.code.length === 6) {
        const n = Number(e.code.slice(5));
        if (n >= 1 && n <= 7) col = n - 1;
      } else if (e.code.startsWith("Numpad") && e.code.length === 7) {
        const n = Number(e.code.slice(6));
        if (n >= 1 && n <= 7) col = n - 1;
      }
      if (col === null) return;
      e.preventDefault();
      setFocusedCol(col);
      void onColumnClickRef.current(col);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, terminal, busy]);

  useEffect(() => {
    if (!hintsOn || phase !== "playing" || terminal || difficulty === "hard") {
      setHintCol(null);
      return;
    }
    const legal = getLegalColumns(board);
    if (legal.length === 0) {
      setHintCol(null);
      return;
    }
    setHintCol(legal[Math.floor(Math.random() * legal.length)]!);
  }, [hintsOn, phase, terminal, difficulty, board]);

  async function submitScore(name: string) {
    const startedAt = matchStartedAtMs ?? Date.now();
    const endedAt = matchEndedAtMsRef.current ?? Date.now();

    if (mode === "daily" && dailyMeta) {
      const r = await fetch(apiUrl("/api/daily/scores"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: name.trim(),
          moves,
          moveHistory: moves,
          seed,
          puzzleDate: dailyMeta.date,
          startedAt,
          endedAt,
        }),
      });
      const data = (await r.json().catch(() => ({}))) as { error?: string; rank?: number };
      if (!r.ok) {
        const msg =
          data.error === "rate_limited"
            ? "Too many submissions. Try again later."
            : data.error === "daily_not_improved"
              ? "Your existing daily result is already as good or better."
              : data.error === "daily_wrong_date"
                ? "This puzzle is no longer active (UTC day changed). Refresh the page."
                : data.error === "daily_wrong_seed"
                  ? "Puzzle data mismatch. Refresh and try again."
                  : data.error === "invalid_name"
                    ? "Invalid name (2–24 chars, letters, numbers, spaces, _ -)."
                    : data.error === "duration_implausible"
                      ? "That run finished too quickly to verify."
                      : data.error === "invalid_times"
                        ? "Invalid timestamps."
                        : data.error === "moves_moveHistory_mismatch"
                          ? "Move list mismatch."
                          : data.error ?? `Error ${r.status}`;
        return { ok: false as const, error: msg };
      }
      await queryClient.invalidateQueries({ queryKey: dailyKeys.all });
      return { ok: true as const };
    }

    const r = await fetch(apiUrl("/api/scores"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: name.trim(),
        difficulty,
        moves,
        moveHistory: moves,
        seed,
        gameId,
        startedAt,
        endedAt,
      }),
    });
    const data = (await r.json().catch(() => ({}))) as { error?: string };
    if (!r.ok) {
      const msg =
        data.error === "rate_limited"
          ? "Too many submissions. Try again later."
          : data.error === "name_taken_not_better"
            ? "That name is taken with a higher or equal score."
            : data.error === "invalid_name"
              ? "Invalid name (2–24 chars, letters, numbers, spaces, _ -)."
              : data.error === "duration_implausible"
                ? "That game finished too quickly to verify. Take your time on the next run."
                : data.error === "invalid_times"
                  ? "Invalid game timestamps. Try again from a fresh match."
                  : data.error === "moves_moveHistory_mismatch"
                    ? "Move list mismatch. Refresh and play again."
                    : data.error ?? `Error ${r.status}`;
      return { ok: false as const, error: msg };
    }
    await queryClient.invalidateQueries({ queryKey: leaderboardKeys.all });
    try {
      sessionStorage.setItem(LAST_SUBMITTED_NAME_KEY, normalizeDisplayName(name.trim()));
    } catch {
      /* ignore */
    }
    return { ok: true as const };
  }

  const winCells =
    terminal?.kind === "human" || terminal?.kind === "cpu" ? terminal.cells : null;
  const gameOver = terminal !== null;
  const gridClass =
    phase === "playing"
      ? proOpen
        ? "lg:grid lg:grid-cols-[1fr_minmax(260px,280px)] lg:items-start lg:gap-6"
        : "lg:grid lg:grid-cols-[1fr_auto] lg:items-start lg:gap-3"
      : "";

  return (
    <div className={gridClass}>
      <div className="min-w-0 space-y-8">
        <div className="glass-panel p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-semibold text-white md:text-3xl">
                {mode === "daily" ? "Daily puzzle" : "Play"}
              </h1>
              {mode === "daily" && dailyMeta ? (
                <p className="mt-1 text-xs text-white/50">
                  UTC {dailyMeta.date} · Everyone shares this seed · Resets {new Date(dailyMeta.closesAt).toUTCString()}
                </p>
              ) : null}
              {phase === "playing" && !terminal ? (
                <p className="mt-1 text-sm text-white/65">
                  {busy ? "CPU is thinking…" : "Your turn — pick a column."} ·{" "}
                  <span className="capitalize text-amber-200/90">{difficulty}</span>
                </p>
              ) : mode !== "daily" ? (
                <p className="mt-1 text-sm text-white/65">Choose a difficulty to begin.</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {phase === "playing" ? (
                <button
                  type="button"
                  onClick={() => setProOpen((o) => !o)}
                  className="btn-pill-outline"
                  aria-expanded={proOpen}
                >
                  Pro
                </button>
              ) : null}
              <button type="button" onClick={confirmNewGame} className="btn-pill-outline">
                <RotateCcw className="size-4" />
                New game
              </button>
              <Link href="/leaderboard" className="btn-pill-outline">
                Hall of Fame
              </Link>
              <Link
                href="/"
                className="rounded-full px-3 py-2 text-sm text-white/55 transition hover:text-white"
              >
                <Home className="mr-1 inline size-4 align-text-bottom" />
                Home
              </Link>
            </div>
          </div>
        </div>

        {mode !== "daily" && phase === "pick" ? (
          <div className="glass-panel flex flex-col gap-3 p-6 sm:flex-row sm:justify-center">
            {(["easy", "medium", "hard"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => void startMatch(d)}
                className="rounded-full border border-white/15 bg-white/5 px-10 py-4 text-sm font-semibold capitalize tracking-wide text-white transition hover:border-emerald-300/40 hover:bg-white/10"
              >
                {d}
              </button>
            ))}
          </div>
        ) : (
          <div id="play-game-board" className="glass-panel space-y-4 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
              <button
                type="button"
                disabled={busy || !!terminal || undoStack.length === 0}
                onClick={handleUndo}
                className="btn-pill-outline disabled:opacity-40"
              >
                <Undo2 className="size-4" aria-hidden />
                Undo last pair
              </button>
              {difficulty !== "hard" ? (
                <label className="flex cursor-pointer items-center gap-2 text-white/75">
                  <input
                    type="checkbox"
                    checked={hintsOn}
                    onChange={(e) => setHintsOn(e.target.checked)}
                    className="rounded border-white/30 bg-black/40 text-emerald-500"
                  />
                  Show hints
                </label>
              ) : null}
              <span className="text-xs text-white/45">Keys 1–7 · hover or focus columns</span>
            </div>
            <GameBoard
              board={board}
              onColumnClick={(c) => {
                setFocusedCol(c);
                void onColumnClick(c);
              }}
              onColumnHover={setHighlightCol}
              disabled={busy || !!terminal}
              winningCells={winCells}
              highlightCol={highlightCol}
              lastDrop={lastDrop}
              focusedCol={focusedCol}
              hintCol={hintsOn && difficulty !== "hard" ? hintCol : null}
            />
          </div>
        )}

        {phase === "playing" && !terminal ? (
          <p className="text-center text-xs text-white/45">
            You are red · CPU is yellow · Full columns show ×
          </p>
        ) : null}

        {terminal && !submitOpen ? (
          <GameOverOverlay
            title={
              terminal.kind === "human"
                ? "You win"
                : terminal.kind === "cpu"
                  ? "CPU wins"
                  : "Draw"
            }
            subtitle={
              terminal.kind === "human"
                ? mode === "daily"
                  ? "Submit to today’s Daily leaderboard (fewest plies wins; faster breaks ties)."
                  : "Submit your score to the Hall of Fame."
                : terminal.kind === "cpu"
                  ? "Try again with a different strategy."
                  : "The board is full."
            }
            humanWon={terminal.kind === "human"}
            showWinningLineHint={terminal.kind === "cpu"}
            canPeekBoard={terminal.kind === "human" || terminal.kind === "cpu"}
            shareMoves={moves}
            shareSeed={seed}
            onPlayAgain={mode === "daily" ? restartDailyRound : resetToPick}
            onSubmitScore={terminal.kind === "human" ? () => setSubmitOpen(true) : undefined}
          />
        ) : null}

        {submitOpen && terminal?.kind === "human" ? (
          <SubmitScoreOverlay onClose={() => setSubmitOpen(false)} onSubmit={submitScore} />
        ) : null}
      </div>

      {phase === "playing" && proOpen ? (
        <aside
          aria-label="Pro panel"
          className="hidden min-h-0 lg:sticky lg:top-6 lg:block lg:self-start"
        >
          <ProSidebar
            board={board}
            moves={moves}
            gameOver={gameOver}
            difficulty={difficulty}
            onDifficultyChange={handleProDifficulty}
            onClose={() => setProOpen(false)}
            showClose={false}
            difficultyLocked={mode === "daily"}
          />
        </aside>
      ) : null}

      {phase === "playing" && !proOpen ? (
        <button
          type="button"
          onClick={() => setProOpen(true)}
          className="sticky top-24 hidden max-h-[420px] shrink-0 self-start rounded-2xl border border-white/15 bg-white/5 px-3 py-6 text-xs font-bold uppercase tracking-widest text-white/70 hover:bg-white/10 lg:flex lg:flex-col lg:items-center"
          aria-label="Open Pro panel"
        >
          Pro
        </button>
      ) : null}

      {phase === "playing" && proOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close Pro panel"
            onClick={() => setProOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[75vh] overflow-y-auto rounded-t-3xl border border-white/15 border-b-0 bg-black/80 shadow-2xl backdrop-blur-md">
            <ProSidebar
              board={board}
              moves={moves}
              gameOver={gameOver}
              difficulty={difficulty}
              onDifficultyChange={handleProDifficulty}
              onClose={() => setProOpen(false)}
              showClose
              difficultyLocked={mode === "daily"}
            />
          </div>
        </div>
      ) : null}

      {pendingDifficulty ? (
        <ChangeDifficultyModal
          targetDifficulty={pendingDifficulty}
          onCancel={() => setPendingDifficulty(null)}
          onConfirm={() => {
            const d = pendingDifficulty;
            setPendingDifficulty(null);
            if (d) void startMatch(d);
          }}
        />
      ) : null}
    </div>
  );
}
