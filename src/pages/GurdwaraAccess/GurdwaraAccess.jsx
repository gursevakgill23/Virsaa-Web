/**
 * pages/GurdwaraAccess/GurdwaraAccess.jsx
 * -----------------------------------------------------------------------------
 * The Gurdwara finder (/gurdwara-access), for anywhere in the world:
 *   - search any address, town or postcode (suggestions as you type), or use
 *     the browser's location
 *   - the Gurdwaras around it, nearest first, live from Google Maps
 *     (api/googleMaps.js), with the distance and rough walk / bus / car
 *     times, on a Google map (components/GoogleMap)
 *   - the history and photo of the Gurdwara you pick ("History" on a result
 *     or on the map; the nearest one at first): the history from Wikipedia
 *     (hooks/useGurdwaraHistory), the photo from Wikipedia or Wikimedia
 *     Commons, or else from Google Maps, each with the credit it asks for
 *   - links to each Gurdwara's directions, services and full history pages
 *   - the services Gurdwaras offer
 * The last place searched is remembered for this visit, so coming back from
 * a Gurdwara's page shows the same results.
 * -----------------------------------------------------------------------------
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import styles from './GurdwaraAccess.module.css';
import {
  FaSearch, FaLocationArrow, FaWalking, FaBus, FaCar, FaGlobe, FaMapMarkedAlt,
  FaHandsHelping, FaBook, FaUtensils, FaBed, FaHeartbeat, FaChevronDown, FaHistory, FaMapMarkerAlt, FaRedo,
} from 'react-icons/fa';
import PageHero from '../../components/PageHero/PageHero';
import GoogleMap from '../../components/GoogleMap/GoogleMap';
import useGurdwaraHistory from '../../hooks/useGurdwaraHistory';
import {
  findGurdwaras, findPlace, googleMapsConfigured, googleMapsSearchUrl, newSearchSession, placeFromSuggestion,
  suggestPlaces,
} from '../../api/googleMaps';
import { safeExternalUrl } from '../../utils/safeUrl';
import { formatDistance, travelEstimate, gurdwaraLink, placeLabel } from './gurdwaras';
import WikipediaCredit from './WikipediaCredit';

// Header pictures (public/images)
const header_image_light = '/images/header-image.png';
const header_image_dark = '/images/header-image-dark.png';

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

// Where the finder starts before anyone searches
const DEFAULT_PLACE = { lat: 43.7315, lng: -79.7624, label: 'Brampton, Ontario, Canada' };
const LAST_PLACE_KEY = 'virsaa.gurdwaraSearch';
const ORIGIN_PIN = '__origin';

const readLastPlace = () => {
  try {
    const place = JSON.parse(sessionStorage.getItem(LAST_PLACE_KEY) || 'null');
    return place && Number.isFinite(place.lat) && Number.isFinite(place.lng)
      ? { lat: place.lat, lng: place.lng, label: String(place.label || '').slice(0, 200) }
      : null;
  } catch {
    return null;
  }
};

const writeLastPlace = (place) => {
  try {
    sessionStorage.setItem(LAST_PLACE_KEY, JSON.stringify(place));
  } catch {
    // storage blocked: the finder starts at Brampton next time
  }
};

// Services described at the bottom of the page
const servicesList = [
  { id: 1, icon: <FaUtensils />, name: 'Langar (Free Community Kitchen)', description: 'Every Gurdwara serves langar, a free vegetarian meal shared by everyone who comes, whoever they are.' },
  { id: 2, icon: <FaBed />, name: 'Accommodation (Stay Facilities)', description: 'Many larger and historic Gurdwaras have rooms (sarai) where visitors and pilgrims can stay.' },
  { id: 3, icon: <FaHandsHelping />, name: 'Religious Classes (Gurbani and Kirtan)', description: 'Classes in Gurmukhi, Gurbani, kirtan and Sikh history, often for children at weekends.' },
  { id: 4, icon: <FaHeartbeat />, name: 'Medical Camps (Free Health Checkups)', description: 'Some Gurdwaras hold free health camps and blood drives with volunteer doctors.' },
  { id: 5, icon: <FaBook />, name: 'Library (Sikh Literature and History)', description: 'Many have a library of Sikh literature and history, and sell gutkas and books.' },
];

// The first paragraph of a Gurdwara's history, cut at a word if it's very long
const INTRO_MAX = 480;
const historyIntro = (data) => {
  const first = (Array.isArray(data?.summary) && data.summary[0])
    || data?.sections?.[0]?.paragraphs?.[0] || '';
  return first.length > INTRO_MAX ? `${first.slice(0, first.lastIndexOf(' ', INTRO_MAX))}…` : first;
};

// "gurdwara in Southall, London" -> "Gurdwara in Southall, London."
const sentence = (text) => {
  const t = String(text || '').trim();
  return t ? `${t[0].toUpperCase()}${t.slice(1)}${/[.!?]$/.test(t) ? '' : '.'}` : '';
};

// Props: isDarkMode, apiString (API base URL)
const GurdwaraAccess = ({ isDarkMode, apiString }) => {
  const getImagePath = useProductionImagePath();
  const startPlace = useRef(readLastPlace() || DEFAULT_PLACE).current;

  // Where the Gurdwaras are looked for, and what to call that place
  const [origin, setOrigin] = useState({ lat: startPlace.lat, lng: startPlace.lng });
  const [originLabel, setOriginLabel] = useState(startPlace.label);
  const [results, setResults] = useState({ status: 'loading', gurdwaras: [], error: '' });
  const [attempt, setAttempt] = useState(0); // bumped by "Try again"
  const [selectedId, setSelectedId] = useState('');

  // Search box, suggestions, and the location button
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  const mapApi = useRef(null);
  const searchInputRef = useRef(null);
  const debounceTimeoutRef = useRef(null);
  const suggestionRequest = useRef(0); // only the newest suggestions count
  const searchSession = useRef(null); // groups one search's suggestions for Google's billing
  const suggestedFor = useRef(''); // the text the suggestions shown were for

  // ---------------------------------------------------------------- the Gurdwaras around `origin`
  useEffect(() => {
    let cancelled = false;
    setResults((prev) => ({ ...prev, status: 'loading', error: '' }));
    findGurdwaras(origin)
      .then((list) => {
        if (cancelled) return;
        setResults({ status: 'ready', gurdwaras: list, error: '' });
        setSelectedId(list[0]?.id || '');
      })
      .catch(() => {
        if (cancelled) return;
        setResults({
          status: 'error', gurdwaras: [],
          error: googleMapsConfigured
            ? 'Google Maps couldn’t be reached just now, so the Gurdwaras can’t be listed. Try again in a minute.'
            : 'The Gurdwara search isn’t switched on for this site yet.',
        });
      });
    return () => { cancelled = true; };
  }, [origin, attempt]);

  useEffect(() => () => {
    clearTimeout(debounceTimeoutRef.current);
    suggestionRequest.current += 1;
  }, []);

  // ---------------------------------------------------------------- searching
  // Look for Gurdwaras around a place ({ lat, lng, label })
  const searchAround = useCallback((place) => {
    setLocationError(null);
    setOrigin({ lat: place.lat, lng: place.lng });
    setOriginLabel(place.label);
    writeLastPlace(place);
  }, []);

  // "Use my location": ask the browser
  const getUserLocation = () => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('Your browser can’t share your location. Type an address instead.');
      return;
    }
    setIsSearching(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        searchAround({ lat, lng, label: 'your location' });
        setSearchQuery('');
        setIsSearching(false);
      },
      (error) => {
        // 1 = permission denied, 2 = position unavailable, 3 = timed out
        const messages = {
          1: 'Location access is turned off for this site. Allow it in your browser, or type an address instead.',
          2: 'Your location isn’t available right now. Type an address instead.',
          3: 'Finding your location took too long. Try again, or type an address instead.',
        };
        setLocationError(messages[error.code] || 'Your location couldn’t be found. Type an address instead.');
        setIsSearching(false);
      },
      { timeout: 15000, maximumAge: 60000 }
    );
  };

  // Go to a suggestion (Google looks up where it is; that ends the search session)
  const goToSuggestion = async (suggestion) => {
    setSearchQuery(suggestion.label);
    setShowSuggestions(false);
    setSuggestions([]);
    setIsSearching(true);
    setLocationError(null);
    try {
      const place = await placeFromSuggestion(suggestion);
      if (place) searchAround(place);
      else setLocationError('That place couldn’t be found on the map. Try another address.');
    } catch {
      setLocationError('Search isn’t available right now. Try again in a moment.');
    } finally {
      searchSession.current = null;
      setIsSearching(false);
    }
  };

  // Search button / Enter: the first suggestion for this text, or else look the text up (any country)
  const handleSearch = async (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setLocationError('Type an address, town or postcode first, or use your location.');
      searchInputRef.current?.focus();
      return;
    }
    clearTimeout(debounceTimeoutRef.current);
    suggestionRequest.current += 1;
    if (suggestions.length && suggestedFor.current === query) {
      goToSuggestion(suggestions[0]);
      return;
    }
    setShowSuggestions(false);
    setIsSearching(true);
    setLocationError(null);
    try {
      const place = await findPlace(query);
      if (place) searchAround({ ...place, label: place.label || query });
      else setLocationError('That place wasn’t found. Try adding the town or country, e.g. “Southall, London”.');
    } catch {
      setLocationError('Search isn’t available right now. Try again in a moment.');
    } finally {
      searchSession.current = null;
      setIsSearching(false);
    }
  };

  // Typing: Google's suggestions after 3 letters, with a 300 ms pause (only the newest answer counts)
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (locationError) setLocationError(null);
    setShowSuggestions(value.trim().length > 2);
    clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(async () => {
      suggestionRequest.current += 1;
      const request = suggestionRequest.current;
      const query = value.trim();
      if (query.length <= 2) {
        setSuggestions([]);
        return;
      }
      try {
        if (!searchSession.current) searchSession.current = await newSearchSession();
        const found = await suggestPlaces(query, searchSession.current);
        if (request !== suggestionRequest.current) return;
        suggestedFor.current = query;
        setSuggestions(found);
      } catch {
        if (request === suggestionRequest.current) setSuggestions([]);
      }
    }, 300);
  };

  // ---------------------------------------------------------------- picking a Gurdwara
  const showHistory = useCallback((gurdwara) => {
    setSelectedId(gurdwara.id);
    requestAnimationFrame(() => {
      document.getElementById('gurdwara-history')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const focusOnMap = (gurdwara) => {
    document.getElementById('gurdwara-map')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    mapApi.current?.focus(gurdwara.id);
  };

  const gurdwaras = results.gurdwaras;
  const selected = gurdwaras.find((g) => g.id === selectedId) || gurdwaras[0] || null;
  const handover = { lat: origin.lat, lng: origin.lng, label: originLabel };

  // ---------------------------------------------------------------- the map
  const pins = useMemo(() => [
    {
      id: ORIGIN_PIN, kind: 'origin', position: { lat: origin.lat, lng: origin.lng },
      title: originLabel === 'your location' ? 'Your location' : `You searched: ${originLabel}`,
    },
    ...gurdwaras.map((g) => ({
      id: g.id, kind: 'gurdwara', title: g.name, selected: g.id === selected?.id,
      position: { lat: g.coordinates[0], lng: g.coordinates[1] },
    })),
  ], [origin, originLabel, gurdwaras, selected?.id]);

  // The search point and the nearest Gurdwaras in view, once they're found
  const fit = useMemo(() => (results.status === 'ready'
    ? [{ lat: origin.lat, lng: origin.lng }, ...gurdwaras.slice(0, 12).map((g) => ({ lat: g.coordinates[0], lng: g.coordinates[1] }))]
    : null), [results.status, origin, gurdwaras]);

  // A pin's popup: name, where, how far, and a button for its history (plain DOM, inside Google's map)
  const popupFor = useCallback((id) => {
    const gurdwara = gurdwaras.find((g) => g.id === id);
    if (!gurdwara) return null;
    const box = document.createElement('div');
    box.className = styles.popup;
    const title = document.createElement('strong');
    title.textContent = gurdwara.name;
    box.append(title);
    [placeLabel(gurdwara), gurdwara.distance_km != null ? `${formatDistance(gurdwara.distance_km)} away` : '']
      .filter(Boolean)
      .forEach((line) => {
        const p = document.createElement('p');
        p.textContent = line;
        box.append(p);
      });
    const button = document.createElement('button');
    button.type = 'button';
    button.className = styles.popupButton;
    button.textContent = 'History and photo';
    button.addEventListener('click', () => showHistory(gurdwara));
    box.append(button);
    return box;
  }, [gurdwaras, showHistory]);

  // ---------------------------------------------------------------- the picked Gurdwara's history and photo
  // History from Wikipedia; the photo from Wikipedia or Wikimedia Commons, or else Google Maps
  const history = useGurdwaraHistory(apiString, selected);
  const historyData = history.status === 'found' || history.status === 'missing' ? history.data : null;
  const freePhoto = safeExternalUrl(historyData?.image);
  const googlePhoto = !freePhoto ? safeExternalUrl(selected?.photo?.url) : '';
  const photo = freePhoto || googlePhoto;
  const googleUrl = safeExternalUrl(selected?.google_url);

  // ---------------------------------------------------------------- results line
  const resultsLine = () => {
    const place = <strong>{originLabel}</strong>;
    if (results.status === 'loading') return <>Looking for Gurdwaras near {place}…</>;
    if (results.status !== 'ready') return null;
    const count = gurdwaras.length;
    if (!count) return <>No Gurdwaras were found near {place}. Try a nearby town.</>;
    return count === 1 ? <>1 Gurdwara near {place}</> : <>{count} Gurdwaras near {place}, nearest first</>;
  };

  return (
    <div className={styles.page}>
      <PageHero
        image={getImagePath(isDarkMode ? header_image_dark : header_image_light)}
        title="DISCOVER GURDWARAS NEAR YOU"
        subtitle="Your Gateway to Peace and Community"
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Gurdwara Access' }]}
      />

      {/* ---------- Finder ---------- */}
      <section className={styles.finderWrap} aria-label="Find a Gurdwara">
        <div className={styles.finder}>
          <form onSubmit={handleSearch} className={styles.searchForm} role="search">
            <div className={styles.searchInputContainer}>
              <FaSearch className={styles.searchIcon} aria-hidden="true" />
              <input
                ref={searchInputRef}
                type="text"
                role="combobox"
                aria-controls="address-suggestions"
                placeholder="Any address, town or postcode, e.g. Southall, London"
                maxLength={200}
                className={styles.input}
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={() => searchQuery.trim().length > 2 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                aria-label="Address, town or postcode"
                aria-autocomplete="list"
                aria-expanded={showSuggestions && suggestions.length > 0}
                autoComplete="off"
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul id="address-suggestions" className={styles.suggestionsList} role="listbox">
                  {suggestions.map((suggestion) => (
                    <li key={suggestion.id || suggestion.label} role="option" aria-selected="false">
                      <button type="button" className={styles.suggestionItem} onMouseDown={() => goToSuggestion(suggestion)}>
                        <FaMapMarkerAlt aria-hidden="true" /> <span>{suggestion.label}</span>
                      </button>
                    </li>
                  ))}
                  <li className={styles.suggestionsCredit} aria-hidden="true">Suggestions from Google Maps</li>
                </ul>
              )}
            </div>
            <button type="submit" className={styles.searchButton} disabled={isSearching}>
              {isSearching ? 'Searching…' : 'Search'}
            </button>
          </form>
          <button type="button" className={styles.locationButton} onClick={getUserLocation} disabled={isSearching}>
            <FaLocationArrow aria-hidden="true" /> Use my location
          </button>
        </div>

        {locationError && <p className={styles.errorMessage} role="alert">{locationError}</p>}
        {results.status === 'error' ? (
          <div className={styles.errorMessage} role="alert">
            {results.error}{' '}
            {googleMapsConfigured && (
              <button type="button" className={styles.inlineRetry} onClick={() => setAttempt((n) => n + 1)}>
                <FaRedo aria-hidden="true" /> Try again
              </button>
            )}
            {' '}
            <a className={styles.inlineRetry} href={googleMapsSearchUrl(handover)} target="_blank" rel="noopener noreferrer">
              Search Google Maps instead
            </a>
          </div>
        ) : (
          <p className={styles.resultsInfo} aria-live="polite">{resultsLine()}</p>
        )}
      </section>

      {/* ---------- Results + map ---------- */}
      <section className={styles.resultsSection} aria-label="Gurdwaras near the place searched" aria-busy={results.status === 'loading'}>
        <ul className={styles.list}>
          {results.status === 'loading' && gurdwaras.length === 0 && Array.from({ length: 3 }).map((_, i) => (
            <li key={`skeleton-${i}`} className={`${styles.listItem} ${styles.listSkeleton}`} aria-hidden="true">
              <span /><span /><span />
            </li>
          ))}

          {gurdwaras.map((gurdwara, index) => {
            const km = gurdwara.distance_km;
            const isSelected = selected?.id === gurdwara.id;
            const where = placeLabel(gurdwara);
            return (
              <li
                key={gurdwara.id}
                className={`${styles.listItem} ${index === 0 ? styles.nearest : ''} ${isSelected ? styles.selected : ''}`}
              >
                <div className={styles.itemHeader}>
                  <div>
                    {index === 0 && <span className={styles.nearestTag}>Nearest</span>}
                    <h3>{gurdwara.name}</h3>
                    {where && <p className={styles.address}>{where}</p>}
                  </div>
                  <span className={styles.distance}>{formatDistance(km)}</span>
                </div>

                <div className={styles.travel} aria-label="Rough travel times">
                  <Link to={gurdwaraLink('locate', gurdwara, handover, { mode: 'walk' })} className={styles.travelPill}>
                    <FaWalking aria-hidden="true" /> {travelEstimate(km, 'walk')}
                  </Link>
                  <Link to={gurdwaraLink('locate', gurdwara, handover, { mode: 'bus' })} className={styles.travelPill}>
                    <FaBus aria-hidden="true" /> {travelEstimate(km, 'bus')}
                  </Link>
                  <Link to={gurdwaraLink('locate', gurdwara, handover, { mode: 'car' })} className={styles.travelPill}>
                    <FaCar aria-hidden="true" /> {travelEstimate(km, 'car')}
                  </Link>
                </div>

                <div className={styles.itemActions}>
                  <Link to={gurdwaraLink('locate', gurdwara, handover)} className={styles.actionPrimary}>
                    <FaMapMarkedAlt aria-hidden="true" /> Directions
                  </Link>
                  <button type="button" className={styles.actionLink} onClick={() => showHistory(gurdwara)} aria-pressed={isSelected}>
                    History
                  </button>
                  <Link to={gurdwaraLink('services', gurdwara, handover)} className={styles.actionLink}>Services</Link>
                  <button type="button" className={styles.actionLink} onClick={() => focusOnMap(gurdwara)}>Show on map</button>
                </div>
              </li>
            );
          })}
        </ul>

        <div className={styles.mapColumn} id="gurdwara-map">
          <div className={styles.mapContainer}>
            <GoogleMap
              ref={mapApi}
              center={{ lat: startPlace.lat, lng: startPlace.lng }}
              zoom={12}
              markers={pins}
              fit={fit}
              maxZoom={15}
              singleZoom={12}
              onMarkerClick={setSelectedId}
              popup={popupFor}
              dark={isDarkMode}
              label={`Map of Gurdwaras near ${originLabel}`}
              fallbackUrl={googleMapsSearchUrl(handover)}
            />
          </div>
          <p className={styles.mapAttribution}>
            Gurdwaras, photos and map from Google Maps. Missing one? It can be added in the Google Maps app.
          </p>
        </div>
      </section>

      {/* ---------- History and photo of the picked Gurdwara ---------- */}
      {selected && (
        <section id="gurdwara-history" className={styles.section} aria-labelledby="history-title">
          <div className={styles.history}>
            <figure className={styles.historyImageWrap}>
              {history.status === 'loading' && <span className={styles.photoSkeleton} aria-hidden="true" />}
              {history.status !== 'loading' && photo && (
                <img key={photo} src={photo} alt={selected.name} className={styles.historyImage} loading="lazy" />
              )}
              {history.status !== 'loading' && !photo && (
                <div className={styles.photoPlaceholder}>
                  <FaMapMarkerAlt aria-hidden="true" />
                  <p>There’s no photo of {selected.name} yet.</p>
                </div>
              )}
              {history.status !== 'loading' && freePhoto && (
                <figcaption className={styles.photoCredit}>
                  {safeExternalUrl(historyData?.image_page) ? (
                    <a href={safeExternalUrl(historyData.image_page)} target="_blank" rel="noopener noreferrer">
                      Photo: {historyData?.image_credit || 'Wikipedia'}
                    </a>
                  ) : `Photo: ${historyData?.image_credit || 'Wikipedia'}`}
                </figcaption>
              )}
              {history.status !== 'loading' && googlePhoto && (
                <figcaption className={styles.photoCredit}>
                  Photo{selected.photo.credit ? ': ' : ' '}
                  {selected.photo.credit && safeExternalUrl(selected.photo.credit_url) ? (
                    <a href={safeExternalUrl(selected.photo.credit_url)} target="_blank" rel="noopener noreferrer">{selected.photo.credit}</a>
                  ) : selected.photo.credit}
                  {selected.photo.credit ? ', ' : ''}from Google Maps
                </figcaption>
              )}
            </figure>

            <div className={styles.historyText} aria-busy={history.status === 'loading'}>
              <span className={styles.eyebrowIcon} aria-hidden="true"><FaHistory /></span>
              <h2 id="history-title" className={styles.sectionTitle}>History of {selected.name}</h2>

              {history.status === 'loading' && (
                <div className={styles.historySkeleton} role="status" aria-label="Loading the history from Wikipedia">
                  <span /><span /><span /><span />
                </div>
              )}

              {history.status === 'found' && (
                <>
                  <p>{historyIntro(history.data)}</p>
                  <WikipediaCredit data={history.data} className={styles.credit} />
                  <Link to={gurdwaraLink('history', selected, handover)} className={styles.primaryButton}>
                    Read the full history
                  </Link>
                </>
              )}

              {history.status === 'missing' && (
                <>
                  {sentence(history.data?.description) && <p>{sentence(history.data.description)}</p>}
                  <p>
                    Wikipedia doesn’t have an article about {selected.name} yet, so there’s no history to show here.
                    {googleUrl ? ' Its Google Maps page has more about it.' : ''}
                  </p>
                  {placeLabel(selected) && (
                    <dl className={styles.facts}>
                      <dt>Address</dt><dd>{placeLabel(selected)}</dd>
                    </dl>
                  )}
                  <div className={styles.historyActions}>
                    {googleUrl && (
                      <a href={googleUrl} className={styles.primaryButton} target="_blank" rel="noopener noreferrer">
                        <FaGlobe aria-hidden="true" /> See it on Google Maps
                      </a>
                    )}
                    {safeExternalUrl(history.data?.search_url) && (
                      <a href={safeExternalUrl(history.data.search_url)} className={styles.secondaryButton} target="_blank" rel="noopener noreferrer">
                        Search Wikipedia
                      </a>
                    )}
                    <Link to={gurdwaraLink('locate', selected, handover)} className={styles.secondaryButton}>
                      <FaMapMarkedAlt aria-hidden="true" /> Directions
                    </Link>
                  </div>
                </>
              )}

              {history.status === 'error' && (
                <>
                  <p role="alert">{history.error}</p>
                  <button type="button" className={styles.secondaryButton} onClick={history.retry}>
                    <FaRedo aria-hidden="true" /> Try again
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ---------- Services ---------- */}
      <section className={styles.section} aria-labelledby="services-title">
        <h2 id="services-title" className={styles.sectionTitle}>Services in Gurdwara</h2>
        <p className={styles.lede}>What most Gurdwaras offer. Every Gurdwara is open to everyone.</p>
        <ul className={styles.servicesList}>
          {servicesList.map((service) => {
            const open = selectedService === service.id;
            return (
              <li key={service.id} className={`${styles.service} ${open ? styles.serviceOpen : ''}`}>
                <button
                  type="button"
                  className={styles.serviceHead}
                  onClick={() => setSelectedService(open ? null : service.id)}
                  aria-expanded={open}
                >
                  <span className={styles.serviceIcon} aria-hidden="true">{service.icon}</span>
                  <span className={styles.serviceName}>{service.name}</span>
                  <FaChevronDown className={styles.serviceChevron} aria-hidden="true" />
                </button>
                {open && (
                  <div className={styles.serviceBody}>
                    <p>{service.description}</p>
                    {selected && (
                      <Link to={gurdwaraLink('services', selected, handover)} className={styles.secondaryButton}>
                        Services at {selected.name}
                      </Link>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
};

export default GurdwaraAccess;
