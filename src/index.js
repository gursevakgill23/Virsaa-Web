import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initSiteLanguage } from './i18n/siteLanguage';

// Punjabi / French: loads Google's translator before the app renders
initSiteLanguage();

/*
 * Browser extensions inject scripts into every page. When one of them throws
 * (e.g. "Cannot read properties of undefined (reading 'M_ID')" from a
 * chrome-extension:// script), the development error overlay shows it as if it
 * were a Virsaa error. These listeners run first and hide only errors whose
 * source is an extension, so real app errors still show up.
 * The production build has no overlay, so this only matters in `npm start`.
 */
if (process.env.NODE_ENV === 'development') {
  const EXTENSION = /(chrome|moz|safari(-web)?)-extension:\/\//;

  const fromExtension = (value) => {
    if (!value) return false;
    if (typeof value === 'string') return EXTENSION.test(value);
    return EXTENSION.test(value.stack || '') || EXTENSION.test(value.fileName || value.filename || '');
  };

  window.addEventListener('error', (event) => {
    if (fromExtension(event.filename) || fromExtension(event.error)) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    if (fromExtension(event.reason)) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }, true);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
