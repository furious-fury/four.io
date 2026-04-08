import {
  BASE_POINTS,
  BONUS_CAP,
  BONUS_WEIGHT,
  type Difficulty,
} from "./constants";

export function computeScore(difficulty: Difficulty, totalPlies: number): {
  basePoints: number;
  bonusPoints: number;
  totalScore: number;
} {
  const basePoints = BASE_POINTS[difficulty];
  const rawBonus = Math.max(0, 42 - totalPlies) * BONUS_WEIGHT[difficulty];
  const bonusPoints = Math.min(BONUS_CAP, Math.round(rawBonus));
  return {
    basePoints,
    bonusPoints,
    totalScore: basePoints + bonusPoints,
  };
}
