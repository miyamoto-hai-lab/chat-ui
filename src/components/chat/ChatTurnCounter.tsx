'use client';

import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface ChatTurnCounterProps {
  currentTurns: number;
  className?: string;
}

export function ChatTurnCounter({ currentTurns, className }: ChatTurnCounterProps) {
  const { t } = useTranslation();

  // OFFの場合は表示しない
  if (__APP_CONFIG__.ui.turn_counter.style === 'hidden') {
    return null;
  }

  // MAXの場合
  if (__APP_CONFIG__.ui.turn_counter.style === 'fraction') {
    if (__APP_CONFIG__.chat.max_turns === 0) {
      // 制限なしの場合は現在のターン数のみ表示
      return (
        <div className={cn("text-sm text-muted-foreground", className)}>
          {t('chat.turnCounterNoLimit', { current: currentTurns })}
        </div>
      );
    }
    // 制限ありの場合は n / N 形式
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        {t('chat.turnCounter', { current: currentTurns, max: __APP_CONFIG__.chat.max_turns })}
      </div>
    );
  }

  // カスタム文字列の場合
  return (
    <div className={cn("text-sm text-muted-foreground", className)}>
      {currentTurns}
      {__APP_CONFIG__.ui.turn_counter.custom_suffix || ` / ${__APP_CONFIG__.chat.max_turns}`}
    </div>
  );
}
