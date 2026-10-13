/**
 * pages/GurdwaraAccess/GurdwaraLocate/GurdwaraLocate.jsx
 * -----------------------------------------------------------------------------
 * Directions to one Gurdwara (/gurdwara-access/locate/:id): travel mode
 * (walk, drive, transit), a map with the route, travel time and step-by-step
 * directions. Uses sample data for now; a routing API will replace it.
 * -----------------------------------------------------------------------------
 */
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FaWalking, FaCar, FaBus, FaMapMarkerAlt, FaHistory } from 'react-icons/fa';
import PageHero from '../../../components/PageHero/PageHero';
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

// Route colours per travel mode, picked to sit well with the maroon theme
// Travel modes and their route colours
const MODES = [
  { id: 'walk', label: 'Walk', icon: <FaWalking />, color: '#2f8a4e' },
  { id: 'car', label: 'Drive', icon: <FaCar />, color: '#65041d' },
  { id: 'bus', label: 'Transit', icon: <FaBus />, color: '#c27a1a' },
];

const GurdwaraLocate = ({ isDarkMode }) => {
  const getImagePath = useProductionImagePath();
  const { id } = useParams();
  const [transportMode, setTransportMode] = useState('car');

  // Pictures and Leaflet marker icons
  const header_image_light = '/images/header-image.png';
  const header_image_dark = '/images/header-image-dark.png';
  const marker_icon = '/images/gurdwaraAccess/marker-icon.png';
  const marker_icon_2x = '/images/gurdwaraAccess/marker-icon-2x.png';
  const marker_shadow = '/images/gurdwaraAccess/marker-shadow.png';

  // Default marker icons for Leaflet
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: getImagePath(marker_icon_2x),
    iconUrl: getImagePath(marker_icon),
    shadowUrl: getImagePath(marker_shadow),
  });

  // Mock data; will come from the API by id later
  const gurdwaras = [
    { id: 1, name: 'Gurdwara Sikh Sangat Brampton', address: '32 Regan Rd, Brampton, ON, Canada', coordinates: [43.7156, -79.7607] },
    { id: 2, name: 'Gurudwara Nanaksar-Brampton', address: '64 Timberlane Dr, Brampton, ON, Canada', coordinates: [43.7089, -79.7631] },
    { id: 3, name: 'Sri Guru Nanak Sikh Centre Brampton', address: '99 Glidden Rd, Brampton, ON, Canada', coordinates: [43.7023, -79.7665] },
  ];

  const selectedGurdwara = gurdwaras.find((g) => g.id === parseInt(id, 10)) || gurdwaras[0];

  // Mock user location and route (a routing API will replace these)
  const userLocation = [43.7216, -79.7447];
  const routeCoordinates = [userLocation, [43.7196, -79.7507], [43.7176, -79.7557], selectedGurdwara.coordinates];
  const travelTimes = { walk: '45 mins', car: '10 mins', bus: '25 mins' };

  const directions = [
    'Start at your current location',
    'Head northwest on Main St toward 1st Ave',
    'Turn right onto Oak St',
    'Continue straight for 2 km',
    'Turn left onto Regan Rd',
    'Destination will be on your right',
  ];

  // The selected travel mode
  const activeMode = MODES.find((m) => m.id === transportMode);

  return (
    <div className={styles.page}>
      <PageHero
        compact
        image={getImagePath(isDarkMode ? header_image_dark : header_image_light)}
        title={`LOCATE ${selectedGurdwara.name.toUpperCase()}`}
        subtitle="Find the best route to reach the Gurdwara"
        crumbs={[
          { label: 'Home', to: '/' },
          { label: 'Gurdwara Access', to: '/gurdwara-access' },
          { label: `Locate ${selectedGurdwara.name}` },
        ]}
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
              <span className={styles.modeTime}>{travelTimes[mode.id]}</span>
            </button>
          ))}
        </div>

        <div className={styles.routeLayout}>
          <div className={styles.mapContainer}>
            <MapContainer center={userLocation} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={userLocation}>
                <Popup>Your location</Popup>
              </Marker>
              <Marker position={selectedGurdwara.coordinates}>
                <Popup>
                  <strong>{selectedGurdwara.name}</strong>
                  <br />
                  {selectedGurdwara.address}
                </Popup>
              </Marker>
              <Polyline positions={routeCoordinates} color={activeMode.color} weight={6} />
            </MapContainer>

            {/* Glass summary floating on the map */}
            <div className={styles.mapCard}>
              <span className={styles.mapCardIcon} style={{ background: activeMode.color }} aria-hidden="true">
                {activeMode.icon}
              </span>
              <div>
                <p className={styles.mapCardTime}>{travelTimes[transportMode]}</p>
                <p className={styles.mapCardText}>{activeMode.label} to {selectedGurdwara.name}</p>
              </div>
            </div>
          </div>

          <aside className={styles.directionsContainer}>
            <div className={styles.destination}>
              <FaMapMarkerAlt aria-hidden="true" />
              <div>
                <h2 className={styles.destName}>{selectedGurdwara.name}</h2>
                <p className={styles.destAddress}>{selectedGurdwara.address}</p>
              </div>
            </div>

            <h3 className={styles.directionsTitle}>Step-by-step directions</h3>
            <ol className={styles.directionsList}>
              {directions.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>

            <Link to={`/gurdwara-access/history/${selectedGurdwara.id}`} className={styles.secondaryButton}>
              <FaHistory aria-hidden="true" /> Read its history
            </Link>
          </aside>
        </div>
      </section>
    </div>
  );
};

export default GurdwaraLocate;
