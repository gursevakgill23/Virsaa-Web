/**
 * pages/Collections/EbookDetail/EbookListen.jsx
 * -----------------------------------------------------------------------------
 * The book's audiobook, read by Google's Punjabi voice, played on the ebook
 * page (the "Listen" button). The same recording is on the Audiobooks page.
 * The MP3 is private on S3: the API gives signed-in readers a temporary link
 * (stream_audio), as for every audiobook. Guests are asked to sign in.
 *
 *   <EbookListen id apiUrl audiobookId accessToken isLoggedIn onClose />
 *
 * Play / pause, back and forward 15 s, the position, and three speeds.
 * -----------------------------------------------------------------------------
 */
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaPause, FaPlay, FaRedoAlt, FaTimes, FaUndoAlt } from 'react-icons/fa';
import { safeUrl } from '../../../utils/safeUrl';
import styles from './EbookDetail.module.css';

const SPEEDS = [1, 1.25, 0.75];

// Seconds → "1:02:03" or "2:03"
const clock = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const whole = Math.floor(seconds);
  const h = Math.floor(whole / 3600);
  const m = Math.floor((whole % 3600) / 60);
  const s = String(whole % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
};

const EbookListen = ({ id, apiUrl, audiobookId, accessToken, isLoggedIn, onClose }) => {
  const audioRef = useRef(null);
  const tokenRef = useRef(accessToken); // a renewed token mustn't fetch the link again
  tokenRef.current = accessToken;
  const [url, setUrl] = useState('');
  const [state, setState] = useState(isLoggedIn ? 'loading' : 'signin'); // loading | ready | error | signin
  const [attempt, setAttempt] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);

  // The temporary link to the MP3
  useEffect(() => {
    if (!isLoggedIn) {
      setState('signin');
      return undefined;
    }
    let cancelled = false;
    setState('loading');
    axios.get(`${apiUrl}/collections/audiobooks/${encodeURIComponent(audiobookId)}/stream_audio/`, {
      timeout: 20000,
      headers: { Authorization: `Bearer ${tokenRef.current}` },
    })
      .then((r) => {
        const link = safeUrl(r.data?.audio_url, { allowRelative: false });
        if (cancelled) return;
        if (!link) throw new Error('No link');
        setUrl(link);
        setState('ready');
      })
      .catch((err) => {
        if (!cancelled) setState(err?.response?.status === 401 ? 'signin' : 'error');
      });
    return () => { cancelled = true; };
  }, [apiUrl, audiobookId, isLoggedIn, attempt]);

  // Start as soon as the link arrives (the press of Listen counts as the tap browsers ask for)
  useEffect(() => {
    if (state !== 'ready' || !audioRef.current) return;
    audioRef.current.play().catch(() => {}); // refused: the play button is there
  }, [state, url]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  };

  const skip = (seconds) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(Math.max(audio.currentTime + seconds, 0), audio.duration || 0);
  };

  const nextSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const close = () => {
    audioRef.current?.pause();
    onClose();
  };

  const progress = duration ? (time / duration) * 100 : 0;

  return (
    <section id={id} className={`${styles.listenPanel} ${styles.glass}`} aria-label="Listen to this book">
      {state === 'ready' && (
        <audio
          ref={audioRef}
          src={url}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => { setDuration(e.currentTarget.duration); e.currentTarget.playbackRate = speed; }}
        />
      )}

      <div className={styles.listenTop}>
        <p className={styles.listenTitle}>Listen to this book</p>
        <button type="button" className={styles.listenClose} onClick={close} aria-label="Close the player">
          <FaTimes aria-hidden="true" />
        </button>
      </div>

      {state === 'signin' && (
        <p className={styles.listenNote}>
          <Link to="/login" className={styles.bylineLink}>Sign in</Link> to listen, as with every audiobook.
        </p>
      )}
      {state === 'loading' && <p className={styles.listenNote} role="status">Getting the audiobook…</p>}
      {state === 'error' && (
        <p className={styles.listenNote} role="alert">
          The audiobook couldn’t be played.{' '}
          <button type="button" className={styles.moreButton} onClick={() => setAttempt((n) => n + 1)}>Try again</button>
        </p>
      )}

      {state === 'ready' && (
        <div className={styles.listenPlayer}>
          <button type="button" className={styles.listenPlay} onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? <FaPause aria-hidden="true" /> : <FaPlay aria-hidden="true" className={styles.listenPlayNudge} />}
          </button>
          <div className={styles.listenTrack}>
            <input
              type="range"
              min="0"
              max={duration || 0}
              step="1"
              value={Math.min(time, duration || 0)}
              onChange={(e) => { if (audioRef.current) audioRef.current.currentTime = Number(e.target.value); }}
              className={styles.listenSeek}
              style={{ '--progress': `${progress}%` }}
              aria-label="Position"
              aria-valuetext={`${clock(time)} of ${clock(duration)}`}
            />
            <div className={styles.listenBelow}>
              <span className={styles.listenTimes}>{clock(time)} / {clock(duration)}</span>
              <div className={styles.listenButtons}>
                <button type="button" className={styles.listenSmall} onClick={() => skip(-15)} aria-label="Back 15 seconds">
                  <FaUndoAlt aria-hidden="true" /><span>15</span>
                </button>
                <button type="button" className={styles.listenSmall} onClick={() => skip(15)} aria-label="Forward 15 seconds">
                  <FaRedoAlt aria-hidden="true" /><span>15</span>
                </button>
                <button type="button" className={styles.listenSmall} onClick={nextSpeed} aria-label={`Speed ${speed}×. Change the speed`}>
                  {speed}×
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <p className={styles.listenFoot}>
        <span>Read by Google’s Punjabi voice</span>
        <Link to={`/collections/audiobooks/audiobook/${encodeURIComponent(audiobookId)}`} className={styles.bylineLink}>
          Open in Audiobooks
        </Link>
      </p>
    </section>
  );
};

export default EbookListen;
