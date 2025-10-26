'use client';

import { env } from '@/lib/env';
import { defaultSettings, loadSettings, saveSettings } from '@/lib/storage';
import type { ChatSettings } from '@/types/chat';
import {
    createContext,
    type ReactNode,
    useContext,
    useEffect,
    useState,
} from 'react';

interface SettingsContextType {
  settings: ChatSettings;
  updateSettings: (newSettings: Partial<ChatSettings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ChatSettings>(() => {
    // 環境変数で固定値が設定されている場合はそれを使用
    const loaded = loadSettings();
    return {
      ...loaded,
      apiServerUrl: env.allowUserApiServer
        ? loaded.apiServerUrl || env.defaultApiServer
        : env.defaultApiServer,
      apiKey: env.allowUserApiServer
        ? loaded.apiKey || env.defaultApiKey
        : env.defaultApiKey,
      systemPrompt: env.allowUserSystemPrompt
        ? loaded.systemPrompt || env.systemPrompt
        : env.systemPrompt,
    };
  });

  useEffect(() => {
    // 設定が変更されたらlocalStorageに保存
    saveSettings(settings);
  }, [settings]);

  const updateSettings = (newSettings: Partial<ChatSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...newSettings,
    }));
  };

  const resetSettings = () => {
    setSettings({
      ...defaultSettings,
      apiServerUrl: env.defaultApiServer,
      apiKey: env.defaultApiKey,
      systemPrompt: env.systemPrompt,
    });
  };

  return (
    <SettingsContext.Provider
      value={{ settings, updateSettings, resetSettings }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
