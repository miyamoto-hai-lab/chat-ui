import type { ChatSettings } from '@/types/chat';

const STORAGE_KEY = 'chatui-settings';
const PASSWORD_KEY = 'chatui-password';

// デフォルト設定
export const defaultSettings: ChatSettings = {
  apiServerUrl: '',
  apiKey: '',
  systemPrompt: '',
  showThinking: false,
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
    return {
      ...defaultSettings,
      ...parsed,
    };
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
