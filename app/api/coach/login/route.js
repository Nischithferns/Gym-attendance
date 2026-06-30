import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const COOKIE = 'coach_session';

// POST /api/coach/login  { pin }
// On a correct PIN, sets an httpOnly session cookie. The PIN itself never
// gets stored in browser-readable JavaScript storage.
export async function POST(req) {
  let body = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const expected = process.env.COACH_PIN;
  if (!expected) {
    return NextResponse.json(
      { ok: false, message: 'COACH_PIN is not configured on the server.' },
      { status: 500 }
    );
  }

  if (String(body.pin) !== String(expected)) {
    return NextResponse.json(
      { ok: false, message: 'Incorrect PIN.' },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, String(expected), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12, // 12 hours
  });
  return res;
}

// POST to /api/coach/login/logout is not used; logout clears via this DELETE.
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
