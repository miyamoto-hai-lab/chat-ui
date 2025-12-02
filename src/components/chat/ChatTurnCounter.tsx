'use client';

import { env } from '@/lib/env';
import { useTranslation } from 'react-i18next';

interface ChatTurnCounterProps {
  currentTurns: number;
}

export function ChatTurnCounter({ currentTurns }: ChatTurnCounterProps) {
  const { t } = useTranslation();

  // OFFの場合は表示しない
  if (env.displayChatTurns === 'OFF') {
    return null;
  }

  // MAXの場合
  if (env.displayChatTurns === 'MAX') {
    if (env.maxChatTurns === 0) {
      // 制限なしの場合は現在のターン数のみ表示
      return (
        <div className="text-sm text-muted-foreground">
          {t('chat.turnCounterNoLimit', { current: currentTurns })}
        </div>
      );
    }
    // 制限ありの場合は n / N 形式
    return (
      <div className="text-sm text-muted-foreground">
        {t('chat.turnCounter', { current: currentTurns, max: env.maxChatTurns })}
      </div>
    );
  }

  // カスタム文字列の場合
  return (
    <div className="text-sm text-muted-foreground">
      {currentTurns} / {env.displayChatTurns}
    </div>
  );
}
