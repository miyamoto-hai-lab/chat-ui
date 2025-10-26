'use client';

import { env } from '@/lib/env';
import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const { t } = useTranslation();

  if (role === 'system') {
    return null;
  }

  const isUser = role === 'user';
  const displayName = isUser ? 'You' : env.assistantDisplayName;

  return (
    <div
      className={cn(
        'flex gap-3 p-4 rounded-lg',
        isUser ? 'bg-muted/50' : 'bg-background'
      )}
    >
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <User className="w-5 h-5 text-primary-foreground" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <Bot className="w-5 h-5 text-secondary-foreground" />
          </div>
        )}
      </div>
      
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="font-semibold text-sm">{displayName}</div>
        <div className="prose prose-sm dark:prose-invert max-w-none break-words whitespace-pre-wrap">
          {content}
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
