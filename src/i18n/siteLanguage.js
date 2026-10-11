/*
 * Whole-site translation with Google's website translator.
 * No translation files: the page is translated in the browser when someone picks a language.
 *
 * - English visitors never load Google's script.
 * - The choice is kept in the "googtrans" cookie (Google reads it) and in localStorage.
 * - Anything inside an element with class="notranslate" (or translate="no") stays as written,
 *   e.g. Gurbani, game boards and the Virsaa name.
 */

export const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ', short: 'ਪੰ' },
  { code: 'fr', label: 'Français', short: 'FR' },
];

const STORAGE_KEY = 'virsaa:language';
const SOURCE = 'en';

const readCookie = () => {
  const match = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
  if (!match) return null;
  const code = decodeURIComponent(match[1]).split('/').pop();
  return LANGUAGES.some((l) => l.code === code) ? code : null;
};

export const getLanguage = () => {
  let saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch { /* storage blocked */ }
  return readCookie() || (LANGUAGES.some((l) => l.code === saved) ? saved : SOURCE);
};

const writeCookie = (value, expires) => {
  const host = window.location.hostname;
  const base = `googtrans=${value}; path=/; expires=${expires}`;
  document.cookie = base;
  // Google sometimes sets it on the domain as well, so clear/set both
  if (host.includes('.')) document.cookie = `${base}; domain=${host}`;
  if (host.split('.').length > 2) document.cookie = `${base}; domain=.${host.split('.').slice(-2).join('.')}`;
};

export const setLanguage = (code) => {
  if (!LANGUAGES.some((l) => l.code === code) || code === getLanguage()) return;
  try { localStorage.setItem(STORAGE_KEY, code); } catch { /* storage blocked */ }
  if (code === SOURCE) {
    writeCookie('', 'Thu, 01 Jan 1970 00:00:00 GMT');
  } else {
    writeCookie(`/${SOURCE}/${code}`, 'Fri, 31 Dec 2099 23:59:59 GMT');
  }
  // Reloading is the most reliable way to switch: Google translates the fresh page
  window.location.reload();
};

/*
 * Google wraps translated text in <font> tags. When React later removes or moves
 * those nodes it can crash ("Failed to execute 'removeChild' on 'Node'").
 * This known workaround makes those calls safe. Only used while a translation is active.
 */
const patchDomForTranslation = () => {
  if (typeof Node !== 'function' || Node.prototype.__virsaaPatched) return;
  const { removeChild, insertBefore } = Node.prototype;
  Node.prototype.removeChild = function patchedRemoveChild(child) {
    if (child.parentNode !== this) return child;
    return removeChild.apply(this, arguments); // eslint-disable-line prefer-rest-params
  };
  Node.prototype.insertBefore = function patchedInsertBefore(newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) return newNode;
    return insertBefore.apply(this, arguments); // eslint-disable-line prefer-rest-params
  };
  Node.prototype.__virsaaPatched = true;
};

const loadGoogleTranslate = () => {
  if (document.getElementById('google-translate-script')) return;
  const holder = document.createElement('div');
  holder.id = 'google_translate_element';
  holder.style.display = 'none';
  document.body.appendChild(holder);

  window.googleTranslateElementInit = () => {
    // eslint-disable-next-line no-new
    new window.google.translate.TranslateElement(
      { pageLanguage: SOURCE, includedLanguages: LANGUAGES.map((l) => l.code).join(','), autoDisplay: false },
      'google_translate_element'
    );
  };

  const script = document.createElement('script');
  script.id = 'google-translate-script';
  script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  script.async = true;
  document.body.appendChild(script);
};

// Called once from index.js
export const initSiteLanguage = () => {
  const code = getLanguage();
  document.documentElement.lang = code;
  if (code === SOURCE) return;
  // localStorage remembered a language but the cookie was cleared: restore it
  if (!readCookie()) writeCookie(`/${SOURCE}/${code}`, 'Fri, 31 Dec 2099 23:59:59 GMT');
  patchDomForTranslation();
  loadGoogleTranslate();
};
