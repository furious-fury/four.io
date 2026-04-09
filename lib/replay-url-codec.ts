/**
 * Compact replay URLs: `moves=3333124` — one digit (0–6) per ply, no commas.
 * Legacy `moves=3,3,3` and space-separated forms still parse.
 */

export function parseMovesFromReplayParam(raw: string | undefined): number[] | null {
  if (raw == null || raw.trim() === "") return [];
  const t = raw.trim();

  if (/[,\s]/.test(t)) {
    const parts = t.split(/[,\s]+/).filter(Boolean);
    const out: number[] = [];
    for (const p of parts) {
      const n = Number(p);
      if (!Number.isInteger(n) || n < 0 || n > 6) return null;
      out.push(n);
    }
    return out;
  }

  if (/^[0-6]*$/.test(t)) {
    if (t === "") return [];
    return [...t].map((c) => Number(c));
  }

  return null;
}

/** Shortest stable encoding for `moves` query (digit run, no commas). */
export function encodeMovesForReplayQuery(moves: number[]): string {
  for (const c of moves) {
    if (!Number.isInteger(c) || c < 0 || c > 6) throw new RangeError("move columns must be integers 0–6");
  }
  return moves.join("");
}
