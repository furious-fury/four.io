let sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sharedCtx) {
    try {
      sharedCtx = new AudioContext();
    } catch {
      return null;
    }
  }
  return sharedCtx;
}

function tone(frequency: number, durationMs: number, type: OscillatorType = "sine", gain = 0.08) {
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  const t0 = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, t0);
  g.gain.setValueAtTime(0.001, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + durationMs / 1000);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + durationMs / 1000 + 0.05);
}

export function playDropSound() {
  tone(280, 70, "triangle", 0.06);
}

export function playWinSound() {
  [440, 554, 659].forEach((hz, i) => {
    window.setTimeout(() => tone(hz, 120, "sine", 0.07), i * 90);
  });
}

export function playLoseSound() {
  [330, 220].forEach((hz, i) => {
    window.setTimeout(() => tone(hz, 160, "sawtooth", 0.045), i * 120);
  });
}
