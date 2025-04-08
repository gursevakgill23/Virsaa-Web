import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './GurdwaraLocate.module.css';
import header_image_light from '../../../images/gurdwaraAccess/header-image.jpg';
import header_image_dark from '../../../images/gurdwaraAccess/header-image-dark.png';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('../../../images/gurdwaraAccess/marker-icon-2x.png'),
  iconUrl: require('../../../images/gurdwaraAccess/marker-icon.png'),
  shadowUrl: require('../../../images/gurdwaraAccess/marker-shadow.png'),
});

const GurdwaraLocate = ({ isDarkMode }) => {
  const { id } = useParams();
  
  // Mock data - in a real app, you would fetch this based on the id
  const gurdwaras = [
    {
      id: 1,
      name: 'Gurdwara Sikh Sangat Brampton',
      address: '32 Regan Rd, Brampton, ON, Canada',
      coordinates: [43.7156, -79.7607],
    },
    {
      id: 2,
      name: 'Gurudwara Nanaksar-Brampton',
      address: '64 Timberlane Dr, Brampton, ON, Canada',
      coordinates: [43.7089, -79.7631],
    },
    {
      id: 3,
      name: 'Sri Guru Nanak Sikh Centre Brampton',
      address: '99 Glidden Rd, Brampton, ON, Canada',
      coordinates: [43.7023, -79.7665],
    },
  ];
  
  const selectedGurdwara = gurdwaras.find(g => g.id === parseInt(id)) || gurdwaras[0];
  
  // Mock user location (in a real app, you'd get this from geolocation API)
  const userLocation = [43.7216, -79.7447];
  
  // Mock route coordinates (in a real app, you'd get these from a routing API)
  const routeCoordinates = [
    userLocation,
    [43.7196, -79.7507],
    [43.7176, -79.7557],
    selectedGurdwara.coordinates
  ];
  
  // Travel times (mock data)
  const travelTimes = {
    walk: '45 mins',
    car: '10 mins',
    bus: '25 mins'
  };

  const [transportMode, setTransportMode] = React.useState('car');

  return (
    <div className={styles.page} data-theme={isDarkMode ? 'dark' : 'light'}>
      {/* Header with image and text */}
      <div className={styles.header}>
        <img
          src={isDarkMode ? header_image_dark : header_image_light}
          alt="Gurdwara Locate"
          className={styles.headerImage}
        />
        <div className={styles.headerText}>
          <h1>LOCATE {selectedGurdwara.name.toUpperCase()}</h1>
          <p>Find the best route to reach the Gurdwara</p>
        </div>
      </div>

      {/* Breadcrumb Section */}
      <div className={styles.breadcrumb}>
        <Link to={'/'}><span>Home</span></Link> / 
        <Link to={'/gurdwara-access'}><span> Gurdwara Access</span></Link> / 
        <span> Locate {selectedGurdwara.name}</span>
      </div>

      <div className={styles.mainContainer}>
        {/* Transport mode selector */}
        <div className={styles.transportSelector}>
          <button 
            className={`${styles.transportButton} ${transportMode === 'walk' ? styles.active : ''}`}
            onClick={() => setTransportMode('walk')}
          >
            <span className={styles.walkIcon}>🚶</span> Walk: {travelTimes.walk}
          </button>
          <button 
            className={`${styles.transportButton} ${transportMode === 'car' ? styles.active : ''}`}
            onClick={() => setTransportMode('car')}
          >
            <span className={styles.carIcon}>🚗</span> Drive: {travelTimes.car}
          </button>
          <button 
            className={`${styles.transportButton} ${transportMode === 'bus' ? styles.active : ''}`}
            onClick={() => setTransportMode('bus')}
          >
            <span className={styles.busIcon}>🚌</span> Transit: {travelTimes.bus}
          </button>
        </div>

        {/* Map container */}
        <div className={styles.mapContainer}>
          <MapContainer
            center={userLocation}
            zoom={13}
            style={{ height: '500px', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {/* User location marker */}
            <Marker position={userLocation}>
              <Popup>
                <div>
                  <h3>Your Location</h3>
                </div>
              </Popup>
            </Marker>
            
            {/* Gurdwara marker */}
            <Marker position={selectedGurdwara.coordinates}>
              <Popup>
                <div>
                  <h3>{selectedGurdwara.name}</h3>
                  <p>{selectedGurdwara.address}</p>
                </div>
              </Popup>
            </Marker>
            
            {/* Route polyline */}
            <Polyline 
              positions={routeCoordinates} 
              color={transportMode === 'walk' ? '#4CAF50' : transportMode === 'car' ? '#2196F3' : '#FF9800'}
              weight={6}
            />
          </MapContainer>
        </div>

        {/* Directions list */}
        <div className={styles.directionsContainer}>
          <h3>Step-by-Step Directions</h3>
          <ol className={styles.directionsList}>
            <li>Start at your current location</li>
            <li>Head northwest on Main St toward 1st Ave</li>
            <li>Turn right onto Oak St</li>
            <li>Continue straight for 2 km</li>
            <li>Turn left onto Regan Rd</li>
            <li>Destination will be on your right</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default GurdwaraLocate;