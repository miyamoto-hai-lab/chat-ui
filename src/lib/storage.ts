import type { ChatSettings } from '@/types/chat';

const STORAGE_KEY = 'chatui-settings';
const PASSWORD_KEY = 'chatui-password';

// デフォルト設定
export const defaultSettings: ChatSettings = {
  provider: __APP_CONFIG__.llm.provider || 'openai',
  apiServerUrl: __APP_CONFIG__.llm.endpoint_url || '',
  apiKey: __APP_CONFIG__.llm.api_key || '',
  modelName: __APP_CONFIG__.llm.model,
  systemPrompt: __APP_CONFIG__.llm.system_prompt || '',
  showThinking: __APP_CONFIG__.llm.enable_thinking || false,
  thinkingTags: __APP_CONFIG__.llm.thinking_tags || [],
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

    // LLM設定が許可されていない場合には固定値を強制的に上書き
    if (!__APP_CONFIG__.llm.permissions.allow_change_config) {
      if (!__APP_CONFIG__.llm.provider) {
        settings.provider = 'openai';
      } else {
        // デフォルト設定がある場合はそれを使用（以前の設定値が不正な場合などのフォールバック）
        settings.provider = __APP_CONFIG__.llm.provider;
      }
    }

    // Thinking表示が固定されている場合は強制的に上書き
    if (!__APP_CONFIG__.llm.permissions.allow_toggle_thinking) {
      settings.showThinking = __APP_CONFIG__.llm.enable_thinking || false;
    }

    // その他の固定設定を強制的に上書き
    if (!__APP_CONFIG__.llm.permissions.allow_change_config) {
      settings.apiServerUrl = __APP_CONFIG__.llm.endpoint_url;
    }
    if (!__APP_CONFIG__.llm.permissions.allow_change_config) {
      if (!__APP_CONFIG__.llm.model) {
        // デフォルトがない場合は何もしない（あるいは固定のデフォルトを設定）
      } else {
        // デフォルト設定を使用
        settings.modelName = __APP_CONFIG__.llm.model;
      }
    }
    if (!__APP_CONFIG__.llm.permissions.allow_change_config) {
      if (!__APP_CONFIG__.llm.api_key) {
        // デフォルトがない場合は何もしない
      } else {
        // デフォルト設定を使用
        settings.apiKey = __APP_CONFIG__.llm.api_key;
      }
    }
    if (!__APP_CONFIG__.llm.permissions.allow_change_config) {
      settings.systemPrompt = __APP_CONFIG__.llm.system_prompt || '';
    }
    if (!__APP_CONFIG__.llm.permissions.allow_change_config) {
      settings.thinkingTags = __APP_CONFIG__.llm.thinking_tags || [];
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
