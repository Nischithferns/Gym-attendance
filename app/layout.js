import './globals.css';

export const metadata = {
  title: 'Gym Attendance',
  description: 'Scan to mark your gym attendance.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0d0d0f',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
