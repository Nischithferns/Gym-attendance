'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

// Printable, one-time QR. Encodes this site's own URL, so scanning it with
// Google Lens (or any camera) opens the attendance page in the phone browser.
export default function QrPage() {
  const canvasRef = useRef(null);
  const [url, setUrl] = useState('');

  useEffect(() => {
    const origin = window.location.origin;
    setUrl(origin);
    QRCode.toCanvas(canvasRef.current, origin, {
      width: 320,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });
  }, []);

  return (
    <main className="screen">
      <div
        className="card"
        style={{ textAlign: 'center', background: '#fff', color: '#111' }}
      >
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
          {process.env.NEXT_PUBLIC_GYM_NAME || 'Gym'} Attendance
        </div>
        <p style={{ color: '#555', marginTop: 0, fontSize: 14 }}>
          Scan with your phone camera or Google Lens to check in / out
        </p>
        <div
          style={{
            display: 'inline-block',
            padding: 16,
            background: '#fff',
            borderRadius: 14,
          }}
        >
          <canvas ref={canvasRef} />
        </div>
        <p style={{ color: '#888', fontSize: 12, wordBreak: 'break-all' }}>{url}</p>
        <button
          className="btn"
          style={{ marginTop: 8 }}
          onClick={() => window.print()}
        >
          🖨️ Print this QR
        </button>
        <p style={{ color: '#999', fontSize: 12, marginTop: 14 }}>
          Print once and paste it at the reception desk.
        </p>
      </div>
    </main>
  );
}
