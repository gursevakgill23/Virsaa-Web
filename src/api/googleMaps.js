/**
 * api/googleMaps.js
 * -----------------------------------------------------------------------------
 * Google Maps Platform in the browser, for the Gurdwara pages:
 *   - the Maps JavaScript API, loaded once, when a Gurdwara page first needs it
 *   - Places API (New): the Gurdwaras near a point, places as you type, and
 *     one Gurdwara's details (phone, website, opening hours)
 *
 * Set in Vercel (Settings → Environment Variables), then redeploy:
 *   REACT_APP_GOOGLE_MAPS_API_KEY  a browser key, restricted to this site's
 *                                  addresses and to "Maps JavaScript API" and
 *                                  "Places API (New)"
 *   REACT_APP_GOOGLE_MAP_ID        optional: a map ID from Google Cloud's Map
 *                                  Management (Google's demo ID otherwise)
 *
 *   googleMapsConfigured               is a key set?
 *   loadGoogleMaps()                   -> google.maps (rejects when it can't load)
 *   onKeyRejected(fn)                  fn() if Google refuses the key; returns "stop listening"
 *   findGurdwaras({ lat, lng })        -> [Gurdwara, ...] nearest first (up to 20)
 *   gurdwaraDetails(id, { contact })   -> one Gurdwara by its Google place ID
 *   gurdwaraContact(id)                -> { phone, website, opening_hours, hours_week, contact_loaded }
 *   newSearchSession()                 -> a token that groups one address search (billing)
 *   suggestPlaces(text, session)       -> [{ id, label, main, secondary, prediction }]
 *   placeFromSuggestion(suggestion)    -> { lat, lng, label }
 *   findPlace(text)                    -> { lat, lng, label } or null
 *   googleMapsSearchUrl(place)         Google Maps' own Gurdwara search there (no key needed)
 *
 * A Gurdwara is plain data, so it can travel with a link:
 *   { id, source: 'google', name, address, city, country, coordinates: [lat, lng],
 *     distance_km, google_url, photo: { url, credit, credit_url } | null }
 * and, once its details are loaded: phone, website, opening_hours, hours_week.
 *
 * Google's terms: its places are only shown on a Google map, or without a map
 * with "Google Maps" credited; a photo shows its author; nothing is kept
 * after the visit (answers are remembered in memory only).
 * -----------------------------------------------------------------------------
 */
import { distanceKm } from '../pages/GurdwaraAccess/gurdwaras';

const KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
export const MAP_ID = process.env.REACT_APP_GOOGLE_MAP_ID || 'DEMO_MAP_ID';
export const googleMapsConfigured = Boolean(KEY);

const CALLBACK = '__virsaaGoogleMapsLoaded';
const LANGUAGE = 'en';

// ---------------------------------------------------------------------------- loading
let loading = null;
let keyRejected = false;
const keyListeners = new Set();

export const onKeyRejected = (fn) => {
  if (keyRejected) fn();
  keyListeners.add(fn);
  return () => keyListeners.delete(fn);
};

export const loadGoogleMaps = () => {
  if (window.google?.maps?.importLibrary) return Promise.resolve(window.google.maps);
  if (!KEY) {
    console.warn('Google Maps: set REACT_APP_GOOGLE_MAPS_API_KEY to show the Gurdwara map and search.');
    return Promise.reject(new Error('no-key'));
  }
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      // Google calls this when it refuses the key (site not allowed, API not enabled, billing off)
      window.gm_authFailure = () => {
        keyRejected = true;
        keyListeners.forEach((fn) => fn());
      };
      window[CALLBACK] = () => {
        delete window[CALLBACK];
        resolve(window.google.maps);
      };
      const params = new URLSearchParams({ key: KEY, v: 'weekly', loading: 'async', callback: CALLBACK });
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
      script.async = true;
      script.onerror = () => {
        script.remove();
        loading = null;
        reject(new Error('Google Maps could not be loaded.'));
      };
      document.head.appendChild(script);
    });
  }
  return loading;
};

const libraries = new Map(); // name -> Promise of the library
const library = (name) => {
  if (!libraries.has(name)) {
    libraries.set(name, loadGoogleMaps()
      .then((maps) => maps.importLibrary(name))
      .catch((error) => {
        libraries.delete(name);
        throw error;
      }));
  }
  return libraries.get(name);
};

// One request per key at a time, remembered for this visit (a failure is forgotten, so "Try again" asks again)
const answers = new Map();
const once = (key, request) => {
  if (!answers.has(key)) {
    answers.set(key, request().catch((error) => {
      answers.delete(key);
      throw error;
    }));
  }
  return answers.get(key);
};

// ---------------------------------------------------------------------------- Gurdwaras
// Billing: the search uses Text Search Pro fields; phone, website and hours are
// asked for one Gurdwara at a time (Place Details Enterprise), only on its pages.
const SEARCH_FIELDS = ['id', 'displayName', 'formattedAddress', 'location', 'addressComponents',
  'googleMapsURI', 'businessStatus', 'types', 'photos'];
const PLACE_FIELDS = ['displayName', 'formattedAddress', 'location', 'addressComponents', 'googleMapsURI', 'photos'];
const CONTACT_FIELDS = ['internationalPhoneNumber', 'nationalPhoneNumber', 'websiteURI', 'regularOpeningHours'];
const SEARCH_RADIUS_M = 50000; // the largest Google allows; nearer ones come first

// Google has no "gurdwara" type, so the search is for the word, and the answers are checked:
// a Gurdwara by name, or a place of worship that isn't a church, mosque or temple
const GURDWARA_NAME = /gurd|gurud|sikh|ਗੁਰਦੁਆਰ|ਗੁਰੂਦੁਆਰ|ਸਿੱਖ|गुरुद्वार|गुरद्वार|सिख/i;
const OTHER_FAITHS = ['church', 'mosque', 'hindu_temple', 'synagogue', 'buddhist_temple', 'shinto_shrine'];

const isGurdwara = (place) => {
  const types = Array.isArray(place.types) ? place.types : [];
  if (place.businessStatus === 'CLOSED_PERMANENTLY') return false;
  if (!types.includes('establishment') && !types.includes('place_of_worship')) return false; // e.g. "Gurdwara Road"
  if (GURDWARA_NAME.test(place.displayName || '')) return true;
  return types.includes('place_of_worship') && !types.some((type) => OTHER_FAITHS.includes(type));
};

const part = (place, type) => (Array.isArray(place.addressComponents) ? place.addressComponents : [])
  .find((c) => Array.isArray(c.types) && c.types.includes(type))?.longText || '';

// The first photo, with the credit Google asks for (the photo's author)
const photoOf = (place) => {
  const photo = Array.isArray(place.photos) ? place.photos[0] : null;
  if (!photo || typeof photo.getURI !== 'function') return null;
  const author = (Array.isArray(photo.authorAttributions) ? photo.authorAttributions : [])[0] || {};
  return {
    url: photo.getURI({ maxWidth: 1200, maxHeight: 900 }),
    credit: String(author.displayName || ''),
    credit_url: String(author.uri || ''),
  };
};

const toGurdwara = (place, origin = null) => {
  const lat = place.location?.lat?.();
  const lng = place.location?.lng?.();
  if (!place.id || !place.displayName || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const coordinates = [lat, lng];
  return {
    id: place.id,
    source: 'google',
    name: String(place.displayName),
    address: String(place.formattedAddress || ''),
    city: part(place, 'locality') || part(place, 'postal_town') || part(place, 'administrative_area_level_2'),
    country: part(place, 'country'),
    coordinates,
    distance_km: origin ? distanceKm([origin.lat, origin.lng], coordinates) : null,
    google_url: String(place.googleMapsURI || ''),
    photo: photoOf(place),
  };
};

// "Every day, 5:00 AM – 9:00 PM" when all seven days are the same, else '' (hours_week has each day)
const hoursOf = (place) => {
  const week = (Array.isArray(place.regularOpeningHours?.weekdayDescriptions)
    ? place.regularOpeningHours.weekdayDescriptions : []).filter((line) => typeof line === 'string' && line);
  const times = week.map((line) => line.slice(line.indexOf(':') + 1).trim());
  const same = week.length === 7 && times.every((t) => t && t === times[0]);
  let summary = '';
  if (same) summary = /24 hours/i.test(times[0]) ? 'Open 24 hours, every day' : `Every day, ${times[0]}`;
  return { opening_hours: summary, hours_week: week };
};

const contactOf = (place) => ({
  phone: String(place.internationalPhoneNumber || place.nationalPhoneNumber || ''),
  website: String(place.websiteURI || ''),
  ...hoursOf(place),
  contact_loaded: true,
});

/** The Gurdwaras nearest to { lat, lng }, nearest first. */
export const findGurdwaras = ({ lat, lng }) => {
  const spot = `${Number(lat).toFixed(3)},${Number(lng).toFixed(3)}`;
  return once(`near|${spot}`, async () => {
    const places = await library('places');
    const { places: found } = await places.Place.searchByText({
      textQuery: 'gurdwara',
      fields: SEARCH_FIELDS,
      locationBias: { center: { lat, lng }, radius: SEARCH_RADIUS_M },
      rankPreference: places.SearchByTextRankPreference?.DISTANCE || 'DISTANCE',
      maxResultCount: 20,
      language: LANGUAGE,
    });
    return (Array.isArray(found) ? found : [])
      .filter(isGurdwara)
      .map((place) => toGurdwara(place, { lat, lng }))
      .filter(Boolean)
      .sort((a, b) => a.distance_km - b.distance_km);
  });
};

/** One Gurdwara by its place ID; with { contact: true } also its phone, website and hours. */
export const gurdwaraDetails = (id, { contact = false } = {}) => once(`place|${id}|${contact}`, async () => {
  const { Place } = await library('places');
  const place = new Place({ id, requestedLanguage: LANGUAGE });
  await place.fetchFields({ fields: contact ? [...PLACE_FIELDS, ...CONTACT_FIELDS] : PLACE_FIELDS });
  const gurdwara = toGurdwara(place);
  return gurdwara && contact ? { ...gurdwara, ...contactOf(place) } : gurdwara;
});

/** Just the phone, website and opening hours, for a Gurdwara already on screen. */
export const gurdwaraContact = (id) => once(`contact|${id}`, async () => {
  const { Place } = await library('places');
  const place = new Place({ id, requestedLanguage: LANGUAGE });
  await place.fetchFields({ fields: CONTACT_FIELDS });
  return contactOf(place);
});

/** Was this a "no such place" answer from Google (a wrong or very old place ID)? */
export const isPlaceNotFound = (error) => /NOT_FOUND|INVALID_ARGUMENT|INVALID_REQUEST/i
  .test(`${error?.code || ''} ${error?.message || ''}`);

// ---------------------------------------------------------------------------- addresses, worldwide
/** A token grouping the suggestions of one search and the place picked (Google bills it as one). */
export const newSearchSession = async () => {
  const { AutocompleteSessionToken } = await library('places');
  return new AutocompleteSessionToken();
};

const text = (formattable) => String(formattable?.text ?? formattable ?? '');

export const suggestPlaces = async (input, session) => {
  const query = String(input || '').trim().slice(0, 120);
  if (query.length < 3) return [];
  const { AutocompleteSuggestion } = await library('places');
  const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
    input: query,
    sessionToken: session || undefined,
    language: LANGUAGE,
  });
  return (Array.isArray(suggestions) ? suggestions : [])
    .map((s) => s.placePrediction)
    .filter(Boolean)
    .slice(0, 6)
    .map((p) => ({ id: p.placeId, label: text(p.text), main: text(p.mainText), secondary: text(p.secondaryText), prediction: p }))
    .filter((s) => s.label);
};

const pointOf = (place, label) => {
  const lat = place?.location?.lat?.();
  const lng = place?.location?.lng?.();
  return Number.isFinite(lat) && Number.isFinite(lng)
    ? { lat, lng, label: label || String(place.formattedAddress || place.displayName || '') }
    : null;
};

export const placeFromSuggestion = async (suggestion) => {
  const place = suggestion.prediction.toPlace();
  await place.fetchFields({ fields: ['location', 'formattedAddress'] });
  return pointOf(place, suggestion.label);
};

export const findPlace = async (input) => {
  const textQuery = String(input || '').trim().slice(0, 200);
  if (!textQuery) return null;
  const { Place } = await library('places');
  const { places } = await Place.searchByText({
    textQuery, fields: ['location', 'formattedAddress', 'displayName'], maxResultCount: 1, language: LANGUAGE,
  });
  return Array.isArray(places) && places[0] ? pointOf(places[0]) : null;
};

/** Google Maps' own search for Gurdwaras around a place, for when the map here can't load. */
export const googleMapsSearchUrl = (place) => {
  const near = !place?.label || place.label === 'your location' ? 'me' : place.label;
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: '1', query: `gurdwaras near ${near}` }).toString()}`;
};
