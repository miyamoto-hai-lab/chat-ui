'use client';

import { useSettings } from '@/components/providers/SettingsProvider';
import { useAvatarImages } from '@/hooks/useAvatarImages';
import { cn } from '@/lib/utils';
import { Bot, Loader2, User } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning?: string;
  isStreaming?: boolean;
  showSpinner?: boolean;
  showReadMark?: boolean;
}

export function ChatMessage({
  role,
  content,
  reasoning,
  isStreaming,
  showSpinner,
  showReadMark,
}: ChatMessageProps) {
  const { settings } = useSettings();
  const { userAvatarUrl, assistantAvatarUrl } = useAvatarImages();

  // 設定から名前を取得
  const userName = __APP_CONFIG__.chat.user_name || '';
  const assistantName = __APP_CONFIG__.chat.assistant_name || '';

  if (role === 'system') {
    return null;
  }

  const isUser = role === 'user';
  const displayName = isUser ? userName : assistantName;

  return (
    <div className={cn('flex gap-3 mb-4', isUser ? 'justify-end' : 'justify-start')}>
      {/* Assistantのアイコン（左側） */}
      {!isUser && (
        <div className="flex-shrink-0 self-start">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
            {assistantAvatarUrl ? (
              <img src={assistantAvatarUrl} alt="Assistant" className="w-full h-full object-cover" />
            ) : (
              <Bot className="w-5 h-5 text-secondary-foreground" />
            )}
          </div>
        </div>
      )}

      {/* メッセージコンテンツエリア */}
      <div className="flex flex-col max-w-[75%]">
        {/* 名前表示（吹き出しの上） */}
        {displayName && (
          <span className={cn(
            'text-xs text-muted-foreground mb-1',
            isUser ? 'text-right' : 'text-left'
          )}>
            {displayName}
          </span>
        )}

        {/* 思考過程（Assistantの吹き出しの上） */}
        {!isUser && reasoning && settings.showThinking && (
          <details className="mb-2 text-sm text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground transition-colors font-medium">
              思考過程
            </summary>
            <div className="mt-1 pl-2 border-l-2 border-muted-foreground/20">
              <MarkdownRenderer content={reasoning} />
            </div>
          </details>
        )
        }

        {/* スピナー（Assistantの吹き出しの上、コンテンツ生成前） */}
        {!isUser && showSpinner && content.length === 0 && (
          <div className="flex items-center justify-start mb-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* メッセージバブル */}
        {content.length > 0 && (
          <div
            className={cn(
              'relative rounded-2xl px-4 py-2.5 shadow-sm',
              isUser
                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                : 'bg-muted rounded-tl-sm'
            )}
          >
            <MarkdownRenderer 
              content={content} 
              isStreaming={isStreaming && !isUser} /* Userのメッセージはストリーミングしない */
              className={isUser ? "text-primary-foreground" : ""}
            />
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
        <div className="flex-shrink-0 self-start">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center overflow-hidden">
            {userAvatarUrl ? (
              <img src={userAvatarUrl} alt="User" className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-primary-foreground" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
