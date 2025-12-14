'use client';

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
      apiServerUrl: __APP_CONFIG__.llm.permissions.allow_change_config
        ? loaded.apiServerUrl || __APP_CONFIG__.llm.defaults.endpoint_url
        : __APP_CONFIG__.llm.defaults.endpoint_url,
      apiKey: __APP_CONFIG__.llm.permissions.allow_change_config
        ? loaded.apiKey || __APP_CONFIG__.llm.defaults.api_key
        : __APP_CONFIG__.llm.defaults.api_key,
      systemPrompt: __APP_CONFIG__.llm.permissions.allow_change_system_prompt
        ? loaded.systemPrompt || __APP_CONFIG__.llm.defaults.system_prompt
        : __APP_CONFIG__.llm.defaults.system_prompt,
      modelName: __APP_CONFIG__.llm.permissions.allow_change_config
        ? loaded.modelName || __APP_CONFIG__.llm.defaults.model
        : __APP_CONFIG__.llm.defaults.model,
      showThinking: __APP_CONFIG__.llm.permissions.allow_toggle_thinking
        ? loaded.showThinking ?? __APP_CONFIG__.llm.defaults.enable_thinking
        : __APP_CONFIG__.llm.defaults.enable_thinking,
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
      apiServerUrl: __APP_CONFIG__.llm.defaults.endpoint_url || '',
      apiKey: __APP_CONFIG__.llm.defaults.api_key || '',
      systemPrompt: __APP_CONFIG__.llm.defaults.system_prompt || '',
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
