/**
 * pages/Learning/Arcade/games/MapQuest.jsx
 * -----------------------------------------------------------------------------
 * Punjab Map Quest: a place is named (a city, a town of the Gurus, a Takht,
 * a Gurdwara across the border...). Tap the map where you think it is and
 * press Guess. The closer the pin, the more points: full points within a
 * tenth of the stage's distance scale, nothing beyond the scale.
 * The map is a Google map (api/googleMaps.js, like Gurdwara Access) with its
 * place names and road numbers hidden, so the answer isn't written there;
 * rivers and borders help find the way. It follows the site's dark mode.
 * Content: { places: [{name, name_pa, lat, lng, fact}], bounds, scale_km }
 * -----------------------------------------------------------------------------
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FaArrowRight, FaCrosshairs, FaMapMarkerAlt } from 'react-icons/fa';
import { loadGoogleMaps, onKeyRejected } from '../../../../api/googleMaps';
import arcade from '../Arcade.module.css';
import { sfx } from '../arcadeSound';
import styles from './MapQuest.module.css';

// No names on the map (only works on a map without a map ID, so none is set here)
const NO_LABELS = [
  { elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];
const NIGHT = [
  { elementType: 'geometry', stylers: [{ color: '#2a1a1f' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#14263a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#4a3036' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#a5707d' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#33222a' }] },
];

// A round pin (and an optional name above it) drawn on the map
const makeDot = (maps, { position, fill, size, label }) => {
  class Dot extends maps.OverlayView {
    onAdd() {
      this.el = document.createElement('div');
      this.el.className = styles.dot;
      this.el.style.setProperty('--fill', fill);
      this.el.style.setProperty('--size', `${size}px`);
      if (label) {
        const tag = document.createElement('span');
        tag.className = styles.dotLabel;
        tag.textContent = label;
        this.el.appendChild(tag);
      }
      this.getPanes().overlayMouseTarget.appendChild(this.el);
    }

    draw() {
      const point = this.getProjection()?.fromLatLngToDivPixel(new maps.LatLng(position[0], position[1]));
      if (!point || !this.el) return;
      this.el.style.left = `${point.x}px`;
      this.el.style.top = `${point.y}px`;
    }

    onRemove() {
      this.el?.remove();
      this.el = null;
    }
  }
  return new Dot();
};

const toBounds = (maps, [[s, w], [n, e]]) => new maps.LatLngBounds({ lat: s, lng: w }, { lat: n, lng: e });

const WORDS = {
  english: {
    find: 'Where is', tapMap: 'Tap the map to drop your pin.', guess: 'Guess', next: 'Next place', finish: 'Finish',
    away: 'km away', bullseye: 'Bullseye!', close: 'Very close!', good: 'Good guess!', far: 'A long way off.',
    points: 'points', place: 'Place',
  },
  punjabi: {
    find: 'ਇਹ ਕਿੱਥੇ ਹੈ:', tapMap: 'ਨਕਸ਼ੇ ਤੇ ਛੂਹ ਕੇ ਆਪਣਾ ਨਿਸ਼ਾਨ ਲਗਾਓ।', guess: 'ਅੰਦਾਜ਼ਾ', next: 'ਅਗਲੀ ਥਾਂ', finish: 'ਪੂਰਾ ਕਰੋ',
    away: 'ਕਿ.ਮੀ. ਦੂਰ', bullseye: 'ਬਿਲਕੁਲ ਸਹੀ!', close: 'ਬਹੁਤ ਨੇੜੇ!', good: 'ਵਧੀਆ ਅੰਦਾਜ਼ਾ!', far: 'ਕਾਫ਼ੀ ਦੂਰ।',
    points: 'ਅੰਕ', place: 'ਥਾਂ',
  },
};

// Distance in km between two points on the earth
const haversine = (a, b) => {
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
};

// 1 within a tenth of the scale, falling to 0 at the scale
const closeness = (km, scale) => (km <= scale * 0.1 ? 1 : Math.max(0, 1 - (km - scale * 0.1) / (scale * 0.9)));

export default function MapQuest({ content, language, onFinish, dark = false }) {
  const w = WORDS[language];
  const places = content.places || [];
  const bounds = useMemo(() => content.bounds || [[29.5, 73.8], [32.6, 77]], [content.bounds]);
  const scale = content.scale_km || 100;
  const [index, setIndex] = useState(0);
  const [pin, setPin] = useState(null);
  const [result, setResult] = useState(null);     // { km, value }
  const [values, setValues] = useState([]);
  const place = places[index];
  const pa = language === 'punjabi';
  const perPlace = 1000 / Math.max(1, places.length);
  const maxBounds = useMemo(() => {
    const [[s, wst], [n, e]] = bounds;
    const padLat = (n - s) * 0.6;
    const padLng = (e - wst) * 0.6;
    return [[s - padLat, wst - padLng], [n + padLat, e + padLng]];
  }, [bounds]);

  const pick = (latlng) => {
    if (result) return;
    sfx.tap();
    setPin(latlng);
  };

  const guess = () => {
    if (!pin || result) return;
    const km = haversine(pin, [place.lat, place.lng]);
    const value = closeness(km, scale);
    if (value >= 0.8) sfx.correct(); else if (value > 0.3) sfx.pop(); else sfx.drop();
    setResult({ km, value });
    setValues((v) => [...v, value]);
  };

  const next = () => {
    sfx.pick();
    if (index + 1 < places.length) {
      setIndex((i) => i + 1);
      setPin(null);
      setResult(null);
      return;
    }
    const total = values.reduce((a, b) => a + b, 0) / Math.max(1, places.length);
    onFinish({ score: Math.round(total * 1000), completed: true, details: { places: places.length } });
  };

  const answer = useMemo(() => (place ? [place.lat, place.lng] : null), [place]);
  const focus = useMemo(() => (result && pin && answer ? [pin, answer] : null), [result, pin, answer]);

  // ---------------------------------------------------------------- the Google map
  const boxRef = useRef(null);
  const mapRef = useRef(null);
  const mapsRef = useRef(null);
  const pickRef = useRef(pick);
  pickRef.current = pick;
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'failed'

  // Made once, and again when the theme changes
  useEffect(() => {
    let cancelled = false;
    let clicks = null;
    setStatus('loading');
    const stopListening = onKeyRejected(() => { if (!cancelled) setStatus('failed'); });
    loadGoogleMaps()
      .then((maps) => Promise.all([maps.importLibrary('maps'), maps.importLibrary('core')]).then(() => maps))
      .then((maps) => {
        if (cancelled || !boxRef.current) return;
        const [[s, wst], [n, e]] = maxBounds;
        const map = new maps.Map(boxRef.current, {
          center: { lat: (bounds[0][0] + bounds[1][0]) / 2, lng: (bounds[0][1] + bounds[1][1]) / 2 },
          zoom: 7,
          minZoom: 4,
          maxZoom: 12,
          styles: dark ? [...NIGHT, ...NO_LABELS] : NO_LABELS,
          backgroundColor: dark ? '#2a1a1f' : '#f6edd6',
          gestureHandling: 'greedy',
          draggableCursor: 'crosshair',
          clickableIcons: false,
          disableDefaultUI: true,
          zoomControl: true,
          restriction: { latLngBounds: { south: s, west: wst, north: n, east: e }, strictBounds: false },
        });
        map.fitBounds(toBounds(maps, bounds), 10);
        clicks = map.addListener('click', (event) => {
          if (event.latLng) pickRef.current([event.latLng.lat(), event.latLng.lng()]);
        });
        mapsRef.current = maps;
        mapRef.current = map;
        setStatus('ready');
      })
      .catch(() => { if (!cancelled) setStatus('failed'); });
    return () => {
      cancelled = true;
      stopListening();
      clicks?.remove();
      mapRef.current = null;
    };
    // a new map only for a new theme or region
  }, [dark, bounds, maxBounds]);

  // The pins and the line between them
  useEffect(() => {
    const map = mapRef.current;
    const maps = mapsRef.current;
    if (status !== 'ready' || !map || !maps) return undefined;
    const shown = [];
    if (pin) shown.push(makeDot(maps, { position: pin, fill: '#E2483D', size: 22 }));
    if (result && answer) {
      shown.push(makeDot(maps, { position: answer, fill: '#2FA36B', size: 26, label: pa ? place.name_pa : place.name }));
      shown.push(new maps.Polyline({
        path: [{ lat: pin[0], lng: pin[1] }, { lat: answer[0], lng: answer[1] }],
        geodesic: true,
        clickable: false,
        strokeOpacity: 0,
        icons: [{
          icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, strokeColor: dark ? '#F3E6E9' : '#1D3B2A', strokeWeight: 3, scale: 3 },
          offset: '0',
          repeat: '14px',
        }],
      }));
    }
    shown.forEach((thing) => thing.setMap(map));
    return () => shown.forEach((thing) => thing.setMap(null));
  }, [status, pin, result, answer, pa, place, dark]);

  // Back to the whole region for each new place, and show both pins after a guess
  useEffect(() => {
    const map = mapRef.current;
    const maps = mapsRef.current;
    if (status !== 'ready' || !map || !maps) return undefined;
    if (!focus) {
      map.fitBounds(toBounds(maps, bounds), 10);
      return undefined;
    }
    const both = new maps.LatLngBounds();
    focus.forEach(([lat, lng]) => both.extend({ lat, lng }));
    map.fitBounds(both, 60);
    const listener = map.addListener('idle', () => {
      listener.remove();
      if (map.getZoom() > 9) map.setZoom(9);
    });
    return () => listener.remove();
  }, [status, focus, bounds, index]);
  if (!place) return null;
  const verdict = result && (result.value >= 0.95 ? w.bullseye : result.value >= 0.7 ? w.close : result.value >= 0.3 ? w.good : w.far);
  const total = Math.round(values.reduce((a, b) => a + b, 0) * perPlace);

  return (
    <div className={styles.game}>
      <div className={arcade.hud}>
        <span className={arcade.hudPill}><FaMapMarkerAlt aria-hidden="true" /> {w.place} {index + 1}/{places.length}</span>
        <span className={arcade.hudSpacer} />
        <span className={arcade.hudPill}>{total} {w.points}</span>
      </div>

      <div className={styles.banner}>
        <span className={styles.bannerLabel}>{w.find}</span>
        <span className={styles.placeName}>{pa ? place.name_pa : place.name}</span>
        <span className={styles.placeOther} lang={pa ? 'en' : 'pa'}>{pa ? place.name : place.name_pa}</span>
      </div>

      <div className={styles.mapFrame}>
        <div ref={boxRef} key={dark ? 'dark' : 'light'} className={styles.map} role="application" aria-label={w.tapMap} />
        {status === 'failed' && (
          <div className={styles.failed} role="status">The map isn’t available right now. Please try again later.</div>
        )}
        <span className={styles.compass} aria-hidden="true">N</span>
      </div>

      {!result ? (
        <div className={styles.controls}>
          <p className={styles.tip}>{w.tapMap}</p>
          <button type="button" className={arcade.btnBig} onClick={guess} disabled={!pin}>
            <FaCrosshairs aria-hidden="true" /> {w.guess}
          </button>
        </div>
      ) : (
        <div className={styles.resultCard} role="status">
          <p className={styles.verdict}>{verdict}</p>
          <p className={styles.distance}>
            <span>{Math.round(result.km)} {w.away}</span>
            <b>+{Math.round(result.value * perPlace)} {w.points}</b>
          </p>
          {place.fact && <p className={styles.fact}>{place.fact}</p>}
          <button type="button" className={arcade.btnBig} onClick={next}>
            {index + 1 < places.length ? w.next : w.finish} <FaArrowRight aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
