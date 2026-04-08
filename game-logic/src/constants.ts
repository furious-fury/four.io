export const ROWS = 6;
export const COLS = 7;

/** Human = 1 (Red), CPU = 2 (Yellow), empty = 0 */
export const EMPTY = 0 as const;
export const HUMAN = 1 as const;
export const CPU = 2 as const;

export type Cell = typeof EMPTY | typeof HUMAN | typeof CPU;

export type Difficulty = "easy" | "medium" | "hard";

export const BASE_POINTS: Record<Difficulty, number> = {
  easy: 10,
  medium: 50,
  hard: 100,
};

/** Bonus weight per difficulty (capped separately) */
export const BONUS_WEIGHT: Record<Difficulty, number> = {
  easy: 0.25,
  medium: 0.5,
  hard: 1,
};

export const BONUS_CAP = 50;
