/**
 * utils/inApp.js
 * -----------------------------------------------------------------------------
 * Whether this page is open inside the Virsaa iPhone app (the app shows the
 * games as website pages). The app marks its pages before the site starts, by
 * saving "virsaa:in-app" = "ios" in the page's storage.
 *
 * Inside the app nothing is sold (App Store rules for reader apps): no Buy coins
 * buttons, no coin shop, no prices. Coins are still earned by playing.
 *
 *   import { IN_APP } from '../../utils/inApp';
 *   {!IN_APP && <button>Buy coins</button>}
 * -----------------------------------------------------------------------------
 */
export const IN_APP = (() => {
  try {
    return window.localStorage.getItem('virsaa:in-app') === 'ios';
  } catch {
    return false;
  }
})();
