/**
 * utils/devLog.js
 * -----------------------------------------------------------------------------
 * Console messages for developers only. They print while developing
 * (npm start) and are silent on the live site, so visitors' consoles stay
 * clean. Request errors are reduced to their status or message, so a token in
 * a request's headers is never printed.
 *
 *   devError('Wallet load failed:', err);
 *   devWarn('Google Maps: no key set');
 * -----------------------------------------------------------------------------
 */
const DEV = process.env.NODE_ENV === 'development';

// An axios error -> its HTTP status (or message); anything else as it is
const tidy = (value) => {
  if (value && typeof value === 'object' && (value.isAxiosError || value.response || value.config)) {
    return value.response?.status || value.message || 'request failed';
  }
  return value;
};

export const devError = (...args) => {
  // eslint-disable-next-line no-console
  if (DEV) console.error(...args.map(tidy));
};

export const devWarn = (...args) => {
  // eslint-disable-next-line no-console
  if (DEV) console.warn(...args.map(tidy));
};
