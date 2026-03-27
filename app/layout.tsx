import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'VoedingsTracker',
  description: 'Bijhoud je voeding, calorieën en macronutriënten.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#07070F',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>
        <main style={{ paddingBottom: '84px', minHeight: '100dvh' }}>
          {children}
        </main>
        <Navigation />
      </body>
    </html>
  );
}
