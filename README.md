# Gym Attendance

A dead-simple, install-free attendance system for a gym.

- 🧾 **One-time QR** printed at reception. Members scan it with **Google Lens / any phone camera** — no app to install.
- 🙋 **First scan ever:** member enters name + mobile number (stored for next time).
- ⚡ **Next scans:** instantly recorded — no details asked (remembered in their phone's browser; phone-number fallback if that's cleared).
- 🟢🔵 **Twice a day:** 1st scan = **In time**, 2nd scan = **Out time**. 3rd scan shows *"Your attendance has been recorded."*
- 👮 **Coach view (PIN-protected):** see who's present today with name, number, In time, Out time — and pick **any past date**.

Built with **Next.js (App Router) + Supabase (Postgres)**, deployable free on **Vercel**.

---

## How it works

| Page | URL | Who |
|------|-----|-----|
| Scan / check-in | `/` | Members (QR points here) |
| Coach dashboard | `/coach` | Coach / owner (PIN) |
| Printable QR | `/qr` | Print once, paste at reception |

The QR simply encodes the site's home URL. Google Lens opens it in the browser,
which talks to a server API that decides In / Out / already-done. All member
phone numbers live in Supabase and are only ever read on the server.

---

## Setup (≈10 minutes)

### 1. Create the database (Supabase — free)

1. Go to <https://supabase.com> → **New project**.
2. Open **SQL Editor → New query**, paste the contents of [`supabase-schema.sql`](./supabase-schema.sql), and **Run**.
3. Go to **Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** secret key → `SUPABASE_SERVICE_ROLE_KEY` (keep this private)

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

| Variable | Meaning |
|----------|---------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key (server only) |
| `COACH_PIN` | Passcode the coach types to view attendance |
| `GYM_NAME` / `NEXT_PUBLIC_GYM_NAME` | Display name |
| `GYM_TZ` / `NEXT_PUBLIC_GYM_TZ` | Timezone, e.g. `Asia/Kolkata` (decides what "today" means) |
| `MIN_GAP_MINUTES` | Min minutes between In and Out (guards accidental double-scans). `0` to disable. |

### 3. Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000> (member view) and <http://localhost:3000/coach> (coach).

### 4. Deploy to Vercel

1. Push this folder to a GitHub repo.
2. On <https://vercel.com> → **New Project** → import the repo.
3. Add every variable from `.env.local` under **Settings → Environment Variables**.
4. Deploy. You'll get a URL like `https://your-gym.vercel.app`.

### 5. Print the QR

Visit `https://your-gym.vercel.app/qr`, click **Print**, and paste it at reception. Done.

---

## Notes & limitations

- **Returning-member recognition** uses the phone's browser storage. If a member
  clears their browser data or uses a different phone, they're asked for their
  mobile number once to re-link — no full re-registration.
- **"Today"** is computed in `GYM_TZ`, so the day rolls over at local midnight
  regardless of where the server runs.
- The coach PIN is a shared passcode held in an httpOnly cookie for 12 hours.
  For a single gym this is plenty; swap in full auth later if you need per-user logins.
