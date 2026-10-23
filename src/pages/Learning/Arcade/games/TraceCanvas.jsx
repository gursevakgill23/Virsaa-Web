/**
 * pages/Learning/Arcade/games/TraceCanvas.jsx
 * -----------------------------------------------------------------------------
 * Trace a Gurmukhi letter with a finger, a pen or the mouse. The letter is
 * drawn faintly (with dots to follow on "guided", only its outline on
 * "outline", very faint on "faint"); measure() compares the drawing with the
 * letter (traceCheck.js) and judgeTrace() says whether it passes.
 *
 *   const ref = useRef();  <TraceCanvas ref={ref} text="ਕ" mode="guided" onInk={...} />
 *   ref.current.measure('guided') -> { coverage, precision, spread, worstPart, ... }   ref.current.clear()
 * -----------------------------------------------------------------------------
 */
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { fontsReady } from './common';
import { INK_WIDTH, SIZE, drawLetter, measureTrace } from './traceCheck';
import styles from './AkharSikho.module.css';

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
  const pen = useRef(null);          // the pointer that is drawing (a second finger is ignored)
  const shown = useRef(text);

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
    ctx.lineWidth = INK_WIDTH;
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

  // Sharp on high-density screens. A new letter starts with a clean board
  useEffect(() => {
    const canvas = canvasRef.current;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = SIZE * dpr * 1.4;
    canvas.height = SIZE * dpr * 1.4;
    if (shown.current !== text) {
      shown.current = text;
      strokes.current = [];
      pen.current = null;
    }
    let live = true;
    paint();
    fontsReady().then(() => { if (live) paint(); });
    return () => { live = false; };
  }, [paint, text]);

  const point = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return [((e.clientX - rect.left) / rect.width) * SIZE, ((e.clientY - rect.top) / rect.height) * SIZE];
  };

  const down = (e) => {
    if (pen.current !== null) return;
    e.preventDefault();
    try { canvasRef.current.setPointerCapture?.(e.pointerId); } catch { /* the pointer is already gone */ }
    pen.current = e.pointerId;
    strokes.current.push([point(e)]);
    paint();
  };
  const move = (e) => {
    if (pen.current !== e.pointerId) return;
    e.preventDefault();
    strokes.current[strokes.current.length - 1].push(point(e));
    paint();
  };
  const up = (e) => {
    if (pen.current !== e.pointerId) return;
    pen.current = null;
    const total = strokes.current.reduce((n, line) => n + line.length, 0);
    onInk?.(total);
  };

  useImperativeHandle(ref, () => ({
    clear: () => {
      strokes.current = [];
      pen.current = null;
      paint();
      onInk?.(0);
    },
    measure: (rules = mode) => measureTrace(text, strokes.current, rules),
  }), [paint, text, onInk, mode]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.traceCanvas}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onPointerLeave={up}
      onLostPointerCapture={up}
      role="img"
      aria-label={`Trace ${text}`}
    />
  );
});

TraceCanvas.displayName = 'TraceCanvas';

export default TraceCanvas;
