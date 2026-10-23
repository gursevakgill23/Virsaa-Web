/**
 * pages/Learning/Arcade/games/traceCheck.js
 * -----------------------------------------------------------------------------
 * Does a tracing match the letter? (Akhar Sikho, drawn on TraceCanvas)
 *
 * The letter and the lines that were drawn are put on a 100 x 100 grid. The
 * letter is thinned to its centre line, the path a pen takes. A drawn line
 * "follows" the letter where it runs along that centre line, in the same
 * direction, no further from it than the stroke's own half width and a
 * finger's wobble. Lines that cross the letter (a scribble or zigzag) don't
 * follow it, however close they are. Then:
 *   coverage   how much of the centre line was followed
 *   parts      the same for each part of the letter: each ninth of it, and
 *              each piece that stands on its own (a dot, a vowel sign).
 *              Every part has to be traced, not just most of the letter
 *   precision  how much of the drawing follows the letter
 *   spread     how much of the box the drawing takes up, against the letter's
 *              own lines (tracing it, even twice, is about 1 to 2; scribbling,
 *              colouring or circling over it is more)
 * judgeTrace() turns these into "well done" or "try again" (and why), with a
 * quality for the score. A scribble, another letter or half of the letter
 * doesn't pass.
 *
 *   measureTrace('ਕ', strokes, 'guided') -> { coverage, precision, spread, worstPart, ... }
 *   judgeTrace(measure, 'guided')        -> { ok, reason: null | 'cover' | 'stay' | 'scribble', quality }
 * Strokes are lists of [x, y] points on the 300 x 300 drawing (SIZE).
 * -----------------------------------------------------------------------------
 */
import { GURMUKHI_FONT, clamp } from './common';

export const SIZE = 300;           // drawing units (the canvas is scaled to fit its box)
export const INK_WIDTH = 15;       // the width of the line drawn on screen, in drawing units
const GRID = 100;                  // the shapes are compared on a 100 x 100 grid
const K = GRID / SIZE;

// How close is close enough, by guide (tried on every letter with wobbly tracings, tracings
// over the outline, scribbles, zigzags, spirals, half tracings and other letters)
//   wobble     how far (grid squares, about 3-4 px on screen each) a line may run from the
//              stroke's edge and still follow it
//   align      how far (degrees) its direction may turn from the stroke's
//   need       share of the centre line to follow
//   part       share of every part (each ninth, each dot or sign) to follow
//   stay       share of the drawing that must follow the letter
//   spread     most drawing allowed, against the letter's own size
export const RULES = {
  guided: { wobble: 4, align: 35, need: 0.85, part: 0.9, stay: 0.85, spread: 2.4 },
  outline: { wobble: 4, align: 35, need: 0.85, part: 0.88, stay: 0.84, spread: 2.4 },
  faint: { wobble: 4, align: 35, need: 0.85, part: 0.85, stay: 0.82, spread: 2.4 },
};
export const rulesFor = (mode) => (mode && typeof mode === 'object' ? { ...RULES.guided, ...mode } : RULES[mode] || RULES.guided);

// ---------------------------------------------------------------- drawing the letter

// The font size and place that put the letter in the middle of the box, filling
// most of it (tall vowel signs included)
const layout = (ctx, text) => {
  const fontAt = (size) => `700 ${size}px ${GURMUKHI_FONT}`;
  ctx.font = fontAt(230);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  let m = ctx.measureText(text);
  if (typeof m.actualBoundingBoxAscent !== 'number') {        // very old browsers: as before
    const size = m.width > SIZE * 0.82 ? Math.floor((230 * SIZE * 0.82) / m.width) : 230;
    return { font: fontAt(size), x: SIZE / 2, y: SIZE * 0.53, align: 'center', baseline: 'middle' };
  }
  const width = m.actualBoundingBoxLeft + m.actualBoundingBoxRight || m.width;
  const height = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent || 160;
  const size = Math.floor(230 * Math.min(1, (SIZE * 0.8) / width, (SIZE * 0.78) / height));
  ctx.font = fontAt(size);
  m = ctx.measureText(text);
  return {
    font: fontAt(size),
    x: SIZE / 2 - (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2,
    y: SIZE / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2,
    align: 'left',
    baseline: 'alphabetic',
  };
};

/** Draw the letter (for the guide on screen, and for the check). */
export const drawLetter = (ctx, text, scale, { fill, stroke, lineWidth = 0, dash = null }) => {
  ctx.save();
  ctx.scale(scale, scale);
  const at = layout(ctx, text);
  ctx.font = at.font;
  ctx.textAlign = at.align;
  ctx.textBaseline = at.baseline;
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fillText(text, at.x, at.y);
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = 'round';
    if (dash) ctx.setLineDash(dash);
    ctx.strokeText(text, at.x, at.y);
  }
  ctx.restore();
};

// ---------------------------------------------------------------- shapes on the grid

const letterMask = (text) => {
  const canvas = document.createElement('canvas');
  canvas.width = GRID;
  canvas.height = GRID;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  drawLetter(ctx, text, K, { fill: '#000' });
  const data = ctx.getImageData(0, 0, GRID, GRID).data;
  const mask = new Uint8Array(GRID * GRID);
  for (let i = 0; i < mask.length; i += 1) mask[i] = data[i * 4 + 3] >= 128 ? 1 : 0;
  return mask;
};

// Thin a shape to lines one square wide (Zhang and Suen)
const thin = (mask) => {
  const img = mask.slice();
  const W = GRID;
  let changed = true;
  while (changed) {
    changed = false;
    for (let pass = 0; pass < 2; pass += 1) {
      const remove = [];
      for (let y = 1; y < W - 1; y += 1) {
        for (let x = 1; x < W - 1; x += 1) {
          const i = y * W + x;
          if (img[i]) {
            const p2 = img[i - W]; const p3 = img[i - W + 1]; const p4 = img[i + 1]; const p5 = img[i + W + 1];
            const p6 = img[i + W]; const p7 = img[i + W - 1]; const p8 = img[i - 1]; const p9 = img[i - W - 1];
            const b = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
            const a = (!p2 && p3) + (!p3 && p4) + (!p4 && p5) + (!p5 && p6) + (!p6 && p7) + (!p7 && p8) + (!p8 && p9) + (!p9 && p2);
            const keep = pass === 0 ? (p2 && p4 && p6) || (p4 && p6 && p8) : (p2 && p4 && p8) || (p2 && p6 && p8);
            if (b >= 2 && b <= 6 && a === 1 && !keep) remove.push(i);
          }
        }
      }
      if (remove.length) {
        changed = true;
        remove.forEach((i) => { img[i] = 0; });
      }
    }
  }
  return img;
};

// Distance from every square to the nearest marked one (two passes, close to the straight-line distance)
const distanceTo = (mask) => {
  const W = GRID;
  const d = new Float32Array(W * W);
  for (let i = 0; i < d.length; i += 1) d[i] = mask[i] ? 0 : 1e6;
  const D = Math.SQRT2;
  for (let y = 0; y < W; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const i = y * W + x;
      let v = d[i];
      if (x > 0) v = Math.min(v, d[i - 1] + 1);
      if (y > 0) {
        v = Math.min(v, d[i - W] + 1);
        if (x > 0) v = Math.min(v, d[i - W - 1] + D);
        if (x < W - 1) v = Math.min(v, d[i - W + 1] + D);
      }
      d[i] = v;
    }
  }
  for (let y = W - 1; y >= 0; y -= 1) {
    for (let x = W - 1; x >= 0; x -= 1) {
      const i = y * W + x;
      let v = d[i];
      if (x < W - 1) v = Math.min(v, d[i + 1] + 1);
      if (y < W - 1) {
        v = Math.min(v, d[i + W] + 1);
        if (x < W - 1) v = Math.min(v, d[i + W + 1] + D);
        if (x > 0) v = Math.min(v, d[i + W - 1] + D);
      }
      d[i] = v;
    }
  }
  return d;
};

// The separate pieces of the letter (a dot, a vowel sign that doesn't touch it)
const pieces = (mask) => {
  const W = GRID;
  const label = new Int32Array(W * W).fill(-1);
  const list = [];
  for (let start = 0; start < mask.length; start += 1) {
    if (mask[start] && label[start] < 0) {
      const id = list.length;
      const cells = [start];
      label[start] = id;
      for (let k = 0; k < cells.length; k += 1) {
        const i = cells[k];
        const x = i % W;
        const y = (i - x) / W;
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const nx = x + dx;
            const ny = y + dy;
            const j = ny * W + nx;
            if (nx >= 0 && ny >= 0 && nx < W && ny < W && mask[j] && label[j] < 0) {
              label[j] = id;
              cells.push(j);
            }
          }
        }
      }
      list.push(cells);
    }
  }
  return list;
};

// Which way the centre line runs at each of its squares (from its neighbours within 3
// squares), and how clearly: 0 at a dot or where lines meet, near 1 along a line
const directions = (line) => {
  const W = GRID;
  const dir = new Map();
  for (let i = 0; i < line.length; i += 1) {
    if (line[i]) {
      const x = i % W;
      const y = (i - x) / W;
      let sxx = 0; let syy = 0; let sxy = 0; let n = 0;
      for (let dy = -3; dy <= 3; dy += 1) {
        for (let dx = -3; dx <= 3; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < W && ny < W && line[ny * W + nx]) {
            sxx += dx * dx; syy += dy * dy; sxy += dx * dy; n += 1;
          }
        }
      }
      const spread = sxx + syy;
      const clear = n >= 3 && spread ? Math.sqrt((sxx - syy) ** 2 + 4 * sxy * sxy) / spread : 0;
      const angle = 0.5 * Math.atan2(2 * sxy, sxx - syy);
      dir.set(i, { ux: Math.cos(angle), uy: Math.sin(angle), clear });
    }
  }
  return dir;
};

// The drawn lines as evenly spaced points on the grid: { x, y, w (length it stands for),
// ux, uy (which way the line was going; 0, 0 for a tap) }
const samplePath = (strokes) => {
  const points = [];
  strokes.forEach((raw) => {
    const line = raw.map(([x, y]) => [x * K, y * K]);
    if (!line.length) return;
    const run = [];
    for (let i = 1; i < line.length; i += 1) {
      const [ax, ay] = line[i - 1];
      const dx = line[i][0] - ax;
      const dy = line[i][1] - ay;
      const d = Math.hypot(dx, dy);
      const n = Math.max(1, Math.ceil(d / 0.5));
      for (let j = 0; j < n; j += 1) run.push({ x: ax + (dx * (j + 0.5)) / n, y: ay + (dy * (j + 0.5)) / n, w: d / n });
    }
    const moved = run.reduce((sum, p) => sum + p.w, 0);
    if (moved < 1) {                                     // a tap (a dot)
      points.push({ x: line[0][0], y: line[0][1], w: 0.5, ux: 0, uy: 0 });
      return;
    }
    // the direction over about five squares, so a shaky hand still has a direction
    run.forEach((p, j) => {
      const a = run[Math.max(0, j - 5)];
      const b = run[Math.min(run.length - 1, j + 5)];
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      points.push({ ...p, ux: d ? (b.x - a.x) / d : 0, uy: d ? (b.y - a.y) / d : 0 });
    });
  });
  return points;
};

/**
 * How well `strokes` trace `text`. All shares are 0-1.
 * Returns { coverage, precision, spread, worstPart, parts: [{coverage, size}], ink }.
 * `mode` is 'guided' | 'outline' | 'faint' (or rules like RULES.guided).
 */
export function measureTrace(text, strokes, mode = 'guided') {
  const rule = rulesFor(mode);
  const points = samplePath(strokes || []);
  const empty = { coverage: 0, precision: 0, spread: 0, worstPart: 0, parts: [], ink: 0 };
  if (!points.length || typeof document === 'undefined') return empty;

  const letter = letterMask(text);
  const area = letter.reduce((a, b) => a + b, 0);
  if (!area) return empty;
  const line = thin(letter);
  const outside = new Uint8Array(letter.length);
  for (let i = 0; i < letter.length; i += 1) outside[i] = letter[i] ? 0 : 1;
  const halfWidth = distanceTo(outside);         // inside the letter: how far to its edge
  const dir = directions(line);
  const lineCells = [];
  for (let i = 0; i < line.length; i += 1) if (line[i]) lineCells.push(i);
  if (!lineCells.length) return empty;

  // the drawn points, sorted into the grid's squares
  const buckets = new Map();
  points.forEach((p) => {
    const key = clamp(Math.round(p.y), 0, GRID - 1) * GRID + clamp(Math.round(p.x), 0, GRID - 1);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(p);
  });
  // a drawn point and a square of the centre line go together if they are close enough
  // and run the same way (or either has no clear direction: a tap, a dot, a corner)
  const together = (p, i, reach) => {
    const x = i % GRID;
    const y = (i - x) / GRID;
    if (Math.hypot(p.x - x, p.y - y) > reach) return false;
    const d = dir.get(i);
    if (!d || d.clear < 0.5 || (!p.ux && !p.uy)) return true;
    return Math.abs(p.ux * d.ux + p.uy * d.uy) >= align;
  };
  const reachOf = (i) => halfWidth[i] + rule.wobble;
  const align = Math.cos((rule.align * Math.PI) / 180);

  // the centre line: which squares were followed
  const followed = new Uint8Array(line.length);
  lineCells.forEach((i) => {
    const reach = reachOf(i);
    const r = Math.ceil(reach);
    const x = i % GRID;
    const y = (i - x) / GRID;
    for (let dy = -r; dy <= r && !followed[i]; dy += 1) {
      for (let dx = -r; dx <= r && !followed[i]; dx += 1) {
        const list = buckets.get((y + dy) * GRID + (x + dx));
        if (list && x + dx >= 0 && x + dx < GRID && list.some((p) => together(p, i, reach))) followed[i] = 1;
      }
    }
  });

  // the drawing: which points follow the letter
  const widest = Math.ceil(Math.max(...lineCells.map(reachOf)));
  let total = 0;
  let onLetter = 0;
  points.forEach((p) => {
    total += p.w;
    const px = Math.round(p.x);
    const py = Math.round(p.y);
    let on = false;
    for (let dy = -widest; dy <= widest && !on; dy += 1) {
      for (let dx = -widest; dx <= widest && !on; dx += 1) {
        const x = px + dx;
        const y = py + dy;
        if (x >= 0 && y >= 0 && x < GRID && y < GRID) {
          const i = y * GRID + x;
          if (line[i] && together(p, i, reachOf(i))) on = true;
        }
      }
    }
    if (on) onLetter += p.w;
  });

  // every part has to be traced: each ninth that holds a fair share of the letter,
  // and each piece on its own (its centre line, or its middle if it is only a dot)
  let x0 = GRID; let y0 = GRID; let x1 = 0; let y1 = 0;
  lineCells.forEach((i) => {
    const x = i % GRID;
    const y = (i - x) / GRID;
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  });
  const n = 3;
  const cells = Array.from({ length: n * n }, () => ({ size: 0, done: 0 }));
  lineCells.forEach((i) => {
    const x = i % GRID;
    const y = (i - x) / GRID;
    const cx = Math.min(n - 1, Math.floor(((x - x0) * n) / (x1 - x0 + 1)));
    const cy = Math.min(n - 1, Math.floor(((y - y0) * n) / (y1 - y0 + 1)));
    cells[cy * n + cx].size += 1;
    cells[cy * n + cx].done += followed[i];
  });
  const parts = cells.filter((c) => c.size >= Math.max(4, lineCells.length * 0.06))
    .map((c) => ({ coverage: c.done / c.size, size: c.size }));
  pieces(letter).forEach((piece) => {
    if (piece.length < Math.max(5, area * 0.01)) return;
    const own = piece.filter((i) => line[i]);
    if (own.length) {
      parts.push({ coverage: own.reduce((n, i) => n + followed[i], 0) / own.length, size: own.length });
      return;
    }
    // a dot thinned away: any line or tap on it counts
    const hit = piece.some((i) => {
      const x = i % GRID;
      const y = (i - x) / GRID;
      const list = buckets.get(i) || [];
      return list.length > 0 || points.some((p) => Math.hypot(p.x - x, p.y - y) <= rule.wobble);
    });
    parts.push({ coverage: hit ? 1 : 0, size: 1 });
  });

  // how much was drawn: the band along the drawing, against the band along the letter's
  // centre line (going over the same line again adds nothing; scribbling adds a lot)
  const drawn = new Uint8Array(GRID * GRID);
  points.forEach((p) => { drawn[clamp(Math.round(p.y), 0, GRID - 1) * GRID + clamp(Math.round(p.x), 0, GRID - 1)] = 1; });
  const fromDrawn = distanceTo(drawn);
  const fromLine = distanceTo(line);
  let drawnBand = 0;
  let lineBand = 0;
  for (let i = 0; i < drawn.length; i += 1) {
    if (fromDrawn[i] <= 2) drawnBand += 1;
    if (fromLine[i] <= 2) lineBand += 1;
  }

  const coverage = followed.reduce((a, b) => a + b, 0) / lineCells.length;
  return {
    coverage,
    precision: total ? onLetter / total : 0,
    spread: drawnBand / lineBand,
    worstPart: parts.length ? Math.min(...parts.map((p) => p.coverage)) : coverage,
    parts,
    ink: points.length,
  };
}

/**
 * Pass or try again. reason: 'stay' (much of the drawing doesn't follow the letter),
 * 'scribble' (far too much drawing), 'cover' (some of the letter wasn't traced).
 * quality 0.5-1 for a pass (how neat it was), 0 otherwise.
 */
export function judgeTrace(m, mode = 'guided') {
  const rule = rulesFor(mode);
  let reason = null;
  if (m.precision < rule.stay) reason = 'stay';
  else if (m.spread > rule.spread) reason = 'scribble';
  else if (m.coverage < rule.need || m.worstPart < rule.part) reason = 'cover';
  if (reason) return { ok: false, reason, quality: 0 };
  const neat = 0.6 * clamp((m.coverage - rule.need) / (0.97 - rule.need), 0, 1)
    + 0.4 * clamp((m.precision - rule.stay) / (0.98 - rule.stay), 0, 1);
  return { ok: true, reason: null, quality: 0.5 + 0.5 * neat };
}
