import { z } from 'zod';

// 空文字をundefinedに変換するプリプロセッサ
const emptyToUndefined = (val: unknown) => (val === '' ? undefined : val);

// 真偽値のような文字列をパースするヘルパー
// true/false, yes/no, on/off, enable/disable, enabled/disabled (case insensitive)
const booleanLikeSchema = z.preprocess(
  emptyToUndefined,
  z.string().transform((val) => {
    const lower = val.toLowerCase();
    if (['true', 'yes', 'on', 'enable', 'enabled'].includes(lower)) return true;
    if (['false', 'no', 'off', 'disable', 'disabled'].includes(lower)) return false;
    return Boolean(val); // Fallback
  }).optional()
);

// Enum値を小文字に正規化してパースするヘルパー
const preprocessEnum = <T extends string>(
  values: [T, ...T[]],
  defaultValue: T
) =>
  z.preprocess(
    (val) => (typeof val === 'string' && val !== '' ? val.toLowerCase() : emptyToUndefined(val)),
    z.enum(values).default(defaultValue)
  );

// 環境変数のスキーマ定義
const envSchema = z.object({
  // LLMの設定
  NEXT_PUBLIC_LLM_API_PROVIDER: preprocessEnum(
    ['openai', 'gemini', 'anthropic', 'grok', 'deepseek'],
    'openai'
  ).optional(),
  NEXT_PUBLIC_LLM_API_ENDPOINT: z.string().optional(),
  NEXT_PUBLIC_LLM_MODEL: z.string().optional(),
  NEXT_PUBLIC_LLM_API_KEY: z.string().optional(),
  NEXT_PUBLIC_LLM_SYSTEM_PROMPT: z.string().optional(),
  NEXT_PUBLIC_LLM_SHOW_THINKING: booleanLikeSchema,

  // 機能の許可設定 (デフォルト値を入力する形に変更)
  NEXT_PUBLIC_ALLOW_IMPORT: booleanLikeSchema,
  NEXT_PUBLIC_ALLOW_EXPORT: booleanLikeSchema,

  // チャット動作の制御
  NEXT_PUBLIC_STARTING_ROLE: preprocessEnum(['user', 'assistant'], 'assistant'),
  NEXT_PUBLIC_MAX_CHAT_TURNS: z.preprocess(
    emptyToUndefined,
    z.string().default('0')
  ),
  NEXT_PUBLIC_ON_MAX_CHAT_TURNS: preprocessEnum(['exit', 'message', 'nothing'], 'nothing'),
  NEXT_PUBLIC_ALLOW_USER_EXIT: preprocessEnum(['never', 'max', 'always'], 'always'),
  NEXT_PUBLIC_DISPLAY_CHAT_TURNS: z.preprocess(
    (val) => (typeof val === 'string' && val !== '' ? val.toUpperCase() : emptyToUndefined(val)),
    z.string().default('OFF')
  ),
  
  // レスポンス設定
  NEXT_PUBLIC_ASSISTANT_PROCESSING_STYLE: preprocessEnum(
    ['streaming', 'spinner', 'read', 'instant'],
    'streaming'
  ),
  NEXT_PUBLIC_ASSISTANT_RESPONSE_STYLE: preprocessEnum(['bubble', 'flat'], 'bubble'),

  // 研究・実験用設定
  NEXT_PUBLIC_AUTH_PASSWORD: z.string().optional(), // 空文字/false系なら認証不要
  NEXT_PUBLIC_ENABLED_EVENTS: z.preprocess(
    emptyToUndefined,
    z.string().default('')
  ),
  NEXT_PUBLIC_EVENT_ENDPOINT_URL: z.preprocess(
    emptyToUndefined,
    z.string().default('')
  ),

  // UI・その他
  NEXT_PUBLIC_APP_TITLE: z.preprocess(
    emptyToUndefined,
    z.string().default('Chat UI')
  ),
  NEXT_PUBLIC_APP_DESCRIPTION: z.preprocess(
    emptyToUndefined,
    z.string().default('')
  ),
  NEXT_PUBLIC_REDIRECT_URL_ON_EXIT: z.preprocess(
    emptyToUndefined,
    z.string().default('')
  ),
  NEXT_PUBLIC_EXPORT_FILENAME_STRATEGY: z.preprocess(
    emptyToUndefined,
    z.string().default('chat_{YYYYMMDDHHmmss}.json')
  ),
  NEXT_PUBLIC_ASSISTANT_DISPLAY_NAME: z.preprocess(
    emptyToUndefined,
    z.string().default('Assistant')
  ),
});

// 環境変数を解析
const rawEnv = {
  NEXT_PUBLIC_LLM_API_PROVIDER: process.env.NEXT_PUBLIC_LLM_API_PROVIDER,
  NEXT_PUBLIC_LLM_API_ENDPOINT: process.env.NEXT_PUBLIC_LLM_API_ENDPOINT,
  NEXT_PUBLIC_LLM_MODEL: process.env.NEXT_PUBLIC_LLM_MODEL,
  NEXT_PUBLIC_LLM_API_KEY: process.env.NEXT_PUBLIC_LLM_API_KEY,
  NEXT_PUBLIC_LLM_SYSTEM_PROMPT: process.env.NEXT_PUBLIC_LLM_SYSTEM_PROMPT,
  NEXT_PUBLIC_LLM_SHOW_THINKING: process.env.NEXT_PUBLIC_LLM_SHOW_THINKING,

  NEXT_PUBLIC_ALLOW_IMPORT: process.env.NEXT_PUBLIC_ALLOW_IMPORT,
  NEXT_PUBLIC_ALLOW_EXPORT: process.env.NEXT_PUBLIC_ALLOW_EXPORT,

  NEXT_PUBLIC_STARTING_ROLE: process.env.NEXT_PUBLIC_STARTING_ROLE,
  NEXT_PUBLIC_MAX_CHAT_TURNS: process.env.NEXT_PUBLIC_MAX_CHAT_TURNS,
  NEXT_PUBLIC_ON_MAX_CHAT_TURNS: process.env.NEXT_PUBLIC_ON_MAX_CHAT_TURNS,
  NEXT_PUBLIC_ALLOW_USER_EXIT: process.env.NEXT_PUBLIC_ALLOW_USER_EXIT,
  NEXT_PUBLIC_DISPLAY_CHAT_TURNS: process.env.NEXT_PUBLIC_DISPLAY_CHAT_TURNS,

  NEXT_PUBLIC_ASSISTANT_PROCESSING_STYLE:
    process.env.NEXT_PUBLIC_ASSISTANT_PROCESSING_STYLE ||
    process.env.NEXT_PUBLIC_ASSISTANT_RESPONSE_MODE, // 旧変数名への互換性考慮
  NEXT_PUBLIC_ASSISTANT_RESPONSE_STYLE:
    process.env.NEXT_PUBLIC_ASSISTANT_RESPONSE_STYLE,

  NEXT_PUBLIC_AUTH_PASSWORD:
    process.env.NEXT_PUBLIC_AUTH_PASSWORD ||
    process.env.NEXT_PUBLIC_ENABLE_PASSWORD_AUTH, // 旧変数名への互換性考慮
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

// ヘルパー関数: 値が設定されているか (固定値モードか)
// interactive という文字列が指定された場合、または未定義の場合は false (ユーザー設定許可)
// それ以外の場合は true (固定値)
const isFixed = (val: string | undefined) => {
  if (val === undefined || val === '' || val === 'interactive') return false;
  return true;
};

// パスワード認証が有効かどうか
// false系文字列の場合は無効
const isAuthEnabled = (val: string | undefined) => {
  if (!val) return false;
  const lower = val.toLowerCase();
  if (['false', 'off', 'disable', 'disabled'].includes(lower)) return false;
  return true;
};

// 型安全な環境変数アクセス
export const env = {
  // LLMの設定
  // 固定値が設定されている場合はそれを使う。されていない場合は空文字（UI側で入力させる）
  llmApiEndpoint: parsedEnv.NEXT_PUBLIC_LLM_API_ENDPOINT || '',
  llmModel: parsedEnv.NEXT_PUBLIC_LLM_MODEL || '',
  llmApiKey: parsedEnv.NEXT_PUBLIC_LLM_API_KEY || '',
  llmSystemPrompt: parsedEnv.NEXT_PUBLIC_LLM_SYSTEM_PROMPT || '',
  llmProvider: parsedEnv.NEXT_PUBLIC_LLM_API_PROVIDER,
  
  // UI表示制御 (固定値が設定されている = ユーザー変更不可 = UI非表示)
  allowUserProvider: !isFixed(parsedEnv.NEXT_PUBLIC_LLM_API_PROVIDER),
  allowUserApiServer: !isFixed(parsedEnv.NEXT_PUBLIC_LLM_API_ENDPOINT),
  allowUserModel: !isFixed(parsedEnv.NEXT_PUBLIC_LLM_MODEL),
  allowUserApiKey: !isFixed(parsedEnv.NEXT_PUBLIC_LLM_API_KEY),
  allowUserSystemPrompt: !isFixed(parsedEnv.NEXT_PUBLIC_LLM_SYSTEM_PROMPT),
  // Thinking表示設定: 値があれば固定、なければユーザー設定可
  allowUserShowThinking: !isFixed(process.env.NEXT_PUBLIC_LLM_SHOW_THINKING), 
  // Thinkingのデフォルト値 (固定値があればそれ、なければtrue)
  defaultShowThinking: parsedEnv.NEXT_PUBLIC_LLM_SHOW_THINKING ?? true,

  // Import/Export
  // 未定義or interactiveなら表示(true)、false系なら非表示(false)
  allowImport: parsedEnv.NEXT_PUBLIC_ALLOW_IMPORT ?? true,
  allowExport: parsedEnv.NEXT_PUBLIC_ALLOW_EXPORT ?? true,

  // チャット動作の制御
  startingRole: parsedEnv.NEXT_PUBLIC_STARTING_ROLE,
  maxChatTurns: Number.parseInt(parsedEnv.NEXT_PUBLIC_MAX_CHAT_TURNS, 10),
  onMaxChatTurns: parsedEnv.NEXT_PUBLIC_ON_MAX_CHAT_TURNS,
  allowUserExit: parsedEnv.NEXT_PUBLIC_ALLOW_USER_EXIT,
  displayChatTurns: parsedEnv.NEXT_PUBLIC_DISPLAY_CHAT_TURNS,
  
  // レスポンス設定
  assistantProcessingStyle: parsedEnv.NEXT_PUBLIC_ASSISTANT_PROCESSING_STYLE,
  assistantResponseStyle: parsedEnv.NEXT_PUBLIC_ASSISTANT_RESPONSE_STYLE,

  // 研究・実験用設定
  authPassword: isAuthEnabled(parsedEnv.NEXT_PUBLIC_AUTH_PASSWORD) ? parsedEnv.NEXT_PUBLIC_AUTH_PASSWORD : '',
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
