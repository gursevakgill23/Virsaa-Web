import React, { useEffect, useState } from 'react';
import { TailSpin } from 'react-loader-spinner'; // Import the spinner component
import logo from '../images/logo.png'; // Replace with the path to your logo
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


const Loader = ({ onLoadingComplete }) => {
  const getImagePath = useProductionImagePath();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false); // Hide loader after 1.5 seconds
      onLoadingComplete(); // Notify parent component that loading is complete
    }, 2000); // Show loader for 1.5 seconds
    return () => clearTimeout(timer); // Cleanup timer on unmount
  }, [onLoadingComplete]);

  if (loading) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'black',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999, // Ensure loader is on top of everything
        }}
      >
        <div style={{ position: 'relative', textAlign: 'center' }}>
          {/* Logo */}
          <img
            src={getImagePath(logo)}
            alt="App Logo"
            style={{ width: '120px', height: '100px' }} // Adjust size as needed
            className='loader-image'
          />
          {/* Rotating Circle */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)', // Center the spinner
            }}
          >
            <TailSpin
              color="#ffffff" // White color for the spinner
              height={120} // Size of the spinner
              width={120} // Size of the spinner
            />
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default Loader;