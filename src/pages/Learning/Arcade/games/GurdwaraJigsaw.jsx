/**
 * pages/Learning/Arcade/games/GurdwaraJigsaw.jsx
 * -----------------------------------------------------------------------------
 * Gurdwara Jigsaw: a photo of a historic Gurdwara (a website picture in S3)
 * cut into real jigsaw pieces (3x3 up to 6x6). Drag each piece into the
 * frame; it snaps in when it is close. Finishing within the stage's time
 * gives the most points, and the story of the Gurdwara is shown at the end
 * (with the photo's credit, as its licence asks).
 * Pieces are SVG: the photo clipped to each piece's outline, so nothing is
 * redrawn on a canvas.
 * Content: { picture: {image, title, title_pa, story, credit, width, height} }
 * + settings { grid, ghost: clear | faint | none, target_seconds }
 * -----------------------------------------------------------------------------
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaCheck, FaEye, FaPuzzlePiece } from 'react-icons/fa';
import arcade from '../Arcade.module.css';
import { sfx } from '../arcadeSound';
import styles from './GurdwaraJigsaw.module.css';
import { formatTime, useStopwatch } from './common';

const WORDS = {
  english: {
    pieces: 'Pieces', peek: 'Hold to peek', done: 'See the story', story: 'The story', photo: 'Photo',
    licence: 'licence', time: 'Time', target: 'Three stars under',
  },
  punjabi: {
    pieces: 'ਟੁਕੜੇ', peek: 'ਦਬਾ ਕੇ ਪੂਰੀ ਤਸਵੀਰ ਦੇਖੋ', done: 'ਕਹਾਣੀ ਪੜ੍ਹੋ', story: 'ਇਤਿਹਾਸ', photo: 'ਤਸਵੀਰ',
    licence: 'ਲਾਇਸੈਂਸ', time: 'ਸਮਾਂ', target: 'ਤਿੰਨ ਤਾਰੇ ਇਸ ਤੋਂ ਘੱਟ ਸਮੇਂ ਵਿੱਚ',
  },
};

// A simple drawn Gurdwara, used if the photo can't be loaded
const FALLBACK = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ad1f0"/><stop offset="1" stop-color="#fdf3dc"/></linearGradient></defs>
<rect width="600" height="400" fill="url(#s)"/><rect y="300" width="600" height="100" fill="#7fb3dd"/>
<rect x="170" y="190" width="260" height="110" fill="#f5d27a" stroke="#c3922a" stroke-width="6"/>
<path d="M230 190c0-80 140-80 140 0z" fill="#f5d27a" stroke="#c3922a" stroke-width="6"/>
<path d="M300 92v28" stroke="#c3922a" stroke-width="6"/><circle cx="300" cy="88" r="8" fill="#c3922a"/>
<path d="M174 190c0-40 56-40 56 0zM370 190c0-40 56-40 56 0z" fill="#f5d27a" stroke="#c3922a" stroke-width="6"/>
<path d="M262 300v-56a38 38 0 0 1 76 0v56" fill="#fffaf0" stroke="#c3922a" stroke-width="6"/>
<path d="M500 110v190" stroke="#e07b24" stroke-width="6"/><path d="M500 112l-46 18 46 18z" fill="#e07b24"/></svg>`)}`;

// Which way each tab sticks out: +1 out, -1 in, 0 for the frame's straight edges
const makeEdges = (rows, cols) => ({
  h: Array.from({ length: rows - 1 }, () => Array.from({ length: cols }, () => (Math.random() < 0.5 ? 1 : -1))),
  v: Array.from({ length: rows }, () => Array.from({ length: cols - 1 }, () => (Math.random() < 0.5 ? 1 : -1))),
});

// The outline of one piece, w x h, with its tabs (they reach `knob` beyond the square)
const KNOB = [[0.36, 0], [0.42, 0], [0.42, 0.06], [0.39, 0.12], [0.35, 0.2], [0.4, 0.28], [0.5, 0.28], [0.6, 0.28],
  [0.65, 0.2], [0.61, 0.12], [0.58, 0.06], [0.58, 0], [0.64, 0]];
const piecePath = (w, h, sides) => {
  const size = Math.min(w, h);
  // edge from p0 to p1, outward normal n, tab sign
  const edge = (p0, p1, n, sign) => {
    if (!sign) return `L${p1[0]} ${p1[1]}`;
    const at = ([u, v]) => [p0[0] + (p1[0] - p0[0]) * u + n[0] * v * size * sign, p0[1] + (p1[1] - p0[1]) * u + n[1] * v * size * sign];
    const pts = KNOB.map(at);
    let d = `L${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length - 1; i += 3) {
      d += ` C${pts[i][0]} ${pts[i][1]} ${pts[i + 1][0]} ${pts[i + 1][1]} ${pts[i + 2][0]} ${pts[i + 2][1]}`;
    }
    return `${d} L${p1[0]} ${p1[1]}`;
  };
  return `M0 0 ${edge([0, 0], [w, 0], [0, -1], sides.top)} ${edge([w, 0], [w, h], [1, 0], sides.right)} `
    + `${edge([w, h], [0, h], [0, 1], sides.bottom)} ${edge([0, h], [0, 0], [-1, 0], sides.left)} Z`;
};

export default function GurdwaraJigsaw({ stage, content, language, onFinish }) {
  const w = WORDS[language];
  const settings = stage.settings || {};
  const grid = settings.grid || 3;
  const picture = content.picture || {};
  const image = picture.image || FALLBACK;
  const aspect = useMemo(() => {
    const ratio = picture.width && picture.height ? picture.width / picture.height : 1.5;
    return Math.max(1.15, Math.min(1.8, ratio));
  }, [picture.width, picture.height]);
  const edges = useMemo(() => makeEdges(grid, grid), [grid]);
  const tableRef = useRef(null);
  const [tableWidth, setTableWidth] = useState(0);
  const [pieces, setPieces] = useState([]);           // {id, row, col, x, y, placed} (x, y in piece units)
  const [dragging, setDragging] = useState(null);
  const [peek, setPeek] = useState(false);
  const [finished, setFinished] = useState(false);
  const [imgOk, setImgOk] = useState(true);
  const [seconds, readSeconds] = useStopwatch(!finished);
  const order = useRef(0);
  const drag = useRef(null);
  const uid = useMemo(() => `jig${Math.random().toString(36).slice(2, 8)}`, []);

  // ------------------------------------------------------------ sizes
  useEffect(() => {
    const el = tableRef.current;
    if (!el) return undefined;
    const measure = () => setTableWidth(el.clientWidth);
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    window.addEventListener('resize', measure);
    return () => { ro?.disconnect(); window.removeEventListener('resize', measure); };
  }, []);

  // The frame at the top; the pieces wait in rows on the table under it
  const boardW = Math.max(240, Math.min(tableWidth - 16, 660));
  const boardH = boardW / aspect;
  const pw = boardW / grid;
  const ph = boardH / grid;
  const pad = Math.min(pw, ph) * 0.3;
  const boardLeft = (tableWidth - boardW) / 2;
  const boardTop = 10;
  const trayTop = boardTop + boardH + 24;
  const perRow = Math.max(1, Math.floor((tableWidth - 12) / (pw * 1.18)));
  const tableHeight = trayTop + Math.ceil((grid * grid) / perRow) * ph * 1.14 + 24;

  // ------------------------------------------------------------ scatter the pieces (in piece units, from the board's corner)
  useEffect(() => {
    if (!tableWidth) return;
    setPieces((current) => {
      if (current.length) return current;
      const all = [];
      for (let row = 0; row < grid; row += 1) for (let col = 0; col < grid; col += 1) all.push({ id: `${row}-${col}`, row, col });
      const shuffled = all.sort(() => Math.random() - 0.5);
      // rows under the frame, centred on the table
      const rowWidth = perRow * pw * 1.18;
      const startX = (tableWidth - rowWidth) / 2 + pw * 0.09;
      return shuffled.map((p, i) => ({
        ...p,
        x: (startX + (i % perRow) * pw * 1.18 - boardLeft) / pw + (Math.random() - 0.5) * 0.08,
        y: (trayTop - boardTop) / ph + Math.floor(i / perRow) * 1.14 + (Math.random() - 0.5) * 0.08,
        placed: false,
        z: i,
      }));
    });
  }, [tableWidth, grid, pw, ph, boardLeft, trayTop, perRow]);

  // ------------------------------------------------------------ dragging
  const down = (e, piece) => {
    if (piece.placed || finished) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const rect = tableRef.current.getBoundingClientRect();
    drag.current = {
      id: piece.id,
      dx: (e.clientX - rect.left - boardLeft) / pw - piece.x,
      dy: (e.clientY - rect.top - boardTop) / ph - piece.y,
    };
    order.current += 1;
    const z = 100 + order.current;
    setDragging(piece.id);
    setPieces((list) => list.map((p) => (p.id === piece.id ? { ...p, z } : p)));
    sfx.tap();
  };

  // Put the dragged piece under the pointer
  const placeAt = useCallback((clientX, clientY) => {
    const d = drag.current;
    if (!d || !tableRef.current) return;
    const rect = tableRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - boardLeft) / pw - d.dx;
    const y = (clientY - rect.top - boardTop) / ph - d.dy;
    setPieces((list) => list.map((p) => (p.id === d.id ? { ...p, x, y } : p)));
  }, [boardLeft, boardTop, pw, ph]);

  const move = (e) => {
    const d = drag.current;
    if (!d) return;
    d.lx = e.clientX;
    d.ly = e.clientY;
    placeAt(e.clientX, e.clientY);
  };

  // On a small screen the frame and the pieces don't all fit: holding a piece
  // near the top or bottom of the screen scrolls the page
  useEffect(() => {
    if (!dragging) return undefined;
    let frame;
    const step = () => {
      const d = drag.current;
      if (d && d.ly != null) {
        const topEdge = 120;               // under the site's navbar
        const bottomEdge = window.innerHeight - 70;
        let dy = 0;
        if (d.ly < topEdge) dy = -Math.ceil((topEdge - d.ly) / 5);
        else if (d.ly > bottomEdge) dy = Math.ceil((d.ly - bottomEdge) / 5);
        if (dy) {
          const before = window.scrollY;
          window.scrollBy(0, dy);
          if (window.scrollY !== before) placeAt(d.lx, d.ly);
        }
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [dragging, placeAt]);

  const complete = useCallback(() => {
    setFinished(true);
    sfx.win();
  }, []);

  const up = () => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    setDragging(null);
    setPieces((list) => {
      const next = list.map((p) => {
        if (p.id !== d.id) return p;
        const close = Math.abs(p.x - p.col) < 0.22 && Math.abs(p.y - p.row) < 0.22;
        if (close) {
          sfx.snap();
          return { ...p, x: p.col, y: p.row, placed: true, z: 1 };
        }
        return p;
      });
      if (next.every((p) => p.placed)) setTimeout(complete, 250);
      return next;
    });
  };

  const placedCount = pieces.filter((p) => p.placed).length;
  const target = settings.target_seconds || 120;

  const done = () => {
    const time = readSeconds();
    const score = time <= target ? 1000 : Math.max(300, Math.round(1000 - (600 * (time - target)) / (2 * target)));
    const credit = picture.credit;
    const story = (
      <div className={styles.storyCard}>
        <img src={image} alt={picture.alt || picture.title || ''} className={styles.storyImage} />
        <h3 lang={language === 'punjabi' ? 'pa' : 'en'}>{language === 'punjabi' ? picture.title_pa || picture.title : picture.title}</h3>
        <p>{picture.story}</p>
        {credit && (credit.author || credit.license) && (
          <p className={styles.credit}>
            {w.photo}: {credit.author || 'Wikimedia Commons'}
            {credit.license && <>, {credit.license_url ? <a href={credit.license_url} target="_blank" rel="noopener noreferrer">{credit.license}</a> : credit.license}</>}
          </p>
        )}
      </div>
    );
    onFinish({ score, completed: true, time_taken_seconds: time, details: { grid, picture: picture.picture || '' } }, story);
  };

  const ghostOpacity = settings.ghost === 'clear' ? 0.38 : settings.ghost === 'faint' ? 0.16 : 0;

  return (
    <div className={styles.game}>
      <div className={arcade.hud}>
        <span className={arcade.hudPill}><FaPuzzlePiece aria-hidden="true" /> {w.pieces}: {placedCount}/{grid * grid}</span>
        <span className={`${arcade.hudPill} ${seconds > target ? styles.late : ''}`}>{w.time} {formatTime(seconds)}</span>
        <span className={styles.target}>{w.target} {formatTime(target)}</span>
        <span className={arcade.hudSpacer} />
        {!finished && (
          <button type="button" className={arcade.btnGhost} onPointerDown={() => setPeek(true)} onPointerUp={() => setPeek(false)}
            onPointerLeave={() => setPeek(false)} onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') setPeek(true); }}
            onKeyUp={() => setPeek(false)}
          >
            <FaEye aria-hidden="true" /> {w.peek}
          </button>
        )}
      </div>

      <div className={styles.title}>
        <h2 lang={language === 'punjabi' ? 'pa' : 'en'}>{language === 'punjabi' ? picture.title_pa || picture.title : picture.title}</h2>
      </div>

      <div
        ref={tableRef}
        className={styles.table}
        style={{ height: tableWidth ? tableHeight : 420 }}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      >
        {tableWidth > 0 && (
          <>
            <div className={`${styles.board} ${finished ? styles.boardDone : ''}`}
              style={{ left: boardLeft, top: boardTop, width: boardW, height: boardH }}
            >
              <img className={styles.ghost} src={imgOk ? image : FALLBACK} alt="" style={{ opacity: peek || finished ? 1 : ghostOpacity }}
                onError={() => setImgOk(false)} draggable={false}
              />
              <svg className={styles.gridLines} viewBox={`0 0 ${boardW} ${boardH}`} aria-hidden="true">
                {Array.from({ length: grid - 1 }).map((_, i) => (
                  <g key={i}>
                    <line x1={(i + 1) * pw} y1="0" x2={(i + 1) * pw} y2={boardH} />
                    <line x1="0" y1={(i + 1) * ph} x2={boardW} y2={(i + 1) * ph} />
                  </g>
                ))}
              </svg>
            </div>
            {!finished && pieces.map((p) => {
              const sides = {
                top: p.row === 0 ? 0 : -edges.h[p.row - 1][p.col],
                bottom: p.row === grid - 1 ? 0 : edges.h[p.row][p.col],
                left: p.col === 0 ? 0 : -edges.v[p.row][p.col - 1],
                right: p.col === grid - 1 ? 0 : edges.v[p.row][p.col],
              };
              const d = piecePath(pw, ph, sides);
              const clip = `${uid}-${p.id}`;
              return (
                <svg
                  key={p.id}
                  className={`${styles.piece} ${p.placed ? styles.placed : ''} ${dragging === p.id ? styles.dragging : ''}`}
                  style={{ left: boardLeft + p.x * pw - pad, top: boardTop + p.y * ph - pad, width: pw + pad * 2, height: ph + pad * 2, zIndex: p.z }}
                  viewBox={`${-pad} ${-pad} ${pw + pad * 2} ${ph + pad * 2}`}
                  onPointerDown={(e) => down(e, p)}
                  role="img"
                  aria-label={`Piece ${p.row + 1}, ${p.col + 1}${p.placed ? ' (placed)' : ''}`}
                >
                  <defs><clipPath id={clip}><path d={d} /></clipPath></defs>
                  <image href={imgOk ? image : FALLBACK} x={-p.col * pw} y={-p.row * ph} width={boardW} height={boardH}
                    preserveAspectRatio="xMidYMid slice" clipPath={`url(#${clip})`}
                  />
                  <path d={d} className={styles.outline} />
                </svg>
              );
            })}
          </>
        )}
      </div>

      {finished && (
        <div className={styles.finish}>
          <button type="button" className={arcade.btnBig} onClick={done}><FaCheck aria-hidden="true" /> {w.done}</button>
        </div>
      )}
    </div>
  );
}
