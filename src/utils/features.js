/**
 * utils/features.js
 * -----------------------------------------------------------------------------
 * Switches for features that aren't open to everyone yet.
 *
 * EBOOK_AUDIO_FOR_EVERYONE: the audiobooks Google's Punjabi voice makes from
 * the ebooks (the ebook page's Listen, and those audiobooks' own pages).
 *   false  Listen shows "Coming soon"; staff accounts can already play them,
 *          to check them first
 *   true   everyone can listen
 * -----------------------------------------------------------------------------
 */
export const EBOOK_AUDIO_FOR_EVERYONE = false;

/** Can this visitor play the audiobooks made from ebooks? (userData from useAuth) */
export const canPlayEbookAudio = (userData) => EBOOK_AUDIO_FOR_EVERYONE || Boolean(userData?.is_staff);
