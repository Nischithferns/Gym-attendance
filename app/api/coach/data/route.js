import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { gymDateKey } from '@/lib/time';
import { coachAuthed } from '@/lib/coachAuth';

export const dynamic = 'force-dynamic';

// GET /api/coach/data?date=YYYY-MM-DD
// Returns the attendance list for that gym-day, joined with member name + phone.
export async function GET(req) {
  if (!coachAuthed()) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || gymDateKey();

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from('attendance')
    .select('id, check_in, check_out, clients ( name, phone )')
    .eq('date', date)
    .order('check_in', { ascending: true });

  if (error) {
    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 500 }
    );
  }

  const records = (data || []).map((r) => ({
    id: r.id,
    name: r.clients?.name || 'Unknown',
    phone: r.clients?.phone || '',
    checkIn: r.check_in,
    checkOut: r.check_out,
  }));

  return NextResponse.json({ ok: true, date, records });
}
