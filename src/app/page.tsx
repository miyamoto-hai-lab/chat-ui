'use client';

import { ChatContainer } from '@/components/chat/ChatContainer';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { PasswordDialog } from '@/components/settings/PasswordDialog';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { usePasswordAuth } from '@/hooks/use-password-auth';
import { env } from '@/lib/env';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export default function Home() {
  const { t } = useTranslation();
  const { isAuthenticated, password, isLoading, authenticate } = usePasswordAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleExport = () => {
    // エクスポート機能は今後の実装で追加
    // 現在のメッセージ状態をChatContainerから取得する方法を検討
    toast.info(t('export.success'));
  };

  // パスワード認証が必要な場合
  if (env.enablePasswordAuth && !isAuthenticated && !isLoading) {
    return <PasswordDialog open={true} onAuthenticate={authenticate} />;
  }

  return (
    <div className="flex flex-col h-screen">
      <ChatHeader
        onSettingsClick={() => setSettingsOpen(true)}
        onExportClick={handleExport}
      />
      <main className="flex-1 overflow-hidden min-h-0">
        <ChatContainer password={password} />
      </main>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
