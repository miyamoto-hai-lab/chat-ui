import fs from "fs";
import yaml from "js-yaml";
import type { NextConfig } from 'next';
import path from "path";
import type { AppConfig } from './src/types/config';

// 1. YAMLファイルを読み込んでJSオブジェクトに変換
const configPath = path.join(__dirname, "config.yml");
console.error(`--- DEBUG: Loading config from ${configPath} ---`);
if (fs.existsSync(configPath)) {
  const rawContent = fs.readFileSync(configPath, "utf8");
  console.error("File content length:", rawContent.length);
  console.error("File content preview:\n", rawContent); // 中身を全部出す
} else {
  console.error("!!! FATAL: Config file does not exist !!!");
}
const fileContents = fs.readFileSync(configPath, "utf8");
const appConfig = yaml.load(fileContents) as AppConfig;

// YAMLの処理ロジック: file:// で始まる変数を読み込んで値を更新する
const processFileReferences = (obj: any): void => {
  for (const key in obj) {
    const value = obj[key];
    if (typeof value === 'string' && value.startsWith('file://')) {
      const filePath = value.replace('file://', '');
      try {
        obj[key] = fs.readFileSync(path.join(path.dirname(configPath), filePath), 'utf-8').trim();
      } catch (error) {
        console.warn(`Failed to load file for key ${key}: ${filePath}`, error);
      }
    } else if (typeof value === 'object' && value !== null) {
      processFileReferences(value);
    }
  }
};

processFileReferences(appConfig);

if (appConfig.base_path === "/") {
  appConfig.base_path = "";
}

const nextConfig: NextConfig = {
  output: 'export',
  basePath: appConfig.base_path || '',
  reactCompiler: true,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  webpack: (config, { webpack }) => {
    // 2. DefinePluginでグローバル変数を定義
    // 文字列化してから渡す
    config.plugins.push(
      new (webpack.DefinePlugin)({
        // クライアント側で __APP_CONFIG__ として参照できるようになる
        "__APP_CONFIG__": JSON.stringify(appConfig),
      })
    );

    return config;
  },
};

export default nextConfig;
