import { Link } from "react-router-dom";
import { Circle, Sparkles, Trophy } from "lucide-react";

export function Home() {
  return (
    <div className="relative flex min-h-[calc(100dvh-8rem)] flex-col items-center justify-center px-2 pb-8 pt-4 md:min-h-[calc(100dvh-9rem)]">
      <aside className="glass-panel absolute right-0 top-0 z-10 hidden max-w-[17rem] p-4 text-left lg:block">
        <p className="font-display text-sm font-semibold text-white">Verified leaderboard</p>
        <p className="mt-1 text-xs leading-relaxed text-white/70">
          Wins on Hard are checked server-side from your moves — no fake scores.
        </p>
        <Link
          to="/leaderboard"
          className="btn-pill-outline mt-4 w-full justify-center gap-2 py-2.5 text-[11px] font-bold uppercase tracking-wider"
        >
          <Trophy className="size-3.5 text-amber-300/90" aria-hidden />
          Hall of Fame
        </Link>
      </aside>

      <div className="flex max-w-2xl flex-col items-center text-center">
        <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.35em] text-emerald-200/80">
          <Sparkles className="size-3.5 text-amber-200/90" aria-hidden />
          Connect 4 · vs CPU
        </p>

        <h1 className="font-display text-5xl font-semibold leading-tight tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.45)] sm:text-6xl md:text-7xl">
          <span className="text-gradient-brand">four.io</span>
        </h1>

        <p className="mt-6 max-w-md text-pretty text-base leading-relaxed text-white/80 md:text-lg">
          Drop discs, connect four in a row, and outsmart the CPU on Easy, Medium, or Hard. Prove it on
          the global Hall of Fame.
        </p>

        <div className="mt-10 flex w-full max-w-md flex-col items-stretch gap-4 sm:flex-row sm:justify-center sm:gap-5">
          <Link to="/play" className="btn-pill-solid">
            Play now
          </Link>
          <Link to="/leaderboard" className="btn-pill-ghost gap-2">
            <Trophy className="size-4 text-amber-200/90" aria-hidden />
            Hall of Fame
          </Link>
        </div>

        <ul className="mt-14 max-w-md space-y-2 text-left text-sm text-white/55">
          <li className="flex gap-2">
            <Circle className="mt-0.5 size-4 shrink-0 fill-red-400 text-red-400" aria-hidden />
            <span>You play red · CPU plays yellow · Three skill levels</span>
          </li>
          <li className="flex gap-2 pl-6">
            <span>Scores verified from move history — fair play only.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
