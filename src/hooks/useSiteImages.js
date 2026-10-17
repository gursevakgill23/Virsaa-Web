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
 * shared by every page; it is also kept in this browser for 30 minutes, so
 * the next visit shows its pictures straight away. Pages show a soft
 * placeholder until a picture is known (see components/SitePicture).
 * -----------------------------------------------------------------------------
 */
import { useEffect, useState } from 'react';
import { picturesApi } from '../api/picturesApi';

const STORAGE_KEY = 'virsaa:site-images:v1';
const FRESH_MS = 30 * 60 * 1000;   // fetch again after 30 minutes
const RETRY_MS = 60 * 1000;        // after a failed fetch, wait a minute before trying again

// ---------------------------------------------------------------- shared state (one copy for the whole app)
const readStored = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return saved && typeof saved.images === 'object' ? saved : null;
  } catch {
    return null; // storage blocked or the saved copy is unreadable
  }
};

let current = readStored();          // { images, at } | null
let pending = null;                  // the fetch in progress
let failedAt = 0;
const listeners = new Set();

const publish = (images) => listeners.forEach((listener) => listener(images));

const fetchImages = (apiString) => {
  if (pending || Date.now() - failedAt < RETRY_MS) return;
  pending = picturesApi.siteImages(apiString)
    .then((images) => {
      current = { images, at: Date.now() };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(current)); } catch { /* storage blocked */ }
      publish(images);
    })
    .catch(() => { failedAt = Date.now(); }) // pages keep their placeholders (or the saved copy)
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
