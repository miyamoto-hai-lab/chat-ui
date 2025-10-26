'use client';

import { cn } from '@/lib/utils';
import { Bot, Loader2, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  isStreaming?: boolean;
  showSpinner?: boolean;
  showReadMark?: boolean;
}

export function ChatMessage({
  role,
  content,
  isStreaming,
  showSpinner,
  showReadMark,
}: ChatMessageProps) {
  const { t } = useTranslation();

  if (role === 'system') {
    return null;
  }

  const isUser = role === 'user';

  return (
    <div className={cn('flex gap-3 mb-4', isUser ? 'justify-end' : 'justify-start')}>
      {/* Assistantのアイコン（左側） */}
      {!isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <Bot className="w-5 h-5 text-secondary-foreground" />
          </div>
        </div>
      )}

      {/* メッセージバブル */}
      <div
        className={cn(
          'relative max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm',
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-muted rounded-tl-sm'
        )}
      >
        <div className="prose prose-sm dark:prose-invert max-w-none break-words whitespace-pre-wrap">
          {content}
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
          )}
        </div>

        {/* スピナー（Assistantの吹き出し内） */}
        {!isUser && showSpinner && (
          <div className="flex items-center justify-center mt-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* 既読マーク（ユーザーの吹き出しの左下） */}
      {isUser && showReadMark && (
        <div className="flex items-end pb-1">
          <span className="text-xs text-muted-foreground ml-2">既読</span>
        </div>
      )}

      {/* ユーザーのアイコン（右側） */}
      {isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <User className="w-5 h-5 text-primary-foreground" />
          </div>
        </div>
      )}
    </div>
  );
}
