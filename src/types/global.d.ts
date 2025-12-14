import { AppConfig } from "./config"; // 前回提案したAppConfig型をimport

declare global {
  // Webpackによって置換されるグローバル定数の定義
  const __APP_CONFIG__: AppConfig;
}

export { };
