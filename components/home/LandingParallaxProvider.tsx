"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useMotionValue, useSpring, useTransform, type MotionValue } from "framer-motion";

/** Max parallax offset in px — background moves opposite the cursor. */
const BG_MAX_PX = 20;
/** Foreground follows the cursor, subtler depth cue. */
const FG_MAX_PX = 8;

const springConfig = { stiffness: 280, damping: 35, mass: 0.4 };

export type ActiveLandingParallax = {
  bgX: MotionValue<number>;
  bgY: MotionValue<number>;
  fgX: MotionValue<number>;
  fgY: MotionValue<number>;
};

const LandingParallaxContext = createContext<ActiveLandingParallax | null | undefined>(undefined);

function useParallaxEligible() {
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const mqCoarse = window.matchMedia("(pointer: coarse)");
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setOk(!mqCoarse.matches && !mqReduce.matches);
    sync();
    mqCoarse.addEventListener("change", sync);
    mqReduce.addEventListener("change", sync);
    return () => {
      mqCoarse.removeEventListener("change", sync);
      mqReduce.removeEventListener("change", sync);
    };
  }, []);

  return ok;
}

export function LandingParallaxProvider({ children }: { children: ReactNode }) {
  const eligible = useParallaxEligible();

  const mouseNX = useMotionValue(0);
  const mouseNY = useMotionValue(0);

  const springNX = useSpring(mouseNX, springConfig);
  const springNY = useSpring(mouseNY, springConfig);

  const bgX = useTransform(springNX, [-0.5, 0.5], [BG_MAX_PX, -BG_MAX_PX]);
  const bgY = useTransform(springNY, [-0.5, 0.5], [BG_MAX_PX, -BG_MAX_PX]);
  const fgX = useTransform(springNX, [-0.5, 0.5], [-FG_MAX_PX, FG_MAX_PX]);
  const fgY = useTransform(springNY, [-0.5, 0.5], [-FG_MAX_PX, FG_MAX_PX]);

  useEffect(() => {
    if (!eligible) return;
    const onMove = (e: PointerEvent) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      const nx = Math.max(-0.5, Math.min(0.5, e.clientX / w - 0.5));
      const ny = Math.max(-0.5, Math.min(0.5, e.clientY / h - 0.5));
      mouseNX.set(nx);
      mouseNY.set(ny);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [eligible, mouseNX, mouseNY]);

  const value = useMemo((): ActiveLandingParallax | null => {
    if (!eligible) return null;
    return { bgX, bgY, fgX, fgY };
  }, [eligible, bgX, bgY, fgX, fgY]);

  return <LandingParallaxContext.Provider value={value}>{children}</LandingParallaxContext.Provider>;
}

/**
 * `undefined` — not wrapped by `LandingParallaxProvider` (other routes).
 * `null` — landing provider present but parallax disabled (touch / reduced motion).
 * Otherwise — active motion values for background + foreground.
 */
export function useOptionalLandingParallax(): ActiveLandingParallax | null | undefined {
  return useContext(LandingParallaxContext);
}
