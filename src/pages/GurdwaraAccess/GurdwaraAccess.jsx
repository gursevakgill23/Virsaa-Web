/**
 * pages/GurdwaraAccess/GurdwaraAccess.jsx
 * -----------------------------------------------------------------------------
 * The Gurdwara finder (/gurdwara-access):
 *   - search an address (with suggestions) or use the browser's location
 *   - lists Gurdwaras within 10 km with distance and walk/bus/car times, and
 *     shows them on a Leaflet map (OpenStreetMap tiles)
 *   - links to directions, services and history for each Gurdwara
 *   - history of the nearest Gurdwara and the services Gurdwaras offer
 * Addresses are looked up with OpenStreetMap's Nominatim service (Canada only).
 * The Gurdwara list itself is local data for now.
 * -----------------------------------------------------------------------------
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import styles from './GurdwaraAccess.module.css';
import {
  FaSearch, FaLocationArrow, FaWalking, FaBus, FaCar, FaGlobe, FaPhoneAlt, FaMapMarkedAlt,
  FaHandsHelping, FaBook, FaUtensils, FaBed, FaHeartbeat, FaChevronDown, FaHistory, FaMapMarkerAlt,
} from 'react-icons/fa';
import PageHero from '../../components/PageHero/PageHero';
import { safeExternalUrl } from '../../utils/safeUrl';

// Pictures and Leaflet marker icons (files in public/images)
const gurdwaraHistoryImage = '/images/gurdwaraAccess/gurdwara-history.jpg';
const header_image_light = '/images/header-image.png';
const header_image_dark = '/images/header-image-dark.png';
const iconRetinaUrl = '/images/gurdwaraAccess/marker-icon-2x.png';
const iconUrl = '/images/gurdwaraAccess/marker-icon.png';
const iconShadowUrl = '/images/gurdwaraAccess/marker-shadow.png';

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

// Default marker icons for Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl: iconShadowUrl });

// Gurdwara list (can move to the API later)
const gurdwaraDatabase = [
  {
    id: 1,
    name: 'Gurdwara Sikh Sangat Brampton',
    address: '32 Regan Rd, Brampton, ON, Canada',
    coordinates: [43.7156, -79.7607],
    website: 'https://www.gssbrampton.com',
    phone: '(905) 495-1200',
    history: 'Established in 1995, Gurdwara Sikh Sangat Brampton has served as a spiritual and cultural hub for thousands of devotees. It was founded by a small group of Sikh immigrants and has grown to become one of the largest Gurdwaras in the region.',
    services: ['Langar', 'Accommodation', 'Religious Classes'],
  },
  {
    id: 2,
    name: 'Gurudwara Nanaksar-Brampton',
    address: '64 Timberlane Dr, Brampton, ON, Canada',
    coordinates: [43.7089, -79.7631],
    website: 'https://www.nanaksar.com',
    phone: '(905) 452-1313',
    history: 'Founded in 2002, Gurudwara Nanaksar-Brampton follows the Nanaksar tradition. It is known for its peaceful atmosphere and strict adherence to Sikh principles. The Gurdwara hosts regular kirtan programs and religious discourses.',
    services: ['Langar', 'Medical Camps', 'Library'],
  },
  {
    id: 3,
    name: 'Sri Guru Nanak Sikh Centre Brampton',
    address: '99 Glidden Rd, Brampton, ON, Canada',
    coordinates: [43.7023, -79.7665],
    website: 'https://www.sgnsc.com',
    phone: '(905) 457-5757',
    history: 'Sri Guru Nanak Sikh Centre was established in 2010 to serve the growing Sikh community in northwest Brampton. It features modern facilities while maintaining traditional Sikh architecture and values.',
    services: ['Langar', 'Religious Classes', 'Youth Programs'],
  },
  {
    id: 4,
    name: 'Gurdwara Sahib Malton',
    address: '7085 Airport Rd, Mississauga, ON, Canada',
    coordinates: [43.6921, -79.6428],
    website: 'https://www.gsmalton.com',
    phone: '(905) 677-1111',
    history: 'One of the oldest Gurdwaras in the region, established in 1985. It played a key role in serving the early Sikh immigrant community and continues to be an important institution.',
    services: ['Langar', 'Senior Programs', 'Community Services'],
  },
  {
    id: 5,
    name: 'Ontario Khalsa Darbar',
    address: '7080 Dixie Rd, Mississauga, ON, Canada',
    coordinates: [43.6845, -79.6553],
    website: 'https://www.ontariokhalsadarbar.com',
    phone: '(905) 670-1771',
    history: 'Known as one of the largest Gurdwaras outside India, Ontario Khalsa Darbar opened in 2007. It features magnificent architecture and can accommodate thousands of devotees.',
    services: ['Langar', 'Accommodation', 'Library', 'Medical Camps'],
  },
];

// Distance between two coordinates in km
// Straight-line distance in km between two coordinates (haversine formula)
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Services described at the bottom of the page
const servicesList = [
  { id: 1, icon: <FaUtensils />, name: 'Langar (Free Community Kitchen)', description: 'Experience the warmth of community through our free langar service. Everyone is welcome to join and share a meal.' },
  { id: 2, icon: <FaBed />, name: 'Accommodation (Stay Facilities)', description: 'We provide comfortable accommodation facilities for visitors. Stay with us and feel at home.' },
  { id: 3, icon: <FaHandsHelping />, name: 'Religious Classes (Gurbani and Kirtan)', description: 'Join our religious classes to learn Gurbani and Kirtan. Enhance your spiritual journey with us.' },
  { id: 4, icon: <FaHeartbeat />, name: 'Medical Camps (Free Health Checkups)', description: 'Free health checkups and medical camps are organized regularly. Stay healthy with our medical services.' },
  { id: 5, icon: <FaBook />, name: 'Library (Sikh Literature and History)', description: 'Explore our library filled with Sikh literature and history. Learn about our rich heritage.' },
];

const GurdwaraAccess = ({ isDarkMode }) => {
  const getImagePath = useProductionImagePath();
  // Search box, location, results, loading/error and suggestions state
  const [selectedService, setSelectedService] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [nearbyGurdwaras, setNearbyGurdwaras] = useState([]);
  const [nearestGurdwara, setNearestGurdwara] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [searchAddress, setSearchAddress] = useState('');
  const mapRef = useRef(null);
  const searchInputRef = useRef(null);
  const debounceTimeoutRef = useRef(null);
  const suggestionRequest = useRef(0); // only the newest suggestions request may update the list

  // Travel time estimate from distance and mode
  const calculateTravelTime = useCallback((distanceKm, mode) => {
    const speeds = { walk: 5, bus: 25, car: 40 };
    const timeMinutes = Math.round((distanceKm / (speeds[mode] || 30)) * 60);
    if (timeMinutes < 60) return `${timeMinutes} min`;
    const hours = Math.floor(timeMinutes / 60);
    const mins = timeMinutes % 60;
    return `${hours} hr${mins > 0 ? ` ${mins} min` : ''}`;
  }, []);

  // Gurdwaras within 10 km
  const findNearbyGurdwaras = useCallback((lat, lng) => {
    const nearby = gurdwaraDatabase
      .map((g) => {
        const distance = getDistance(lat, lng, g.coordinates[0], g.coordinates[1]);
        return {
          ...g,
          km: distance,
          distance: `${distance.toFixed(1)} km`,
          timeByWalk: calculateTravelTime(distance, 'walk'),
          timeByBus: calculateTravelTime(distance, 'bus'),
          timeByCar: calculateTravelTime(distance, 'car'),
        };
      })
      .filter((g) => g.km <= 10)
      .sort((a, b) => a.km - b.km);

    setNearbyGurdwaras(nearby);
    setNearestGurdwara(nearby[0] || null);
    if (lat && lng) mapRef.current?.flyTo?.([lat, lng], 13);
  }, [calculateTravelTime]);

  // Reverse geocode coordinates to an address
  // Coordinates → a readable address for the search box (best effort)
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
      if (!response.ok) throw new Error('Reverse geocoding failed');
      const data = await response.json();
      if (data.display_name) {
        setSearchAddress(data.display_name);
        setSearchQuery(data.display_name);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error.message);
    }
  };

  // "Use my location": ask the browser, then list nearby Gurdwaras
  const getUserLocation = () => {
    setIsLoading(true);
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('Your browser can’t share your location. Type an address instead.');
      setIsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        findNearbyGurdwaras(latitude, longitude);
        setIsLoading(false);
        reverseGeocode(latitude, longitude);
      },
      (error) => {
        // 1 = permission denied, 2 = position unavailable, 3 = timed out
        const messages = {
          1: 'Location access is turned off for this site. Allow it in your browser, or type an address instead.',
          2: 'Your location isn’t available right now. Type an address instead.',
          3: 'Finding your location took too long. Try again, or type an address instead.',
        };
        setLocationError(messages[error.code] || 'Your location couldn’t be found. Allow location access, or type an address instead.');
        setIsLoading(false);
        console.error('Geolocation error:', error.message);
      },
      { timeout: 15000, maximumAge: 60000 }
    );
  };

  // Address search with Nominatim
  const geocodeAddress = async (address) => {
    try {
      setIsLoading(true);
      setLocationError(null);
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=5&countrycodes=ca&addressdetails=1`);
      if (!response.ok) throw new Error('Geocoding request failed');
      const data = await response.json();
      const first = Array.isArray(data) ? data[0] : null;
      const lat = parseFloat(first?.lat);
      const lng = parseFloat(first?.lon);
      if (!first || Number.isNaN(lat) || Number.isNaN(lng)) {
        setLocationError('That address wasn’t found. Try adding the city, e.g. “Main St, Brampton”.');
        return null;
      }
      return { lat, lng, address: String(first.display_name || address) };
    } catch (error) {
      console.error('Geocoding error:', error.message);
      setLocationError('Search isn’t available right now. Try again in a moment.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Use a found location: remember it and list nearby Gurdwaras
  const applyLocation = (location) => {
    setUserLocation({ lat: location.lat, lng: location.lng });
    setSearchAddress(location.address);
    findNearbyGurdwaras(location.lat, location.lng);
  };

  // Search button / Enter
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setLocationError('Type an address or area first, or use your location.');
      searchInputRef.current?.focus();
      return;
    }
    setShowSuggestions(false);
    const location = await geocodeAddress(searchQuery);
    if (location) applyLocation(location);
  };

  const fetchLocationSuggestions = async (query) => {
    const request = ++suggestionRequest.current;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=ca&addressdetails=1`);
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      const data = await response.json();
      if (request !== suggestionRequest.current) return; // a newer search has started
      setFilteredSuggestions(Array.isArray(data) ? data.map((item) => String(item.display_name || '')).filter(Boolean) : []);
    } catch (error) {
      console.error('Suggestions error:', error.message);
      if (request === suggestionRequest.current) setFilteredSuggestions([]);
    }
  };

  // Typing: suggestions after 3 letters, with a 300 ms pause
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (locationError) setLocationError(null);
    setShowSuggestions(value.length > 2);
    clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(() => {
      if (value.length > 2) fetchLocationSuggestions(value);
      else setFilteredSuggestions([]);
    }, 300);
  };

  // Pick a suggestion
  const handleSuggestionClick = async (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    const location = await geocodeAddress(suggestion);
    if (location) applyLocation(location);
  };

  useEffect(() => {
    // Start with Brampton so the page isn't empty
    findNearbyGurdwaras(43.7315, -79.7624); // Brampton by default
  }, [findNearbyGurdwaras]);

  useEffect(() => () => clearTimeout(debounceTimeoutRef.current), []);

  // "Show on map": fly the map to a Gurdwara
  const focusOnMap = (gurdwara) => {
    mapRef.current?.flyTo?.(gurdwara.coordinates, 15);
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
                placeholder="Enter an address or area, e.g. 123 Main St, Brampton"
                maxLength={200}
                className={styles.input}
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={() => searchQuery.length > 2 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                aria-label="Address or area"
                aria-autocomplete="list"
                aria-expanded={showSuggestions && filteredSuggestions.length > 0}
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <ul id="address-suggestions" className={styles.suggestionsList} role="listbox">
                  {filteredSuggestions.map((suggestion) => (
                    <li key={suggestion} role="option" aria-selected="false">
                      <button type="button" className={styles.suggestionItem} onMouseDown={() => handleSuggestionClick(suggestion)}>
                        <FaMapMarkerAlt aria-hidden="true" /> <span>{suggestion}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button type="submit" className={styles.searchButton} disabled={isLoading}>
              {isLoading ? 'Searching…' : 'Search'}
            </button>
          </form>
          <button type="button" className={styles.locationButton} onClick={getUserLocation} disabled={isLoading}>
            <FaLocationArrow aria-hidden="true" /> Use my location
          </button>
        </div>

        {locationError && <p className={styles.errorMessage} role="alert">{locationError}</p>}
        {userLocation && searchAddress && (
          <p className={styles.resultsInfo}>
            {nearbyGurdwaras.length > 0
              ? <>Showing {nearbyGurdwaras.length} Gurdwaras within 10 km of <strong>{searchAddress}</strong></>
              : <>No Gurdwaras found within 10 km of <strong>{searchAddress}</strong>. Try a different location.</>}
          </p>
        )}
      </section>

      {/* ---------- Results + map ---------- */}
      <section className={styles.resultsSection} aria-label="Nearby Gurdwaras">
        <ul className={styles.list}>
          {nearbyGurdwaras.map((gurdwara, index) => (
            <li key={gurdwara.id} className={`${styles.listItem} ${index === 0 ? styles.nearest : ''}`}>
              <div className={styles.itemHeader}>
                <div>
                  {index === 0 && <span className={styles.nearestTag}>Nearest</span>}
                  <h3>{gurdwara.name}</h3>
                  <p className={styles.address}>{gurdwara.address}</p>
                </div>
                <span className={styles.distance}>{gurdwara.distance}</span>
              </div>

              <div className={styles.travel}>
                <Link to={`/gurdwara-access/locate/${gurdwara.id}`} className={styles.travelPill}>
                  <FaWalking aria-hidden="true" /> {gurdwara.timeByWalk}
                </Link>
                <Link to={`/gurdwara-access/locate/${gurdwara.id}`} className={styles.travelPill}>
                  <FaBus aria-hidden="true" /> {gurdwara.timeByBus}
                </Link>
                <Link to={`/gurdwara-access/locate/${gurdwara.id}`} className={styles.travelPill}>
                  <FaCar aria-hidden="true" /> {gurdwara.timeByCar}
                </Link>
              </div>

              <div className={styles.itemActions}>
                <Link to={`/gurdwara-access/locate/${gurdwara.id}`} className={styles.actionPrimary}>
                  <FaMapMarkedAlt aria-hidden="true" /> Directions
                </Link>
                <Link to={`/gurdwara-access/services/${gurdwara.id}`} className={styles.actionLink}>Services</Link>
                <Link to={`/gurdwara-access/history/${gurdwara.id}`} className={styles.actionLink}>History</Link>
                <button type="button" className={styles.actionLink} onClick={() => focusOnMap(gurdwara)}>Show on map</button>
              </div>

              <div className={styles.contact}>
                {/* Only real http(s) links are shown (see utils/safeUrl.js) */}
                {safeExternalUrl(gurdwara.website) && (
                  <a href={safeExternalUrl(gurdwara.website)} target="_blank" rel="noopener noreferrer"><FaGlobe aria-hidden="true" /> Website</a>
                )}
                <a href={`tel:${gurdwara.phone}`}><FaPhoneAlt aria-hidden="true" /> {gurdwara.phone}</a>
              </div>
            </li>
          ))}
        </ul>

        <div className={styles.mapColumn}>
          <div className={styles.mapContainer}>
            <MapContainer center={[43.7156, -79.7607]} zoom={12} style={{ height: '100%', width: '100%' }} ref={mapRef}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {userLocation && (
                <Marker position={[userLocation.lat, userLocation.lng]}>
                  <Popup>Your location</Popup>
                </Marker>
              )}
              {nearbyGurdwaras.map((gurdwara) => (
                <Marker key={gurdwara.id} position={gurdwara.coordinates}>
                  <Popup>
                    <strong>{gurdwara.name}</strong>
                    <br />
                    {gurdwara.address}
                    <br />
                    {gurdwara.distance} away
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
          <p className={styles.mapAttribution}>
            Location data © <a href="https://www.openstreetmap.org/" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors
          </p>
        </div>
      </section>

      {/* ---------- History of the nearest ---------- */}
      {nearestGurdwara && (
        <section className={styles.section} aria-labelledby="history-title">
          <div className={styles.history}>
            <div className={styles.historyImageWrap}>
              <img src={getImagePath(gurdwaraHistoryImage)} alt="" className={styles.historyImage} loading="lazy" />
            </div>
            <div className={styles.historyText}>
              <span className={styles.eyebrowIcon} aria-hidden="true"><FaHistory /></span>
              <h2 id="history-title" className={styles.sectionTitle}>History of {nearestGurdwara.name}</h2>
              <p>{nearestGurdwara.history}</p>
              <Link to={`/gurdwara-access/history/${nearestGurdwara.id}`} className={styles.primaryButton}>
                Read the full history
              </Link>
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
                    <button type="button" className={styles.secondaryButton}>Avail service</button>
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
