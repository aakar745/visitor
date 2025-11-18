import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { APP_CONFIG } from '@/lib/constants';

const inter = Inter({ subsets: ['latin'] });

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
      <body className={inter.className}>
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
