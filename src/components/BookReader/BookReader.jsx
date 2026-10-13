/**
 * components/BookReader/BookReader.jsx
 * -----------------------------------------------------------------------------
 * Full-screen flip-book reader for ebooks (opened from EbookDetail).
 *   - loads pdf.js from a CDN only when a book is opened
 *   - renders pages to images in the background, nearest pages first, and
 *     keeps at most CACHE_LIMIT of them in memory
 *   - two-page spreads on wide screens, one page on phones / portrait
 *   - turn pages by dragging, tapping either half, the arrow buttons, the
 *     slider or the keyboard (arrows, Page Up/Down, Space, Home, End, Esc)
 *   - reports the current page through onProgress (used for History)
 *   - shows a clear message with "Try again" / "Open PDF" if the book can't load
 * -----------------------------------------------------------------------------
 */
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  FaTimes, FaExpand, FaCompress, FaChevronLeft, FaChevronRight, FaExternalLinkAlt, FaRedo,
} from 'react-icons/fa';
import styles from './BookReader.module.css';
import { safeUrl } from '../../utils/safeUrl';

/* -------------------------------------------------------------------------
   pdf.js is loaded from a CDN only when someone opens a book, so it adds
   nothing to the app bundle and needs no npm install.
   ------------------------------------------------------------------------- */
const PDFJS_VERSION = '4.10.38';
const PDFJS_BASE = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build`;

let pdfjsPromise = null;
const loadPdfjs = () => {
  if (!pdfjsPromise) {
    pdfjsPromise = import(/* webpackIgnore: true */ `${PDFJS_BASE}/pdf.min.mjs`)
      .then((lib) => {
        lib.GlobalWorkerOptions.workerSrc = `${PDFJS_BASE}/pdf.worker.min.mjs`;
        return lib;
      })
      .catch((err) => {
        pdfjsPromise = null; // let the next attempt try again
        throw err;
      });
  }
  return pdfjsPromise;
};

// ---------------------------------------------------------------- small helpers
const CACHE_LIMIT = 24; // rendered pages kept in memory
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/* Spreads (two-page view): 0 = [ -, 1 ], 1 = [ 2, 3 ], 2 = [ 4, 5 ] ...
   so the cover sits alone on the right, like a real book. */
const leftOf = (s) => (s === 0 ? null : 2 * s);
const rightOf = (s, n) => (2 * s + 1 <= n ? 2 * s + 1 : null);

/**
 * Full-screen flip-book reader for a PDF.
 *
 * Props
 *  - url:       PDF link (null while it is being fetched)
 *  - title:     book title for the toolbar
 *  - linkError: message to show if the link couldn't be fetched
 *  - onRetry(): fetch the link again
 *  - onClose()
 *  - onProgress(page, numPages): optional, called when the page changes (for History)
 */
const BookReader = ({ url, title, linkError, onRetry, onClose, onProgress }) => {
  // DOM nodes and the open PDF document
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const pdfRef = useRef(null);

  // Loading state of the book
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [loadPercent, setLoadPercent] = useState(0);
  const [loadError, setLoadError] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [aspect, setAspect] = useState(0.7); // width / height of page 1

  // Layout, current position, the leaf being turned, rendered pages, full screen
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const [index, setIndex] = useState(0); // spread number (two-page) or page number (one-page)
  const [flip, setFlip] = useState(null); // { a, x }: turning the leaf between position a and a+1, x 0..1
  const [images, setImages] = useState({}); // page number -> { src, h }
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));

  // Mirrors of state for animation / drag handlers (avoid stale values)
  const flipRef = useRef(null);
  const animRef = useRef(0);
  const dragRef = useRef(null);

  /* ---------- Layout: one page on phones / portrait, two on wide screens ---------- */
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    const measure = () => setStage({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Page size that fits the stage (two pages side by side in spread view)
  const spread = stage.w >= 760 && stage.w > stage.h * 1.05;
  const availW = Math.max(0, stage.w - (spread ? 48 : 24));
  const availH = Math.max(0, stage.h - 24);
  const pageH = Math.floor(Math.min(availH, (spread ? availW / 2 : availW) / aspect));
  const pageW = Math.floor(pageH * aspect);

  // Keep the reader on the same page when switching between one- and two-page view
  const spreadRef = useRef(spread);
  useEffect(() => {
    if (spreadRef.current === spread) return;
    spreadRef.current = spread;
    setIndex((i) => (spread ? Math.floor(i / 2) : Math.max(1, i === 0 ? 1 : 2 * i)));
  }, [spread]);

  // First and last position, and the current one kept inside that range
  const maxIndex = spread ? Math.floor(numPages / 2) : numPages;
  const minIndex = spread ? 0 : 1;
  const current = clamp(index, minIndex, Math.max(minIndex, maxIndex));

  // Tell the page which page the reader is on (latest callback kept in a ref)
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;
  useEffect(() => {
    if (status !== 'ready' || !numPages || !onProgressRef.current) return;
    const page = spread ? Math.min(numPages, Math.max(1, current * 2 + 1)) : current;
    onProgressRef.current(page, numPages);
  }, [status, current, spread, numPages]);

  /* ---------- Open the PDF ---------- */
  useEffect(() => {
    if (!url) return undefined;
    let cancelled = false;
    let task = null;

    setStatus('loading');
    setLoadPercent(0);
    setLoadError(null);
    setImages({});

    loadPdfjs()
      .then((pdfjs) => {
        if (cancelled) return null;
        // No cookies sent with the file request; never run code generated from the PDF
        task = pdfjs.getDocument({ url, withCredentials: false, isEvalSupported: false });
        task.onProgress = ({ loaded, total }) => {
          if (total) setLoadPercent(Math.round((loaded / total) * 100));
        };
        return task.promise;
      })
      .then(async (pdf) => {
        if (!pdf || cancelled) return;
        pdfRef.current = pdf;
        const first = await pdf.getPage(1);
        const vp = first.getViewport({ scale: 1 });
        if (cancelled) return;
        setAspect(vp.width / vp.height);
        setNumPages(pdf.numPages);
        setIndex(spreadRef.current ? 0 : 1);
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Book reader:', err?.message || err);
        setLoadError(
          err?.name === 'MissingPDFException'
            ? 'The book file wasn’t found.'
            : 'The book couldn’t be opened here.'
        );
        setStatus('error');
      });

    return () => {
      cancelled = true;
      task?.destroy?.();
      pdfRef.current = null;
    };
  }, [url]);

  /* ---------- Render pages to images, nearest pages first ---------- */
  const imagesRef = useRef(images);
  imagesRef.current = images;
  const queueRef = useRef(new Set());
  const busyRef = useRef(false);
  const focusRef = useRef(1);
  const renderHRef = useRef(0);

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  renderHRef.current = Math.round(pageH * dpr);

  // Works through the queue of pages to render, one at a time, closest to the
  // reader first. Each page is drawn on a canvas and kept as a JPEG blob URL.
  const pump = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      while (queueRef.current.size && pdfRef.current) {
        const focus = focusRef.current;
        const num = [...queueRef.current].sort((p, q) => Math.abs(p - focus) - Math.abs(q - focus))[0];
        queueRef.current.delete(num);
        const targetH = renderHRef.current;
        const have = imagesRef.current[num];
        if (have && have.h >= targetH * 0.85) continue;

        const pdf = pdfRef.current;
        const page = await pdf.getPage(num);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: clamp(targetH / base.height, 0.5, 4) });
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, canvas, viewport }).promise;
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
        if (!blob || pdf !== pdfRef.current) continue;
        const src = URL.createObjectURL(blob);

        setImages((prev) => {
          const next = { ...prev, [num]: { src, h: canvas.height } };
          if (prev[num]) URL.revokeObjectURL(prev[num].src);
          // Forget the pages furthest from where the reader is
          const keys = Object.keys(next).map(Number);
          if (keys.length > CACHE_LIMIT) {
            keys
              .sort((p, q) => Math.abs(q - focusRef.current) - Math.abs(p - focusRef.current))
              .slice(0, keys.length - CACHE_LIMIT)
              .forEach((k) => {
                URL.revokeObjectURL(next[k].src);
                delete next[k];
              });
          }
          return next;
        });
      }
    } catch (err) {
      console.error('Book reader render:', err?.message || err);
    } finally {
      busyRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Queue the pages around the current position whenever it changes
    if (status !== 'ready' || !pageH) return;
    const focus = spread ? Math.max(1, 2 * current) : current;
    focusRef.current = focus;
    const ahead = spread ? 6 : 3;
    const behind = spread ? 3 : 2;
    for (let p = focus - behind; p <= focus + ahead; p += 1) {
      if (p >= 1 && p <= numPages) queueRef.current.add(p);
    }
    pump();
  }, [status, current, spread, numPages, pageH, pump]);

  // Free every image when the reader closes
  useEffect(() => () => {
    Object.values(imagesRef.current).forEach((img) => URL.revokeObjectURL(img.src));
  }, []);

  /* ---------- Page turning ---------- */
  const canNext = status === 'ready' && current < maxIndex;
  const canPrev = status === 'ready' && current > minIndex;

  // Keep the ref and the state of the turning leaf in step
  const setFlipState = (value) => {
    flipRef.current = value;
    setFlip(value);
  };

  // Animate the turning leaf to fully turned (1) or back (0), then settle the index
  const animateTo = useCallback((target, easing = easeOut) => {
    const start = flipRef.current;
    if (!start) return;
    cancelAnimationFrame(animRef.current);
    const from = start.x;
    const distance = Math.abs(target - from);
    const duration = prefersReducedMotion() ? 120 : 260 + 520 * distance;
    const t0 = performance.now();

    const step = (now) => {
      const t = clamp((now - t0) / duration, 0, 1);
      const x = from + (target - from) * easing(t);
      if (t < 1) {
        setFlipState({ a: start.a, x });
        animRef.current = requestAnimationFrame(step);
      } else {
        setIndex(target === 1 ? start.a + 1 : start.a);
        setFlipState(null);
      }
    };
    animRef.current = requestAnimationFrame(step);
  }, []);

  // Turn one page / spread forward or back
  const goNext = useCallback(() => {
    if (flipRef.current || !canNext) return;
    setFlipState({ a: current, x: 0 });
    animateTo(1, easeInOut);
  }, [canNext, current, animateTo]);

  const goPrev = useCallback(() => {
    if (flipRef.current || !canPrev) return;
    setFlipState({ a: current - 1, x: 1 });
    animateTo(0, easeInOut);
  }, [canPrev, current, animateTo]);

  // Jump straight to a position (slider, Home/End)
  const jumpTo = (value) => {
    if (flipRef.current) return;
    setIndex(clamp(Number(value), minIndex, maxIndex));
  };

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  /* Drag / swipe: the page follows the finger */
  const onPointerDown = (e) => {
    if (status !== 'ready' || flipRef.current || e.button > 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    dragRef.current = { startX: e.clientX, startY: e.clientY, rect, mode: null, id: e.pointerId };
  };

  const onPointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    if (!drag.mode) {
      if (Math.abs(dx) < 8) return;
      if (dx < 0 && canNext) {
        drag.mode = 'next';
        setFlipState({ a: current, x: 0 });
      } else if (dx > 0 && canPrev) {
        drag.mode = 'prev';
        setFlipState({ a: current - 1, x: 1 });
      } else {
        dragRef.current = null;
        return;
      }
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
    const span = Math.max(160, pageW * (spread ? 1.6 : 1.1));
    const x = drag.mode === 'next' ? clamp(-dx / span, 0, 1) : clamp(1 - dx / span, 0, 1);
    setFlipState({ a: flipRef.current.a, x });
  };

  const onPointerUp = (e) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag || drag.id !== e.pointerId) return;
    if (drag.mode) {
      const { x } = flipRef.current;
      const target = drag.mode === 'next' ? (x > 0.22 ? 1 : 0) : (x < 0.78 ? 0 : 1);
      animateTo(target);
      return;
    }
    // A tap: right half turns forward, left half turns back
    if (Math.abs(e.clientY - drag.startY) > 12) return;
    const mid = drag.rect.left + drag.rect.width / 2;
    if (e.clientX >= mid) goNext();
    else goPrev();
  };

  const onPointerCancel = () => {
    if (dragRef.current?.mode && flipRef.current) animateTo(flipRef.current.x > 0.5 ? 1 : 0);
    dragRef.current = null;
  };

  /* ---------- Keyboard, full screen, scroll lock ---------- */
  useEffect(() => {
    const onKey = (e) => {
      if (e.target instanceof HTMLInputElement && e.key !== 'Escape') return;
      if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); goNext(); }
      else if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); goPrev(); }
      else if (e.key === 'Home') jumpTo(minIndex);
      else if (e.key === 'End') jumpTo(maxIndex);
      else if (e.key === 'Escape' && !document.fullscreenElement) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    rootRef.current?.focus();
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Full screen on/off (errors such as a blocked request are ignored)
  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
  };

  const handleClose = () => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    onClose();
  };

  /* ---------- What is on screen ---------- */
  const shownPages = (() => {
    if (status !== 'ready') return '';
    if (!spread) return `Page ${current} of ${numPages}`;
    const l = leftOf(current);
    const r = rightOf(current, numPages);
    if (l && r) return `Pages ${l}–${r} of ${numPages}`;
    return `Page ${l || r} of ${numPages}`;
  })();

  // One sheet of paper: the rendered page, or its number while it renders
  const pageFace = (num, extra = '') => (
    <div className={`${styles.paper} ${extra}`}>
      {num && images[num] ? (
        <img src={images[num].src} alt={`Page ${num}`} className={styles.pageImage} draggable="false" />
      ) : num ? (
        <span className={styles.pagePending} aria-hidden="true">{num}</span>
      ) : null}
    </div>
  );

  // The book on the stage, including the leaf while a page is being turned
  const renderBook = () => {
    const f = flip;
    const s = f ? Math.sin(Math.PI * f.x) : 0; // how far the leaf is lifted
    const angle = f ? -180 * f.x : 0;

    if (spread) {
      // Base pages under the turning leaf
      const baseLeft = f ? leftOf(f.a) : leftOf(current);
      const baseRight = f ? rightOf(f.a + 1, numPages) : rightOf(current, numPages);
      const remaining = numPages ? (numPages - (2 * current + 1)) / numPages : 0;
      const read = numPages ? (2 * current) / numPages : 0;

      return (
        <div className={styles.book} style={{ width: pageW * 2, height: pageH }}>
          <div
            className={`${styles.half} ${styles.halfLeft} ${baseLeft ? '' : styles.halfEmpty}`}
            style={{ '--stack': `${Math.round(read * 7)}px` }}
          >
            {baseLeft && pageFace(baseLeft)}
            {baseLeft && <div className={styles.gutterLeft} aria-hidden="true" />}
            {f && f.x > 0.5 && baseLeft && (
              <div className={styles.castLeft} style={{ opacity: s * 0.9 }} aria-hidden="true" />
            )}
          </div>
          <div
            className={`${styles.half} ${styles.halfRight} ${baseRight ? '' : styles.halfEmpty}`}
            style={{ '--stack': `${Math.round(Math.max(0, remaining) * 7)}px` }}
          >
            {baseRight && pageFace(baseRight)}
            {baseRight && <div className={styles.gutterRight} aria-hidden="true" />}
            {f && f.x < 0.5 && baseRight && (
              <div className={styles.castRight} style={{ opacity: s * 0.9 }} aria-hidden="true" />
            )}
          </div>

          {f && (
            <div
              className={styles.leaf}
              style={{ left: pageW, width: pageW, height: pageH, transform: `rotateY(${angle}deg)` }}
            >
              <div className={styles.face}>
                {pageFace(rightOf(f.a, numPages))}
                <div className={styles.gutterRight} aria-hidden="true" />
                <div className={styles.shadeFront} style={{ opacity: s }} aria-hidden="true" />
              </div>
              <div className={`${styles.face} ${styles.faceBack}`}>
                {pageFace(leftOf(f.a + 1))}
                <div className={styles.gutterLeft} aria-hidden="true" />
                <div className={styles.shadeBack} style={{ opacity: s }} aria-hidden="true" />
              </div>
            </div>
          )}
        </div>
      );
    }

    // One page at a time
    const base = f ? f.a + 1 : current;
    return (
      <div className={`${styles.book} ${styles.bookSingle}`} style={{ width: pageW, height: pageH }}>
        <div className={`${styles.half} ${styles.halfSingle}`}>
          {pageFace(base)}
          {f && <div className={styles.castRight} style={{ opacity: s * 0.9 }} aria-hidden="true" />}
        </div>
        {f && (
          <div className={styles.leaf} style={{ left: 0, width: pageW, height: pageH, transform: `rotateY(${angle}deg)` }}>
            <div className={styles.face}>
              {pageFace(f.a)}
              <div className={styles.shadeFront} style={{ opacity: s }} aria-hidden="true" />
            </div>
            <div className={`${styles.face} ${styles.faceBack}`}>
              {pageFace(null, styles.paperBack)}
              <div className={styles.shadeBack} style={{ opacity: s }} aria-hidden="true" />
            </div>
          </div>
        )}
      </div>
    );
  };

  // A problem fetching the link (from the parent) or opening the PDF (here)
  const errorMessage = linkError || loadError;

  return (
    <div
      ref={rootRef}
      className={styles.reader}
      role="dialog"
      aria-modal="true"
      aria-label={`Reading ${title}`}
      tabIndex={-1}
    >
      <div className={styles.aura} aria-hidden="true" />

      {/* Title, page count, full screen and close */}
      <header className={styles.topBar}>
        <div className={styles.titleBlock}>
          <h2 className={styles.title}>{title}</h2>
          {shownPages && <span className={styles.pageInfo} aria-live="polite">{shownPages}</span>}
        </div>
        <div className={styles.topActions}>
          {document.fullscreenEnabled && (
            <button
              type="button"
              className={styles.roundButton}
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'}
            >
              {isFullscreen ? <FaCompress /> : <FaExpand />}
            </button>
          )}
          <button type="button" className={styles.roundButton} onClick={handleClose} aria-label="Close book">
            <FaTimes />
          </button>
        </div>
      </header>

      {/* Error message, loading animation, or the book */}
      <div className={styles.stage} ref={stageRef}>
        {errorMessage ? (
          <div className={styles.message}>
            <h3>{errorMessage}</h3>
            <p>Check your connection and try again{url ? ', or open the PDF in a new tab' : ''}.</p>
            <div className={styles.messageActions}>
              {onRetry && (
                <button type="button" className={styles.primaryButton} onClick={onRetry}>
                  <FaRedo aria-hidden="true" /> Try again
                </button>
              )}
              {safeUrl(url) && (
                <a className={styles.ghostButton} href={safeUrl(url)} target="_blank" rel="noopener noreferrer">
                  <FaExternalLinkAlt aria-hidden="true" /> Open PDF
                </a>
              )}
            </div>
          </div>
        ) : status !== 'ready' || !pageH ? (
          <div className={styles.message} role="status">
            <div className={styles.openingBook} aria-hidden="true">
              <span /><span /><span />
            </div>
            <p>{url && loadPercent > 0 ? `Opening the book… ${loadPercent}%` : 'Opening the book…'}</p>
          </div>
        ) : (
          <div
            className={styles.bookArea}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
          >
            {renderBook()}
            <div className={styles.floorShadow} style={{ width: spread ? pageW * 2 : pageW }} aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Page controls */}
      {status === 'ready' && !errorMessage && (
        <footer className={styles.bottomBar}>
          <button type="button" className={styles.roundButton} onClick={goPrev} disabled={!canPrev} aria-label="Previous page">
            <FaChevronLeft />
          </button>
          <label className={styles.scrubber}>
            <span className={styles.srOnly}>Go to page</span>
            <input
              type="range"
              min={minIndex}
              max={Math.max(minIndex, maxIndex)}
              value={current}
              onChange={(e) => jumpTo(e.target.value)}
              aria-valuetext={shownPages}
            />
          </label>
          <button type="button" className={styles.roundButton} onClick={goNext} disabled={!canNext} aria-label="Next page">
            <FaChevronRight />
          </button>
        </footer>
      )}
    </div>
  );
};

export default BookReader;
