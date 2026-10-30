/**
 * hooks/useGurdwaraHistory.js
 * -----------------------------------------------------------------------------
 * React hook that loads one Gurdwara's history and photo live from Wikipedia
 * and Wikimedia Commons, through the server (api/gurdwaraApi.js). Used by
 * the finder (the Gurdwara picked from the results) and the history page.
 *
 *   const history = useGurdwaraHistory(apiString, gurdwara); // a Gurdwara from the finder, or null
 *   history.status   'idle' (no Gurdwara) | 'loading' | 'found' | 'missing' | 'error'
 *   history.data     the server's answer, when found or missing
 *   history.error    a message to show, when status is 'error'
 *   history.retry()  ask again after an error
 *
 * When the Gurdwara changes (another one is picked, or a new search), the
 * previous Gurdwara's history is never shown while the new one loads.
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
  const key = gurdwara?.name ? `${gurdwara.id || ''}|${gurdwara.name}|${gurdwara.city || ''}` : '';
  const [state, setState] = useState({ key: '', status: 'idle', data: null, error: '' });
  const [attempt, setAttempt] = useState(0); // bumped by retry()

  useEffect(() => {
    if (!key) return undefined;
    let cancelled = false;
    setState({ key, status: 'loading', data: null, error: '' });
    gurdwaraApi.history(apiString, gurdwara)
      .then((data) => {
        if (!cancelled) setState({ key, status: data?.found ? 'found' : 'missing', data: data || null, error: '' });
      })
      .catch((error) => {
        if (!cancelled) setState({ key, status: 'error', data: null, error: failureMessage(error) });
      });
    return () => { cancelled = true; };
    // The Gurdwara object may be re-created on each render; its key says when it really changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiString, key, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  // The answer belongs to the Gurdwara asked for now, or it isn't shown yet
  const current = state.key === key ? state : { status: key ? 'loading' : 'idle', data: null, error: '' };
  return { status: current.status, data: current.data, error: current.error, retry };
};

export default useGurdwaraHistory;
