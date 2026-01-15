import { HeartbeatManager } from '@/components/HeartbeatManager';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { I18nProvider } from '@/components/providers/I18nProvider';
import { SettingsProvider } from '@/components/providers/SettingsProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';
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

// メタデータ生成関数（動的な設定値を反映するため）
export async function generateMetadata(): Promise<Metadata> {
  const title = __APP_CONFIG__.app.title || 'Chat UI';
  const descriptionVal = __APP_CONFIG__.app.description;
  const description = typeof descriptionVal === 'object' ? descriptionVal.contents : (descriptionVal || '');
  const basePath = __APP_CONFIG__.base_path && __APP_CONFIG__.base_path !== '/' ? __APP_CONFIG__.base_path : '';

  return {
    title: title,
    description: description,
    manifest: `${basePath}/manifest.webmanifest`, // Next.jsが生成するパス
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: title,
    },
    // アイコン設定
    // base_pathを考慮してパスを設定
    icons: {
      icon: [
        { url: `${basePath}/favicon.png`, type: 'image/png' },
        { url: `${basePath}/favicon.ico`, type: 'image/x-icon' },
      ],
      apple: [
        { url: `${basePath}/favicon.png`, type: 'image/png' },
      ],
    },
  };
}

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
        <ThemeProvider>
          <I18nProvider>
            <SettingsProvider>
              <AuthProvider>
                {children}
                <HeartbeatManager />
                <Toaster />
              </AuthProvider>
            </SettingsProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
