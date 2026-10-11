/*
 * Decides whether a user's profile is complete.
 * Matches the backend's CompleteProfileSerializer rules: every field below is
 * required, and "prefer_not_to_say" is the default (i.e. "not chosen yet").
 */

const hasText = (value) => typeof value === 'string' ? value.trim() !== '' : value != null;

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

export const isProfileComplete = (profile) => missingProfileFields(profile).length === 0;
