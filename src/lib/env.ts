import { z } from 'zod';

// 環境変数のスキーマ定義
const envSchema = z.object({
  // UI設定の制御
  NEXT_PUBLIC_ALLOW_USER_API_SERVER: z.string().default('true'),
  NEXT_PUBLIC_ALLOW_USER_SYSTEM_PROMPT: z.string().default('true'),
  NEXT_PUBLIC_ALLOW_EXPORT: z.string().default('true'),
  NEXT_PUBLIC_ALLOW_USER_SHOW_THINKING: z.string().default('true'),

  // デフォルト値と固定値
  NEXT_PUBLIC_DEFAULT_API_SERVER: z.string().default(''),
  NEXT_PUBLIC_DEFAULT_API_KEY: z.string().default(''),
  NEXT_PUBLIC_SYSTEM_PROMPT: z.string().default(''),

  // チャット動作の制御
  NEXT_PUBLIC_STARTING_ROLE: z.enum(['user', 'assistant']).default('assistant'),
  NEXT_PUBLIC_MAX_CHAT_TURNS: z.string().default('0'),
  NEXT_PUBLIC_DISPLAY_CHAT_TURNS: z.string().default('OFF'),
  NEXT_PUBLIC_ASSISTANT_RESPONSE_MODE: z
    .enum(['streaming', 'spinner', 'read', 'instant'])
    .default('streaming'),

  // 研究・実験用設定
  NEXT_PUBLIC_ENABLE_PASSWORD_AUTH: z.string().default('false'),
  NEXT_PUBLIC_ENABLED_EVENTS: z.string().default(''),
  NEXT_PUBLIC_EVENT_ENDPOINT_URL: z.string().default(''),

  // UI・その他
  NEXT_PUBLIC_APP_TITLE: z.string().default('Chat UI'),
  NEXT_PUBLIC_APP_DESCRIPTION: z.string().default(''),
  NEXT_PUBLIC_REDIRECT_URL_ON_EXIT: z.string().default(''),
  NEXT_PUBLIC_EXPORT_FILENAME_STRATEGY: z
    .string()
    .default('chat_{YYYYMMDDHHmmss}.json'),
  NEXT_PUBLIC_ASSISTANT_DISPLAY_NAME: z.string().default('Assistant'),
});

// 環境変数を解析
const rawEnv = {
  NEXT_PUBLIC_ALLOW_USER_API_SERVER:
    process.env.NEXT_PUBLIC_ALLOW_USER_API_SERVER,
  NEXT_PUBLIC_ALLOW_USER_SYSTEM_PROMPT:
    process.env.NEXT_PUBLIC_ALLOW_USER_SYSTEM_PROMPT,
  NEXT_PUBLIC_ALLOW_EXPORT: process.env.NEXT_PUBLIC_ALLOW_EXPORT,
  NEXT_PUBLIC_ALLOW_USER_SHOW_THINKING:
    process.env.NEXT_PUBLIC_ALLOW_USER_SHOW_THINKING,
  NEXT_PUBLIC_DEFAULT_API_SERVER: process.env.NEXT_PUBLIC_DEFAULT_API_SERVER,
  NEXT_PUBLIC_DEFAULT_API_KEY: process.env.NEXT_PUBLIC_DEFAULT_API_KEY,
  NEXT_PUBLIC_SYSTEM_PROMPT: process.env.NEXT_PUBLIC_SYSTEM_PROMPT,
  NEXT_PUBLIC_STARTING_ROLE: process.env.NEXT_PUBLIC_STARTING_ROLE,
  NEXT_PUBLIC_MAX_CHAT_TURNS: process.env.NEXT_PUBLIC_MAX_CHAT_TURNS,
  NEXT_PUBLIC_DISPLAY_CHAT_TURNS: process.env.NEXT_PUBLIC_DISPLAY_CHAT_TURNS,
  NEXT_PUBLIC_ASSISTANT_RESPONSE_MODE:
    process.env.NEXT_PUBLIC_ASSISTANT_RESPONSE_MODE,
  NEXT_PUBLIC_ENABLE_PASSWORD_AUTH:
    process.env.NEXT_PUBLIC_ENABLE_PASSWORD_AUTH,
  NEXT_PUBLIC_ENABLED_EVENTS: process.env.NEXT_PUBLIC_ENABLED_EVENTS,
  NEXT_PUBLIC_EVENT_ENDPOINT_URL: process.env.NEXT_PUBLIC_EVENT_ENDPOINT_URL,
  NEXT_PUBLIC_APP_TITLE: process.env.NEXT_PUBLIC_APP_TITLE,
  NEXT_PUBLIC_APP_DESCRIPTION: process.env.NEXT_PUBLIC_APP_DESCRIPTION,
  NEXT_PUBLIC_REDIRECT_URL_ON_EXIT:
    process.env.NEXT_PUBLIC_REDIRECT_URL_ON_EXIT,
  NEXT_PUBLIC_EXPORT_FILENAME_STRATEGY:
    process.env.NEXT_PUBLIC_EXPORT_FILENAME_STRATEGY,
  NEXT_PUBLIC_ASSISTANT_DISPLAY_NAME:
    process.env.NEXT_PUBLIC_ASSISTANT_DISPLAY_NAME,
};

const parsedEnv = envSchema.parse(rawEnv);

// 型安全な環境変数アクセス
export const env = {
  // UI設定の制御
  allowUserApiServer: parsedEnv.NEXT_PUBLIC_ALLOW_USER_API_SERVER === 'true',
  allowUserSystemPrompt:
    parsedEnv.NEXT_PUBLIC_ALLOW_USER_SYSTEM_PROMPT === 'true',
  allowExport: parsedEnv.NEXT_PUBLIC_ALLOW_EXPORT === 'true',
  allowUserShowThinking:
    parsedEnv.NEXT_PUBLIC_ALLOW_USER_SHOW_THINKING === 'true',

  // デフォルト値と固定値
  defaultApiServer: parsedEnv.NEXT_PUBLIC_DEFAULT_API_SERVER,
  defaultApiKey: parsedEnv.NEXT_PUBLIC_DEFAULT_API_KEY,
  systemPrompt: parsedEnv.NEXT_PUBLIC_SYSTEM_PROMPT,

  // チャット動作の制御
  startingRole: parsedEnv.NEXT_PUBLIC_STARTING_ROLE,
  maxChatTurns: Number.parseInt(parsedEnv.NEXT_PUBLIC_MAX_CHAT_TURNS, 10),
  displayChatTurns: parsedEnv.NEXT_PUBLIC_DISPLAY_CHAT_TURNS,
  assistantResponseMode: parsedEnv.NEXT_PUBLIC_ASSISTANT_RESPONSE_MODE,

  // 研究・実験用設定
  enablePasswordAuth: parsedEnv.NEXT_PUBLIC_ENABLE_PASSWORD_AUTH === 'true',
  enabledEvents: parsedEnv.NEXT_PUBLIC_ENABLED_EVENTS.split(',').filter(
    (e) => e.trim() !== ''
  ),
  eventEndpointUrl: parsedEnv.NEXT_PUBLIC_EVENT_ENDPOINT_URL,

  // UI・その他
  appTitle: parsedEnv.NEXT_PUBLIC_APP_TITLE,
  appDescription: parsedEnv.NEXT_PUBLIC_APP_DESCRIPTION,
  redirectUrlOnExit: parsedEnv.NEXT_PUBLIC_REDIRECT_URL_ON_EXIT,
  exportFilenameStrategy: parsedEnv.NEXT_PUBLIC_EXPORT_FILENAME_STRATEGY,
  assistantDisplayName: parsedEnv.NEXT_PUBLIC_ASSISTANT_DISPLAY_NAME,
};

export type Env = typeof env;
