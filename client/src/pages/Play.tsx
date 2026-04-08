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
} from "@four.io/game-logic";
import { useQueryClient } from "@tanstack/react-query";
import { Home, RotateCcw, Undo2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { apiUrl } from "../apiUrl";
import { LAST_SUBMITTED_NAME_KEY, normalizeDisplayName } from "../lib/displayName";
import { leaderboardKeys } from "../queries/leaderboard";
import { Board as GameBoard } from "../components/Board";
import { GameOverOverlay } from "../components/GameOverOverlay";
import { SubmitScoreOverlay } from "../components/SubmitScoreOverlay";
import { recordMatchOutcome } from "../lib/localStats";
import { useSound } from "../sound/SoundProvider";

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
  const { playDrop, playWin, playLose } = useSound();
  const workerRef = useRef<Worker | null>(null);
  const recordedEndRef = useRef<string | null>(null);
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
  const [focusedCol, setFocusedCol] = useState<number | null>(null);
  /** Snapshots before each human move; undo restores last snapshot (before human+CPU pair). */
  const [undoStack, setUndoStack] = useState<{ board: Board; moves: number[] }[]>([]);
  const [hintsOn, setHintsOn] = useState(false);
  const [hintCol, setHintCol] = useState<number | null>(null);

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
    setUndoStack([]);
    setHintsOn(false);
    setHintCol(null);
    setFocusedCol(null);
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
    setUndoStack([]);
    setHintsOn(false);
    setHintCol(null);
    setFocusedCol(null);
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
    try {
      sessionStorage.setItem(LAST_SUBMITTED_NAME_KEY, normalizeDisplayName(name.trim()));
    } catch {
      /* ignore quota / private mode */
    }
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
        <div className="glass-panel space-y-4 p-4 sm:p-6">
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
