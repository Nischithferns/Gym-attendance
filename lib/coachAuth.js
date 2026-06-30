import { cookies } from 'next/headers';

export const COACH_COOKIE = 'coach_session';

// True when the request carries a valid coach session cookie.
export function coachAuthed() {
  const expected = process.env.COACH_PIN;
  const session = cookies().get(COACH_COOKIE)?.value;
  return Boolean(expected) && session === String(expected);
}
