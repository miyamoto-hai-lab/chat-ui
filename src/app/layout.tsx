import { I18nProvider } from '@/components/providers/I18nProvider';
import { SettingsProvider } from '@/components/providers/SettingsProvider';
import { Toaster } from '@/components/ui/sonner';
import { env } from '@/lib/env';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: env.appTitle,
  description: env.appDescription || 'Chat UI for LLM interactions',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <I18nProvider>
          <SettingsProvider>
            {children}
            <Toaster />
          </SettingsProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
