let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function playTone(
  frequency: number,
  startTime: number,
  duration: number,
  gainValue: number,
  type: OscillatorType = "sine",
  ac: AudioContext
) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startTime);

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(gainValue, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.start(startTime);
  osc.stop(startTime + duration);
}

/** Single soft tick — played when it's the human's turn */
export function playYourTurnSound() {
  try {
    const ac = getCtx();
    playTone(880, ac.currentTime, 0.12, 0.08, "sine", ac);
  } catch {
    // AudioContext may be blocked before user interaction — ignore silently
  }
}

/** Single soft tone — played when a hand ends */
export function playHandEndSound() {
  try {
    const ac = getCtx();
    playTone(660, ac.currentTime, 0.15, 0.08, "sine", ac);
  } catch {
    // ignore
  }
}
