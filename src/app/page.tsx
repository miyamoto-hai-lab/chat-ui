'use client';

import { ChatContainer, type ChatContainerHandle } from '@/components/chat/ChatContainer';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { useSettings } from '@/components/providers/SettingsProvider';
import { PasswordDialog } from '@/components/settings/PasswordDialog';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { usePasswordAuth } from '@/hooks/use-password-auth';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export default function Home() {
  const { t } = useTranslation();
  const { isAuthenticated, password, isLoading, error, authenticate } = usePasswordAuth();
  const { refreshConfigDefaults } = useSettings();
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
    // エクスポート機能は今後の実装で追加
    // 現在のメッセージ状態をChatContainerから取得する方法を検討
    toast.info(t('export.success'));
  };

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
