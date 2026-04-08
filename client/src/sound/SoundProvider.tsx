import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { playDropSound, playLoseSound, playWinSound } from "./audioEngine";

const MUTE_KEY = "four.io:soundMuted";

type SoundCtx = {
  muted: boolean;
  setMuted: (v: boolean) => void;
  toggleMuted: () => void;
  playDrop: () => void;
  playWin: () => void;
  playLose: () => void;
};

const Ctx = createContext<SoundCtx | null>(null);

export function SoundProvider({ children }: { children: ReactNode }) {
  const [muted, setMutedState] = useState(() => {
    try {
      return localStorage.getItem(MUTE_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (muted) localStorage.setItem(MUTE_KEY, "1");
      else localStorage.removeItem(MUTE_KEY);
    } catch {
      /* ignore */
    }
  }, [muted]);

  const setMuted = useCallback((v: boolean) => setMutedState(v), []);
  const toggleMuted = useCallback(() => setMutedState((m) => !m), []);

  const playDrop = useCallback(() => {
    if (!muted) playDropSound();
  }, [muted]);
  const playWin = useCallback(() => {
    if (!muted) playWinSound();
  }, [muted]);
  const playLose = useCallback(() => {
    if (!muted) playLoseSound();
  }, [muted]);

  const value = useMemo(
    () => ({ muted, setMuted, toggleMuted, playDrop, playWin, playLose }),
    [muted, setMuted, toggleMuted, playDrop, playWin, playLose]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSound() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSound requires SoundProvider");
  return v;
}
