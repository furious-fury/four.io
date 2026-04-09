import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  BASE_POINTS,
  BONUS_CAP,
  BONUS_WEIGHT,
  COLS,
  ROWS,
  type Difficulty,
} from "@/game-logic";

function ScoreTable() {
  const difficulties: Difficulty[] = ["easy", "medium", "hard"];
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/20">
      <table className="w-full min-w-[280px] text-left text-sm text-white/90">
        <thead>
          <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/55">
            <th className="px-4 py-3 font-semibold">Difficulty</th>
            <th className="px-4 py-3 font-semibold">Base points</th>
            <th className="px-4 py-3 font-semibold">Bonus weight</th>
          </tr>
        </thead>
        <tbody>
          {difficulties.map((d) => (
            <tr key={d} className="border-b border-white/5 capitalize last:border-0">
              <td className="px-4 py-3">{d}</td>
              <td className="px-4 py-3 tabular-nums">{BASE_POINTS[d]}</td>
              <td className="px-4 py-3 tabular-nums">{BONUS_WEIGHT[d]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-white/10 px-4 py-2 text-xs text-white/50">
        Bonus cap (all difficulties): <strong className="text-white/70">{BONUS_CAP}</strong> points.
      </p>
    </div>
  );
}

export function Help() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back home
        </Link>
      </div>

      <div className="glass-panel p-5 md:p-8">
        <h1 className="font-display text-3xl font-semibold text-white md:text-4xl">Rules &amp; help</h1>
        <p className="mt-3 max-w-2xl text-white/70">
          four.io is Connect 4 vs the CPU with a verified leaderboard. There are <strong className="text-white/90">no accounts</strong>{" "}
          so you can play immediately; scores are tied to the <strong className="text-white/90">display name</strong> you choose when
          you submit after a win.
        </p>
      </div>

      <section className="glass-panel space-y-4 p-5 md:p-7">
        <h2 className="font-display text-xl font-semibold text-white">How to play</h2>
        <ul className="list-inside list-disc space-y-2 text-sm text-white/75">
          <li>
            Board is <strong className="text-white/90">{COLS}×{ROWS}</strong> (standard Connect 4). You are red, the CPU is
            yellow. You move first.
          </li>
          <li>
            Click a column header (or press <strong className="text-white/90">1–7</strong>) to drop a piece. Pieces settle on the
            lowest free cell in that column.
          </li>
          <li>Connect four in a row — horizontally, vertically, or diagonally — to win.</li>
          <li>If the grid fills with no winner, the game is a draw (no score submission).</li>
          <li>Full columns are marked and cannot accept another piece.</li>
        </ul>
      </section>

      <section className="glass-panel space-y-4 p-5 md:p-7">
        <h2 className="font-display text-xl font-semibold text-white">CPU difficulties</h2>
        <ul className="list-inside list-disc space-y-2 text-sm text-white/75">
          <li>
            <strong className="text-white/90">Easy</strong> — legal moves chosen at random.
          </li>
          <li>
            <strong className="text-white/90">Medium</strong> — heuristic search (no deep lookahead).
          </li>
          <li>
            <strong className="text-white/90">Hard</strong> — minimax with alpha–beta pruning (heavier work runs in a web worker so
            the UI stays smooth).
          </li>
        </ul>
      </section>

      <section className="glass-panel space-y-4 p-5 md:p-7">
        <h2 className="font-display text-xl font-semibold text-white">Daily puzzle (UTC)</h2>
        <p className="text-sm text-white/75">
          The <Link href="/daily" className="text-emerald-300/90 underline-offset-2 hover:underline">Daily</Link> mode uses one{" "}
          <strong className="text-white/90">shared CPU seed per calendar day in UTC</strong>. Everyone faces the same randomness
          against <strong className="text-white/90">Hard</strong>. Wins can be submitted to the Daily board: ranking is{" "}
          <strong className="text-white/90">fewest plies first</strong>, then <strong className="text-white/90">fastest elapsed time</strong>{" "}
          as a tie-break. The server verifies moves and timestamps like the Hall of Fame. The puzzle identifier is public; fairness
          comes from replay checks, not hiding the seed.
        </p>
      </section>

      <section className="glass-panel space-y-4 p-5 md:p-7">
        <h2 className="font-display text-xl font-semibold text-white">How your score is calculated</h2>
        <p className="text-sm text-white/75">
          Only a <strong className="text-white/90">verified human win</strong> can create or update a Hall of Fame entry. The server
          replays your move list and checks that the CPU’s replies match what the official CPU would play for your difficulty and
          game seed.
        </p>
        <p className="text-sm text-white/75">
          Let <em className="text-white/85">P</em> be the total number of plies (half-moves) in your winning game — i.e. the length of
          your move list. The board has at most <strong className="text-white/90">42</strong> cells ({COLS}×{ROWS}), so a full game is
          at most 42 plies.
        </p>
        <ol className="list-inside list-decimal space-y-2 pl-1 text-sm text-white/75">
          <li>
            <strong className="text-white/90">Base points</strong> depend only on difficulty (see table below).
          </li>
          <li>
            <strong className="text-white/90">Bonus points</strong> reward shorter wins: we start from{" "}
            <code className="rounded bg-white/10 px-1 text-amber-200/90">42 − P</code>, multiply by a difficulty weight, round to the
            nearest integer, then <strong className="text-white/90">cap</strong> bonus at {BONUS_CAP} points.
          </li>
          <li>
            <strong className="text-white/90">Total score</strong> = base points + bonus points (this is what the leaderboard sorts
            by).
          </li>
        </ol>
        <p className="rounded-xl border border-white/10 bg-black/25 px-4 py-3 font-mono text-xs text-emerald-200/90 leading-relaxed">
          rawBonus = max(0, 42 − P) × bonusWeight[difficulty]
          <br />
          bonus = min({BONUS_CAP}, round(rawBonus))
          <br />
          totalScore = basePoints[difficulty] + bonus
        </p>
        <ScoreTable />
        <p className="text-xs text-white/50">
          Example (Hard): win in 10 plies → raw bonus = (42 − 10) × {BONUS_WEIGHT.hard} = 32 → total = {BASE_POINTS.hard} + 32 ={" "}
          {BASE_POINTS.hard + 32}.
        </p>
      </section>

      <section className="glass-panel space-y-4 p-5 md:p-7">
        <h2 className="font-display text-xl font-semibold text-white">Hall of Fame &amp; display names</h2>
        <ul className="list-inside list-disc space-y-2 text-sm text-white/75">
          <li>
            The leaderboard shows the top entries per view (default up to 50). You can filter by <strong className="text-white/90">All / Easy / Medium / Hard</strong>; ranks are <em>within that filter</em>, not necessarily global across all difficulties.
          </li>
          <li>
            Display names are <strong className="text-white/90">normalized</strong> for comparison: trimmed, lowercased, and
            consecutive spaces collapsed to one (e.g. <code className="rounded bg-white/10 px-1">Fury</code> and{" "}
            <code className="rounded bg-white/10 px-1">fury</code> are the same slot).
          </li>
          <li>
            Names must be <strong className="text-white/90">2–24 characters</strong> and may use letters (any language), numbers,
            spaces, underscores, and hyphens.
          </li>
          <li>
            <strong className="text-white/90">One row per normalized name.</strong> If that name already exists, you can only replace
            it with a <strong className="text-white/90">strictly higher</strong> total score. Otherwise you’ll see: &quot;That name
            is taken with a higher or equal score.&quot; Pick a different name or earn a better run on the same difficulty rules.
          </li>
          <li>Losses and draws are not submitted; only wins count toward the Hall of Fame.</li>
        </ul>
      </section>

      <section className="glass-panel space-y-4 p-5 md:p-7">
        <h2 className="font-display text-xl font-semibold text-white">Fair play &amp; limits</h2>
        <ul className="list-inside list-disc space-y-2 text-sm text-white/75">
          <li>The server validates every submission; you cannot post a fake win by editing the client.</li>
          <li>Starting games and submitting scores are rate-limited to reduce abuse.</li>
          <li>
            <Link
              href="/replay?moves=0,1,2,3,4,5,6"
              className="text-emerald-300 underline decoration-emerald-500/50 underline-offset-2 hover:text-emerald-200"
            >
              Replay
            </Link>{" "}
            URLs rebuild a board from a query like{" "}
            <code className="rounded bg-white/10 px-1">?moves=0,1,2,3,4,5,6</code> (column indices 0–6 per ply, human
            then CPU) for fun or sharing — they do <strong className="text-white/90">not</strong> prove a score by
            themselves.
          </li>
        </ul>
      </section>

      <section className="glass-panel space-y-4 p-5 md:p-7">
        <h2 className="font-display text-xl font-semibold text-white">Tips in the app</h2>
        <ul className="list-inside list-disc space-y-2 text-sm text-white/75">
          <li>
            <strong className="text-white/90">Undo</strong> (after the CPU has replied) backs up one full human+CPU exchange for casual
            play. It does not change verification — only the final move list you submit matters.
          </li>
          <li>
            <strong className="text-white/90">Hints</strong> (Easy / Medium) highlight a random legal column as a nudge, not an
            optimal solver.
          </li>
          <li>
            Local win/loss/draw stats on the home page are stored in your browser only; they are not sent to the server.
          </li>
        </ul>
      </section>

      <p className="text-center text-sm text-white/45">
        <Link href="/play" className="text-emerald-300/90 underline-offset-2 hover:underline">
          Play
        </Link>
        {" · "}
        <Link href="/leaderboard" className="text-emerald-300/90 underline-offset-2 hover:underline">
          Hall of Fame
        </Link>
      </p>
    </div>
  );
}
