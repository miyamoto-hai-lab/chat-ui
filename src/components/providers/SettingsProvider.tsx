'use client';

import { replacePlaceholders } from '@/lib/placeholder';
import { defaultSettings, loadPassword, loadSettings, saveSettings } from '@/lib/storage';
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
  refreshConfigDefaults: () => void;
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
        ? loaded.apiServerUrl || replacePlaceholders(__APP_CONFIG__.llm.defaults.endpoint_url || '')
        : replacePlaceholders(__APP_CONFIG__.llm.defaults.endpoint_url || ''),
      apiKey: __APP_CONFIG__.llm.permissions.allow_change_config
        ? loaded.apiKey || replacePlaceholders(__APP_CONFIG__.llm.defaults.api_key || '')
        : replacePlaceholders(__APP_CONFIG__.llm.defaults.api_key || ''),
      systemPrompt: __APP_CONFIG__.llm.permissions.allow_change_system_prompt
        ? loaded.systemPrompt || replacePlaceholders(__APP_CONFIG__.llm.defaults.system_prompt || '')
        : replacePlaceholders(__APP_CONFIG__.llm.defaults.system_prompt || ''),
      modelName: __APP_CONFIG__.llm.permissions.allow_change_config
        ? loaded.modelName || replacePlaceholders(__APP_CONFIG__.llm.defaults.model || '')
        : replacePlaceholders(__APP_CONFIG__.llm.defaults.model || ''),
      showThinking: __APP_CONFIG__.llm.permissions.allow_toggle_thinking
        ? loaded.showThinking ?? __APP_CONFIG__.llm.defaults.enable_thinking ?? false
        : __APP_CONFIG__.llm.defaults.enable_thinking ?? false,
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

  const refreshConfigDefaults = () => {
    const pwd = loadPassword();
    const variables = { 
      PASSWORD: pwd ?? '',
    };

    setSettings((prev) => ({
      ...prev,
      apiServerUrl: __APP_CONFIG__.llm.permissions.allow_change_config
        ? prev.apiServerUrl || replacePlaceholders(__APP_CONFIG__.llm.defaults.endpoint_url || '', variables)
        : replacePlaceholders(__APP_CONFIG__.llm.defaults.endpoint_url || '', variables),
      apiKey: __APP_CONFIG__.llm.permissions.allow_change_config
        ? prev.apiKey || replacePlaceholders(__APP_CONFIG__.llm.defaults.api_key || '', variables)
        : replacePlaceholders(__APP_CONFIG__.llm.defaults.api_key || '', variables),
      systemPrompt: __APP_CONFIG__.llm.permissions.allow_change_system_prompt
        ? prev.systemPrompt || replacePlaceholders(__APP_CONFIG__.llm.defaults.system_prompt || '', variables)
        : replacePlaceholders(__APP_CONFIG__.llm.defaults.system_prompt || '', variables),
      modelName: __APP_CONFIG__.llm.permissions.allow_change_config
        ? prev.modelName || replacePlaceholders(__APP_CONFIG__.llm.defaults.model || '', variables)
        : replacePlaceholders(__APP_CONFIG__.llm.defaults.model || '', variables),
    }));
  };

  const resetSettings = () => {
    setSettings({
      ...defaultSettings,
      apiServerUrl: replacePlaceholders(__APP_CONFIG__.llm.defaults.endpoint_url || ''),
      apiKey: replacePlaceholders(__APP_CONFIG__.llm.defaults.api_key || ''),
      systemPrompt: replacePlaceholders(__APP_CONFIG__.llm.defaults.system_prompt || ''),
    });
  };

  return (
    <SettingsContext.Provider
      value={{ settings, updateSettings, resetSettings, refreshConfigDefaults }}
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
