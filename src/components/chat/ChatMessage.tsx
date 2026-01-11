'use client';

import { useSettings } from '@/components/providers/SettingsProvider';
import { useAvatarImages } from '@/hooks/useAvatarImages';
import { cn } from '@/lib/utils';
import { Bot, Loader2, User } from 'lucide-react';

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

  if (role === 'system') {
    return null;
  }

  const isUser = role === 'user';

  return (
    <div className={cn('flex gap-3 mb-4', isUser ? 'justify-end' : 'justify-start')}>
      {/* Assistantのアイコン（左側） */}
      {!isUser && (
        <div className="flex-shrink-0">
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
        {/* 思考過程（Assistantの吹き出しの上） */}
        {!isUser && reasoning && settings.showThinking && (
          <details className="mb-2 text-sm text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground transition-colors font-medium">
              思考過程
            </summary>
            <div className="mt-1 pl-2 border-l-2 border-muted-foreground/20 whitespace-pre-wrap">
              {reasoning}
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
            {content}
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
            )}
          </div>
        )}
        
        {/* スピナー（Assistantの吹き出し内、ストリーミング中など） - 既存のロジックだと吹き出し内だったが、
            要件は「吹き出しの外かつ吹き出しの上」だが、
            responseが1文字以上来てから表示される吹き出しの中にスピナーを入れるべきか？
            元のコードは吹き出し内にあった。
            要件: "responseの下に思考過程のアコーディオンがありますが，思考過程は吹き出しの外かつ吹き出しの上においてほしいです"
            
            思考過程 -> 吹き出し外・上
            吹き出し -> response >= 1文字
            
            Spinnerの位置については明言がないが、通常は応答待ちのときは吹き出し外・上で、
            応答中はカーソル点滅(isStreaming)がある。
            showSpinnerは "waiting for response" の状態だと思われる。
            
            元のコード:
            {!isUser && showSpinner && ( ... )}
            
            もし content.length > 0 なら吹き出しが表示される。
            その場合 showSpinner が true ならどうするか？
            通常、文字が出始めたら showSpinner は false になるか、あるいは isStreaming が true になるはず。
            
            一旦、showSpinner は「まだ文字が出ていないとき」のローディング表示として扱い、
            文字が出ているときは isStreaming のカーソルに任せるのが自然だが、
            既存ロジックを壊さないように注意。
            
            とりあえず showSpinner も「吹き出しの外・上」に移動しておくのが安全そう（思考過程と同じ扱い）。
            ただし、思考過程の下、吹き出しの上。
         */}
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
