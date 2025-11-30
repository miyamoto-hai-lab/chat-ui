'use client';

import { useSettings } from '@/components/providers/SettingsProvider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatService } from '@/lib/chat-service';
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
  reasoning?: string;
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
  const [streamingReasoning, setStreamingReasoning] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const accumulatedRef = useRef({ content: '', reasoning: '' });

  // メッセージが追加されたら自動スクロール
  // biome-ignore lint/correctness/useExhaustiveDependencies: messagesとstreamingContentの変更時にスクロールする必要がある
  useEffect(() => {
    const viewport = scrollRef.current?.querySelector('[data-slot="scroll-area-viewport"]');
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages, streamingContent, streamingReasoning]);

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
    setStreamingReasoning('');
    accumulatedRef.current = { content: '', reasoning: '' };

    // AbortControllerを作成
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      await ChatService.sendMessage({
        messages: [...messages, userMessage],
        settings,
        password,
        signal: abortController.signal,
        onUpdate: (content, reasoning) => {
          accumulatedRef.current = { content, reasoning: reasoning || '' };
          setStreamingContent(content);
          if (reasoning) setStreamingReasoning(reasoning);
        },
      });

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: accumulatedRef.current.content,
        reasoning: accumulatedRef.current.reasoning,
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      logChatMessage('assistant', assistantMessage.content, currentTurns + 1);
      
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
      setStreamingContent('');
      setStreamingReasoning('');
      abortControllerRef.current = null;
    }
  };

  // アプリ説明の表示
  const showDescription = !!env.appDescription;

  // 表示用メッセージリスト
  const displayMessages = [...messages];
  if ((streamingContent || streamingReasoning) && isLoading) {
    displayMessages.push({
      id: 'streaming',
      role: 'assistant',
      content: streamingContent,
      reasoning: streamingReasoning,
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
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full" ref={scrollRef}>
        <div className="max-w-4xl mx-auto p-4">
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
                reasoning={message.reasoning}
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
      </div>

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
