/**
 * hooks/useGurdwara.js
 * -----------------------------------------------------------------------------
 * The Gurdwara a page is about (/gurdwara-access/locate|services|history/:id,
 * where :id is its Google Maps place ID), for the directions, services and
 * history pages.
 *
 *   const { status, gurdwara, origin, error, retry } = useGurdwara(id, { contact: true });
 *   status   'loading' | 'found' | 'missing' (no such place) | 'error'
 *   origin   where the visitor searched from ({ lat, lng, label }), when the
 *            finder handed it over, else null
 *   contact  also load its phone, website and opening hours
 *
 * The Gurdwara the finder handed over with the link shows at once (its phone,
 * website and hours are added when they come); a shared link or a bookmark
 * asks Google Maps (api/googleMaps.js).
 * -----------------------------------------------------------------------------
 */
import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { gurdwaraContact, gurdwaraDetails, isPlaceNotFound } from '../api/googleMaps';

// Google place IDs: letters, digits, '-' and '_'
const ID_PATTERN = /^[A-Za-z0-9_-]{10,400}$/;

const validOrigin = (origin) => (origin && Number.isFinite(origin.lat) && Number.isFinite(origin.lng)
  ? { lat: origin.lat, lng: origin.lng, label: String(origin.label || '') }
  : null);

const useGurdwara = (id, { contact = false } = {}) => {
  const location = useLocation();
  const handed = location.state?.gurdwara;
  const origin = validOrigin(location.state?.origin);
  const known = handed && handed.id === id && Array.isArray(handed.coordinates) ? handed : null;
  const needed = !known || (contact && !known.contact_loaded);
  const key = `${id}|${contact}|${Boolean(known)}`;

  const [state, setState] = useState({ key: '', status: 'loading', gurdwara: null, error: '' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!needed) return undefined;
    if (!ID_PATTERN.test(id || '')) {
      setState({ key, status: 'missing', gurdwara: null, error: '' });
      return undefined;
    }
    let cancelled = false;
    setState({ key, status: 'loading', gurdwara: null, error: '' });
    const request = known
      ? gurdwaraContact(id).then((more) => ({ ...known, ...more }))
      : gurdwaraDetails(id, { contact });
    request
      .then((gurdwara) => {
        if (!cancelled) setState({ key, status: gurdwara ? 'found' : 'missing', gurdwara: gurdwara || null, error: '' });
      })
      .catch((error) => {
        if (cancelled) return;
        if (isPlaceNotFound(error)) {
          setState({ key, status: 'missing', gurdwara: null, error: '' });
        } else {
          setState({ key, status: 'error', gurdwara: null,
            error: 'Google Maps couldn’t be reached just now, so this Gurdwara couldn’t be loaded. Try again in a minute.' });
        }
      });
    return () => { cancelled = true; };
    // `known` is worked out from the id and the link's state on every render; `key` says when it changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, needed, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const current = state.key === key ? state : null;

  if (known) {
    // Shown at once; the phone, website and hours join it when they come (a failure just leaves them out)
    const gurdwara = current?.status === 'found' && current.gurdwara ? current.gurdwara : known;
    return { status: 'found', gurdwara, origin, error: '', retry };
  }
  return { ...(current || { status: 'loading', gurdwara: null, error: '' }), origin, retry };
};

export default useGurdwara;
