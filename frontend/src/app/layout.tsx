import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { APP_CONFIG } from '@/lib/constants';

// ✅ Optimized font loading for better performance on old PCs
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Show fallback font immediately, then swap when Inter loads
  preload: true,
  fallback: ['system-ui', 'arial'], // System font fallback for instant text display
  adjustFontFallback: true, // Reduce layout shift when font loads
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} - Register for Exhibitions`,
  description: 'Register for upcoming exhibitions and events. Simple, fast, and secure registration process.',
  keywords: ['exhibition', 'registration', 'events', 'visitor registration'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* ✅ Preconnect to Google Fonts for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <QueryProvider>
            {children}
            <ToastProvider />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
