/**
 * hooks/useGurdwaraHistory.js
 * -----------------------------------------------------------------------------
 * React hook that loads one Gurdwara's history live from Wikipedia, through
 * the server (api/gurdwaraApi.js). Used by the finder (history of the nearest
 * Gurdwara) and the full history page.
 *
 *   const history = useGurdwaraHistory(apiString, gurdwara); // { name, city } or null
 *   history.status   'idle' (no Gurdwara) | 'loading' | 'found' | 'missing' | 'error'
 *   history.data     the server's answer, when found or missing
 *   history.error    a message to show, when status is 'error'
 *   history.retry()  ask again after an error
 *
 * When the Gurdwara changes (e.g. a new search finds a different nearest
 * one), the previous Gurdwara's history is never shown while the new one loads.
 * -----------------------------------------------------------------------------
 */
import { useCallback, useEffect, useState } from 'react';
import gurdwaraApi from '../api/gurdwaraApi';
import { describeApiError } from '../utils/apiError';

// What to say when the lookup fails: Wikipedia down (503 from our server) or anything else
const failureMessage = (error) => (error?.response?.status === 503
  ? 'Wikipedia couldn’t be reached just now, so the history isn’t available. Try again in a minute.'
  : describeApiError(error, 'The history couldn’t be loaded. Try again.'));

const useGurdwaraHistory = (apiString, gurdwara) => {
  const name = gurdwara?.name || '';
  const city = gurdwara?.city || '';
  const key = name ? `${name}|${city}` : '';
  const [state, setState] = useState({ key: '', status: 'idle', data: null, error: '' });
  const [attempt, setAttempt] = useState(0); // bumped by retry()

  useEffect(() => {
    if (!key) return undefined;
    let cancelled = false;
    setState({ key, status: 'loading', data: null, error: '' });
    gurdwaraApi.history(apiString, { name, city })
      .then((data) => {
        if (!cancelled) setState({ key, status: data?.found ? 'found' : 'missing', data: data || null, error: '' });
      })
      .catch((error) => {
        if (!cancelled) setState({ key, status: 'error', data: null, error: failureMessage(error) });
      });
    return () => { cancelled = true; };
  }, [apiString, name, city, key, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  // The answer belongs to the Gurdwara asked for now, or it isn't shown yet
  const current = state.key === key ? state : { status: key ? 'loading' : 'idle', data: null, error: '' };
  return { status: current.status, data: current.data, error: current.error, retry };
};

export default useGurdwaraHistory;
