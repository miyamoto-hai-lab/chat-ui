'use client';

import { ChatContainer, type ChatContainerHandle } from '@/components/chat/ChatContainer';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { PasswordDialog } from '@/components/settings/PasswordDialog';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { usePasswordAuth } from '@/hooks/use-password-auth';
import { env } from '@/lib/env';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export default function Home() {
  const { t } = useTranslation();
  const { isAuthenticated, password, isLoading, authenticate } = usePasswordAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const chatContainerRef = useRef<ChatContainerHandle>(null);

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
  if (env.authPassword && !isAuthenticated && !isLoading) {
    return <PasswordDialog open={true} onAuthenticate={authenticate} />;
  }

  return (
    <div className="flex flex-col h-screen">
      <ChatHeader
        onSettingsClick={() => setSettingsOpen(true)}
        onExportClick={handleExport}
        onImportClick={handleImport}
        isLimitReached={isLimitReached}
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
