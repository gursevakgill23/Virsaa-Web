/**
 * components/AdSlot/AdSlot.jsx
 * -----------------------------------------------------------------------------
 * One Google AdSense display ad, in the page's flow (responsive width).
 *
 *   <AdSlot />                       the default ad unit
 *   <AdSlot slot="1234567890" />     a specific ad unit
 *
 * Who sees ads: signed-out visitors and the Free and Basic plans. Standard and
 * Premium are ad-free (as the plans promise). Never on Gurbani, Hukamnama,
 * account or checkout pages: those pages simply don't include an <AdSlot />.
 *
 * Google's script only loads when the first ad is shown, so members and the
 * pages without ads never load it.
 *
 * Build settings (Cloudflare build variables):
 *   REACT_APP_ADSENSE_CLIENT   your publisher id, "ca-pub-1234567890123456"
 *   REACT_APP_ADSENSE_SLOT     the ad unit id (AdSense > Ads > By ad unit > Display ads)
 * Without them nothing shows, so the site works the same until AdSense approves it.
 * -----------------------------------------------------------------------------
 */
import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './AdSlot.module.css';

const CLIENT = process.env.REACT_APP_ADSENSE_CLIENT || '';
const DEFAULT_SLOT = process.env.REACT_APP_ADSENSE_SLOT || '';
const AD_FREE = /standard|premium/i;
// Pages that never show ads, whatever they include
const NO_ADS = [/^\/gurbani/, /hukamnama/, /^\/(my-|account|checkout|payment|login|signup|premium)/];

let scriptAdded = false;
function loadScript() {
  if (scriptAdded || !CLIENT) return;
  scriptAdded = true;
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(CLIENT)}`;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
}

const AdSlot = ({ slot = DEFAULT_SLOT, className = '' }) => {
  const { isLoggedIn, isLoading, userData } = useAuth();
  const { pathname } = useLocation();
  const pushed = useRef(false);
  const adFree = isLoggedIn && AD_FREE.test(String(userData?.membership_level || ''));
  const show = Boolean(CLIENT && slot) && !isLoading && !adFree && !NO_ADS.some((rule) => rule.test(pathname));

  useEffect(() => {
    if (!show || pushed.current) return;
    loadScript();
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch { /* blocked by an ad blocker: nothing to do */ }
  }, [show]);

  if (!show) return null;
  return (
    <aside className={`${styles.wrap} ${className}`} aria-label="Advertisement">
      <span className={styles.label}>Advertisement</span>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
};

export default AdSlot;
