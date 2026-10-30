/**
 * hooks/useGurdwara.js
 * -----------------------------------------------------------------------------
 * The Gurdwara a page is about (/gurdwara-access/locate|services|history/:id),
 * for the directions, services and history pages.
 *
 *   const { status, gurdwara, origin, error, retry } = useGurdwara(apiString, id);
 *   status   'loading' | 'found' | 'missing' (no such Gurdwara) | 'error'
 *   origin   where the visitor searched from ({ lat, lng, label }), when the
 *            finder handed it over, else null
 *
 * Fastest first: the Gurdwara the finder handed over with the link, one seen
 * earlier in this visit, or else OpenStreetMap through our server (a shared
 * link or a bookmark).
 * -----------------------------------------------------------------------------
 */
import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import gurdwaraApi from '../api/gurdwaraApi';
import { describeApiError } from '../utils/apiError';

const ID_PATTERN = /^[nwr]\d{1,15}$/;

const validOrigin = (origin) => (origin && Number.isFinite(origin.lat) && Number.isFinite(origin.lng)
  ? { lat: origin.lat, lng: origin.lng, label: String(origin.label || '') }
  : null);

const useGurdwara = (apiString, id) => {
  const location = useLocation();
  const handed = location.state?.gurdwara;
  const origin = validOrigin(location.state?.origin);
  const known = (handed && handed.id === id && Array.isArray(handed.coordinates) ? handed : null)
    || (ID_PATTERN.test(id || '') ? gurdwaraApi.remembered(id) : null);

  const [state, setState] = useState({ id: '', status: 'loading', gurdwara: null, error: '' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (known) return undefined;
    if (!ID_PATTERN.test(id || '')) {
      setState({ id, status: 'missing', gurdwara: null, error: '' });
      return undefined;
    }
    let cancelled = false;
    setState({ id, status: 'loading', gurdwara: null, error: '' });
    gurdwaraApi.place(apiString, id)
      .then((gurdwara) => {
        if (!cancelled) setState({ id, status: gurdwara ? 'found' : 'missing', gurdwara: gurdwara || null, error: '' });
      })
      .catch((error) => {
        if (cancelled) return;
        if (error?.response?.status === 404) {
          setState({ id, status: 'missing', gurdwara: null, error: '' });
        } else {
          setState({ id, status: 'error', gurdwara: null,
            error: describeApiError(error, 'This Gurdwara couldn’t be loaded. Try again.') });
        }
      });
    return () => { cancelled = true; };
    // `known` is worked out from id and the link's state on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiString, id, attempt, Boolean(known)]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  if (known) return { status: 'found', gurdwara: known, origin, error: '', retry };
  const current = state.id === id ? state : { status: 'loading', gurdwara: null, error: '' };
  return { ...current, origin, retry };
};

export default useGurdwara;
