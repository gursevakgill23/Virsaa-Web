/**
 * pages/Learning/Arcade/games/TraceCanvas.jsx
 * -----------------------------------------------------------------------------
 * Trace a Gurmukhi letter with a finger, a pen or the mouse. The letter is
 * drawn faintly (with dots to follow on "guided", only its outline on
 * "outline", very faint on "faint"); check() compares the ink with the
 * letter's shape and says how much of the letter was covered and how much
 * of the ink stayed on it.
 *
 *   const ref = useRef();  <TraceCanvas ref={ref} text="ਕ" mode="guided" onInk={...} />
 *   ref.current.check() -> { coverage: 0-1, precision: 0-1, spread }   ref.current.clear()
 * -----------------------------------------------------------------------------
 */
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { GURMUKHI_FONT, fontsReady } from './common';
import styles from './AkharSikho.module.css';

const SIZE = 300;        // drawing units (the canvas is scaled to fit its box)
const GRID = 100;        // the shapes are compared on a 100 x 100 grid
const INK_WIDTH = 24;

// The letter's font size so that it fills most of the box
const fitFont = (ctx, text) => {
  let size = 230;
  ctx.font = `700 ${size}px ${GURMUKHI_FONT}`;
  const width = ctx.measureText(text).width;
  if (width > SIZE * 0.82) size = Math.floor(size * (SIZE * 0.82) / width);
  return size;
};

const drawLetter = (ctx, text, scale, { fill, stroke, lineWidth = 0, dash = null }) => {
  ctx.save();
  ctx.scale(scale, scale);
  const size = fitFont(ctx, text);
  ctx.font = `700 ${size}px ${GURMUKHI_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const y = SIZE * 0.53;
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fillText(text, SIZE / 2, y);
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = 'round';
    if (dash) ctx.setLineDash(dash);
    ctx.strokeText(text, SIZE / 2, y);
  }
  ctx.restore();
};

// The guide and the ink, on the light and on the dark board
const COLOURS = {
  light: {
    guidedFill: 'rgba(215, 38, 61, 0.14)', guidedLine: 'rgba(215, 38, 61, 0.55)', outlineFill: 'rgba(74, 14, 30, 0.07)',
    outlineLine: 'rgba(74, 14, 30, 0.35)', faint: 'rgba(74, 14, 30, 0.08)', ink: '#8E2A8C',
  },
  dark: {
    guidedFill: 'rgba(255, 120, 140, 0.16)', guidedLine: 'rgba(255, 140, 160, 0.65)', outlineFill: 'rgba(255, 239, 227, 0.08)',
    outlineLine: 'rgba(255, 239, 227, 0.42)', faint: 'rgba(255, 239, 227, 0.1)', ink: '#E58BE3',
  },
};

const TraceCanvas = forwardRef(({ text, mode = 'guided', onInk, dark = false }, ref) => {
  const canvasRef = useRef(null);
  const strokes = useRef([]);
  const drawing = useRef(false);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const scale = canvas.width / SIZE;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const c = dark ? COLOURS.dark : COLOURS.light;
    // the guide
    if (mode === 'guided') {
      drawLetter(ctx, text, scale, { fill: c.guidedFill, stroke: c.guidedLine, lineWidth: 3, dash: [2, 9] });
    } else if (mode === 'outline') {
      drawLetter(ctx, text, scale, { fill: c.outlineFill, stroke: c.outlineLine, lineWidth: 2 });
    } else {
      drawLetter(ctx, text, scale, { fill: c.faint });
    }
    // the ink
    ctx.save();
    ctx.scale(scale, scale);
    ctx.strokeStyle = c.ink;
    ctx.lineWidth = INK_WIDTH * 0.62;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    strokes.current.forEach((line) => {
      ctx.beginPath();
      line.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      if (line.length === 1) ctx.lineTo(line[0][0] + 0.1, line[0][1]);
      ctx.stroke();
    });
    ctx.restore();
  }, [text, mode, dark]);

  // Sharp on high-density screens
  useEffect(() => {
    const canvas = canvasRef.current;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = SIZE * dpr * 1.4;
    canvas.height = SIZE * dpr * 1.4;
    strokes.current = [];
    let live = true;
    paint();
    fontsReady().then(() => { if (live) paint(); });
    return () => { live = false; };
  }, [paint]);

  const point = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return [((e.clientX - rect.left) / rect.width) * SIZE, ((e.clientY - rect.top) / rect.height) * SIZE];
  };

  const down = (e) => {
    e.preventDefault();
    canvasRef.current.setPointerCapture?.(e.pointerId);
    drawing.current = true;
    strokes.current.push([point(e)]);
    paint();
  };
  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    strokes.current[strokes.current.length - 1].push(point(e));
    paint();
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const total = strokes.current.reduce((n, line) => n + line.length, 0);
    onInk?.(total);
  };

  useImperativeHandle(ref, () => ({
    clear: () => {
      strokes.current = [];
      paint();
      onInk?.(0);
    },
    check: () => {
      const make = () => {
        const c = document.createElement('canvas');
        c.width = GRID;
        c.height = GRID;
        return c.getContext('2d', { willReadFrequently: true });
      };
      const scale = GRID / SIZE;
      const shape = make();
      drawLetter(shape, text, scale, { fill: '#000' });
      const near = make();     // the letter with a margin, for "stayed on the letter"
      drawLetter(near, text, scale, { fill: '#000', stroke: '#000', lineWidth: 18 });
      const ink = make();
      ink.save();
      ink.scale(scale, scale);
      ink.strokeStyle = '#000';
      ink.lineWidth = INK_WIDTH;
      ink.lineCap = 'round';
      ink.lineJoin = 'round';
      strokes.current.forEach((line) => {
        ink.beginPath();
        line.forEach(([x, y], i) => (i ? ink.lineTo(x, y) : ink.moveTo(x, y)));
        if (line.length === 1) ink.lineTo(line[0][0] + 0.1, line[0][1]);
        ink.stroke();
      });
      ink.restore();
      const a = shape.getImageData(0, 0, GRID, GRID).data;
      const b = near.getImageData(0, 0, GRID, GRID).data;
      const c = ink.getImageData(0, 0, GRID, GRID).data;
      let letter = 0;
      let covered = 0;
      let inked = 0;
      let onLetter = 0;
      for (let i = 3; i < a.length; i += 4) {
        const isLetter = a[i] > 60;
        const isInk = c[i] > 60;
        if (isLetter) letter += 1;
        if (isInk) {
          inked += 1;
          if (b[i] > 60) onLetter += 1;
        }
        if (isLetter && isInk) covered += 1;
      }
      return {
        coverage: letter ? covered / letter : 0,
        precision: inked ? onLetter / inked : 0,
        spread: letter ? inked / letter : 0,     // much more ink than letter = scribbling
      };
    },
  }), [paint, text, onInk]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.traceCanvas}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onPointerLeave={up}
      role="img"
      aria-label={`Trace ${text}`}
    />
  );
});

TraceCanvas.displayName = 'TraceCanvas';

export default TraceCanvas;
