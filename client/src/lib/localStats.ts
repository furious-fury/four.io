import type { Difficulty } from "@four.io/game-logic";

const STATS_KEY = "four.io:localStats";

type Tallies = { w: number; l: number; d: number };
type StatsShape = Record<Difficulty, Tallies>;

const empty: StatsShape = {
  easy: { w: 0, l: 0, d: 0 },
  medium: { w: 0, l: 0, d: 0 },
  hard: { w: 0, l: 0, d: 0 },
};

function parse(raw: string | null): StatsShape {
  if (!raw) return { ...empty, easy: { ...empty.easy }, medium: { ...empty.medium }, hard: { ...empty.hard } };
  try {
    const p = JSON.parse(raw) as Partial<StatsShape>;
    const out: StatsShape = {
      easy: { w: 0, l: 0, d: 0, ...p.easy },
      medium: { w: 0, l: 0, d: 0, ...p.medium },
      hard: { w: 0, l: 0, d: 0, ...p.hard },
    };
    return out;
  } catch {
    return { ...empty, easy: { ...empty.easy }, medium: { ...empty.medium }, hard: { ...empty.hard } };
  }
}

export function loadLocalStats(): StatsShape {
  try {
    return parse(localStorage.getItem(STATS_KEY));
  } catch {
    return { ...empty, easy: { ...empty.easy }, medium: { ...empty.medium }, hard: { ...empty.hard } };
  }
}

export function recordMatchOutcome(difficulty: Difficulty, outcome: "win" | "loss" | "draw") {
  const s = loadLocalStats();
  const t = s[difficulty];
  if (outcome === "win") t.w += 1;
  else if (outcome === "loss") t.l += 1;
  else t.d += 1;
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
