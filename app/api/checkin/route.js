import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { gymDateKey } from '@/lib/time';

export const dynamic = 'force-dynamic';

const MIN_GAP_MIN = Number(process.env.MIN_GAP_MINUTES ?? 1);

// Keep only digits; treat last 10 digits as the canonical number so that
// "+91 98765 43210", "098765 43210" and "9876543210" all match.
function normalizePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function result(status, client, extra = {}) {
  return NextResponse.json({
    status,
    client: client ? { id: client.id, name: client.name } : null,
    ...extra,
  });
}

// POST /api/checkin
// Body: { clientId?, phone?, name? }
//
// Resolution order:
//   1. clientId (returning member, recognised by their phone's browser token)
//   2. phone    (fallback when the token is gone, or first ever scan)
//        - phone found  -> existing member, re-link
//        - phone new + name given -> create member (first-time registration)
//        - phone new, no name     -> ask for name  (status: need_name)
//   3. nothing  -> ask for phone (status: need_phone)
//
// Attendance for the gym-local day:
//   no record         -> create with check_in   (status: in)
//   record, no out    -> set check_out          (status: out)
//   record, both set  -> already done           (status: done)
export async function POST(req) {
  let body = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const { clientId, name } = body;
  const phone = normalizePhone(body.phone);

  const sb = supabaseAdmin();

  // ── 1. Resolve the member ───────────────────────────────────────────────
  let client = null;

  if (clientId) {
    const { data } = await sb
      .from('clients')
      .select('id, name, phone')
      .eq('id', clientId)
      .maybeSingle();
    if (data) client = data;
  }

  if (!client && phone) {
    if (phone.length < 10) {
      return result('error', null, {
        message: 'Please enter a valid 10-digit mobile number.',
      });
    }

    const { data: existing } = await sb
      .from('clients')
      .select('id, name, phone')
      .eq('phone', phone)
      .maybeSingle();

    if (existing) {
      client = existing;
    } else if (name && name.trim()) {
      const { data: created, error } = await sb
        .from('clients')
        .insert({ name: name.trim(), phone })
        .select('id, name, phone')
        .single();
      if (error) {
        return result('error', null, {
          message: 'Could not save your details. Please try again.',
        });
      }
      client = created;
    } else {
      // Phone is new -> first-time registration needs a name.
      return result('need_name');
    }
  }

  if (!client) {
    return result('need_phone');
  }

  // ── 2. Mark attendance for today ────────────────────────────────────────
  const dateKey = gymDateKey();

  const { data: rec } = await sb
    .from('attendance')
    .select('id, check_in, check_out')
    .eq('client_id', client.id)
    .eq('date', dateKey)
    .maybeSingle();

  // First scan of the day -> check IN.
  if (!rec) {
    const now = new Date().toISOString();
    const { error } = await sb
      .from('attendance')
      .insert({ client_id: client.id, date: dateKey, check_in: now });
    if (error) {
      // Unique-constraint race: another scan landed first. Re-read and continue.
      const { data: again } = await sb
        .from('attendance')
        .select('id, check_in, check_out')
        .eq('client_id', client.id)
        .eq('date', dateKey)
        .maybeSingle();
      if (again) {
        return result('done', client, {
          checkIn: again.check_in,
          checkOut: again.check_out,
        });
      }
      return result('error', null, {
        message: 'Could not record attendance. Please try again.',
      });
    }
    return result('in', client, { checkIn: now });
  }

  // Already checked in but not out -> check OUT (with accidental-double-scan guard).
  if (!rec.check_out) {
    const gapMs = Date.now() - new Date(rec.check_in).getTime();
    if (MIN_GAP_MIN > 0 && gapMs < MIN_GAP_MIN * 60_000) {
      return result('already_in', client, { checkIn: rec.check_in });
    }
    const now = new Date().toISOString();
    await sb.from('attendance').update({ check_out: now }).eq('id', rec.id);
    return result('out', client, { checkIn: rec.check_in, checkOut: now });
  }

  // Both In and Out already set -> third (or later) scan.
  return result('done', client, {
    checkIn: rec.check_in,
    checkOut: rec.check_out,
  });
}
