import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import styles from './GurdwaraAccess.module.css';
import { FaCaretRight, FaSearch, FaLocationArrow } from 'react-icons/fa';


const gurdwaraHistoryImage = '../../images/gurdwaraAccess/gurdwara-history.jpg';
const header_image_light = '../../images/header-image.jpg';
const header_image_dark = '../../images/header-image-dark.png';
const iconRetinaUrl = '../../images/gurdwaraAccess/marker-icon-2x.png';
const iconUrl = '../../images/gurdwaraAccess/marker-icon.png';
const iconShadowUrl = '../../images/gurdwaraAccess/marker-shadow.png';

const useProductionImagePath = () => {
  
  return (imagePath) => {
    // Only modify in production
    if (process.env.NODE_ENV === 'production') {
      // Handle both imported images and public folder images
      if (typeof imagePath === 'string') {
        // For public folder images
        return imagePath.startsWith('/') 
          ? imagePath 
          : `/${imagePath.replace(/.*static\/media/, 'static/media')}`;
      } else {
        // For imported images
        return imagePath.default || imagePath;
      }
    }
    return imagePath;
  };
};
// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetinaUrl,
  iconUrl: iconUrl,
  shadowUrl: iconShadowUrl,
});

// Database of Gurdwaras (can be expanded or moved to an API)
const gurdwaraDatabase = [
  {
    id: 1,
    name: 'Gurdwara Sikh Sangat Brampton',
    address: '32 Regan Rd, Brampton, ON, Canada',
    coordinates: [43.7156, -79.7607],
    website: 'https://www.gssbrampton.com',
    phone: '(905) 495-1200',
    history: 'Established in 1995, Gurdwara Sikh Sangat Brampton has served as a spiritual and cultural hub for thousands of devotees. It was founded by a small group of Sikh immigrants and has grown to become one of the largest Gurdwaras in the region.',
    services: ['Langar', 'Accommodation', 'Religious Classes']
  },
  {
    id: 2,
    name: 'Gurudwara Nanaksar-Brampton',
    address: '64 Timberlane Dr, Brampton, ON, Canada',
    coordinates: [43.7089, -79.7631],
    website: 'https://www.nanaksar.com',
    phone: '(905) 452-1313',
    history: 'Founded in 2002, Gurudwara Nanaksar-Brampton follows the Nanaksar tradition. It is known for its peaceful atmosphere and strict adherence to Sikh principles. The Gurdwara hosts regular kirtan programs and religious discourses.',
    services: ['Langar', 'Medical Camps', 'Library']
  },
  {
    id: 3,
    name: 'Sri Guru Nanak Sikh Centre Brampton',
    address: '99 Glidden Rd, Brampton, ON, Canada',
    coordinates: [43.7023, -79.7665],
    website: 'https://www.sgnsc.com',
    phone: '(905) 457-5757',
    history: 'Sri Guru Nanak Sikh Centre was established in 2010 to serve the growing Sikh community in northwest Brampton. It features modern facilities while maintaining traditional Sikh architecture and values.',
    services: ['Langar', 'Religious Classes', 'Youth Programs']
  },
  {
    id: 4,
    name: 'Gurdwara Sahib Malton',
    address: '7085 Airport Rd, Mississauga, ON, Canada',
    coordinates: [43.6921, -79.6428],
    website: 'https://www.gsmalton.com',
    phone: '(905) 677-1111',
    history: 'One of the oldest Gurdwaras in the region, established in 1985. It played a key role in serving the early Sikh immigrant community and continues to be an important institution.',
    services: ['Langar', 'Senior Programs', 'Community Services']
  },
  {
    id: 5,
    name: 'Ontario Khalsa Darbar',
    address: '7080 Dixie Rd, Mississauga, ON, Canada',
    coordinates: [43.6845, -79.6553],
    website: 'https://www.ontariokhalsadarbar.com',
    phone: '(905) 670-1771',
    history: 'Known as one of the largest Gurdwaras outside India, Ontario Khalsa Darbar opened in 2007. It features magnificent architecture and can accommodate thousands of devotees.',
    services: ['Langar', 'Accommodation', 'Library', 'Medical Camps']
  }
];

// Helper function to calculate distance between two coordinates in km
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}


const GurdwaraAccess = ({ isDarkMode }) => {
  const getImagePath = useProductionImagePath();
  const [activeDropdown, setActiveDropdown] = useState(null);
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

  // Services list with descriptions
  const servicesList = [
    {
      id: 1,
      name: 'Langar (Free Community Kitchen)',
      description: 'Experience the warmth of community through our free langar service. Everyone is welcome to join and share a meal.',
    },
    {
      id: 2,
      name: 'Accommodation (Stay Facilities)',
      description: 'We provide comfortable accommodation facilities for visitors. Stay with us and feel at home.',
    },
    {
      id: 3,
      name: 'Religious Classes (Gurbani and Kirtan)',
      description: 'Join our religious classes to learn Gurbani and Kirtan. Enhance your spiritual journey with us.',
    },
    {
      id: 4,
      name: 'Medical Camps (Free Health Checkups)',
      description: 'Free health checkups and medical camps are organized regularly. Stay healthy with our medical services.',
    },
    {
      id: 5,
      name: 'Library (Sikh Literature and History)',
      description: 'Explore our library filled with Sikh literature and history. Learn about our rich heritage.',
    },
  ];

  // Calculate travel time based on distance and mode
  const calculateTravelTime = useCallback((distanceKm, mode) => {
    let speedKmH;
    switch (mode) {
      case 'walk':
        speedKmH = 5; // average walking speed
        break;
      case 'bus':
        speedKmH = 25; // average bus speed with stops
        break;
      case 'car':
        speedKmH = 40; // average car speed in city
        break;
      default:
        speedKmH = 30;
    }
    
    const timeHours = distanceKm / speedKmH;
    const timeMinutes = Math.round(timeHours * 60);
    
    if (timeMinutes < 60) {
      return timeMinutes + ' mins';
    } else {
      const hours = Math.floor(timeMinutes / 60);
      const mins = timeMinutes % 60;
      return hours + ' hour' + (hours > 1 ? 's ' : ' ') + (mins > 0 ? mins + ' mins' : '');
    }
  }, []);

  // Find Gurdwaras within 10km radius
  const findNearbyGurdwaras = useCallback((lat, lng) => {
    const maxDistance = 10; // 10km radius
    const nearby = [];
    
    gurdwaraDatabase.forEach(gurdwara => {
      const distance = getDistance(lat, lng, gurdwara.coordinates[0], gurdwara.coordinates[1]);
      if (distance <= maxDistance) {
        nearby.push({
          ...gurdwara,
          distance: distance.toFixed(1) + ' km',
          timeByWalk: calculateTravelTime(distance, 'walk'),
          timeByBus: calculateTravelTime(distance, 'bus'),
          timeByCar: calculateTravelTime(distance, 'car')
        });
      }
    });

    // Sort by distance
    nearby.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    
    setNearbyGurdwaras(nearby);
    
    // Set the nearest Gurdwara
    if (nearby.length > 0) {
      setNearestGurdwara(nearby[0]);
    } else {
      setNearestGurdwara(null);
    }

    // Center map on user location
    if (mapRef.current && lat && lng) {
      mapRef.current.flyTo([lat, lng], 13);
    }
  }, [calculateTravelTime]);

  // Get user's current location
  const getUserLocation = useCallback(() => {
    setIsLoading(true);
    setLocationError(null);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          findNearbyGurdwaras(latitude, longitude);
          setIsLoading(false);
          
          // Reverse geocode to get address
          reverseGeocode(latitude, longitude);
        },
        (error) => {
          setLocationError('Unable to retrieve your location. Please try again or enter your location manually.');
          setIsLoading(false);
          console.error('Error getting location:', error);
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser. Please enter your location manually.');
      setIsLoading(false);
    }
  }, [findNearbyGurdwaras]);

  // Geocode address using Nominatim API
  const geocodeAddress = async (address) => {
    try {
      setIsLoading(true);
      setLocationError(null);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=5&countrycodes=ca&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding API request failed');
      }
      
      const data = await response.json();
      
      if (data.length === 0) {
        setLocationError('No results found for this location. Please try a different address.');
        return null;
      }
      
      // Return the first result (most relevant)
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        address: data[0].display_name
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      setLocationError('Error searching for location. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Reverse geocode coordinates to get address
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }
      
      const data = await response.json();
      if (data.display_name) {
        setSearchAddress(data.display_name);
        setSearchQuery(data.display_name);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  // Handle search form submission
  const handleSearch = useCallback(async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    const location = await geocodeAddress(searchQuery);
    if (location) {
      setUserLocation({ lat: location.lat, lng: location.lng });
      setSearchAddress(location.address);
      findNearbyGurdwaras(location.lat, location.lng);
    }
  }, [searchQuery, findNearbyGurdwaras]);

  // Handle input change with debounce for suggestions
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(value.length > 2); // Only show suggestions after 3 characters
    
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Set new timeout for debouncing
    debounceTimeoutRef.current = setTimeout(() => {
      if (value.length > 2) {
        fetchLocationSuggestions(value);
      } else {
        setFilteredSuggestions([]);
      }
    }, 300);
  };

  // Fetch location suggestions from Nominatim API
  const fetchLocationSuggestions = async (query) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=ca&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }
      
      const data = await response.json();
      setFilteredSuggestions(data.map(item => item.display_name));
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setFilteredSuggestions([]);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = async (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    
    const location = await geocodeAddress(suggestion);
    if (location) {
      setUserLocation({ lat: location.lat, lng: location.lng });
      setSearchAddress(location.address);
      findNearbyGurdwaras(location.lat, location.lng);
    }
  };

  // Initialize with default data
  useEffect(() => {
    findNearbyGurdwaras(43.7315, -79.7624); // Default to Brampton area
  }, [findNearbyGurdwaras]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const toggleDropdown = (id) => {
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  const handleServiceClick = (id) => {
    setSelectedService(selectedService === id ? null : id);
  };

  return (
    <div className={styles.page} data-theme={isDarkMode ? 'dark' : 'light'}>
      {/* Header with image and text */}
      <div className={styles.header}>
        <img
          src={getImagePath(isDarkMode ? header_image_dark : header_image_light)}
          alt="Gurdwara Header"
          className={styles.headerImage}
        />
        <div className={styles.headerText}>
          <h1>DISCOVER GURDWARAS NEAR YOU</h1>
          <p>Your Gateway to Peace and Community</p>
        </div>
      </div>

      {/* Breadcrumb Section */}
      <div className={styles.breadcrumb}>
        <Link to={'/'}><span>Home</span></Link> / 
        <Link to={'/gurdwara-access'}><span> Gurdwara Access</span></Link>
      </div>

      {/* Main content container */}
      <div className={styles.mainContainer}>
        {/* Left section (70% width) */}
        <div className={styles.leftSection}>
          {/* Search bar with autocomplete */}
          <div className={styles.searchContainer}>
            <form onSubmit={handleSearch} className={styles.searchForm}>
              <div className={styles.searchInputContainer}>
                <FaSearch className={styles.searchIcon} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Enter your address or location (e.g., 123 Main St, Brampton)"
                  className={styles.input}
                  value={searchQuery}
                  onChange={handleInputChange}
                  onFocus={() => searchQuery.length > 2 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <ul className={styles.suggestionsList}>
                    {filteredSuggestions.map((suggestion, index) => (
                      <li 
                        key={index}
                        className={styles.suggestionItem}
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button 
                type="submit" 
                className={styles.searchButton}
                disabled={isLoading}
              >
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            </form>
            <button 
              className={styles.currentLocationButton}
              onClick={getUserLocation}
              disabled={isLoading}
            >
              <FaLocationArrow className={styles.locationIcon} />
              Use Current Location
            </button>
          </div>

          {locationError && (
            <div className={styles.errorMessage}>{locationError}</div>
          )}

          {/* Results information */}
          {userLocation && searchAddress && (
            <div className={styles.resultsInfo}>
              <p>Showing Gurdwaras within 10km of: <strong>{searchAddress}</strong></p>
              {nearbyGurdwaras.length === 0 && (
                <p className={styles.noResults}>No Gurdwaras found nearby. Try a different location.</p>
              )}
            </div>
          )}

          {/* Gurdwaras list */}
          <div className={styles.list}>
            {nearbyGurdwaras.map((gurdwara) => (
              <div key={gurdwara.id} className={styles.listItem}>
                <div className={styles.itemHeader}>
                  <h3>{gurdwara.name}</h3>
                  <div className={styles.dropdown}>
                    <button
                      className={styles.dots}
                      onClick={() => toggleDropdown(gurdwara.id)}
                    >
                      •••
                    </button>
                    {activeDropdown === gurdwara.id && (
                      <div className={styles.dropdownContent}>
                        <Link to={`/gurdwara-access/locate/${gurdwara.id}`}>Locate</Link>
                        <Link to={`/gurdwara-access/services/${gurdwara.id}`}>Services</Link>
                        <Link to={`/gurdwara-access/history/${gurdwara.id}`}>History</Link>
                      </div>
                    )}
                  </div>
                </div>
                <p>{gurdwara.address}</p>
                <div className={styles.details}>
                  <p>
                    <strong>Distance:</strong> {gurdwara.distance}
                  </p>
                  <Link 
                    to={`/gurdwara-access/locate/${gurdwara.id}`} 
                    className={styles.detailLink}
                  >
                    <strong>Time by Bus:</strong> {gurdwara.timeByBus}
                  </Link>
                  <Link 
                    to={`/gurdwara-access/locate/${gurdwara.id}`} 
                    className={styles.detailLink}
                  >
                    <strong>Time by Walk:</strong> {gurdwara.timeByWalk}
                  </Link>
                  <Link 
                    to={`/gurdwara-access/locate/${gurdwara.id}`} 
                    className={styles.detailLink}
                  >
                    <strong>Time by Car:</strong> {gurdwara.timeByCar}
                  </Link>
                </div>
                <div className={styles.contact}>
                  <a href={gurdwara.website} target="_blank" rel="noopener noreferrer">
                    Website
                  </a>
                  <span> | </span>
                  <a href={`tel:${gurdwara.phone}`}>{gurdwara.phone}</a>
                </div>
              </div>
            ))}
          </div>

          {/* Map with pinned locations */}
          <div className={styles.mapContainer}>
            <MapContainer
              center={[43.7156, -79.7607]}
              zoom={12}
              style={{ height: '400px', width: '100%' }}
              ref={mapRef}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {/* User location marker */}
              {userLocation && (
                <Marker position={[userLocation.lat, userLocation.lng]}>
                  <Popup>Your Location</Popup>
                </Marker>
              )}
              
              {/* Gurdwara markers */}
              {nearbyGurdwaras.map((gurdwara) => (
                <Marker key={gurdwara.id} position={gurdwara.coordinates}>
                  <Popup>
                    <div>
                      <h3>{gurdwara.name}</h3>
                      <p>{gurdwara.address}</p>
                      <p>Distance: {gurdwara.distance}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            <div className={styles.mapAttribution}>
              Location data © <a href="https://www.openstreetmap.org/" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors
            </div>
          </div>

          {/* History of Nearest Gurdwara Section */}
          {nearestGurdwara && (
            <div className={styles.historySection}>
              <h2>History of {nearestGurdwara.name}</h2>
              <div className={styles.historyContent}>
                <img
                  src={getImagePath(gurdwaraHistoryImage)}
                  alt="Gurdwara History"
                  className={styles.historyImage}
                />
                <div className={styles.historyText}>
                  <p>{nearestGurdwara.history}</p>
                  <Link 
                    to={`/gurdwara-access/history/${nearestGurdwara.id}`}
                    className={styles.readMoreButton}
                  >
                    Read More
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.rightSection}>
          <h2>Services in Gurdwara</h2>
          <ul className={styles.servicesList}>
            {servicesList.map((service) => (
              <li key={service.id} onClick={() => handleServiceClick(service.id)}>
                <div className={styles.serviceItem}>
                  <FaCaretRight
                    className={`${styles.triangleIcon} ${
                      selectedService === service.id ? styles.rotateIcon : ''
                    }`}
                  />
                  <span>{service.name}</span>
                </div>
                {selectedService === service.id && (
                  <div className={styles.serviceDescription}>
                    <p>{service.description}</p>
                    <button className={styles.availButton}>Avail Service</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GurdwaraAccess;