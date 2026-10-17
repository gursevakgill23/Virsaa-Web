/**
 * hooks/useSiteImages.js
 * -----------------------------------------------------------------------------
 * The website's pictures, by name, for any component:
 *
 *   const picture = useSitePicture('home-gurbani');
 *     -> { url, alt, width, height, credit } once known, otherwise null
 *   const pictures = useSiteImages();      -> every picture, {} until loaded
 *   backgroundOf(picture)                  -> style for a CSS background (or undefined)
 *
 * The names and what each picture shows are listed in the backend
 * (collections_api/site_images.py). The list is fetched once per visit and
 * shared by every page; it is also kept in this browser for 10 minutes, so
 * the next visit shows its pictures straight away. An empty list (the
 * pictures weren't in S3 yet, or the API couldn't be reached) is never kept:
 * the page asks again a minute later, so pictures appear as soon as they can.
 * Pages show a soft placeholder until a picture is known (see
 * components/SitePicture).
 * -----------------------------------------------------------------------------
 */
import { useEffect, useState } from 'react';
import { picturesApi } from '../api/picturesApi';

const STORAGE_KEY = 'virsaa:site-images:v2';   // v1 copies may hold an empty list: ignored
const FRESH_MS = 10 * 60 * 1000;   // fetch again after 10 minutes
const RETRY_MS = 60 * 1000;        // after a failed fetch, wait a minute before trying again

// ---------------------------------------------------------------- shared state (one copy for the whole app)
const readStored = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    const usable = saved && saved.images && typeof saved.images === 'object' && Object.keys(saved.images).length;
    return usable ? saved : null;
  } catch {
    return null; // storage blocked or the saved copy is unreadable
  }
};

let current = readStored();          // { images, at } | null
let pending = null;                  // the fetch in progress
let failedAt = 0;
let retryTimer = null;
const listeners = new Set();

const publish = (images) => listeners.forEach((listener) => listener(images));

// A page that is still open tries again a minute after a failed or empty answer
const retryLater = (apiString) => {
  failedAt = Date.now();
  if (retryTimer) return;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    if (listeners.size) fetchImages(apiString); // eslint-disable-line no-use-before-define
  }, RETRY_MS);
};

const fetchImages = (apiString) => {
  if (pending || Date.now() - failedAt < RETRY_MS) return;
  pending = picturesApi.siteImages(apiString)
    .then((images) => {
      if (!Object.keys(images).length) {
        retryLater(apiString); // nothing there yet: keep nothing, ask again in a minute
        return;
      }
      current = { images, at: Date.now() };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(current)); } catch { /* storage blocked */ }
      publish(images);
    })
    .catch(() => retryLater(apiString)) // pages keep their placeholders (or the saved copy) meanwhile
    .finally(() => { pending = null; });
};

// ---------------------------------------------------------------- hooks
/** Every website picture by name ({} until the list arrives). */
export const useSiteImages = (apiString) => {
  const [images, setImages] = useState(() => current?.images || {});

  useEffect(() => {
    listeners.add(setImages);
    if (current) setImages(current.images);
    if (!current || Date.now() - current.at > FRESH_MS) fetchImages(apiString);
    return () => { listeners.delete(setImages); };
  }, [apiString]);

  return images;
};

/** One website picture, or null while it isn't known (or hasn't been loaded into S3 yet). */
export const useSitePicture = (name, apiString) => {
  const images = useSiteImages(apiString);
  return (name && images[name]) || null;
};

/** Inline style that shows a picture as a CSS background. */
export const backgroundOf = (picture) =>
  (picture?.url ? { backgroundImage: `url("${picture.url.replace(/"/g, '%22')}")` } : undefined);

export default useSiteImages;
