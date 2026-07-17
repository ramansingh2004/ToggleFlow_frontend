import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { AppProvider } from '@/providers/app-provider';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),

  title: {
    default: 'ToggleFlow — Feature Release Control',
    template: '%s | ToggleFlow',
  },

  description:
    'A developer-first platform for feature flags, gradual rollouts, environments, experiments, targeting, and release analytics.',

  applicationName: 'ToggleFlow',

  keywords: [
    'feature flags',
    'feature management',
    'gradual rollout',
    'A/B testing',
    'developer tools',
    'release management',
    'feature toggles',
  ],

  creator: 'ToggleFlow',
  publisher: 'ToggleFlow',
  category: 'Developer Tools',

  alternates: {
    canonical: '/',
  },

  icons: {
    icon: '/toggleflow-icon.svg',
    shortcut: '/toggleflow-icon.svg',
    apple: '/toggleflow-icon.svg',
  },

  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'ToggleFlow',
    title: 'ToggleFlow — Feature Release Control',
    description:
      'Ship features safely with flags, deterministic rollouts, targeting, experiments, and analytics.',
  },

  twitter: {
    card: 'summary',
    title: 'ToggleFlow — Feature Release Control',
    description: 'Developer-first feature flags and release infrastructure.',
  },

  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'dark',
  themeColor: '#050505',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} dark`}
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
