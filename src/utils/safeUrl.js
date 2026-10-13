/**
 * utils/safeUrl.js
 * -----------------------------------------------------------------------------
 * Guards for links whose address comes from data (the API, the URL bar or
 * sessionStorage) rather than from our own code.
 *
 * Why: an address like "javascript:alert(1)" placed in an <a href> runs code
 * when clicked, and "//evil.example" looks like a path but leaves the site.
 * Anything that doesn't pass these checks is dropped, and the link is either
 * hidden or replaced with a safe fallback.
 * -----------------------------------------------------------------------------
 */

/**
 * Returns `url` if it is a normal web link, otherwise ''.
 * Allowed: absolute http:// and https:// addresses, plus (by default) paths on
 * this site that start with a single "/".
 *   safeUrl('https://example.org/page')  → 'https://example.org/page'
 *   safeUrl('/files/nitnem.pdf')         → '/files/nitnem.pdf'
 *   safeUrl('javascript:alert(1)')       → ''
 *   safeUrl('//evil.example')            → ''
 */
export const safeUrl = (url, { allowRelative = true } = {}) => {
  if (typeof url !== 'string') return '';
  const value = url.trim();
  if (!value) return '';
  if (allowRelative && isInternalPath(value)) return value;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : '';
  } catch {
    return ''; // not a valid absolute URL
  }
};

/** Only absolute http(s) links to other sites (e.g. a Gurdwara's website). */
export const safeExternalUrl = (url) => safeUrl(url, { allowRelative: false });

/**
 * True for a path inside this site, such as "/collections/ebooks".
 * Rejects "//host" and "/\host" (browsers treat both as another site) and
 * anything with control characters.
 */
export const isInternalPath = (path) => typeof path === 'string'
  && path.startsWith('/')
  && !path.startsWith('//')
  && !path.startsWith('/\\')
  // eslint-disable-next-line no-control-regex
  && !/[\u0000-\u001f\u007f]/.test(path);

/** `path` if it is inside this site, otherwise `fallback` (default: no link). */
export const safeInternalPath = (path, fallback = '') => (isInternalPath(path) ? path : fallback);
