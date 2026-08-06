import type { Metadata, Viewport } from 'next';
import { Archivo, IBM_Plex_Mono } from 'next/font/google';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { SiteCursor } from '@/components/site-cursor';
import { SITE_ORIGIN } from '@/lib/config';
import './globals.css';

/**
 * Archivo carries display and body from one family via its width axis: wide
 * and heavy for signage-scale headings, normal for reading. Plex Mono handles
 * every readout, parameter, and code block — an engineering face for the parts
 * of the page that are instrumentation.
 */
const display = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-display',
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: 'CursorKit — custom cursors in one script tag',
    template: '%s · CursorKit',
  },
  description:
    'Hand-built cursor styles, click effects and hover transforms across ten categories. Paste one line into any site and the cursor is yours.',
  openGraph: {
    title: 'CursorKit',
    description: 'Custom cursors in one script tag. No npm, no build step.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0d13',
};

/**
 * Applies a stored light-theme choice before first paint. Dark is the CSS
 * default, so only the light case needs to run early — which keeps this to one
 * statement and avoids a flash for the majority.
 */
const THEME_BOOT = `try{if(localStorage.ck_theme==='light')document.documentElement.dataset.theme='light'}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body className="min-h-screen antialiased">
        <SiteCursor>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[2147483001] focus:bg-signal focus:px-4 focus:py-2 focus:text-sm focus:text-[var(--signal-ink)]"
          >
            Skip to content
          </a>
          <Header />
          <main id="main">{children}</main>
          <Footer />
        </SiteCursor>
      </body>
    </html>
  );
}
