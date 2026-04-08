import { useQueryClient } from "@tanstack/react-query";
import { Link, NavLink } from "react-router-dom";
import type { ReactNode } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { fetchLeaderboard, leaderboardKeys } from "../queries/leaderboard";
import { useSound } from "../sound/SoundProvider";

/** Royalty-free alpine valley — replace with your own art if you prefer. */
const HERO_BG =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2400&q=85";

const LB_LIMIT = 50;

export function Shell({ children }: { children: ReactNode }) {
  const { muted, toggleMuted } = useSound();
  const queryClient = useQueryClient();

  const prefetchLeaderboard = () => {
    void queryClient.prefetchQuery({
      queryKey: leaderboardKeys.list(LB_LIMIT, "all"),
      queryFn: () => fetchLeaderboard(LB_LIMIT, "all"),
    });
  };

  return (
    <div className="relative flex min-h-dvh flex-col">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute inset-0 scale-105 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_BG})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/70 via-teal-950/50 to-black/90" />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(253,224,71,0.12),transparent_55%)]"
          aria-hidden
        />
        <div
          className="absolute inset-0 shadow-[inset_0_0_100px_30px_rgba(0,0,0,0.55)]"
          aria-hidden
        />
        <div
          className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black via-black/70 to-transparent"
          aria-hidden
        />
      </div>

      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4 md:px-8">
          <Link to="/" className="shrink-0 font-display text-xl font-semibold tracking-tight md:text-2xl">
            <span className="text-gradient-brand drop-shadow-sm">four.io</span>
          </Link>

          <nav className="flex min-w-0 flex-1 justify-center gap-4 text-xs font-medium sm:gap-8 sm:text-sm">
            <NavLink
              to="/play"
              onMouseEnter={prefetchLeaderboard}
              className={({ isActive }) =>
                [
                  "text-sm font-medium transition-colors",
                  isActive ? "text-white" : "text-white/75 hover:text-white",
                ].join(" ")
              }
            >
              Play
            </NavLink>
            <NavLink
              to="/leaderboard"
              onMouseEnter={prefetchLeaderboard}
              className={({ isActive }) =>
                [
                  "text-sm font-medium transition-colors",
                  isActive ? "text-white" : "text-white/75 hover:text-white",
                ].join(" ")
              }
            >
              Hall of Fame
            </NavLink>
            <NavLink
              to="/help"
              className={({ isActive }) =>
                [
                  "text-sm font-medium transition-colors",
                  isActive ? "text-white" : "text-white/75 hover:text-white",
                ].join(" ")
              }
            >
              Help
            </NavLink>
          </nav>

          <div className="ml-auto flex items-center gap-2 md:gap-3">
            <button
              type="button"
              onClick={toggleMuted}
              className="flex size-10 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label={muted ? "Unmute sound" : "Mute sound"}
              title={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </button>
            <Link
              to="/play"
              onMouseEnter={prefetchLeaderboard}
              className="btn-pill-solid hidden px-6 sm:inline-flex"
            >
              Play
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-4xl flex-1 px-4 pb-16 pt-24 md:px-8 md:pt-28">
        {children}
      </main>
    </div>
  );
}
