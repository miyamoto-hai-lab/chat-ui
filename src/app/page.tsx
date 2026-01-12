'use client';

import { ChatContainer, type ChatContainerHandle } from '@/components/chat/ChatContainer';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { useSettings } from '@/components/providers/SettingsProvider';
import { PasswordDialog } from '@/components/settings/PasswordDialog';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { usePasswordAuth } from '@/hooks/use-password-auth';
import { PROVIDER_CONFIG } from '@/lib/provider-config';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

// ... (keep existing imports)

// ...


export default function Home() {
  const { t } = useTranslation();
  const { isAuthenticated, password, isLoading, error, authenticate } = usePasswordAuth();
  const { settings, refreshConfigDefaults } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const chatContainerRef = useRef<ChatContainerHandle>(null);

  // 認証時に設定のプレースホルダーを再評価（パスワードの適用）
  useEffect(() => {
    if (isAuthenticated) {
      refreshConfigDefaults();
    }
  }, [isAuthenticated, refreshConfigDefaults]);

  const handleExport = () => {
    const containerState = chatContainerRef.current?.getContainerState();
    if (!containerState || containerState.messages.length === 0) {
      toast.error(t('export.noMessages'));
      return;
    }

    const { messages, currentTurns } = containerState;
    const config = __APP_CONFIG__;
    const includeSettings = config.ui.export.include_settings ?? false;

    // 1. Format Messages
    const exportMessages = messages.map((msg) => ({
      created_at: msg.createdAt ? toLocalISOString(msg.createdAt) : null,
      role: msg.role,
      reasoning: msg.reasoning,
      text: msg.content,
      is_prefilled: msg.isPrefilled ?? false,
      id: msg.id,
    }));

    // 2. Prepare Settings (Optional)
    let exportSettings;
    if (includeSettings) {
      // Use effective settings (including runtime overrides and defaults)
      const provider = settings.provider || 'openai';
      const providerConfig = PROVIDER_CONFIG[provider as keyof typeof PROVIDER_CONFIG] || PROVIDER_CONFIG.openai;
      
      exportSettings = {
        provider: provider,
        // Use default if empty
        endpoint_url: settings.apiServerUrl || providerConfig.defaultUrl,
        model: settings.modelName || providerConfig.defaultModel,
        system_prompt: settings.systemPrompt,
        enable_thinking: settings.showThinking,
        thinking_tags: settings.thinkingTags,
        // Static/Chat config
        max_turns: config.chat.max_turns,
        start_role: config.chat.start_role,
        language: settings.language,
        // Explicitly excluded: apiKey, permissions
      };
    }

    // 3. Create Final JSON
    const exportData = {
      exported_at: toLocalISOString(new Date()),
      turn_count: currentTurns,
      messages: exportMessages,
      ...(includeSettings && { settings: exportSettings }),
    };

    // 4. Download File
    const prefix = config.ui.export.filename_prefix || 'chat-export';
    
    // Format: {prefix}_YYYY-MM-DD_HH-mm-ss.json
    const now = new Date();
    const Y = now.getFullYear();
    const M = String(now.getMonth() + 1).padStart(2, '0');
    const D = String(now.getDate()).padStart(2, '0');
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const filename = `${prefix}_${Y}-${M}-${D}_${h}-${m}-${s}.json`;

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(t('export.success'));
  };

  // Helper for Local ISO String with Timezone
  function toLocalISOString(date: Date): string {
    const off = -date.getTimezoneOffset();
    const sign = off >= 0 ? '+' : '-';
    const pad = (n: number) => n.toString().padStart(2, '0');
    const pad3 = (n: number) => n.toString().padStart(3, '0');

    const absOff = Math.abs(off);
    const offH = Math.floor(absOff / 60);
    const offM = absOff % 60;

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad3(date.getMilliseconds())}${sign}${pad(offH)}:${pad(offM)}`;
  }

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // 簡易的なバリデーション
        if (Array.isArray(data) && data.every(m => m.role && m.content)) {
          chatContainerRef.current?.setMessages(data);
          toast.success(t('common.importSuccess') || 'インポートしました');
        } else {
          throw new Error('Invalid format');
        }
      } catch (error) {
        console.error('Import error:', error);
        toast.error(t('common.importError') || 'インポートに失敗しました');
      }
    };
    reader.readAsText(file);
  };

  // パスワード認証が必要な場合
  if (__APP_CONFIG__.system.security.password_auth_enabled && !isAuthenticated) {
    // isLoading中はローディング表示を挟まず、Dialog側でローディング制御する
    // ただし初期チェック中(isLoading=trueかつisAuthenticated=false)は何も表示しないか、ローディングを出す
    if (isLoading && !password) return null; // 初期ロード中

    return (
      <PasswordDialog 
        open={true} 
        onAuthenticate={authenticate} 
        error={error}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <ChatHeader
        onSettingsClick={() => setSettingsOpen(true)}
        onExportClick={handleExport}
        onImportClick={handleImport}
        isLimitReached={isLimitReached}
        password={password}
      />
      <main className="flex-1 overflow-hidden min-h-0">
        <ChatContainer 
          ref={chatContainerRef}
          password={password} 
          onLimitChange={setIsLimitReached}
        />
      </main>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
