/**
 * components/BookReader/BookReader.jsx
 * -----------------------------------------------------------------------------
 * Full-screen flip-book reader for ebooks (opened from EbookDetail).
 *   - loads pdf.js from a CDN only when a book is opened
 *   - renders pages to images in the background, nearest pages first, and
 *     keeps at most CACHE_LIMIT of them in memory
 *   - two-page spreads on wide screens, one page on phones / portrait
 *   - zoom from 100% to 400%: the − / + buttons, Ctrl + mouse wheel (or a
 *     trackpad pinch), a two-finger pinch on touch screens, or the + / − / 0
 *     keys. Zoomed pages are re-drawn sharper, and dragging moves around the
 *     page instead of turning it
 *   - turn pages by dragging, tapping either half, the arrow buttons, the
 *     slider or the keyboard (arrows, Page Up/Down, Space, Home, End, Esc)
 *   - opens at startPage (the reader's bookmark, or a chapter's first page)
 *   - the bookmark: the ribbon button (or B) puts it on the page on screen, or
 *     takes it off; a ribbon hangs from that page, and a mark on the slider
 *     jumps back to it from anywhere in the book
 *   - chapters (the book's own, with their pages): the list button at the
 *     bottom shows the chapter on screen and jumps to any other
 *   - reports the current page through onProgress (used for History)
 *   - shows a clear message with "Try again" / "Open PDF" if the book can't load
 * -----------------------------------------------------------------------------
 */
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  FaTimes, FaExpand, FaCompress, FaChevronLeft, FaChevronRight, FaExternalLinkAlt, FaRedo,
  FaSearchPlus, FaSearchMinus, FaBookmark, FaRegBookmark, FaListUl,
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

/* ---------------------------------------------------------------- zoom
   1 = the page fits the screen. Buttons step through ZOOM_STEPS; pinch and
   Ctrl + wheel zoom smoothly in between. Pages are never drawn taller than
   MAX_RENDER_H pixels, which keeps memory use reasonable on phones. */
const ZOOM_STEPS = [1, 1.25, 1.5, 2, 2.5, 3, 4];
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const MAX_RENDER_H = 3600;
const RENDER_DELAY_MS = 250; // wait for zooming to settle before drawing sharper pages

/* Spreads (two-page view): 0 = [ -, 1 ], 1 = [ 2, 3 ], 2 = [ 4, 5 ] ...
   so the cover sits alone on the right, like a real book. */
const leftOf = (s) => (s === 0 ? null : 2 * s);
const rightOf = (s, n) => (2 * s + 1 <= n ? 2 * s + 1 : null);

const NOTE_MS = 2800; // how long "Page 12 bookmarked" stays
const RIBBON_DROP_MS = 700;

// "Pages 4–5" / "Page 4"
const pagesOf = (chapter) => (chapter.last_page && chapter.last_page !== chapter.first_page
  ? `${chapter.first_page}–${chapter.last_page}` : `${chapter.first_page}`);

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
 *  - startPage: the page to open at (default 1)
 *  - bookmarkPage: the reader's bookmarked page, or null
 *  - onBookmark(page | null, numPages): optional; puts the bookmark on that page (null: takes it
 *    off) and resolves true when it saved. Without it there is no bookmark button.
 *  - chapters: optional [{ id, title, first_page, last_page }]; those with a first page are listed
 */
const BookReader = ({
  url, title, linkError, onRetry, onClose, onProgress,
  startPage = 1, bookmarkPage = null, onBookmark, chapters = [],
}) => {
  // DOM nodes and the open PDF document
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const areaRef = useRef(null); // the scrollable area around the book (scrolls when zoomed)
  const wrapRef = useRef(null); // the book itself, used to keep the zoom centred on a point
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

  // Zoom (1 = fit) and the zoom the pages are drawn for (catches up after zooming stops)
  const [zoom, setZoom] = useState(1);
  const [renderZoom, setRenderZoom] = useState(1);
  const zoomRef = useRef(1);
  const anchorRef = useRef(null); // the point that should stay under the finger/cursor while zooming
  const pointersRef = useRef(new Map()); // touches on the book, for pinch-to-zoom
  const pinchRef = useRef(null);

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

  // One page on phones / portrait, two pages side by side on wide screens
  const spread = stage.w >= 760 && stage.w > stage.h * 1.05;

  // Page size that fits the stage (two pages side by side in spread view), then zoomed
  const availW = Math.max(0, stage.w - (spread ? 48 : 24));
  const availH = Math.max(0, stage.h - 24);
  const fitH = Math.floor(Math.min(availH, (spread ? availW / 2 : availW) / aspect));
  const pageH = Math.floor(fitH * zoom);
  const pageW = Math.floor(fitH * aspect * zoom);
  const isZoomed = zoom > 1.001;

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
  const startRef = useRef(startPage); // read when the book has opened
  startRef.current = startPage;

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
        // Open at the start page (the bookmark or a chapter): the spread or page that shows it
        const opening = clamp(Math.round(Number(startRef.current) || 1), 1, pdf.numPages);
        setIndex(spreadRef.current ? Math.floor(opening / 2) : opening);
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

  // Draw pages for the settled zoom, sharp on high-density screens, within the size cap
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const renderH = Math.min(MAX_RENDER_H, Math.round(fitH * renderZoom * dpr));
  renderHRef.current = renderH;

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
    if (status !== 'ready' || !renderH) return;
    const focus = spread ? Math.max(1, 2 * current) : current;
    focusRef.current = focus;
    const ahead = spread ? 6 : 3;
    const behind = spread ? 3 : 2;
    for (let p = focus - behind; p <= focus + ahead; p += 1) {
      if (p >= 1 && p <= numPages) queueRef.current.add(p);
    }
    pump();
  }, [status, current, spread, numPages, renderH, pump]);

  // Free every image when the reader closes
  useEffect(() => () => {
    Object.values(imagesRef.current).forEach((img) => URL.revokeObjectURL(img.src));
  }, []);

  /* ---------- Zoom ---------- */
  /**
   * Zoom to `value`, keeping the point under (clientX, clientY) where it is
   * (the middle of the screen when no point is given).
   */
  const zoomAt = useCallback((value, clientX, clientY) => {
    const next = clamp(Math.round(value * 100) / 100, MIN_ZOOM, MAX_ZOOM);
    if (next === zoomRef.current) return;
    const area = areaRef.current;
    const book = wrapRef.current;
    if (area && book) {
      const box = area.getBoundingClientRect();
      const r = book.getBoundingClientRect();
      const x = clientX ?? box.left + box.width / 2;
      const y = clientY ?? box.top + box.height / 2;
      // Where that point is on the book, as a fraction of its size
      anchorRef.current = { x, y, fx: r.width ? (x - r.left) / r.width : 0.5, fy: r.height ? (y - r.top) / r.height : 0.5 };
    }
    zoomRef.current = next;
    setZoom(next);
  }, []);

  // After the bigger/smaller book is laid out, scroll so the anchor point is back under the cursor
  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    const area = areaRef.current;
    const book = wrapRef.current;
    anchorRef.current = null;
    if (!anchor || !area || !book) return;
    const r = book.getBoundingClientRect();
    area.scrollLeft += r.left + anchor.fx * r.width - anchor.x;
    area.scrollTop += r.top + anchor.fy * r.height - anchor.y;
  }, [zoom]);

  // Draw sharper (or lighter) pages once zooming has stopped for a moment
  useEffect(() => {
    const t = setTimeout(() => setRenderZoom(zoom), RENDER_DELAY_MS);
    return () => clearTimeout(t);
  }, [zoom]);

  // Button steps: the next step up / down from the current zoom
  const zoomIn = () => zoomAt(ZOOM_STEPS.find((z) => z > zoomRef.current + 0.01) ?? MAX_ZOOM);
  const zoomOut = () => zoomAt([...ZOOM_STEPS].reverse().find((z) => z < zoomRef.current - 0.01) ?? MIN_ZOOM);
  const zoomReset = () => zoomAt(1);

  // Ctrl/⌘ + wheel (and trackpad pinch, which browsers report the same way) zooms at the cursor.
  // Added directly because React's wheel listener can't stop the browser zooming the whole page.
  const hasBookArea = fitH > 0; // the listener is (re)attached once the book area exists
  useEffect(() => {
    const area = areaRef.current;
    if (!area) return undefined;
    const onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      // One mouse-wheel notch (deltaY 100) is about 20%; trackpad pinches send small steps
      zoomAt(zoomRef.current * Math.exp(-e.deltaY * 0.002), e.clientX, e.clientY);
    };
    area.addEventListener('wheel', onWheel, { passive: false });
    return () => area.removeEventListener('wheel', onWheel);
  }, [zoomAt, status, hasBookArea]);

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

  // Jump to a page: the spread or page that shows it
  const goToPage = (page) => {
    if (flipRef.current || !numPages) return;
    const p = clamp(Math.round(Number(page) || 1), 1, numPages);
    setIndex(spread ? Math.floor(p / 2) : p);
  };

  // The pages on screen; the first is the one a bookmark goes on
  const visible = status !== 'ready' ? []
    : spread ? [leftOf(current), rightOf(current, numPages)].filter(Boolean) : [current];
  const readingPage = visible[0] || 1;

  /* ---------- The bookmark ---------- */
  const aliveRef = useRef(true);
  useEffect(() => () => { aliveRef.current = false; }, []);
  const [markBusy, setMarkBusy] = useState(false);
  const [dropping, setDropping] = useState(false); // the ribbon was just put in: it falls onto the page
  const [note, setNote] = useState('');
  const noteTimer = useRef(0);
  const dropTimer = useRef(0);
  useEffect(() => () => { clearTimeout(noteTimer.current); clearTimeout(dropTimer.current); }, []);

  const showNote = (text) => {
    clearTimeout(noteTimer.current);
    setNote(text);
    noteTimer.current = setTimeout(() => setNote(''), NOTE_MS);
  };

  const hasMark = Number(bookmarkPage) > 0 && Number(bookmarkPage) <= numPages;
  const markHere = hasMark && visible.includes(Number(bookmarkPage));

  // On the page on screen: take it off. Anywhere else (or none): put it here.
  const toggleBookmark = async () => {
    if (!onBookmark || markBusy || status !== 'ready') return;
    const removing = markHere;
    const page = readingPage;
    setMarkBusy(true);
    if (!removing) {
      setDropping(true);
      clearTimeout(dropTimer.current);
      dropTimer.current = setTimeout(() => setDropping(false), RIBBON_DROP_MS);
    }
    let saved = false;
    try {
      saved = await onBookmark(removing ? null : page, numPages);
    } catch {
      saved = false;
    }
    if (!aliveRef.current) return;
    setMarkBusy(false);
    if (!saved) showNote('The bookmark didn’t save. Try again.');
    else showNote(removing ? 'Bookmark removed.' : `Page ${page} bookmarked. The book opens here next time.`);
  };

  /* ---------- Chapters ---------- */
  const listed = chapters
    .filter((c) => Number(c.first_page) > 0 && Number(c.first_page) <= (numPages || Infinity))
    .sort((a, b) => a.first_page - b.first_page);
  // The chapter on screen: the one the last page on screen is in (a chapter that starts on the
  // right-hand page is the one just opened)
  const lastShown = visible[visible.length - 1] || readingPage;
  const chapterNow = [...listed].reverse().find((c) => c.first_page <= lastShown) || null;
  const [panelOpen, setPanelOpen] = useState(false);
  const panelButtonRef = useRef(null);
  const panelRef = useRef(null);

  const closePanel = (giveFocusBack = true) => {
    setPanelOpen(false);
    if (giveFocusBack) panelButtonRef.current?.focus();
  };

  // The list opens at the chapter on screen
  useEffect(() => {
    if (!panelOpen) return;
    const now = panelRef.current?.querySelector('[aria-current="true"]') || panelRef.current?.querySelector('button');
    now?.scrollIntoView?.({ block: 'nearest' });
    now?.focus();
  }, [panelOpen]);

  const openChapter = (chapter) => {
    closePanel(false);
    goToPage(chapter.first_page);
    rootRef.current?.focus();
  };

  // Zoomed in and the page changes: start reading the new page from its top
  useEffect(() => {
    if (zoomRef.current > 1 && areaRef.current) areaRef.current.scrollTop = 0;
  }, [current, spread]);

  /* Drag / swipe: the page follows the finger. Two fingers pinch-zoom.
     When zoomed in, dragging moves around the page instead of turning it. */
  const pinchDistance = () => {
    const [a, b] = [...pointersRef.current.values()];
    return Math.hypot(a.x - b.x, a.y - b.y) || 1;
  };

  const onPointerDown = (e) => {
    if (status !== 'ready' || e.button > 0) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Second finger down: start pinching (and let go of any half-turned page)
    if (pointersRef.current.size === 2) {
      if (dragRef.current?.mode === 'next' || dragRef.current?.mode === 'prev') {
        animateTo(flipRef.current && flipRef.current.x > 0.5 ? 1 : 0);
      }
      dragRef.current = null;
      pinchRef.current = { dist: pinchDistance(), zoom: zoomRef.current };
      return;
    }
    if (flipRef.current || pointersRef.current.size > 2) return;

    if (zoomRef.current > 1 && areaRef.current) {
      const area = areaRef.current;
      dragRef.current = {
        mode: 'pan', id: e.pointerId, startX: e.clientX, startY: e.clientY,
        left: area.scrollLeft, top: area.scrollTop,
      };
      e.currentTarget.setPointerCapture?.(e.pointerId);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    dragRef.current = { startX: e.clientX, startY: e.clientY, rect, mode: null, id: e.pointerId };
  };

  const onPointerMove = (e) => {
    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    // Pinch: zoom by how far the fingers moved apart, around the point between them
    const pinch = pinchRef.current;
    if (pinch && pointersRef.current.size >= 2) {
      const [a, b] = [...pointersRef.current.values()];
      zoomAt(pinch.zoom * (pinchDistance() / pinch.dist), (a.x + b.x) / 2, (a.y + b.y) / 2);
      return;
    }
    const drag = dragRef.current;
    if (!drag || drag.id !== e.pointerId) return;
    if (drag.mode === 'pan') {
      areaRef.current.scrollLeft = drag.left - (e.clientX - drag.startX);
      areaRef.current.scrollTop = drag.top - (e.clientY - drag.startY);
      return;
    }
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
    pointersRef.current.delete(e.pointerId);
    if (pinchRef.current) {
      // The pinch ends when fewer than two fingers remain
      if (pointersRef.current.size < 2) pinchRef.current = null;
      dragRef.current = null;
      return;
    }
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag || drag.id !== e.pointerId || drag.mode === 'pan') return;
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

  const onPointerCancel = (e) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (dragRef.current?.mode && dragRef.current.mode !== 'pan' && flipRef.current) {
      animateTo(flipRef.current.x > 0.5 ? 1 : 0);
    }
    dragRef.current = null;
  };

  /* ---------- Keyboard, full screen, scroll lock ---------- */
  useEffect(() => {
    const onKey = (e) => {
      // The chapter list is open: Escape closes it; the keys stay with the list
      if (panelOpen) {
        if (e.key === 'Escape') { e.preventDefault(); closePanel(); }
        return;
      }
      if (e.target instanceof HTMLInputElement && e.key !== 'Escape') return;
      if ((e.key === 'b' || e.key === 'B') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (onBookmark && status === 'ready') { e.preventDefault(); toggleBookmark(); }
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) {
        // Ctrl + / Ctrl − zoom the book rather than the whole website
        if (['+', '=', '-', '0'].includes(e.key) && status === 'ready') {
          e.preventDefault();
          if (e.key === '0') zoomReset(); else if (e.key === '-') zoomOut(); else zoomIn();
        }
        return;
      }
      if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); goNext(); }
      else if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); goPrev(); }
      else if (e.key === 'Home') jumpTo(minIndex);
      else if (e.key === 'End') jumpTo(maxIndex);
      else if ((e.key === '+' || e.key === '=') && status === 'ready') zoomIn();
      else if (e.key === '-' && status === 'ready') zoomOut();
      else if (e.key === '0' && status === 'ready') zoomReset();
      // Escape: first back to 100%, then out of the reader
      else if (e.key === 'Escape' && zoomRef.current > 1) zoomReset();
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

  // One sheet of paper: the rendered page, or its number while it renders. The bookmarked
  // page has the ribbon, near its outer top corner (`side`: which half of the book it is on).
  const pageFace = (num, extra = '', side = 'right') => (
    <div className={`${styles.paper} ${extra}`}>
      {num && images[num] ? (
        <img src={images[num].src} alt={`Page ${num}`} className={styles.pageImage} draggable="false" />
      ) : num ? (
        <span className={styles.pagePending} aria-hidden="true">{num}</span>
      ) : null}
      {num && hasMark && num === Number(bookmarkPage) && (
        <span
          className={`${styles.ribbon} ${side === 'left' ? styles.ribbonLeft : ''} ${dropping ? styles.ribbonDrop : ''}`}
          aria-hidden="true"
        >
          <span />
        </span>
      )}
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
            {baseLeft && pageFace(baseLeft, '', 'left')}
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
                {pageFace(leftOf(f.a + 1), '', 'left')}
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
          {/* Zoom out / reset (shows the current zoom) / zoom in */}
          {status === 'ready' && !errorMessage && (
            <div className={styles.zoomGroup} role="group" aria-label="Zoom">
              <button type="button" onClick={zoomOut} disabled={!isZoomed} aria-label="Zoom out" title="Zoom out (−)">
                <FaSearchMinus aria-hidden="true" />
              </button>
              <button
                type="button"
                className={styles.zoomValue}
                onClick={zoomReset}
                disabled={!isZoomed}
                aria-label={`Zoom ${Math.round(zoom * 100)}%. Reset to fit`}
                title="Fit to screen (0)"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button type="button" onClick={zoomIn} disabled={zoom >= MAX_ZOOM} aria-label="Zoom in" title="Zoom in (+)">
                <FaSearchPlus aria-hidden="true" />
              </button>
            </div>
          )}
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
            ref={areaRef}
            className={`${styles.bookArea} ${isZoomed ? styles.bookAreaZoomed : ''}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
          >
            {/* margin:auto centres the book while it fits, and lets every edge be scrolled to once zoomed */}
            <div ref={wrapRef} className={styles.bookWrap}>
              {renderBook()}
              {!isZoomed && (
                <div className={styles.floorShadow} style={{ width: spread ? pageW * 2 : pageW }} aria-hidden="true" />
              )}
            </div>
          </div>
        )}
      </div>

      {/* "Page 12 bookmarked" and the like (always there, so screen readers hear it) */}
      <p className={note ? styles.note : styles.srOnly} role="status" aria-live="polite">{note}</p>

      {/* Page controls: chapters, turning, the slider (with the bookmark on it), the bookmark */}
      {status === 'ready' && !errorMessage && (
        <footer className={styles.bottomBar}>
          {listed.length > 0 && (
            <div className={styles.chaptersWrap}>
              <button
                type="button"
                ref={panelButtonRef}
                className={`${styles.chaptersButton} ${panelOpen ? styles.chaptersButtonOpen : ''}`}
                onClick={() => (panelOpen ? closePanel() : setPanelOpen(true))}
                aria-expanded={panelOpen}
                aria-controls="reader-chapters"
                aria-label={chapterNow ? `Chapters. On screen: ${chapterNow.title}` : 'Chapters'}
                title="Chapters"
              >
                <FaListUl aria-hidden="true" />
                <span className={styles.chaptersLabel} aria-hidden="true">{chapterNow ? chapterNow.title : 'Chapters'}</span>
              </button>

              {/* The chapters, the one on screen marked; a tap anywhere else closes the list */}
              {panelOpen && (
                <>
                  <div className={styles.panelScrim} onPointerDown={() => closePanel()} aria-hidden="true" />
                  <nav id="reader-chapters" ref={panelRef} className={styles.chapterPanel} aria-label="Chapters">
                    <p className={styles.panelTitle}>Chapters</p>
                    <ol className={styles.chapterRows}>
                      {listed.map((chapter, i) => {
                        const isNow = chapterNow?.id === chapter.id;
                        const last = chapter.last_page || chapter.first_page;
                        const marked = hasMark && bookmarkPage >= chapter.first_page && bookmarkPage <= last;
                        return (
                          <li key={chapter.id ?? chapter.first_page}>
                            <button
                              type="button"
                              className={`${styles.chapterRow} ${isNow ? styles.chapterRowNow : ''}`}
                              aria-current={isNow ? 'true' : undefined}
                              onClick={() => openChapter(chapter)}
                            >
                              <span className={styles.rowIndex}>{i + 1}</span>
                              <span className={styles.rowTitle}>{chapter.title}</span>
                              <span className={styles.rowPages}>
                                {marked && <span className={styles.rowMark} role="img" aria-label="Your bookmark is in this chapter" />}
                                {pagesOf(chapter)}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ol>
                  </nav>
                </>
              )}
            </div>
          )}
          <button type="button" className={styles.roundButton} onClick={goPrev} disabled={!canPrev} aria-label="Previous page">
            <FaChevronLeft />
          </button>
          <div className={styles.scrubber}>
            <label className={styles.scrubberLabel}>
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
            {hasMark && !markHere && (
              <button
                type="button"
                className={styles.trackMark}
                style={{
                  '--at': (clamp(spread ? Math.floor(bookmarkPage / 2) : bookmarkPage, minIndex, maxIndex) - minIndex)
                    / Math.max(1, maxIndex - minIndex),
                }}
                onClick={() => goToPage(bookmarkPage)}
                aria-label={`Go to your bookmark, page ${bookmarkPage}`}
                title={`Your bookmark: page ${bookmarkPage}`}
              />
            )}
          </div>
          <button type="button" className={styles.roundButton} onClick={goNext} disabled={!canNext} aria-label="Next page">
            <FaChevronRight />
          </button>
          {onBookmark && (
            <button
              type="button"
              className={`${styles.roundButton} ${markHere ? styles.markOn : ''}`}
              onClick={toggleBookmark}
              disabled={markBusy}
              aria-pressed={markHere}
              aria-label="Bookmark this page"
              title={markHere ? 'Remove the bookmark (B)' : hasMark ? 'Move the bookmark to this page (B)' : 'Bookmark this page (B)'}
            >
              {markHere ? <FaBookmark aria-hidden="true" /> : <FaRegBookmark aria-hidden="true" />}
            </button>
          )}
        </footer>
      )}
    </div>
  );
};

export default BookReader;
