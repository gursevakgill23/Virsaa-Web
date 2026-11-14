/**
 * components/SocialSignIn/SocialSignIn.jsx
 * -----------------------------------------------------------------------------
 * "Continue with Google" for the Login and Signup pages.
 *
 * It opens Google's own popup (Google Identity Services), so Virsaa never sees
 * the password. The popup gives an access token; the server checks it with
 * Google before signing the person in, or making their account the first time
 * (POST /api/auth/login/google/).
 *
 * Google's script loads when the page opens, so the popup can open straight
 * from the click (browsers block popups opened later).
 *
 * Build settings (Cloudflare build variables):
 *   REACT_APP_GOOGLE_CLIENT_ID    the Google OAuth web client id
 * Without it, the button says that Google sign-in isn't available yet.
 * -----------------------------------------------------------------------------
 */
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { FaGoogle } from 'react-icons/fa';
import { toast } from '../../utils/notify';
import { describeApiError } from '../../utils/apiError';
import { devError } from '../../utils/devLog';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

/** Adds a script once; resolves when it has loaded. */
const loadScript = (src, id) => new Promise((resolve, reject) => {
  const existing = document.getElementById(id);
  if (existing) {
    if (existing.dataset.loaded) resolve();
    else {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', reject);
    }
    return;
  }
  const script = document.createElement('script');
  script.id = id;
  script.src = src;
  script.async = true;
  script.defer = true;
  script.onload = () => { script.dataset.loaded = '1'; resolve(); };
  script.onerror = reject;
  document.body.appendChild(script);
});

let googleReady = null;
const loadGoogle = () => {
  if (!googleReady) {
    googleReady = loadScript('https://accounts.google.com/gsi/client', 'google-gsi');
    googleReady.catch(() => { googleReady = null; });
  }
  return googleReady;
};

/**
 * @param apiString     the API's address
 * @param onResult      gets the server's answer: {access, refresh, user} or {two_factor_required, challenge, ...}
 * @param rememberMe    keep the person signed in on this device
 * @param styles        the page's CSS module (socialLogin, socialButton)
 * @param isDarkMode    for the toasts
 */
const SocialSignIn = ({ apiString, onResult, rememberMe = true, styles, isDarkMode }) => {
  const [busy, setBusy] = useState('');
  const googleClient = useRef(null);
  const toastTheme = isDarkMode ? 'dark' : 'light';

  // Load Google's script now, so the popup can open straight from the click
  useEffect(() => {
    if (GOOGLE_CLIENT_ID) loadGoogle().catch(() => {});
  }, []);

  const send = async (provider, accessToken) => {
    setBusy(provider);
    try {
      const response = await axios.post(`${apiString}/api/auth/login/${provider}/`,
        { access_token: accessToken, remember_me: rememberMe }, { timeout: 20000 });
      if (!response.data?.two_factor_required && !response.data?.access) throw new Error('Unexpected sign-in reply');
      onResult(response.data, rememberMe);
    } catch (error) {
      devError(`${provider} sign-in error:`, error.response?.status || error.message);
      toast.error(error.response?.data?.error || describeApiError(error, 'Sign in didn’t finish. Please try again.'),
        { position: 'top-center', autoClose: 6000, theme: toastTheme });
    } finally {
      setBusy('');
    }
  };

  const notReady = () => toast.info('Google sign-in isn’t available yet. Use your email for now.',
    { position: 'top-center', theme: toastTheme });

  const google = () => {
    const accounts = window.google?.accounts?.oauth2;
    if (!GOOGLE_CLIENT_ID) {
      notReady();
      return;
    }
    if (!accounts) {
      loadGoogle().catch(() => {});
      toast.info('Google is still loading. Try again in a moment.', { position: 'top-center', theme: toastTheme });
      return;
    }
    if (!googleClient.current) {
      googleClient.current = accounts.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'openid email profile',
        callback: (answer) => {
          if (answer?.access_token) send('google', answer.access_token);
        },
        error_callback: () => {},   // closed the popup: nothing to say
      });
    }
    googleClient.current.requestAccessToken({ prompt: 'select_account' });
  };

  return (
    <div className={styles.socialLogin}>
      <button type="button" className={styles.socialButton} onClick={google} disabled={!!busy}>
        <FaGoogle aria-hidden="true" /> {busy ? 'Signing in…' : 'Continue with Google'}
      </button>
    </div>
  );
};

export default SocialSignIn;

/** The fields the website keeps about the signed-in person (AuthContext). */
export const authUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  first_name: user.first_name,
  last_name: user.last_name,
  profile_photo: user.profile_photo,
  membership_level: user.membership_level,
  last_logined: user.last_logined,
  joined_date: user.joined_date,
  theme_preference: user.theme_preference,
});
