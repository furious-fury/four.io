type Props = {
  moves: number[];
};

const COLLAPSE_AFTER = 24;

/** Human-first plies: even index human (red), odd CPU (yellow). */
export function ReplayMoveList({ moves }: Props) {
  if (moves.length === 0) return null;

  const rows = moves.map((col, i) => {
    const human = i % 2 === 0;
    const side = human ? "Red" : "Yellow";
    const label = human ? "You" : "CPU";
    return (
      <li key={i} className="flex justify-between gap-3 text-xs text-white/70 tabular-nums">
        <span className="text-white/45">{i + 1}.</span>
        <span className="min-w-0 text-white/80">
          {label} ({side}) · col <span className="text-amber-200/90">{col + 1}</span>
          <span className="text-white/40"> ({col})</span>
        </span>
      </li>
    );
  });

  if (moves.length <= COLLAPSE_AFTER) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/25 p-4">
        <p className="font-display text-xs font-semibold uppercase tracking-wider text-white/80">Moves</p>
        <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto pr-1">{rows}</ul>
      </div>
    );
  }

  return (
    <details className="group rounded-xl border border-white/10 bg-black/25 p-4">
      <summary className="cursor-pointer font-display text-xs font-semibold uppercase tracking-wider text-white/85 marker:text-white/50">
        Moves ({moves.length}) — tap to expand
      </summary>
      <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto pr-1">{rows}</ul>
    </details>
  );
}
