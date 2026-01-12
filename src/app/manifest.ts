import { AppConfig } from '@/types/config';
import { MetadataRoute } from 'next';

// グローバル定数の型定義を確実にするため
declare const __APP_CONFIG__: AppConfig;

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  const config = __APP_CONFIG__;
  const basePath = config.base_path || '/';

  // アイコンパスの決定ロジック
  // ユーザーが `favicon.png` を配置したとのことなので、それを優先します。
  const iconPath = '/favicon.png'; 

  return {
    name: config.app.title,
    short_name: config.app.title,
    description: "LLMと話せるチャットアプリ",
    start_url: basePath,
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      {
        src: iconPath,
        sizes: 'any',
        type: 'image/png',
      },
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      }
    ],
  };
}
