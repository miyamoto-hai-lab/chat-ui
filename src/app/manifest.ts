import type { AppConfig } from '@/types/config';
import type { MetadataRoute } from 'next';

// グローバル定数の型定義を確実にするため
declare const __APP_CONFIG__: AppConfig;

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  const config = __APP_CONFIG__;
  const basePath = config.base_path && config.base_path !== '/' ? config.base_path : '';

  // アイコンパスの決定ロジック
  // base_pathがある場合はプレフィックスとして付与する
  const iconPrefix = basePath;

  return {
    name: config.app.title,
    short_name: config.app.title,
    description: "LLMと話せるチャットアプリ",
    start_url: basePath || '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      {
        src: `${iconPrefix}/favicon.png`,
        sizes: 'any',
        type: 'image/png',
      },
      {
        src: `${iconPrefix}/favicon.ico`,
        sizes: 'any',
        type: 'image/x-icon',
      }
    ],
  };
}
