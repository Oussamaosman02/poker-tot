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

/** Short ascending chime — played when it's the human's turn */
export function playYourTurnSound() {
  try {
    const ac = getCtx();
    const now = ac.currentTime;
    playTone(523, now, 0.15, 0.25, "sine", ac);       // C5
    playTone(659, now + 0.1, 0.15, 0.25, "sine", ac); // E5
    playTone(784, now + 0.2, 0.25, 0.3, "sine", ac);  // G5
  } catch {
    // AudioContext may be blocked before user interaction — ignore silently
  }
}

/** Two-tone resolution — played when a hand ends */
export function playHandEndSound() {
  try {
    const ac = getCtx();
    const now = ac.currentTime;
    playTone(392, now, 0.15, 0.2, "sine", ac);        // G4
    playTone(523, now + 0.12, 0.15, 0.2, "sine", ac); // C5
    playTone(659, now + 0.24, 0.3, 0.25, "sine", ac); // E5
    playTone(784, now + 0.36, 0.5, 0.3, "sine", ac);  // G5
  } catch {
    // ignore
  }
}
