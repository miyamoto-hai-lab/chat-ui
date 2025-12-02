import { env } from '@/lib/env';
import type { ChatSettings } from '@/types/chat';

const STORAGE_KEY = 'chatui-settings';
const PASSWORD_KEY = 'chatui-password';

// デフォルト設定
export const defaultSettings: ChatSettings = {
  provider: (env.llmProvider as any) || 'openai',
  apiServerUrl: env.llmApiEndpoint,
  apiKey: env.llmApiKey,
  modelName: env.llmModel,
  systemPrompt: env.llmSystemPrompt,
  showThinking: env.allowUserShowThinking,
  language: 'ja',
};

// 設定の読み込み
export function loadSettings(): ChatSettings {
  if (typeof window === 'undefined') {
    return defaultSettings;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return defaultSettings;
    }

    const parsed = JSON.parse(stored);
    const settings = {
      ...defaultSettings,
      ...parsed,
    };

    // 固定プロバイダーが設定されている場合は強制的に上書き
    if (!env.allowUserProvider && env.llmProvider) {
      settings.provider = env.llmProvider;
    }

    // Thinking表示が固定されている場合は強制的に上書き
    if (!env.allowUserShowThinking) {
      settings.showThinking = env.defaultShowThinking;
    }

    // その他の固定設定を強制的に上書き
    if (!env.allowUserApiServer && env.llmApiEndpoint) {
      settings.apiServerUrl = env.llmApiEndpoint;
    }
    if (!env.allowUserModel && env.llmModel) {
      settings.modelName = env.llmModel;
    }
    if (!env.allowUserApiKey && env.llmApiKey) {
      settings.apiKey = env.llmApiKey;
    }
    if (!env.allowUserSystemPrompt && env.llmSystemPrompt) {
      settings.systemPrompt = env.llmSystemPrompt;
    }

    return settings;
  } catch (error) {
    console.error('Failed to load settings:', error);
    return defaultSettings;
  }
}

// 設定の保存
export function saveSettings(settings: ChatSettings): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

// 設定のクリア
export function clearSettings(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear settings:', error);
  }
}

// パスワードの読み込み
export function loadPassword(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    return localStorage.getItem(PASSWORD_KEY) || '';
  } catch (error) {
    console.error('Failed to load password:', error);
    return '';
  }
}

// パスワードの保存
export function savePassword(password: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(PASSWORD_KEY, password);
  } catch (error) {
    console.error('Failed to save password:', error);
  }
}

// パスワードのクリア
export function clearPassword(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(PASSWORD_KEY);
  } catch (error) {
    console.error('Failed to clear password:', error);
  }
}
