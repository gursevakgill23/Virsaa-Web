/**
 * pages/Profile/profileStatus.js
 * -----------------------------------------------------------------------------
 * Helpers that decide whether a user's profile is complete. Used by
 * ProfileRoute (CompleteProfile vs MyProfile) and the navbar.
 * -----------------------------------------------------------------------------
 *
 * Decides whether a user's profile is complete.
 * Matches the backend's CompleteProfileSerializer rules: every field below is
 * required, and "prefer_not_to_say" is the default (i.e. "not chosen yet").
 */

// True for a non-empty string, or any other value that isn't null/undefined
const hasText = (value) => typeof value === 'string' ? value.trim() !== '' : value != null;

// preferred_content may arrive as an array or as a JSON string; always return an array
const toList = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

// One check per required field
export const PROFILE_CHECKS = {
  first_name: (p) => hasText(p.first_name),
  last_name: (p) => hasText(p.last_name),
  profile_photo: (p) => hasText(p.profile_photo),
  about_me: (p) => hasText(p.about_me),
  preferred_content: (p) => toList(p.preferred_content).length > 0,
  dob: (p) => hasText(p.dob),
  gender: (p) => hasText(p.gender) && p.gender !== 'prefer_not_to_say',
};

/** Names of the fields that still need filling in. */
export const missingProfileFields = (profile) => {
  if (!profile) return Object.keys(PROFILE_CHECKS);
  return Object.entries(PROFILE_CHECKS)
    .filter(([, check]) => !check(profile))
    .map(([field]) => field);
};

/** True when nothing is missing. */
export const isProfileComplete = (profile) => missingProfileFields(profile).length === 0;
