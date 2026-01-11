import { AppConfig } from "./config";

declare global {
  // Webpackによって置換されるグローバル定数の定義
  const __APP_CONFIG__: AppConfig;
  const __AVATAR_CONFIG__: {
    userAvatar: string | null;
    assistantAvatar: string | null;
  };
}

export { };

