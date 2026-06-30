import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { coachAuthed } from '@/lib/coachAuth';

export const dynamic = 'force-dynamic';

// POST /api/coach/delete  { id }
// Removes one attendance record (a member's In/Out for a given day). After this
// the member can scan again that day and a fresh In time is recorded.
// PIN-protected via the coach session cookie.
export async function POST(req) {
  if (!coachAuthed()) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let body = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const id = body.id;
  if (!id) {
    return NextResponse.json(
      { ok: false, message: 'Missing attendance id.' },
      { status: 400 }
    );
  }

  const sb = supabaseAdmin();
  const { error } = await sb.from('attendance').delete().eq('id', id);

  if (error) {
    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
