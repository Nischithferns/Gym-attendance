// Client-safe time formatter (browser). Uses a public timezone var so it can
// run in "use client" components. Falls back to Asia/Kolkata.

const TZ = process.env.NEXT_PUBLIC_GYM_TZ || 'Asia/Kolkata';

export function gymTimeLabel(iso) {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: TZ,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(iso));
  } catch {
    return null;
  }
}
