import { Link } from "react-router-dom";

type Props = {
  title: string;
  subtitle?: string;
  humanWon: boolean;
  onPlayAgain: () => void;
  onSubmitScore?: () => void;
};

export function GameOverOverlay({
  title,
  subtitle,
  humanWon,
  onPlayAgain,
  onSubmitScore,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <div
        role="dialog"
        aria-modal="true"
        className="glass-panel w-full max-w-sm border-white/15 p-8 shadow-2xl"
      >
        <h2 className="font-display text-2xl font-semibold text-white">{title}</h2>
        {subtitle ? <p className="mt-2 text-sm leading-relaxed text-white/65">{subtitle}</p> : null}
        <div className="mt-8 flex flex-col gap-3">
          {humanWon && onSubmitScore ? (
            <button
              type="button"
              onClick={onSubmitScore}
              className="btn-pill-solid w-full py-3.5 normal-case tracking-normal"
            >
              Submit score
            </button>
          ) : null}
          <button
            type="button"
            onClick={onPlayAgain}
            className="btn-pill-ghost w-full border-white/40 py-3.5 normal-case tracking-normal"
          >
            Play again
          </button>
          <Link
            to="/"
            className="block w-full py-3 text-center text-sm text-white/50 transition hover:text-white"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
