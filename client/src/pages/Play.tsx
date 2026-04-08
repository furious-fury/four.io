import {
  CPU,
  HUMAN,
  createEmptyBoard,
  dropPiece,
  getDropRow,
  type Board,
  type Difficulty,
  getOutcome,
} from "@four.io/game-logic";
import { useQueryClient } from "@tanstack/react-query";
import { Home, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { apiUrl } from "../apiUrl";
import { leaderboardKeys } from "../queries/leaderboard";
import { Board as GameBoard } from "../components/Board";
import { GameOverOverlay } from "../components/GameOverOverlay";
import { SubmitScoreOverlay } from "../components/SubmitScoreOverlay";

type Terminal =
  | { kind: "human"; cells: { row: number; col: number }[] | null }
  | { kind: "cpu"; cells: { row: number; col: number }[] | null }
  | { kind: "draw"; cells: null };

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

export function Play() {
  const queryClient = useQueryClient();
  const workerRef = useRef<Worker | null>(null);
  const [phase, setPhase] = useState<"pick" | "playing">("pick");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [board, setBoard] = useState<Board>(() => createEmptyBoard());
  const [moves, setMoves] = useState<number[]>([]);
  const [seed, setSeed] = useState(0);
  const [gameId, setGameId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [highlightCol, setHighlightCol] = useState<number | null>(null);
  const [lastDrop, setLastDrop] = useState<{ row: number; col: number } | null>(null);
  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);

  useEffect(() => {
    const w = new Worker(new URL("../workers/cpu.worker.ts", import.meta.url), {
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
  }, []);

  async function startMatch(d: Difficulty) {
    setDifficulty(d);
    const g = await fetchNewGame();
    setSeed(g.seed);
    setGameId(g.gameId);
    setBoard(createEmptyBoard());
    setMoves([]);
    setTerminal(null);
    setSubmitOpen(false);
    setLastDrop(null);
    setPhase("playing");
  }

  function confirmNewGame() {
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
    [difficulty, seed]
  );

  async function onColumnClick(col: number) {
    if (phase !== "playing" || busy || terminal) return;
    const w = workerRef.current;
    if (!w) return;

    setBusy(true);
    try {
      const row = getDropRow(board, col);
      if (row === null || row < 0) return;
      const next = dropPiece(board, col, HUMAN);
      if (!next) return;
      setBoard(next);
      setLastDrop({ row, col });
      setMoves((prev) => [...prev, col]);
      const hPos = { r: row, c: col };

      const o = getOutcome(next, row, col, HUMAN);
      if (o.winner === HUMAN) {
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
  }

  async function submitScore(name: string) {
    const r = await fetch(apiUrl("/api/scores"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: name.trim(),
        difficulty,
        moves,
        seed,
        gameId,
      }),
    });
    const data = (await r.json().catch(() => ({}))) as { error?: string };
    if (!r.ok) {
      const msg =
        data.error === "name_taken_not_better"
          ? "That name is taken with a higher or equal score."
          : data.error === "invalid_name"
            ? "Invalid name (2–24 chars, letters, numbers, spaces, _ -)."
            : data.error ?? `Error ${r.status}`;
      return { ok: false as const, error: msg };
    }
    await queryClient.invalidateQueries({ queryKey: leaderboardKeys.all });
    return { ok: true as const };
  }

  const winCells =
    terminal?.kind === "human" || terminal?.kind === "cpu" ? terminal.cells : null;

  return (
    <div className="space-y-8">
      <div className="glass-panel p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-white md:text-3xl">Play</h1>
            {phase === "playing" && !terminal ? (
              <p className="mt-1 text-sm text-white/65">
                {busy ? "CPU is thinking…" : "Your turn — pick a column."} ·{" "}
                <span className="capitalize text-amber-200/90">{difficulty}</span>
              </p>
            ) : (
              <p className="mt-1 text-sm text-white/65">Choose a difficulty to begin.</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={confirmNewGame}
              className="btn-pill-outline"
            >
              <RotateCcw className="size-4" />
              New game
            </button>
            <Link to="/leaderboard" className="btn-pill-outline">
              Hall of Fame
            </Link>
            <Link to="/" className="rounded-full px-3 py-2 text-sm text-white/55 transition hover:text-white">
              <Home className="mr-1 inline size-4 align-text-bottom" />
              Home
            </Link>
          </div>
        </div>
      </div>

      {phase === "pick" ? (
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
        <div className="glass-panel p-4 sm:p-6">
          <GameBoard
            board={board}
            onColumnClick={(c) => void onColumnClick(c)}
            onColumnHover={setHighlightCol}
            disabled={busy || !!terminal}
            winningCells={winCells}
            highlightCol={highlightCol}
            lastDrop={lastDrop}
          />
        </div>
      )}

      {phase === "playing" && !terminal ? (
        <p className="text-center text-xs text-white/45">
          You are red · CPU is yellow · Columns fill from the bottom
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
              ? "Submit your score to the Hall of Fame."
              : terminal.kind === "cpu"
                ? "Try again with a different strategy."
                : "The board is full."
          }
          humanWon={terminal.kind === "human"}
          onPlayAgain={resetToPick}
          onSubmitScore={terminal.kind === "human" ? () => setSubmitOpen(true) : undefined}
        />
      ) : null}

      {submitOpen && terminal?.kind === "human" ? (
        <SubmitScoreOverlay
          onClose={() => setSubmitOpen(false)}
          onSubmit={submitScore}
        />
      ) : null}
    </div>
  );
}
