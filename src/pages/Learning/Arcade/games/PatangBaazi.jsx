/**
 * pages/Learning/Arcade/games/PatangBaazi.jsx
 * -----------------------------------------------------------------------------
 * Patang Baazi: it's Basant. Steer your kite across the sky (finger, mouse or
 * arrow keys). Fly it across another kite's string to cut it ("Bo kata!"),
 * and keep the other kites away from your own string. Yellow stars give
 * extra points. The round lasts the stage's time; three cut strings of
 * your own end it early.
 * Score (out of 1000): 850 for reaching the stage's target of cuts, up to
 * 100 for stars and 50 for lives left.
 * Drawn on a canvas; the game pauses when the tab is hidden.
 * Settings: duration, rivals, speed, attack, wind, target, lives, sky.
 * -----------------------------------------------------------------------------
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaCut, FaHeart, FaPause, FaPlay, FaStar } from 'react-icons/fa';
import arcade from '../Arcade.module.css';
import { sfx } from '../arcadeSound';
import styles from './PatangBaazi.module.css';
import { formatTime } from './common';

const SKIES = {
  morning: ['#9fdcff', '#fff1b8'],
  noon: ['#62c3f0', '#ffe39a'],
  evening: ['#ff9a6b', '#ffd27a'],
  storm: ['#5f7591', '#b9c4cf'],
};
// Dark mode: Basant kites at night, under the moon and the stars
const NIGHT_SKIES = {
  morning: ['#1d0a16', '#3a1a30'],
  noon: ['#1a0a14', '#341a2c'],
  evening: ['#2a0c18', '#4a1f2a'],
  storm: ['#1c1418', '#3a2f36'],
};
const NIGHT_STARS = Array.from({ length: 34 }, (_, i) => [((i * 73) % 100) / 100, ((i * 37) % 55) / 100, 0.6 + ((i * 17) % 10) / 10]);
const KITE_COLOURS = [['#18A883', '#FFD23F'], ['#7B4BD8', '#FF8FB1'], ['#2A5BD7', '#FFFFFF'], ['#FF7A1A', '#2FBF71'], ['#E2483D', '#FFE58A']];

const WORDS = {
  english: {
    cuts: 'Cut', time: 'Time', start: 'Fly your kite', intro: 'Move across the sky to steer. Cross other strings to cut them!',
    pause: 'Pause', paused: 'Paused', resume: 'Keep flying', boKata: 'Bo kata!', safe: 'We fly with cotton thread to keep birds safe.',
  },
  punjabi: {
    cuts: 'ਕੱਟੇ', time: 'ਸਮਾਂ', start: 'ਪਤੰਗ ਉਡਾਓ', intro: 'ਅਸਮਾਨ ਵਿੱਚ ਉਂਗਲ ਫੇਰ ਕੇ ਪਤੰਗ ਚਲਾਓ। ਦੂਜੀਆਂ ਡੋਰਾਂ ਕੱਟੋ!',
    pause: 'ਰੋਕੋ', paused: 'ਖੇਡ ਰੁਕੀ ਹੋਈ ਹੈ', resume: 'ਉਡਾਉਂਦੇ ਰਹੋ', boKata: 'ਬੋ ਕਾਟਾ!', safe: 'ਪੰਛੀਆਂ ਦੀ ਸੁਰੱਖਿਆ ਲਈ ਅਸੀਂ ਸੂਤੀ ਡੋਰ ਵਰਤਦੇ ਹਾਂ।',
  },
};

// Points along a kite string (a sagging curve from the rooftop to the kite)
const stringPoints = (ax, ay, kx, ky, sway = 0) => {
  const cx = (ax + kx) / 2 + sway;
  const cy = Math.max(ay, ky) - Math.abs(ay - ky) * 0.15 + 40;
  const pts = [];
  for (let i = 0; i <= 14; i += 1) {
    const t = i / 14;
    pts.push([(1 - t) ** 2 * ax + 2 * (1 - t) * t * cx + t * t * kx, (1 - t) ** 2 * ay + 2 * (1 - t) * t * cy + t * t * ky]);
  }
  return pts;
};

const distToSegment = (px, py, [x1, y1], [x2, y2]) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
};

// Does a kite at (x, y) touch the string? (the part near its own kite doesn't count)
const touchesString = (x, y, pts, radius) => {
  for (let i = 0; i < pts.length - 2; i += 1) if (distToSegment(x, y, pts[i], pts[i + 1]) < radius) return true;
  return false;
};

const drawKite = (ctx, x, y, size, [a, b], angle = 0, alpha = 1, tailPhase = 0) => {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(angle);
  // tail
  ctx.strokeStyle = 'rgba(70, 50, 20, 0.7)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0, size);
  for (let i = 1; i <= 4; i += 1) ctx.lineTo(Math.sin(tailPhase + i) * 7, size + i * size * 0.4);
  ctx.stroke();
  for (let i = 1; i <= 3; i += 1) {
    ctx.fillStyle = i % 2 ? b : a;
    ctx.beginPath();
    const tx = Math.sin(tailPhase + i) * 7;
    const ty = size + i * size * 0.4;
    ctx.moveTo(tx - 6, ty - 3); ctx.lineTo(tx, ty); ctx.lineTo(tx - 6, ty + 3); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(tx + 6, ty - 3); ctx.lineTo(tx, ty); ctx.lineTo(tx + 6, ty + 3); ctx.closePath(); ctx.fill();
  }
  // body
  ctx.fillStyle = a;
  ctx.beginPath();
  ctx.moveTo(0, -size); ctx.lineTo(size * 0.82, 0); ctx.lineTo(0, size); ctx.lineTo(-size * 0.82, 0); ctx.closePath();
  ctx.fill();
  ctx.fillStyle = b;
  ctx.beginPath();
  ctx.moveTo(0, -size); ctx.lineTo(size * 0.82, 0); ctx.lineTo(0, 0); ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, size); ctx.lineTo(-size * 0.82, 0); ctx.lineTo(0, 0); ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(70, 50, 20, 0.8)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -size); ctx.lineTo(0, size);
  ctx.moveTo(-size * 0.82, 0); ctx.quadraticCurveTo(0, -size * 0.35, size * 0.82, 0);
  ctx.stroke();
  ctx.restore();
};

const drawString = (ctx, pts, colour, width = 1.4) => {
  ctx.strokeStyle = colour;
  ctx.lineWidth = width;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
};

export default function PatangBaazi({ stage, language, onFinish, dark = false }) {
  const w = WORDS[language];
  const s = useMemo(() => stage.settings || {}, [stage.settings]);
  const duration = s.duration || 60;
  const maxLives = s.lives || 3;
  const target = s.target || 6;
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hud, setHud] = useState({ time: duration, cuts: 0, lives: maxLives, stars: 0 });
  const game = useRef(null);
  const raf = useRef(null);
  const flying = useRef(false);        // the arrow keys steer only while the kite is up

  // ------------------------------------------------------------ set up the world
  const reset = useCallback(() => {
    const canvas = canvasRef.current;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    game.current = {
      width, height, t: 0, last: null, over: false,
      kite: { x: width / 2, y: height * 0.35, tx: width / 2, ty: height * 0.35, down: 0, safe: 0 },
      anchor: [width / 2, height - 52],
      rivals: [], falling: [], stars: [], texts: [], spawnIn: 0.5, starIn: 3,
      cuts: 0, lives: maxLives, starsCaught: 0, keys: {},
      roofs: Array.from({ length: 9 }, (_, i) => ({ x: (i / 8) * width, h: 40 + ((i * 37) % 30), w: width / 7 })),
    };
  }, [maxLives]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
      if (game.current) {
        game.current.width = canvas.clientWidth;
        game.current.height = canvas.clientHeight;
        game.current.anchor = [canvas.clientWidth / 2, canvas.clientHeight - 52];
      }
    };
    fit();
    reset();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [reset]);

  const finish = useCallback((completed) => {
    const g = game.current;
    if (g.over) return;
    g.over = true;
    cancelAnimationFrame(raf.current);
    const score = Math.round(Math.min(1, g.cuts / target) * 850 + Math.min(100, g.starsCaught * 25) + (g.lives / maxLives) * 50);
    if (completed) sfx.win(); else sfx.sad();
    setTimeout(() => onFinish({
      score: completed ? Math.min(1000, score) : Math.min(score, 299),
      completed,
      time_taken_seconds: Math.round(g.t),
      details: { cuts: g.cuts, stars: g.starsCaught, lives: g.lives },
    }), 900);
  }, [target, maxLives, onFinish]);

  // ------------------------------------------------------------ one frame
  const frame = useCallback((now) => {
    const g = game.current;
    const canvas = canvasRef.current;
    if (!g || !canvas || g.over) return;
    const ctx = canvas.getContext('2d');
    if (g.last === null) g.last = now;
    const dt = Math.min(0.05, (now - g.last) / 1000);
    g.last = now;
    g.t += dt;
    const { width, height } = g;
    const scale = Math.min(1.2, Math.max(0.7, width / 800));
    const kiteSize = 24 * scale;

    // wind gusts push everything sideways
    const wind = Math.sin(g.t * 0.7) * Math.sin(g.t * 0.23) * (s.wind || 0.3) * 60 * scale;

    // your kite: keys move the target; the kite eases towards it
    const k = g.kite;
    const step = 420 * scale * dt;
    if (g.keys.ArrowLeft) k.tx -= step;
    if (g.keys.ArrowRight) k.tx += step;
    if (g.keys.ArrowUp) k.ty -= step;
    if (g.keys.ArrowDown) k.ty += step;
    k.tx = Math.max(20, Math.min(width - 20, k.tx));
    k.ty = Math.max(30, Math.min(height - 150, k.ty));
    if (k.down > 0) {
      k.down -= dt;
      k.y += 140 * dt;
      if (k.down <= 0) { k.x = width / 2; k.y = height * 0.35; k.safe = 2; }
    } else {
      const speed = 6 * dt;
      k.x += (k.tx + wind * 0.4 - k.x) * Math.min(1, speed);
      k.y += (k.ty - k.y) * Math.min(1, speed);
    }
    if (k.safe > 0) k.safe -= dt;
    const myString = stringPoints(g.anchor[0], g.anchor[1], k.x, k.y + kiteSize, wind * 0.6);

    // other kites
    g.spawnIn -= dt;
    if (g.spawnIn <= 0 && g.rivals.length < (s.rivals || 2)) {
      const fromLeft = Math.random() < 0.5;
      g.rivals.push({
        x: fromLeft ? -30 : width + 30, y: 50 + Math.random() * height * 0.4,
        ax: 40 + Math.random() * (width - 80), colours: KITE_COLOURS[Math.floor(Math.random() * KITE_COLOURS.length)],
        tx: 80 + Math.random() * (width - 160), ty: 50 + Math.random() * height * 0.45, retarget: 2 + Math.random() * 2,
        phase: Math.random() * 6,
      });
      g.spawnIn = 1.2 + Math.random() * 1.5;
    }
    const rivalSpeed = 70 * (s.speed || 1) * scale;
    g.rivals.forEach((r) => {
      r.retarget -= dt;
      if (r.retarget <= 0) {
        if (Math.random() < (s.attack || 0) && k.down <= 0) {
          // aim across your string
          const mid = myString[Math.floor(myString.length * (0.35 + Math.random() * 0.3))];
          r.tx = mid[0];
          r.ty = mid[1];
          r.retarget = 2.4;
        } else {
          r.tx = 60 + Math.random() * (width - 120);
          r.ty = 40 + Math.random() * height * 0.5;
          r.retarget = 2 + Math.random() * 2.5;
        }
      }
      const dx = r.tx - r.x;
      const dy = r.ty - r.y;
      const dist = Math.hypot(dx, dy) || 1;
      r.x += (dx / dist) * rivalSpeed * dt + wind * 0.3 * dt;
      r.y += (dy / dist) * rivalSpeed * dt + Math.sin(g.t * 2 + r.phase) * 12 * dt;
      r.string = stringPoints(r.ax, height - 40, r.x, r.y + kiteSize * 0.9, wind * 0.6);
    });

    // cutting: your kite across their string, or theirs across yours
    g.rivals = g.rivals.filter((r) => {
      if (k.down <= 0 && touchesString(k.x, k.y, r.string, kiteSize * 0.75)) {
        g.cuts += 1;
        g.falling.push({ x: r.x, y: r.y, vx: (Math.random() - 0.5) * 60, colours: r.colours, spin: 0, life: 3 });
        g.texts.push({ x: r.x, y: r.y - 30, life: 1.2, text: w.boKata });
        sfx.cut();
        return false;
      }
      if (k.down <= 0 && k.safe <= 0 && touchesString(r.x, r.y, myString, kiteSize * 0.7)) {
        g.lives -= 1;
        k.down = 1.4;
        g.texts.push({ x: k.x, y: k.y - 30, life: 1.2, text: w.boKata });
        sfx.wrong();
        r.retarget = 0;
      }
      return r.x > -80 && r.x < width + 80;
    });

    // stars to catch
    g.starIn -= dt;
    if (g.starIn <= 0) {
      g.stars.push({ x: 40 + Math.random() * (width - 80), y: -20, vy: 30 + Math.random() * 30 });
      g.starIn = 3 + Math.random() * 3;
    }
    g.stars = g.stars.filter((st) => {
      st.y += st.vy * dt;
      if (k.down <= 0 && Math.hypot(st.x - k.x, st.y - k.y) < kiteSize * 1.3) {
        g.starsCaught += 1;
        sfx.coin();
        return false;
      }
      return st.y < height - 60;
    });
    g.falling = g.falling.filter((f) => { f.life -= dt; f.y += 90 * dt; f.x += f.vx * dt; f.spin += dt * 3; return f.life > 0; });
    g.texts = g.texts.filter((tx) => { tx.life -= dt; tx.y -= 20 * dt; return tx.life > 0; });

    // ---------------- draw
    const sky = (dark ? NIGHT_SKIES : SKIES)[s.sky] || (dark ? NIGHT_SKIES : SKIES).noon;
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, sky[0]);
    grad.addColorStop(1, sky[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    if (dark) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      NIGHT_STARS.forEach(([sx, sy, r]) => { ctx.beginPath(); ctx.arc(sx * width, sy * height, r * scale, 0, Math.PI * 2); ctx.fill(); });
    }
    if (s.sky !== 'storm') {
      // the sun by day, the moon at night
      ctx.fillStyle = dark ? 'rgba(255, 246, 214, 0.95)' : 'rgba(255, 220, 90, 0.95)';
      ctx.beginPath(); ctx.arc(width * 0.85, height * 0.16, (dark ? 24 : 30) * scale, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = dark ? 'rgba(255, 246, 214, 0.16)' : 'rgba(255, 220, 90, 0.25)';
      ctx.beginPath(); ctx.arc(width * 0.85, height * 0.16, 48 * scale, 0, Math.PI * 2); ctx.fill();
    }
    if (dark) ctx.fillStyle = 'rgba(242, 179, 194, 0.16)';
    else ctx.fillStyle = s.sky === 'storm' ? 'rgba(220, 228, 236, 0.75)' : 'rgba(255, 255, 255, 0.85)';
    [0.12, 0.45, 0.72].forEach((cx, i) => {
      const x = ((cx * width + g.t * (12 + i * 5)) % (width + 200)) - 100;
      const y = height * (0.12 + i * 0.09);
      ctx.beginPath();
      ctx.arc(x, y, 22 * scale, 0, Math.PI * 2); ctx.arc(x + 26 * scale, y - 10 * scale, 28 * scale, 0, Math.PI * 2);
      ctx.arc(x + 56 * scale, y, 22 * scale, 0, Math.PI * 2); ctx.fill();
    });
    // mustard fields and rooftops
    ctx.fillStyle = dark ? '#7d6a14' : '#f7c823';
    ctx.fillRect(0, height - 70, width, 70);
    ctx.fillStyle = dark ? '#9c8418' : '#e8b20f';
    for (let x = 0; x < width; x += 14) { ctx.beginPath(); ctx.arc(x, height - 68 + (x % 3) * 2, 4, 0, Math.PI * 2); ctx.fill(); }
    g.roofs.forEach((roof, i) => {
      if (dark) ctx.fillStyle = i % 2 ? '#6e2f2a' : '#4a3238';
      else ctx.fillStyle = i % 2 ? '#d46a43' : '#e9d3b4';
      ctx.fillRect(roof.x - roof.w / 2, height - roof.h, roof.w * 0.9, roof.h);
      ctx.fillStyle = dark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.12)';
      ctx.fillRect(roof.x - roof.w / 2, height - roof.h, roof.w * 0.9, 6);
    });
    // strings and kites
    g.rivals.forEach((r) => drawString(ctx, r.string, dark ? 'rgba(235, 225, 195, 0.55)' : 'rgba(60, 45, 20, 0.6)'));
    g.rivals.forEach((r) => drawKite(ctx, r.x, r.y, kiteSize * 0.9, r.colours, Math.sin(g.t + r.phase) * 0.15, 1, g.t * 4 + r.phase));
    g.falling.forEach((f) => drawKite(ctx, f.x, f.y, kiteSize * 0.85, f.colours, f.spin, Math.min(1, f.life), g.t * 6));
    drawString(ctx, myString, k.safe > 0 ? 'rgba(255,255,255,0.9)' : (dark ? '#ff6f92' : '#c2185b'), 2);
    const blink = k.safe > 0 && Math.floor(g.t * 8) % 2 === 0;
    drawKite(ctx, k.x, k.y, kiteSize, ['#FF4F79', '#FFD23F'], Math.sin(g.t * 1.5) * 0.12 + (k.down > 0 ? g.t * 6 : 0), blink ? 0.4 : 1, g.t * 5);
    g.stars.forEach((st) => {
      ctx.save();
      ctx.translate(st.x, st.y);
      ctx.rotate(g.t);
      ctx.fillStyle = '#FFD23F';
      ctx.strokeStyle = '#E3A000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 10; i += 1) {
        const rad = i % 2 ? 6 * scale : 14 * scale;
        ctx.lineTo(Math.cos((i * Math.PI) / 5) * rad, Math.sin((i * Math.PI) / 5) * rad);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    });
    ctx.font = `800 ${22 * scale}px 'Baloo Paaji 2', 'Mukta Mahee', sans-serif`;
    ctx.textAlign = 'center';
    g.texts.forEach((tx) => {
      ctx.globalAlpha = Math.min(1, tx.life);
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#c2185b';
      ctx.lineWidth = 4;
      ctx.strokeText(tx.text, tx.x, tx.y);
      ctx.fillText(tx.text, tx.x, tx.y);
      ctx.globalAlpha = 1;
    });
    // the player on their rooftop
    ctx.fillStyle = '#5b3a1e';
    ctx.beginPath(); ctx.arc(g.anchor[0], g.anchor[1] - 6, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FF7A1A';
    ctx.beginPath(); ctx.arc(g.anchor[0], g.anchor[1] - 12, 8, Math.PI, 0); ctx.fill();

    const timeLeft = Math.max(0, duration - g.t);
    if (Math.floor(g.t * 10) % 2 === 0) setHud({ time: timeLeft, cuts: g.cuts, lives: g.lives, stars: g.starsCaught });
    if (g.lives <= 0 && k.down <= 0.2) { finish(false); return; }
    if (timeLeft <= 0) { finish(g.lives > 0); return; }     // the last string cut as time ran out still loses
    raf.current = requestAnimationFrame(frame);
  }, [s, duration, finish, w.boKata, dark]);

  useEffect(() => {
    flying.current = started && !paused;
    if (!started || paused) return undefined;
    if (game.current) game.current.last = null;
    raf.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf.current);
  }, [started, paused, frame]);

  // draw the first frame (before the start) so the sky is there
  useEffect(() => {
    if (started) return;
    const id = requestAnimationFrame((t) => {
      const g = game.current;
      if (!g) return;
      frame(t);
      cancelAnimationFrame(raf.current);
      g.t = 0;
      g.last = null;
    });
    return () => cancelAnimationFrame(id);
  }, [started, frame]);

  useEffect(() => {
    const onHide = () => { if (document.hidden) setPaused(true); };
    const down = (e) => {
      if (!game.current || game.current.over || !flying.current || !e.key.startsWith('Arrow')) return;
      e.preventDefault();
      game.current.keys[e.key] = true;
    };
    const up = (e) => { if (game.current) game.current.keys[e.key] = false; };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const steer = (e) => {
    const g = game.current;
    if (!g) return;
    const rect = canvasRef.current.getBoundingClientRect();
    g.kite.tx = e.clientX - rect.left;
    g.kite.ty = e.clientY - rect.top;
  };

  return (
    <div className={styles.game}>
      <div className={arcade.hud}>
        <span className={arcade.hudPill} aria-label={`${hud.lives} lives`}>
          {Array.from({ length: maxLives }).map((_, i) => <FaHeart key={i} className={i < hud.lives ? styles.heartOn : styles.heartOff} aria-hidden="true" />)}
        </span>
        <span className={arcade.hudPill}><FaCut aria-hidden="true" /> {w.cuts}: {hud.cuts}/{target}</span>
        <span className={arcade.hudPill}><FaStar aria-hidden="true" /> {hud.stars}</span>
        <span className={arcade.hudSpacer} />
        <span className={`${arcade.hudPill} ${hud.time <= 10 ? styles.low : ''}`}>{w.time} {formatTime(hud.time)}</span>
        {started && (
          <button type="button" className={arcade.btnGhost} onClick={() => setPaused((p) => !p)} aria-label={paused ? w.resume : w.pause}>
            {paused ? <FaPlay aria-hidden="true" /> : <FaPause aria-hidden="true" />} <span className={styles.wideOnly}>{paused ? w.resume : w.pause}</span>
          </button>
        )}
      </div>
      <div className={styles.skyWrap} ref={wrapRef}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          onPointerMove={steer}
          onPointerDown={steer}
          role="img"
          aria-label="Kite flying game"
        />
        {!started && (
          <div className={styles.overlay}>
            <p>{w.intro}</p>
            <button type="button" className={arcade.btnBig} onClick={() => { sfx.whoosh(); reset(); setStarted(true); }}>
              <FaPlay aria-hidden="true" /> {w.start}
            </button>
            <small>{w.safe}</small>
          </div>
        )}
        {paused && <div className={styles.overlay}><p>{w.paused}</p></div>}
      </div>
    </div>
  );
}
