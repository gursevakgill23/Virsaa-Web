/**
 * utils/apiError.js
 * -----------------------------------------------------------------------------
 * Turns a failed API request (axios error) into a short message a visitor can
 * act on. Used by the forms (login, sign-up, password reset, settings…) so
 * nobody ever sees raw text like "Network Error" or "Request failed with
 * status code 500".
 *
 *   catch (error) {
 *     toast.error(describeApiError(error, 'Sign in failed. Check your details and try again.'));
 *   }
 *
 * Order of preference:
 *   1. no reply at all            → connection message
 *   2. too many attempts (429)    → wait message
 *   3. server problem (5xx)       → "on our side" message
 *   4. a readable reason from the server (detail / error / message /
 *      non_field_errors / the first field error)
 *   5. the fallback passed in
 * -----------------------------------------------------------------------------
 */

// Longest server message we pass through; anything longer is replaced by the fallback
const MAX_LENGTH = 200;

// First string in a value that may be a string, an array of strings, or nested
const firstText = (value) => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(firstText).find(Boolean) || '';
  if (value && typeof value === 'object') return Object.values(value).map(firstText).find(Boolean) || '';
  return '';
};

/**
 * @param {unknown} error     what axios threw
 * @param {string}  fallback  message to use when nothing better is known
 * @returns {string}
 */
export const describeApiError = (error, fallback = 'Something went wrong. Try again.') => {
  const response = error?.response;

  // The request never got an answer: offline, blocked, timed out or server down
  if (!response) {
    if (error?.code === 'ECONNABORTED') return 'The server took too long to answer. Try again.';
    return 'Virsaa couldn’t be reached. Check your internet connection and try again.';
  }

  if (response.status === 429) return 'Too many attempts. Wait a minute, then try again.';
  if (response.status >= 500) return 'Something went wrong on our side. Try again in a moment.';

  const body = response.data;
  const reason = typeof body === 'string'
    ? '' // an HTML error page, not a message
    : firstText(body?.detail) || firstText(body?.error) || firstText(body?.message)
      || firstText(body?.non_field_errors) || firstText(body);

  return reason && reason.length <= MAX_LENGTH ? reason : fallback;
};

/**
 * Field errors from a Django REST Framework 400 reply, as { field: 'message' }.
 * `fieldMap` renames server fields to form fields, e.g. { confirm_password: 'confirmPassword' }.
 */
export const fieldErrors = (error, fieldMap = {}) => {
  const body = error?.response?.data;
  if (!body || typeof body !== 'object' || Array.isArray(body)) return {};
  return Object.fromEntries(
    Object.entries(body)
      .filter(([key]) => !['detail', 'error', 'message', 'non_field_errors', 'code'].includes(key))
      .map(([key, value]) => [fieldMap[key] || key, firstText(value)])
      .filter(([, value]) => value)
  );
};
