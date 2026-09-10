import type { Metadata } from 'next';
import { Figtree, JetBrains_Mono } from 'next/font/google';
import { Footer } from '@/components/Footer';
import './globals.css';

// next/font downloads these at BUILD time and serves them from our own
// origin, so the page makes no request to Google at runtime. That is what
// spec §5.3 is protecting — the privacy notice can stay short because there
// is no third-party request to disclose.
const figtree = Figtree({
  subsets: ['latin'],
  weight: ['400', '600', '800'],
  variable: '--font-figtree',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://getbarrel.co.za'),
  title: 'Barrel — buy fuel at today’s price',
  description:
    'Buy fuel at today’s price and use it later. Barrel is being built in South Africa. Join the waitlist.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Barrel — buy fuel at today’s price',
    description: 'Buy fuel at today’s price and use it later. Join the waitlist.',
    images: ['/og.png'],
    locale: 'en_ZA',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA" className={`${figtree.variable} ${mono.variable}`}>
      <body>
        {children}
        <Footer />
      </body>
    </html>
  );
}
