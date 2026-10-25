/**
 * pages/Sakhis/useReadAloud.js
 * -----------------------------------------------------------------------------
 * Reads a story aloud with the browser's own voices (Web Speech API), one
 * sentence at a time, and says which paragraph is being read so the page can
 * highlight it. The story page uses this only when Google's voices aren't set
 * up on the server (useStoryVoice.js is the one with the real Punjabi voice).
 *
 *   const reader = useReadAloud(paragraphs, 'en' | 'pa');
 *   reader.available   a voice for that language exists on this device
 *   reader.speaking    reading now (reader.state: 'playing' or 'idle')
 *   reader.current     index of the paragraph being read, or -1 (reader.part: the same as text)
 *   reader.start(i)    read from paragraph i (default 0); call it from a click
 *   reader.stop()
 *
 * Nothing is sent anywhere: the voices are the device's. Many devices have no
 * Punjabi voice; then `available` is false and the page hides the button.
 * Reading stops when the text or language changes and when the page closes.
 * -----------------------------------------------------------------------------
 */
import { useCallback, useEffect, useRef, useState } from 'react';

const synth = () => (typeof window !== 'undefined' && 'speechSynthesis' in window
  && typeof window.SpeechSynthesisUtterance === 'function' ? window.speechSynthesis : null);

// Preferred voices, best first: Indian English says Punjabi names most naturally
const WANTED = {
  en: ['en-in', 'en-gb', 'en-us', 'en'],
  pa: ['pa-in', 'pa-guru', 'pa'],
};

const pickVoice = (voices, lang) => {
  const tag = (v) => String(v.lang || '').replace('_', '-').toLowerCase();
  for (const want of WANTED[lang] || WANTED.en) {
    const voice = voices.find((v) => tag(v) === want) || voices.find((v) => tag(v).startsWith(`${want}-`));
    if (voice) return voice;
  }
  return null;
};

// Short pieces: long utterances can stall in some browsers. Splits after . ! ? and the danda ।
const sentences = (text) => (String(text).match(/[^.!?।॥]+[.!?।॥]*["”’)]*\s*/g) || [String(text)])
  .map((s) => s.trim())
  .filter(Boolean);

const useReadAloud = (paragraphs, lang) => {
  const [voices, setVoices] = useState(() => synth()?.getVoices() || []);
  const [speaking, setSpeaking] = useState(false);
  const [current, setCurrent] = useState(-1);
  const run = useRef(0); // a new number for every start/stop, so events from an old reading are ignored

  // Voices often arrive a moment after the page loads
  useEffect(() => {
    const s = synth();
    if (!s) return undefined;
    const update = () => setVoices(s.getVoices());
    update();
    if (s.addEventListener) s.addEventListener('voiceschanged', update);
    return () => { if (s.removeEventListener) s.removeEventListener('voiceschanged', update); };
  }, []);

  const voice = pickVoice(voices, lang);

  const stop = useCallback(() => {
    run.current += 1;
    synth()?.cancel();
    setSpeaking(false);
    setCurrent(-1);
  }, []);

  const start = useCallback((from = 0) => {
    const s = synth();
    if (!s || !voice || !paragraphs.length) return;
    s.cancel();
    const id = run.current + 1;
    run.current = id;
    const pieces = [];
    paragraphs.slice(from).forEach((text, k) => {
      sentences(text).forEach((sentence) => pieces.push({ index: from + k, sentence }));
    });
    pieces.forEach(({ index, sentence }, n) => {
      const u = new window.SpeechSynthesisUtterance(sentence);
      u.voice = voice;
      u.lang = voice.lang;
      u.rate = 0.92; // a little slower than normal, for young listeners
      u.onstart = () => { if (run.current === id) setCurrent(index); };
      if (n === pieces.length - 1) {
        u.onend = () => {
          if (run.current !== id) return;
          setSpeaking(false);
          setCurrent(-1);
        };
      }
      u.onerror = (e) => {
        // 'interrupted' / 'canceled' come from stop(); anything else ends the reading
        if (run.current !== id || e.error === 'interrupted' || e.error === 'canceled') return;
        setSpeaking(false);
        setCurrent(-1);
      };
      s.speak(u);
    });
    setSpeaking(true);
    setCurrent(from);
  }, [paragraphs, voice]);

  // A new story or language: stop reading the old one. Leaving the page stops it too.
  useEffect(() => stop, [paragraphs, lang, stop]);

  return {
    available: Boolean(synth() && voice),
    speaking,
    state: speaking ? 'playing' : 'idle',
    current,
    part: current >= 0 ? String(current) : '',
    start,
    stop,
  };
};

export default useReadAloud;
