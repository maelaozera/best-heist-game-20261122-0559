// Velvet Vault — tiny WebAudio synth: no audio files, everything is an
// oscillator envelope. Silent until the first user gesture (browser policy).
let ctx = null;
let muted = false;

export function ensureAudio() {
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    } catch {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type, vol, when = 0, slideTo = 0) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export function playPickup() {
  tone(880, 0.12, 'sine', 0.12);
  tone(1318, 0.16, 'sine', 0.1, 0.07);
}

export function playCoin() {
  tone(1200, 0.09, 'triangle', 0.1, 0, 700);
}

export function playHack() {
  tone(440, 0.1, 'square', 0.06);
  tone(660, 0.1, 'square', 0.06, 0.09);
  tone(990, 0.14, 'square', 0.06, 0.18);
}

export function playCrackTick() {
  tone(300, 0.05, 'square', 0.05, 0, 520);
}

export function playSpotted() {
  tone(220, 0.25, 'sawtooth', 0.12, 0, 440);
}

export function playCaught() {
  tone(180, 0.4, 'sawtooth', 0.16, 0, 60);
  tone(90, 0.5, 'sawtooth', 0.14, 0.15, 45);
}

export function playWin() {
  [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.12, i * 0.11));
}

export function playClick() {
  tone(700, 0.05, 'sine', 0.07);
}
