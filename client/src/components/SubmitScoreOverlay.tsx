import { useState } from "react";
import { Link } from "react-router-dom";

type Props = {
  onClose: () => void;
  onSubmit: (name: string) => Promise<{ ok: boolean; error?: string }>;
};

export function SubmitScoreOverlay({ onClose, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const r = await onSubmit(name);
    setBusy(false);
    if (r.ok) setDone(true);
    else setErr(r.error ?? "Could not submit");
  }

  if (done) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
        <div className="glass-panel w-full max-w-sm border-white/15 p-8 text-center shadow-2xl">
          <p className="font-display text-xl font-semibold text-white">Score saved</p>
          <p className="mt-2 text-sm text-white/65">See how you rank on the Hall of Fame.</p>
          <div className="mt-8 flex flex-col gap-2">
            <Link
              to="/leaderboard"
              className="btn-pill-solid py-3.5 normal-case tracking-normal"
            >
              Hall of Fame
            </Link>
            <button type="button" onClick={onClose} className="py-2 text-sm text-white/50 hover:text-white">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <form
        onSubmit={handleSubmit}
        className="glass-panel w-full max-w-sm border-white/15 p-8 shadow-2xl"
      >
        <h2 className="font-display text-xl font-semibold text-white">Submit your score</h2>
        <p className="mt-1 text-sm text-white/65">
          Choose a unique display name (letters, numbers, spaces, 2–24 chars).
        </p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-4 w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-white placeholder:text-white/35 focus:border-emerald-400/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          placeholder="PlayerOne"
          autoComplete="off"
          maxLength={24}
          disabled={busy}
        />
        {err ? <p className="mt-2 text-sm text-red-300">{err}</p> : null}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="btn-pill-ghost flex-1 border-white/30 py-3 normal-case tracking-normal"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="btn-pill-solid flex-1 py-3 normal-case tracking-normal disabled:opacity-50"
          >
            {busy ? "…" : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
