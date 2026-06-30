import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { gymDateKey } from '@/lib/time';

export const dynamic = 'force-dynamic';

const COOKIE = 'coach_session';

function authed() {
  const expected = process.env.COACH_PIN;
  const session = cookies().get(COOKIE)?.value;
  return Boolean(expected) && session === String(expected);
}

// GET /api/coach/data?date=YYYY-MM-DD
// Returns the attendance list for that gym-day, joined with member name + phone.
export async function GET(req) {
  if (!authed()) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || gymDateKey();

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('attendance')
    .select('check_in, check_out, clients ( name, phone )')
    .eq('date', date)
    .order('check_in', { ascending: true });

  if (error) {
    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 500 }
    );
  }

  const records = (data || []).map((r) => ({
    name: r.clients?.name || 'Unknown',
    phone: r.clients?.phone || '',
    checkIn: r.check_in,
    checkOut: r.check_out,
  }));

  return NextResponse.json({ ok: true, date, records });
}
