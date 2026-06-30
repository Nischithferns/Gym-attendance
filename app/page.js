'use client';

import { useEffect, useState } from 'react';
import { gymTimeLabel } from '@/lib/timeClient';

const TOKEN_KEY = 'gym_client_id';

export default function ScanPage() {
  // phase: 'loading' | 'phone' | 'name' | 'result' | 'error'
  const [phase, setPhase] = useState('loading');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState(null); // { status, client, checkIn, checkOut }

  // On load: if we remember this member in the browser, auto-mark attendance.
  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved) {
      submit({ clientId: saved });
    } else {
      setPhase('phone');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(payload) {
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      handle(data);
    } catch {
      setError('Network problem. Please check your connection and try again.');
      setPhase('phone');
    } finally {
      setBusy(false);
    }
  }

  function handle(data) {
    switch (data.status) {
      case 'need_phone':
        setPhase('phone');
        break;
      case 'need_name':
        setPhase('name');
        break;
      case 'in':
      case 'out':
      case 'done':
      case 'already_in':
        if (data.client?.id) localStorage.setItem(TOKEN_KEY, data.client.id);
        setRes(data);
        setPhase('result');
        break;
      case 'error':
      default:
        setError(data.message || 'Something went wrong. Please try again.');
        // Stay on whichever entry screen we were on.
        setPhase((p) => (p === 'loading' ? 'phone' : p));
        break;
    }
  }

  function onPhoneSubmit(e) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    submit({ phone: digits });
  }

  function onNameSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    submit({ phone: phone.replace(/\D/g, ''), name: name.trim() });
  }

  return (
    <main className="screen">
      <div className="card">
        <div className="brand">
          <span className="logo">🏋️</span>
          <h1>{process.env.NEXT_PUBLIC_GYM_NAME || 'Gym Attendance'}</h1>
          <p>Scan • Check In • Check Out</p>
        </div>

        {phase === 'loading' && (
          <div className="result">
            <div className="spinner" />
            <p className="msg">Marking your attendance…</p>
          </div>
        )}

        {phase === 'phone' && (
          <form onSubmit={onPhoneSubmit}>
            <h2 className="title">Welcome 👋</h2>
            <p className="subtitle">Enter your mobile number to continue.</p>
            {error && <div className="error">{error}</div>}
            <div className="field">
              <label htmlFor="phone">Mobile number</label>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoFocus
              />
            </div>
            <button className="btn" disabled={busy}>
              {busy ? 'Please wait…' : 'Continue'}
            </button>
          </form>
        )}

        {phase === 'name' && (
          <form onSubmit={onNameSubmit}>
            <h2 className="title">One-time setup</h2>
            <p className="subtitle">
              Looks like it's your first time. Tell us your name.
            </p>
            {error && <div className="error">{error}</div>}
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <button className="btn" disabled={busy}>
              {busy ? 'Saving…' : 'Save & Check In'}
            </button>
          </form>
        )}

        {phase === 'result' && res && <Result res={res} />}
      </div>
    </main>
  );
}

function Result({ res }) {
  const name = res.client?.name || 'Member';

  let badgeClass = 'done';
  let icon = '✓';
  let heading = '';
  let message = '';

  if (res.status === 'in') {
    badgeClass = 'in';
    icon = '✓';
    heading = `Welcome, ${name}!`;
    message = 'Your In time has been recorded. Have a great workout! 💪';
  } else if (res.status === 'out') {
    badgeClass = 'out';
    icon = '👋';
    heading = `See you, ${name}!`;
    message = 'Your Out time has been recorded. Well done today!';
  } else if (res.status === 'already_in') {
    badgeClass = 'in';
    icon = '✓';
    heading = `You're checked in, ${name}`;
    message = 'Scan again when you leave to record your Out time.';
  } else {
    // done
    badgeClass = 'done';
    icon = '✓';
    heading = 'Attendance has been recorded';
    message = `Thanks ${name}, your attendance for today is complete.`;
  }

  return (
    <div className="result">
      <div className={`badge ${badgeClass}`}>{icon}</div>
      <p className="name">{heading}</p>
      <p className="msg">{message}</p>
      <div className="timebox">
        <div className="slot">
          <div className="k">In</div>
          <div className="v">{gymTimeLabel(res.checkIn) || '—'}</div>
        </div>
        <div className="slot">
          <div className="k">Out</div>
          <div className="v">{gymTimeLabel(res.checkOut) || '—'}</div>
        </div>
      </div>
    </div>
  );
}
