/**
 * pages/Learning/Arcade/confetti.js
 * -----------------------------------------------------------------------------
 * A short burst of confetti over the page when a stage is won with three
 * stars (marigold petals, phulkari colours). Skipped for people who ask their
 * device for less motion.
 * -----------------------------------------------------------------------------
 */
const COLOURS = ['#FFB627', '#FF5E8A', '#2FBF71', '#3D7AF5', '#FF7A1A', '#B05CF7'];

export default function confetti({ pieces = 140, duration = 1800 } = {}) {
  if (typeof window === 'undefined') return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.createElement('canvas');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  Object.assign(canvas.style, {
    position: 'fixed', inset: '0', width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 4000,
  });
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }
  const w = canvas.width;
  const h = canvas.height;
  const bits = Array.from({ length: pieces }, () => ({
    x: w / 2 + (Math.random() - 0.5) * w * 0.3,
    y: h * 0.45,
    vx: (Math.random() - 0.5) * 18 * dpr,
    vy: (-Math.random() * 16 - 6) * dpr,
    size: (5 + Math.random() * 7) * dpr,
    spin: Math.random() * Math.PI,
    turn: (Math.random() - 0.5) * 0.3,
    colour: COLOURS[Math.floor(Math.random() * COLOURS.length)],
    petal: Math.random() < 0.45,
  }));
  const started = performance.now();
  const frame = (now) => {
    const t = now - started;
    ctx.clearRect(0, 0, w, h);
    bits.forEach((b) => {
      b.vy += 0.45 * dpr;
      b.vx *= 0.99;
      b.x += b.vx;
      b.y += b.vy;
      b.spin += b.turn;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - t / duration);
      ctx.translate(b.x, b.y);
      ctx.rotate(b.spin);
      ctx.fillStyle = b.colour;
      if (b.petal) {
        ctx.beginPath();
        ctx.ellipse(0, 0, b.size * 0.55, b.size, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-b.size / 2, -b.size / 4, b.size, b.size / 2);
      }
      ctx.restore();
    });
    if (t < duration) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}
