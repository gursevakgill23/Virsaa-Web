/**
 * pages/Learning/Arcade/games/MapQuest.jsx
 * -----------------------------------------------------------------------------
 * Punjab Map Quest: a place is named (a city, a town of the Gurus, a Takht,
 * a Gurdwara across the border...). Tap the map where you think it is and
 * press Guess. The closer the pin, the more points: full points within a
 * tenth of the stage's distance scale, nothing beyond the scale.
 * The map (Leaflet, like Gurdwara Access) has no place names on it, so the
 * answer isn't written there; rivers and borders help find the way.
 * Content: { places: [{name, name_pa, lat, lng, fact}], bounds, scale_km }
 * -----------------------------------------------------------------------------
 */
import React, { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { FaArrowRight, FaCrosshairs, FaMapMarkerAlt } from 'react-icons/fa';
import arcade from '../Arcade.module.css';
import { sfx } from '../arcadeSound';
import styles from './MapQuest.module.css';

// A map without place names (© OpenStreetMap contributors, © CARTO), light or dark
const TILES = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png';
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

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

function ClickToGuess({ enabled, onPick }) {
  useMapEvents({
    click(e) {
      if (enabled) onPick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

// Back to the whole region for each new place, and show both pins after a guess
function FitView({ bounds, focus, round }) {
  const map = useMap();
  useEffect(() => {
    if (!map?.fitBounds) return;
    if (focus) map.fitBounds(focus, { padding: [60, 60], maxZoom: 9 });
    else map.fitBounds(bounds, { padding: [10, 10] });
  }, [map, bounds, focus, round]);
  return null;
}

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
        <MapContainer
          className={styles.map}
          bounds={bounds}
          maxBounds={maxBounds}
          maxBoundsViscosity={0.9}
          minZoom={4}
          maxZoom={12}
          scrollWheelZoom
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer key={dark ? 'dark' : 'light'} url={dark ? DARK_TILES : TILES} attribution={ATTRIBUTION} subdomains="abcd" />
          <ClickToGuess enabled={!result} onPick={pick} />
          <FitView bounds={bounds} round={index} focus={focus} />
          {pin && (
            <CircleMarker center={pin} radius={11} pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#E2483D', fillOpacity: 1 }} />
          )}
          {result && (
            <>
              <Polyline positions={[pin, answer]} pathOptions={{ color: dark ? '#F3E6E9' : '#1D3B2A', weight: 3, dashArray: '6 8' }} />
              <CircleMarker center={answer} radius={13} pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#2FA36B', fillOpacity: 1 }}>
                <Tooltip permanent direction="top" offset={[0, -12]}>{pa ? place.name_pa : place.name}</Tooltip>
              </CircleMarker>
            </>
          )}
        </MapContainer>
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
