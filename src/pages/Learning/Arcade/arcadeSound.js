/**
 * pages/Learning/Arcade/arcadeSound.js
 * -----------------------------------------------------------------------------
 * Small sound effects for the map games, made in the browser with the Web
 * Audio API (no sound files to download). Off when the player turns sound
 * off; the choice is remembered on this device.
 *
 *   sfx.correct()   sfx.wrong()   sfx.star(2)   sfx.coin()   sfx.win()
 * -----------------------------------------------------------------------------
 */
const SOUND_KEY = 'virsaa_arcade_sound';

let context = null;
let enabled = (() => {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'off';
  } catch {
    return true;
  }
})();

export const soundEnabled = () => enabled;

export const setSoundEnabled = (on) => {
  enabled = Boolean(on);
  try {
    localStorage.setItem(SOUND_KEY, enabled ? 'on' : 'off');
  } catch {
    /* not kept */
  }
};

const audio = () => {
  if (!enabled || typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!context) {
    try {
      context = new Ctx();
    } catch {
      return null;
    }
  }
  if (context.state === 'suspended') context.resume().catch(() => {});
  return context;
};

// One note: frequency (Hz), start delay and length (s), wave shape, loudness
const tone = (freq, delay = 0, length = 0.15, type = 'sine', volume = 0.12, slideTo = null) => {
  const ctx = audio();
  if (!ctx) return;
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + length);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + length + 0.02);
};

// A short burst of noise (rain, a cut string, a whoosh)
const noise = (delay = 0, length = 0.2, volume = 0.08, from = 2000, to = 600) => {
  const ctx = audio();
  if (!ctx) return;
  const start = ctx.currentTime + delay;
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * length), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(from, start);
  filter.frequency.exponentialRampToValueAtTime(to, start + length);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start(start);
};

export const sfx = {
  tap: () => tone(700, 0, 0.06, 'triangle', 0.07),
  pick: () => tone(520, 0, 0.09, 'triangle', 0.09, 780),
  correct: () => [523.25, 659.25, 783.99].forEach((f, i) => tone(f, i * 0.07, 0.2, 'triangle', 0.1)),
  wrong: () => { tone(260, 0, 0.16, 'square', 0.04, 200); tone(196, 0.13, 0.22, 'square', 0.04, 150); },
  star: (n = 0) => tone(880 * (1.26 ** n), 0, 0.32, 'sine', 0.13),
  coin: () => { tone(988, 0, 0.07, 'square', 0.035); tone(1319, 0.07, 0.22, 'square', 0.035); },
  pop: () => tone(330, 0, 0.12, 'sine', 0.14, 990),
  drop: () => tone(900, 0, 0.18, 'sine', 0.08, 300),
  splash: () => noise(0, 0.25, 0.06, 1800, 400),
  cut: () => { noise(0, 0.12, 0.09, 5000, 2500); tone(1500, 0, 0.08, 'triangle', 0.05, 600); },
  whoosh: () => noise(0, 0.35, 0.05, 600, 2400),
  snap: () => { tone(1200, 0, 0.04, 'square', 0.04); tone(620, 0.03, 0.08, 'triangle', 0.06); },
  tick: () => tone(1500, 0, 0.03, 'square', 0.025),
  win: () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.11, 0.35, 'triangle', 0.1)),
  sad: () => [392, 349.23, 311.13].forEach((f, i) => tone(f, i * 0.15, 0.3, 'sine', 0.08)),
};
