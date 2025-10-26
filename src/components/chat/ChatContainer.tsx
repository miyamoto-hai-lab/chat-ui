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

      // リクエストボディの構築
      const requestBody: Record<string, unknown> = {
        messages: requestMessages,
        stream: env.assistantResponseMode === 'streaming',
      };

      // モデル名が設定されている場合のみ追加（設定で空の場合はサーバー側のデフォルトを使用）
      if (settings.modelName) {
        requestBody.model = settings.modelName;
      }

      console.log('API Request:', {
        url: settings.apiServerUrl,
        hasApiKey: !!settings.apiKey,
        messageCount: requestMessages.length,
        stream: requestBody.stream,
        model: requestBody.model,
      });

      const response = await fetch(settings.apiServerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(settings.apiKey && { Authorization: `Bearer ${settings.apiKey}` }),
          ...(password && { 'chatui-password': password }),
        },
        body: JSON.stringify(requestBody),
        signal: abortController.signal,
      });

      console.log('API Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        // エラーレスポンスの詳細を取得
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorData.message || errorMessage;
        } catch {
          // JSONパース失敗時はstatusTextを使用
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(`API request failed: ${errorMessage}`);
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
        <div className="max-w-4xl mx-auto">
          {displayMessages.map((message, index) => {
            // 最後のユーザーメッセージかどうか
            const isLastUserMessage =
              message.role === 'user' &&
              index === displayMessages.length - 1 &&
              isLoading;

            // スピナーを表示するかどうか（最後のメッセージでローディング中、かつspinnerモード）
            const showSpinner =
              message.id === 'streaming' &&
              isLoading &&
              env.assistantResponseMode === 'spinner';

            // 既読マークを表示するかどうか（最後のユーザーメッセージでローディング中、かつreadモード）
            const showReadMark =
              isLastUserMessage && env.assistantResponseMode === 'read';

            return (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                isStreaming={
                  message.id === 'streaming' &&
                  env.assistantResponseMode === 'streaming'
                }
                showSpinner={showSpinner}
                showReadMark={showReadMark}
              />
            );
          })}

          {/* ローディング表示（非ストリーミングモードでスピナー） */}
          {isLoading &&
            env.assistantResponseMode === 'spinner' &&
            !streamingContent && (
              <div className="flex gap-3 mb-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-secondary-foreground animate-spin" />
                  </div>
                </div>
                <div className="relative max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm bg-muted rounded-tl-sm flex items-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
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
