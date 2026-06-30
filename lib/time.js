// Timezone-aware date/time helpers so "today" matches the gym's local day,
// not the UTC clock of the Vercel server.

const TZ = process.env.GYM_TZ || 'Asia/Kolkata';

// Returns the gym-local calendar date as "YYYY-MM-DD".
export function gymDateKey(date = new Date()) {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

// Formats an ISO timestamp as a friendly local time, e.g. "6:42 PM".
export function gymTimeLabel(iso) {
  if (!iso) return null;
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso));
}

export { TZ as GYM_TZ };
