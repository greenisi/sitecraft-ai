import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { ToastProvider } from '@/providers/toast-provider';
import { SpotlightTour } from '@/components/tour/spotlight-tour';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Innovated Marketing | AI-Powered Website Generator',
  description:
    'Create production-ready websites by chatting with AI. No code, no templates, no limits.',
  metadataBase: new URL('https://app.innovated.marketing'),
  openGraph: {
    title: 'Innovated Marketing',
    description: 'Create production-ready websites by chatting with AI',
    url: 'https://app.innovated.marketing',
    siteName: 'Innovated Marketing',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'Innovated Marketing - AI Website Builder',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Innovated Marketing',
    description: 'Create production-ready websites by chatting with AI',
    images: ['/api/og'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <QueryProvider>
            {children}
            <ToastProvider />
              <SpotlightTour />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
