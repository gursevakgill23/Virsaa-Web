/**
 * pages/GurdwaraAccess/GurdwaraLocate/GurdwaraLocate.jsx
 * -----------------------------------------------------------------------------
 * Directions to one Gurdwara (/gurdwara-access/locate/:id), anywhere in the
 * world. The Gurdwara comes from the finder (or Google Maps, through
 * hooks/useGurdwara); the starting point is the place searched in the
 * finder, or the visitor's own location ("Start from my location").
 *
 *   - travel mode (walk, drive, transit) with a rough time from the distance
 *   - a Google map with both places and the straight line between them
 *   - turn-by-turn directions open in Google Maps, which knows the roads,
 *     traffic and transit timetables
 * -----------------------------------------------------------------------------
 */
import React, { useMemo, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  FaWalking, FaCar, FaBus, FaMapMarkerAlt, FaHistory, FaLocationArrow, FaExternalLinkAlt, FaRedo, FaArrowLeft,
} from 'react-icons/fa';
import PageHero from '../../../components/PageHero/PageHero';
import GoogleMap from '../../../components/GoogleMap/GoogleMap';
import useGurdwara from '../../../hooks/useGurdwara';
import { safeExternalUrl } from '../../../utils/safeUrl';
import { directionsLink, distanceKm, formatDistance, gurdwaraLink, placeLabel, travelEstimate } from '../gurdwaras';
import styles from './GurdwaraLocate.module.css';

// Converts image paths for the production build (same helper used across pages)
const useProductionImagePath = () => {
  return (imagePath) => {
    if (process.env.NODE_ENV === 'production') {
      if (typeof imagePath === 'string') {
        return (imagePath.startsWith('/') || /^(https?:|blob:|data:)/i.test(imagePath))
          ? imagePath
          : `/${imagePath.replace(/.*static\/media/, 'static/media')}`;
      }
      return imagePath.default || imagePath;
    }
    return imagePath;
  };
};

// Travel modes and their line colours, picked to sit well with the maroon theme
const MODES = [
  { id: 'walk', label: 'Walk', icon: <FaWalking />, color: '#2f8a4e' },
  { id: 'car', label: 'Drive', icon: <FaCar />, color: '#65041d' },
  { id: 'bus', label: 'Transit', icon: <FaBus />, color: '#c27a1a' },
];

// Header pictures (public/images)
const header_image_light = '/images/header-image.png';
const header_image_dark = '/images/header-image-dark.png';

const GurdwaraLocate = ({ isDarkMode }) => {
  const getImagePath = useProductionImagePath();
  const { id } = useParams();
  const location = useLocation();
  const place = useGurdwara(id);
  const gurdwara = place.gurdwara;
  const startMode = MODES.some((m) => m.id === location.state?.mode) ? location.state.mode : 'car';
  const [transportMode, setTransportMode] = useState(startMode);
  const [origin, setOrigin] = useState(place.origin);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const headerImage = getImagePath(isDarkMode ? header_image_dark : header_image_light);
  const crumbs = [{ label: 'Home', to: '/' }, { label: 'Gurdwara Access', to: '/gurdwara-access' }];

  // Both places on the map, and the straight line between them
  const from = origin ? [origin.lat, origin.lng] : null;
  const to = gurdwara?.coordinates || null;
  const activeMode = MODES.find((m) => m.id === transportMode);
  const startLabel = origin?.label === 'your location' ? 'your location' : origin?.label;
  const fromLat = from?.[0];
  const fromLng = from?.[1];
  const toLat = to?.[0];
  const toLng = to?.[1];
  const gurdwaraName = gurdwara?.name || '';
  const gurdwaraId = gurdwara?.id || '';
  const pins = useMemo(() => {
    const list = [];
    if (Number.isFinite(fromLat)) {
      list.push({ id: '__start', kind: 'origin', position: { lat: fromLat, lng: fromLng }, color: activeMode.color,
        title: startLabel === 'your location' ? 'Your location' : `Start: ${startLabel}` });
    }
    if (Number.isFinite(toLat)) {
      list.push({ id: gurdwaraId, kind: 'gurdwara', position: { lat: toLat, lng: toLng }, title: gurdwaraName, selected: true });
    }
    return list;
  }, [fromLat, fromLng, toLat, toLng, activeMode.color, startLabel, gurdwaraId, gurdwaraName]);
  const fit = useMemo(() => [
    ...(Number.isFinite(fromLat) ? [{ lat: fromLat, lng: fromLng }] : []),
    ...(Number.isFinite(toLat) ? [{ lat: toLat, lng: toLng }] : []),
  ], [fromLat, fromLng, toLat, toLng]);
  const line = Number.isFinite(fromLat) && Number.isFinite(toLat)
    ? { from: { lat: fromLat, lng: fromLng }, to: { lat: toLat, lng: toLng }, color: activeMode.color }
    : null;

  // "Start from my location": the visitor's own position as the starting point
  const startFromMyLocation = () => {
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Your browser can’t share your location. The maps app will ask for it instead.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin({ lat: position.coords.latitude, lng: position.coords.longitude, label: 'your location' });
        setLocating(false);
      },
      () => {
        setLocationError('Your location couldn’t be found. The maps app can still start from where you are.');
        setLocating(false);
      },
      { timeout: 15000, maximumAge: 60000 }
    );
  };

  if (!gurdwara) {
    return (
      <div className={styles.page}>
        <PageHero compact image={headerImage} title={place.status === 'missing' ? 'Gurdwara not found' : 'Directions'}
          crumbs={[...crumbs, { label: 'Directions' }]} />
        <section className={styles.section}>
          <div className={styles.directionsContainer} role={place.status === 'error' ? 'alert' : 'status'}>
            {place.status === 'loading' && <p>Loading the Gurdwara…</p>}
            {place.status === 'missing' && <p>We couldn’t find that Gurdwara. The link may be out of date.</p>}
            {place.status === 'error' && (
              <>
                <p>{place.error}</p>
                <button type="button" className={styles.secondaryButton} onClick={place.retry}>
                  <FaRedo aria-hidden="true" /> Try again
                </button>
              </>
            )}
            {place.status !== 'loading' && (
              <Link to="/gurdwara-access" className={styles.primaryButton}>
                <FaArrowLeft aria-hidden="true" /> Find a Gurdwara
              </Link>
            )}
          </div>
        </section>
      </div>
    );
  }

  const km = from ? distanceKm(from, to) : null;
  const googleDirections = safeExternalUrl(directionsLink(from, gurdwara, transportMode));
  const where = placeLabel(gurdwara);

  return (
    <div className={styles.page}>
      <PageHero
        compact
        image={headerImage}
        title={`LOCATE ${gurdwara.name.toUpperCase()}`}
        subtitle="Find the best route to reach the Gurdwara"
        crumbs={[...crumbs, { label: `Locate ${gurdwara.name}` }]}
      />

      <section className={styles.section} aria-label="Route">
        {/* Travel mode */}
        <div className={styles.transportSelector} role="radiogroup" aria-label="How are you travelling?">
          {MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              role="radio"
              aria-checked={transportMode === mode.id}
              className={`${styles.transportButton} ${transportMode === mode.id ? styles.active : ''}`}
              onClick={() => setTransportMode(mode.id)}
            >
              <span className={styles.modeIcon} aria-hidden="true">{mode.icon}</span>
              <span className={styles.modeLabel}>{mode.label}</span>
              <span className={styles.modeTime}>{km != null ? travelEstimate(km, mode.id) : '—'}</span>
            </button>
          ))}
        </div>

        <div className={styles.routeLayout}>
          <div className={styles.mapContainer}>
            <GoogleMap
              center={{ lat: to[0], lng: to[1] }}
              zoom={15}
              markers={pins}
              fit={fit}
              maxZoom={16}
              singleZoom={15}
              line={line}
              dark={isDarkMode}
              label={`Map of the way to ${gurdwara.name}`}
              fallbackUrl={googleDirections}
            />

            {/* Glass summary floating on the map (at the top: Google's logo stays visible at the bottom) */}
            <div className={styles.mapCard}>
              <span className={styles.mapCardIcon} style={{ background: activeMode.color }} aria-hidden="true">
                {activeMode.icon}
              </span>
              <div>
                <p className={styles.mapCardTime}>{km != null ? travelEstimate(km, transportMode) : 'Choose a start'}</p>
                <p className={styles.mapCardText}>
                  {km != null
                    ? `${activeMode.label} to ${gurdwara.name} · ${formatDistance(km)} in a straight line`
                    : `${activeMode.label} to ${gurdwara.name}`}
                </p>
              </div>
            </div>
          </div>

          <aside className={styles.directionsContainer}>
            <div className={styles.destination}>
              <FaMapMarkerAlt aria-hidden="true" />
              <div>
                <h2 className={styles.destName}>{gurdwara.name}</h2>
                {where && <p className={styles.destAddress}>{where}</p>}
              </div>
            </div>

            <h3 className={styles.directionsTitle}>Step-by-step directions</h3>
            <p className={styles.lede}>
              {from
                ? <>From <strong>{startLabel}</strong>. Your maps app has the route, live traffic and transit times.</>
                : 'Your maps app starts from where you are, with the route, live traffic and transit times.'}
            </p>
            <div className={styles.linkList}>
              {googleDirections && (
                <a href={googleDirections} className={styles.primaryButton} target="_blank" rel="noopener noreferrer">
                  Open in Google Maps <FaExternalLinkAlt aria-hidden="true" />
                </a>
              )}
            </div>

            {origin?.label !== 'your location' && (
              <button type="button" className={styles.textButton} onClick={startFromMyLocation} disabled={locating}>
                <FaLocationArrow aria-hidden="true" /> {locating ? 'Finding you…' : 'Start from my location instead'}
              </button>
            )}
            {locationError && <p className={styles.note} role="alert">{locationError}</p>}

            <Link to={gurdwaraLink('history', gurdwara, origin)} className={styles.secondaryButton}>
              <FaHistory aria-hidden="true" /> Read its history
            </Link>
          </aside>
        </div>
      </section>
    </div>
  );
};

export default GurdwaraLocate;
