import type { NextConfig } from 'next';
import fs from 'node:fs';
import path from 'node:path';

// 環境変数の処理ロジック: file:: で始まる変数を読み込んで process.env を更新する
for (const key in process.env) {
  const value = process.env[key];
  if (value && value.startsWith('file::')) {
    const filePath = value.replace('file::', '');
    try {
      const content = fs.readFileSync(path.join(process.cwd(), filePath), 'utf-8');
      process.env[key] = content;
    } catch (error) {
      console.warn(`Failed to load file for env ${key}: ${filePath}`, error);
      // フォールバック: 元の値をそのまま使う (何もしない)
    }
  }
}

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/chat',
  reactCompiler: true,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
