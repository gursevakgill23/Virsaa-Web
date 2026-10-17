/**
 * api/picturesApi.js
 * -----------------------------------------------------------------------------
 * The website's pictures and their credits (Django collections API).
 *
 *   picturesApi.siteImages(api)  { 'home-gurbani': { url, alt, width, height, credit }, ... }
 *   picturesApi.credits(api)     [{ title, used_on, image, credit, license_url, source_url }, ...]
 *
 * The pictures are real photos and paintings stored in our S3 bucket (the
 * loader picks them from Wikimedia Commons with their licences); only the
 * logo and the page headers stay in public/images. Both calls are public and
 * never send a token. Used by hooks/useSiteImages.js and the Picture credits page.
 * -----------------------------------------------------------------------------
 */
import axios from 'axios';
import { safeUrl } from '../utils/safeUrl';

const base = (apiString) =>
  `${(apiString || process.env.REACT_APP_API_URL || '').replace(/\/$/, '')}/collections`;

const TIMEOUT_MS = 15000;

/** Keep only well-formed entries with an http(s) picture address. */
const cleanImages = (images) => {
  const out = {};
  Object.entries(images && typeof images === 'object' ? images : {}).forEach(([key, value]) => {
    const url = safeUrl(value?.url, { allowRelative: false });
    if (url) out[key] = { ...value, url };
  });
  return out;
};

export const picturesApi = {
  siteImages: (api) =>
    axios.get(`${base(api)}/site-images/`, { timeout: TIMEOUT_MS }).then((r) => cleanImages(r.data?.images)),
  credits: (api) =>
    axios.get(`${base(api)}/picture-credits/`, { timeout: TIMEOUT_MS })
      .then((r) => (Array.isArray(r.data?.pictures) ? r.data.pictures : [])),
};

export default picturesApi;
