'use client';

import { useSettings } from '@/components/providers/SettingsProvider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { env } from '@/lib/env';
import { logChatMessage } from '@/lib/event-logger';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ChatInput } from './ChatInput';
import { ChatMessage } from './ChatMessage';
import { ChatTurnCounter } from './ChatTurnCounter';

interface ChatContainerProps {
  password?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export function ChatContainer({ password }: ChatContainerProps) {
  const { settings } = useSettings();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>(() => {
    // 初期メッセージ
    if (env.startingRole === 'assistant') {
      return [
        {
          id: 'initial',
          role: 'assistant',
          content: settings.systemPrompt || 'こんにちは！',
        },
      ];
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [streamingContent, setStreamingContent] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // メッセージが追加されたら自動スクロール
  // biome-ignore lint/correctness/useExhaustiveDependencies: messagesとstreamingContentの変更時にスクロールする必要がある
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  // ターン数の計算（systemメッセージを除外）
  const currentTurns = Math.floor(
    messages.filter((m) => m.role !== 'system').length / 2
  );
  const isLimitReached = env.maxChatTurns > 0 && currentTurns >= env.maxChatTurns;

  // 入力変更ハンドラー
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  // メッセージ送信ハンドラー
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLimitReached || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
    };

    // ユーザーメッセージを追加
    setMessages((prev) => [...prev, userMessage]);
    logChatMessage('user', userMessage.content, currentTurns + 1);
    setInput('');
    setError(undefined);
    setIsLoading(true);
    setStreamingContent('');

    // AbortControllerを作成
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // APIリクエストの準備
      const requestMessages = [...messages, userMessage].map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // システムプロンプトを追加
      if (settings.systemPrompt) {
        requestMessages.unshift({
          role: 'system',
          content: settings.systemPrompt,
        });
      }

      const response = await fetch(settings.apiServerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(settings.apiKey && { Authorization: `Bearer ${settings.apiKey}` }),
          ...(password && { 'chatui-password': password }),
        },
        body: JSON.stringify({
          messages: requestMessages,
          stream: env.assistantResponseMode === 'streaming',
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const assistantMessageId = `assistant-${Date.now()}`;

      if (env.assistantResponseMode === 'streaming' && response.body) {
        // ストリーミングモード
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = '';

        try {
          // biome-ignore lint/suspicious/noAssignInExpressions: ストリームの読み取りにはこのパターンが必要
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const content =
                    parsed.choices?.[0]?.delta?.content ||
                    parsed.choices?.[0]?.message?.content ||
                    '';

                  if (content) {
                    accumulatedContent += content;
                    setStreamingContent(accumulatedContent);
                  }
                } catch {
                  // JSON パースエラーは無視
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        // ストリーミング完了後、メッセージを確定
        const assistantMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: accumulatedContent,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setStreamingContent('');
        logChatMessage('assistant', accumulatedContent, currentTurns + 1);
      } else {
        // 非ストリーミングモード
        const data = await response.json();
        const content =
          data.choices?.[0]?.message?.content ||
          data.message?.content ||
          data.content ||
          '';

        const assistantMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        logChatMessage('assistant', content, currentTurns + 1);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // ユーザーによる中断
        return;
      }
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // アプリ説明の表示
  const showDescription = env.appDescription && messages.length === 0;

  // 表示用メッセージリスト
  const displayMessages = [...messages];
  if (streamingContent && isLoading) {
    displayMessages.push({
      id: 'streaming',
      role: 'assistant',
      content: streamingContent,
    });
  }

  return (
    <div className="flex flex-col h-full">
      {/* アプリ説明 */}
      {showDescription && (
        <div
          className="p-4 border-b bg-muted/30"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: 環境変数から設定されたHTMLを表示
          dangerouslySetInnerHTML={{ __html: env.appDescription }}
        />
      )}

      {/* ターン数カウンター */}
      <div className="p-4 border-b">
        <ChatTurnCounter currentTurns={currentTurns} />
      </div>

      {/* メッセージリスト */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4 max-w-4xl mx-auto">
          {displayMessages.map((message) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
              isStreaming={
                message.id === 'streaming' &&
                env.assistantResponseMode === 'streaming'
              }
            />
          ))}

          {/* ローディング表示（非ストリーミングモード） */}
          {isLoading && env.assistantResponseMode !== 'streaming' && (
            <div className="flex items-center justify-center p-4">
              {env.assistantResponseMode === 'spinner' ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : env.assistantResponseMode === 'read' ? (
                <div className="text-sm text-muted-foreground">既読</div>
              ) : null}
            </div>
          )}

          {/* エラー表示 */}
          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
              エラーが発生しました: {error.message}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 入力フォーム */}
      <div className="p-4 border-t bg-background">
        <div className="max-w-4xl mx-auto">
          <ChatInput
            input={input}
            isLoading={isLoading}
            isDisabled={isLimitReached}
            onInputChange={handleInputChange}
            onSubmit={handleFormSubmit}
          />
        </div>
      </div>
    </div>
  );
}
