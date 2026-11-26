/**
 * utils/hukamnamaDay.js
 * -----------------------------------------------------------------------------
 * Which day's Hukamnama to show, where the reader is. Sri Darbar Sahib reads it
 * at about 5:30 AM India time, so a new one is due at 4:00 AM local time, but
 * never before 6:00 AM in India (the same rule as the apps' notifications):
 *
 *   Toronto 4:00 AM · India 6:00 AM · Dubai 4:30 AM · Sydney 11:30 AM
 *
 * Before that time it's still yesterday's (local date).
 *
 *   hukamnamaDate(now?)   -> 'YYYY-MM-DD', the local day whose Hukamnama to show
 *   hukamnamaTime(now?)   -> { hour, minute }, when today's is due here
 * -----------------------------------------------------------------------------
 */
const LOCAL_HOUR = 4;
const INDIA_HOUR = 6;
const INDIA_OFFSET_MINUTES = 330; // India is UTC+5:30 all year

const pad = (n) => String(n).padStart(2, '0');
const localDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const hukamnamaTime = (now = new Date()) => {
  // 6:00 AM in India on this local date, as a moment, then read in local time
  const indiaSix = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), INDIA_HOUR, 0) - INDIA_OFFSET_MINUTES * 60000
  );
  if (localDay(indiaSix) === localDay(now)) {
    const minutes = indiaSix.getHours() * 60 + indiaSix.getMinutes();
    if (minutes > LOCAL_HOUR * 60) return { hour: indiaSix.getHours(), minute: indiaSix.getMinutes() };
  }
  return { hour: LOCAL_HOUR, minute: 0 };
};

export const hukamnamaDate = (now = new Date()) => {
  const { hour, minute } = hukamnamaTime(now);
  const due = now.getHours() * 60 + now.getMinutes() >= hour * 60 + minute;
  if (due) return localDay(now);
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 12);
  return localDay(yesterday);
};
