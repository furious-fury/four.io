import { useQueryClient } from "@tanstack/react-query";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Menu, Volume2, VolumeX, X } from "lucide-react";
import { fetchLeaderboard, leaderboardKeys } from "../queries/leaderboard";
import { useSound } from "../sound/SoundProvider";

/** Royalty-free alpine valley — replace with your own art if you prefer. */
const HERO_BG =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2400&q=85";

const LB_LIMIT = 50;

/** Keeps shell chrome above in-page overlays; drawer/backdrop stay below the bar so controls stay tappable. */
const Z_NAV_BACKDROP = 100;
const Z_NAV_DRAWER = 110;
const Z_NAV_HEADER = 120;

const navLinkDesktop = ({ isActive }: { isActive: boolean }) =>
  [
    "text-sm font-medium transition-colors",
    isActive ? "text-white" : "text-white/75 hover:text-white",
  ].join(" ");

const navLinkMobile =
  "block rounded-xl px-4 py-3.5 text-base font-medium text-white/90 transition hover:bg-white/10 active:bg-white/15";

export function Shell({ children }: { children: ReactNode }) {
  const { muted, toggleMuted } = useSound();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [drawerExpanded, setDrawerExpanded] = useState(false);
  const closeAfterTransitionRef = useRef(false);
  const closeFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prefetchLeaderboard = () => {
    void queryClient.prefetchQuery({
      queryKey: leaderboardKeys.list(LB_LIMIT, "all"),
      queryFn: () => fetchLeaderboard(LB_LIMIT, "all"),
    });
  };

  useEffect(() => {
    closeAfterTransitionRef.current = false;
    setDrawerExpanded(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      setDrawerExpanded(false);
      closeAfterTransitionRef.current = false;
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDrawerExpanded(true);
      return;
    }
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setDrawerExpanded(true));
    });
    return () => cancelAnimationFrame(id);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!drawerExpanded) return;
    closeAfterTransitionRef.current = false;
    if (closeFallbackTimerRef.current) {
      clearTimeout(closeFallbackTimerRef.current);
      closeFallbackTimerRef.current = null;
    }
  }, [drawerExpanded]);

  useEffect(() => {
    return () => {
      if (closeFallbackTimerRef.current) clearTimeout(closeFallbackTimerRef.current);
    };
  }, []);

  const finishClose = () => {
    if (closeFallbackTimerRef.current) {
      clearTimeout(closeFallbackTimerRef.current);
      closeFallbackTimerRef.current = null;
    }
    closeAfterTransitionRef.current = false;
    setMobileMenuOpen(false);
  };

  const closeDrawer = () => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    closeAfterTransitionRef.current = !reduced;
    setDrawerExpanded(false);
    if (reduced) {
      finishClose();
      return;
    }
    if (closeFallbackTimerRef.current) clearTimeout(closeFallbackTimerRef.current);
    closeFallbackTimerRef.current = setTimeout(finishClose, 380);
  };

  const onDrawerTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const p = e.propertyName;
    if (p !== "transform" && p !== "-webkit-transform") return;
    if (!closeAfterTransitionRef.current) return;
    finishClose();
  };

  const toggleMobileMenu = () => {
    if (!mobileMenuOpen) {
      setMobileMenuOpen(true);
      return;
    }
    if (drawerExpanded) closeDrawer();
    else setDrawerExpanded(true);
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

      <header className="fixed left-0 right-0 top-0 pt-[env(safe-area-inset-top)]" style={{ zIndex: Z_NAV_HEADER }}>
        <div className="relative border-b border-white/5 bg-black/20 backdrop-blur-md">
          <div className="mx-auto flex min-h-14 max-w-6xl items-center gap-2 px-3 py-3 sm:gap-4 sm:px-4 md:min-h-0 md:py-4 md:px-8">
            <Link
              to="/"
              className="shrink-0 font-display text-lg font-semibold tracking-tight sm:text-xl md:text-2xl"
            >
              <span className="text-gradient-brand drop-shadow-sm">four.io</span>
            </Link>

            <nav
              className="hidden min-w-0 flex-1 justify-center gap-6 text-xs font-medium md:flex md:gap-8 md:text-sm"
              aria-label="Main"
            >
              <NavLink to="/play" onMouseEnter={prefetchLeaderboard} className={navLinkDesktop}>
                Play
              </NavLink>
              <NavLink to="/leaderboard" onMouseEnter={prefetchLeaderboard} className={navLinkDesktop}>
                Hall of Fame
              </NavLink>
              <NavLink to="/help" className={navLinkDesktop}>
                Help
              </NavLink>
            </nav>

            <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2 md:gap-3">
              <button
                type="button"
                onClick={toggleMuted}
                className="flex size-11 min-h-11 min-w-11 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white/80 transition hover:bg-white/10 hover:text-white md:size-10 md:min-h-10 md:min-w-10"
                aria-label={muted ? "Unmute sound" : "Mute sound"}
                title={muted ? "Unmute" : "Mute"}
              >
                {muted ? <VolumeX className="size-[1.125rem] md:size-4" /> : <Volume2 className="size-[1.125rem] md:size-4" />}
              </button>
              <Link
                to="/play"
                onMouseEnter={prefetchLeaderboard}
                className="btn-pill-solid inline-flex px-4 py-2.5 text-[10px] sm:px-6 sm:py-3 sm:text-xs md:hidden"
              >
                Play
              </Link>
              <button
                type="button"
                className="flex size-11 min-h-11 min-w-11 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white/90 transition hover:bg-white/10 md:hidden"
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-nav"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                onClick={toggleMobileMenu}
              >
                {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {mobileMenuOpen ? (
        <div className="md:hidden">
          <button
            type="button"
            className={[
              "fixed inset-0 bg-black/55 backdrop-blur-[2px] transition-opacity duration-300 ease-out motion-reduce:transition-none",
              drawerExpanded ? "opacity-100" : "opacity-0",
            ].join(" ")}
            style={{ zIndex: Z_NAV_BACKDROP }}
            aria-label="Close navigation"
            onClick={closeDrawer}
          />
          <div
            id="mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile main"
            className={[
              "fixed right-0 flex w-[min(19rem,90vw)] flex-col border-l border-white/10 bg-zinc-950/98 pb-[max(1rem,env(safe-area-inset-bottom))] pl-3 shadow-2xl shadow-black/50 backdrop-blur-xl transition-transform duration-300 ease-out motion-reduce:transition-none",
              /* Below header bar: min-h-14 + py-3 + safe inset (matches tall touch targets on small screens). */
              "bottom-0 top-[calc(env(safe-area-inset-top)+4.5rem)]",
              drawerExpanded ? "translate-x-0" : "translate-x-full",
            ].join(" ")}
            style={{ zIndex: Z_NAV_DRAWER }}
            onTransitionEnd={onDrawerTransitionEnd}
          >
            <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto pr-3 pt-3">
              <NavLink
                to="/play"
                onMouseEnter={prefetchLeaderboard}
                className={({ isActive }) =>
                  [navLinkMobile, isActive ? "bg-white/15 text-white" : ""].join(" ")
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                Play
              </NavLink>
              <NavLink
                to="/leaderboard"
                onMouseEnter={prefetchLeaderboard}
                className={({ isActive }) =>
                  [navLinkMobile, isActive ? "bg-white/15 text-white" : ""].join(" ")
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                Hall of Fame
              </NavLink>
              <NavLink
                to="/help"
                className={({ isActive }) =>
                  [navLinkMobile, isActive ? "bg-white/15 text-white" : ""].join(" ")
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                Help
              </NavLink>
            </nav>
          </div>
        </div>
      ) : null}

      <main className="relative z-10 mx-auto w-full max-w-4xl flex-1 px-4 pb-16 pt-20 sm:pt-24 md:px-8 md:pt-28">
        {children}
      </main>
    </div>
  );
}
