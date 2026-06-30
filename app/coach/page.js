'use client';

import { useEffect, useState, useCallback } from 'react';
import { gymTimeLabel } from '@/lib/timeClient';

// Today's date as YYYY-MM-DD in the gym timezone (for the date input default).
function todayKey() {
  const tz = process.env.NEXT_PUBLIC_GYM_TZ || 'Asia/Kolkata';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export default function CoachPage() {
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [date, setDate] = useState(todayKey());
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const [pendingDelete, setPendingDelete] = useState(null); // record awaiting confirm
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (d) => {
    setLoading(true);
    setError('');
    try {
      const r = await fetch(`/api/coach/data?date=${d}`, { cache: 'no-store' });
      if (r.status === 401) {
        setAuthed(false);
        return;
      }
      const data = await r.json();
      if (data.ok) {
        setRecords(data.records);
        setAuthed(true);
      } else {
        setError(data.message || 'Could not load attendance.');
      }
    } catch {
      setError('Network problem. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Try loading on mount; if the session cookie is valid we skip the PIN screen.
  useEffect(() => {
    load(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload whenever the date changes (only once authed).
  useEffect(() => {
    if (authed) load(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function onLogin(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/coach/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await r.json();
      if (data.ok) {
        setPin('');
        setAuthed(true);
        load(date);
      } else {
        setError(data.message || 'Incorrect PIN.');
      }
    } catch {
      setError('Network problem. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function onLogout() {
    await fetch('/api/coach/login', { method: 'DELETE' });
    setAuthed(false);
    setRecords([]);
  }

  async function confirmDelete() {
    const rec = pendingDelete;
    if (!rec) return;
    setDeleting(true);
    try {
      const r = await fetch('/api/coach/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rec.id }),
      });
      const data = await r.json();
      if (data.ok) {
        // Remove locally for an instant update, then refresh from server.
        setRecords((prev) => prev.filter((x) => x.id !== rec.id));
        setPendingDelete(null);
        load(date);
      } else {
        setError(data.message || 'Could not delete. Please try again.');
        setPendingDelete(null);
      }
    } catch {
      setError('Network problem. Please try again.');
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  // ── PIN screen ──
  if (!authed) {
    return (
      <main className="screen">
        <div className="card">
          <div className="brand">
            <span className="logo">🔒</span>
            <h1>Coach Login</h1>
            <p>Enter your passcode to view attendance</p>
          </div>
          <form onSubmit={onLogin}>
            {error && <div className="error">{error}</div>}
            <div className="field">
              <label htmlFor="pin">Passcode</label>
              <input
                id="pin"
                type="password"
                inputMode="numeric"
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                autoFocus
              />
            </div>
            <button className="btn" disabled={busy}>
              {busy ? 'Checking…' : 'View Attendance'}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // ── Dashboard ──
  const present = records.length;
  const checkedOut = records.filter((r) => r.checkOut).length;
  const stillIn = present - checkedOut;

  return (
    <main className="screen" style={{ justifyContent: 'flex-start', paddingTop: 28 }}>
      <div className="toolbar">
        <h1>Attendance</h1>
        <div className="datepick">
          <input
            type="date"
            value={date}
            max={todayKey()}
            onChange={(e) => setDate(e.target.value)}
          />
          <button className="btn ghost" style={{ width: 'auto', padding: '10px 14px' }} onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="stat-strip">
        <div className="stat">
          <div className="n">{present}</div>
          <div className="l">Present</div>
        </div>
        <div className="stat">
          <div className="n">{stillIn}</div>
          <div className="l">Still In</div>
        </div>
        <div className="stat">
          <div className="n">{checkedOut}</div>
          <div className="l">Left</div>
        </div>
      </div>

      {loading ? (
        <div className="empty">
          <div className="spinner" />
        </div>
      ) : records.length === 0 ? (
        <div className="empty">No attendance recorded for this date.</div>
      ) : (
        <div className="list">
          {records.map((r) => (
            <div className="row" key={r.id}>
              <div className="avatar">{(r.name || '?').charAt(0).toUpperCase()}</div>
              <div className="who">
                <div className="nm">{r.name}</div>
                <div className="ph">{r.phone}</div>
              </div>
              <div className="times">
                <div className="pair">
                  <span className="tag in">In {gymTimeLabel(r.checkIn)}</span>
                </div>
                <div className="pair" style={{ marginTop: 5 }}>
                  {r.checkOut ? (
                    <span className="tag out">Out {gymTimeLabel(r.checkOut)}</span>
                  ) : (
                    <span className="tag pending">In gym</span>
                  )}
                </div>
              </div>
              <button
                className="del-btn"
                title="Delete this attendance"
                aria-label={`Delete attendance for ${r.name}`}
                onClick={() => setPendingDelete(r)}
              >
                🗑
              </button>
            </div>
          ))}
        </div>
      )}

      {pendingDelete && (
        <div
          className="modal-overlay"
          onClick={() => !deleting && setPendingDelete(null)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Are you sure?</h3>
            <p>This attendance record will be deleted.</p>
            <div className="modal-actions">
              <button
                className="btn ghost"
                disabled={deleting}
                onClick={() => setPendingDelete(null)}
              >
                Cancel
              </button>
              <button
                className="btn danger"
                disabled={deleting}
                onClick={confirmDelete}
              >
                {deleting ? 'Deleting…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
