/**
 * pages/Sakhis/useStoryVoice.js
 * -----------------------------------------------------------------------------
 * Reads a story aloud with Google's voices: a native Punjabi voice for the
 * Gurmukhi text and an Indian English voice for the English. The API makes
 * each part (the title, every paragraph, the lesson) into an MP3 the first
 * time anyone listens and keeps it (sikhism_api/speech.py). This plays the
 * parts in order and says which one is playing, so the page can highlight it.
 *
 *   const voice = useStoryVoice({ apiUrl, slug, lang, parts, title });
 *   voice.available   this story can be read in this language (the API listed its parts)
 *   voice.state       'idle' | 'loading' | 'playing' | 'paused'
 *   voice.speaking    anything but idle
 *   voice.part        the part being read: 'title', '0', '1', ..., 'lesson', or ''
 *   voice.current     the paragraph being read (a number), or -1
 *   voice.start(i)    read from part i (default 0); call it from a click, as phones require
 *   voice.pause(), voice.resume(), voice.stop()
 *   voice.speed       1, 0.75 or 1.25; voice.nextSpeed() moves to the next (kept on this device)
 *   voice.error       a sentence to show when the audio couldn't be played
 *
 * One <audio> element plays every part, so phones that only allow sound after
 * a tap keep reading from one paragraph to the next. While a part plays, the
 * next one is asked for, so the server has it ready in time. The lock screen
 * shows the story's title with play and pause (Media Session).
 * -----------------------------------------------------------------------------
 */
import { useEffect, useRef, useState } from 'react';
import { sakhiApi } from '../../api/sikhismApi';

export const SPEEDS = [1, 0.75, 1.25];
const SPEED_KEY = 'virsaa:story-speed';
const LOAD_PROBLEM = 'The story couldn’t be played. Check your connection and try again.';

const savedSpeed = () => {
  try {
    const value = Number(localStorage.getItem(SPEED_KEY));
    return SPEEDS.includes(value) ? value : 1;
  } catch {
    return 1; // storage blocked
  }
};

const canPlayAudio = () => typeof window !== 'undefined' && typeof window.Audio === 'function';
const mediaSession = () => (typeof navigator !== 'undefined' && navigator.mediaSession ? navigator.mediaSession : null);

const useStoryVoice = ({ apiUrl, slug, lang, parts, title }) => {
  const [state, setState] = useState('idle');
  const [at, setAt] = useState(-1); // the part being read (its place in `parts`)
  const [error, setError] = useState('');
  const [speed, setSpeed] = useState(savedSpeed);
  const audioRef = useRef(null);
  const pos = useRef(-1);       // the same, for the audio element's events
  const retried = useRef(-1);   // the part that was already tried a second time
  const latest = useRef({});    // the props and speed, for the same events
  latest.current = { apiUrl, slug, lang, parts: parts || [], title, speed };
  const handlers = useRef({});  // the functions below, as of the last render
  const sessionOn = useRef(false); // this page has the lock screen's controls

  const urlOf = (i) => {
    const { apiUrl: api, slug: story, lang: language, parts: list } = latest.current;
    return sakhiApi.speechUrl(api, story, language, list[i]);
  };

  // ---------------------------------------------------------------- the lock screen
  const setSession = (on) => {
    const session = mediaSession();
    if (!session || (!on && !sessionOn.current)) return; // never clear another player's controls
    sessionOn.current = on;
    const actions = {
      play: () => handlers.current.resume(),
      pause: () => handlers.current.pause(),
      stop: () => handlers.current.stop(),
      previoustrack: () => handlers.current.jump(-1),
      nexttrack: () => handlers.current.jump(1),
    };
    Object.entries(actions).forEach(([action, run]) => {
      try { session.setActionHandler(action, on ? run : null); } catch { /* not supported here */ }
    });
    try {
      session.metadata = on && typeof window.MediaMetadata === 'function'
        ? new window.MediaMetadata({ title: latest.current.title || 'Story', artist: 'Virsaa', album: 'Sakhis & Kahaniyaan' })
        : null;
    } catch { /* not supported here */ }
  };

  // ---------------------------------------------------------------- playing
  const stop = () => {
    const audio = audioRef.current;
    pos.current = -1;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load(); // drops what was downloading
    }
    setAt(-1);
    setState('idle');
    setSession(false);
  };

  // Ask for part i now (HEAD: no audio is downloaded), so the server has made it when it's needed
  const warm = (i) => {
    if (i >= latest.current.parts.length || typeof fetch !== 'function') return;
    fetch(urlOf(i), { method: 'HEAD', mode: 'no-cors', credentials: 'omit' }).catch(() => {});
  };

  const playAt = (i) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (i < 0 || i >= latest.current.parts.length) {
      stop(); // the end of the story: back to "Listen"
      return;
    }
    pos.current = i;
    setAt(i);
    setState((now) => (now === 'playing' ? now : 'loading'));
    audio.src = urlOf(i);
    audio.defaultPlaybackRate = latest.current.speed;
    audio.playbackRate = latest.current.speed;
    const playing = audio.play();
    if (playing && typeof playing.catch === 'function') {
      playing.catch((err) => {
        // A part that can't load also fires "error", which deals with it; here only a refusal to
        // play without a tap matters (some phones, after a long pause): wait for Resume
        if (pos.current === i && err && err.name === 'NotAllowedError') setState('paused');
      });
    }
    warm(i + 1);
  };

  const start = (from = 0) => {
    if (!audioRef.current || !latest.current.parts.length) return;
    setError('');
    retried.current = -1;
    setSession(true);
    playAt(from);
  };

  const pause = () => {
    if (!audioRef.current || pos.current < 0) return;
    audioRef.current.pause();
    setState('paused');
  };

  const resume = () => {
    const audio = audioRef.current;
    if (!audio || pos.current < 0) return;
    const playing = audio.play();
    if (playing && typeof playing.catch === 'function') playing.catch(() => {});
  };

  const jump = (step) => {
    if (pos.current < 0) return;
    playAt(Math.min(Math.max(pos.current + step, 0), latest.current.parts.length - 1));
  };

  const nextSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    setSpeed(next);
    latest.current.speed = next;
    try { localStorage.setItem(SPEED_KEY, String(next)); } catch { /* storage blocked: lasts until the page closes */ }
    const audio = audioRef.current;
    if (audio) {
      audio.defaultPlaybackRate = next;
      audio.playbackRate = next;
    }
  };

  // ---------------------------------------------------------------- the audio element's events
  const onError = () => {
    const i = pos.current;
    if (i < 0) return; // stop() emptied it
    if (retried.current !== i) { // once more: a slow network, or the server was still making it
      retried.current = i;
      playAt(i);
      return;
    }
    stop();
    setError(LOAD_PROBLEM);
  };

  const onPause = () => {
    // Paused from outside (headphones unplugged, another app's sound): show Resume.
    // Not at the end of a part, and not while the next part is loading.
    const audio = audioRef.current;
    if (audio && pos.current >= 0 && !audio.ended && audio.readyState >= 2) setState('paused');
  };

  handlers.current = {
    events: {
      playing: () => setState('playing'),
      waiting: () => setState((now) => (now === 'paused' ? now : 'loading')),
      pause: onPause,
      ended: () => { if (pos.current >= 0) playAt(pos.current + 1); },
      error: onError,
    },
    // for the lock screen's buttons and for leaving the page
    stop,
    pause,
    resume,
    jump,
  };

  // One audio element for the whole visit
  useEffect(() => {
    if (!canPlayAudio()) return undefined;
    const audio = new window.Audio();
    audio.preload = 'auto';
    const events = Object.keys(handlers.current.events).map((name) => {
      const listener = (event) => handlers.current.events[name](event);
      audio.addEventListener(name, listener);
      return [name, listener];
    });
    audioRef.current = audio;
    return () => {
      events.forEach(([name, listener]) => audio.removeEventListener(name, listener));
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      audioRef.current = null;
    };
  }, []);

  // Another story or language: a fresh start, and the old one stops reading (also when the page closes)
  const partsKey = (parts || []).join(',');
  useEffect(() => {
    setError('');
    return () => handlers.current.stop();
  }, [slug, lang, partsKey]);

  const part = at >= 0 ? latest.current.parts[at] || '' : '';
  return {
    available: Boolean(latest.current.parts.length && canPlayAudio()),
    state,
    speaking: state !== 'idle',
    part,
    current: /^\d+$/.test(part) ? Number(part) : -1,
    start,
    pause,
    resume,
    stop,
    speed,
    nextSpeed,
    error,
  };
};

export default useStoryVoice;
