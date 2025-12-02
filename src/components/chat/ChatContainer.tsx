'use client';

import { useSettings } from '@/components/providers/SettingsProvider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatService } from '@/lib/chat-service';
import { env } from '@/lib/env';
import { logChatMessage } from '@/lib/event-logger';
import { type ChatMessage } from '@/types/chat';
import { Loader2, LogOut } from 'lucide-react';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChatInput } from './ChatInput';
import { ChatMessage as ChatMessageComponent } from './ChatMessage';
import { ChatTurnCounter } from './ChatTurnCounter';

export interface ChatContainerHandle {
  setMessages: (messages: ChatMessage[]) => void;
}

interface ChatContainerProps {
  password?: string;
  onLimitChange?: (isLimitReached: boolean) => void;
}

export const ChatContainer = forwardRef<ChatContainerHandle, ChatContainerProps>(
  ({ password, onLimitChange }, ref) => {
    const { t } = useTranslation();
    const { settings } = useSettings();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | undefined>(undefined);
    const [streamingContent, setStreamingContent] = useState('');
    const [streamingReasoning, setStreamingReasoning] = useState('');
    const abortControllerRef = useRef<AbortController | null>(null);
    const accumulatedRef = useRef({ content: '', reasoning: '' });
    const hasInitialized = useRef(false);

    useImperativeHandle(ref, () => ({
      setMessages: (newMessages: ChatMessage[]) => {
        setMessages(newMessages);
      },
    }));

    // スクロール処理
    const scrollToBottom = useCallback(() => {
      if (scrollRef.current) {
        const viewport = scrollRef.current.querySelector('[data-slot="scroll-area-viewport"]');
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }
      }
    }, []);

    // メッセージ更新時やストリーミング中にスクロール
    // biome-ignore lint/correctness/useExhaustiveDependencies: メッセージ更新時にスクロールを実行するため
    useEffect(() => {
      scrollToBottom();
    }, [messages, streamingContent, streamingReasoning, isLoading, scrollToBottom]);

    // ... (turn calculation)

    // ... (useEffect for exit)

    // ターン数の計算（systemメッセージを除外）
    const currentTurns = Math.floor(
      messages.filter((m) => m.role !== 'system').length / 2
    );
    const isLimitReached = env.maxChatTurns > 0 && currentTurns >= env.maxChatTurns;

    // メッセージ送信の実行ロジック
    const executeSendMessage = useCallback(async (newMessages: ChatMessage[]) => {
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
          messages: newMessages,
          settings,
          password,
          signal: abortController.signal,
          onUpdate: (content, reasoning) => {
            accumulatedRef.current = { content, reasoning: reasoning || '' };
            setStreamingContent(content);
            if (reasoning) setStreamingReasoning(reasoning);
          },
        });

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: accumulatedRef.current.content,
          reasoning: accumulatedRef.current.reasoning,
          createdAt: new Date(),
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
    }, [settings, password, currentTurns]);

    // 初期メッセージ生成 (startingRole === 'assistant' の場合)
    useEffect(() => {
      if (
        !hasInitialized.current &&
        env.startingRole === 'assistant' &&
        messages.length === 0 &&
        !isLoading
      ) {
        hasInitialized.current = true;
        executeSendMessage([]);
      }
    }, [messages.length, isLoading, executeSendMessage]);

    // 入力変更ハンドラー
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
    };

    // メッセージ送信ハンドラー
    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!input.trim() || isLimitReached || isLoading) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: input.trim(),
        createdAt: new Date(),
      };

      // ユーザーメッセージを追加
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      logChatMessage('user', userMessage.content, currentTurns + 1);
      setInput('');
      
      await executeSendMessage(newMessages);
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
      <div className="flex flex-col h-full relative">
        {/* ターン数制限到達時のポップアップ (messageモード) */}
        <Dialog open={isLimitReached && env.onMaxChatTurns === 'message'}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-xl font-bold text-destructive">
                {t('chat.limitReachedTitle') || '会話終了です'}
              </DialogTitle>
              <DialogDescription className="text-center text-base pt-4 whitespace-pre-wrap">
                {t('chat.limitReachedBody', { max: env.maxChatTurns }) || 
                 `ターン数が${env.maxChatTurns}回に達しました。\n以下の「チャットから退出」ボタンを押して次に進んでください。`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center pt-4">
              <Button 
                variant="destructive" 
                className="w-full sm:w-auto min-w-[200px]"
                onClick={() => {
                  if (env.redirectUrlOnExit) {
                    window.location.href = env.redirectUrlOnExit;
                  } else {
                    window.location.reload();
                  }
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t('chat.exitChat') || 'チャットから退出'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
                env.assistantProcessingStyle === 'spinner';

              // 既読マークを表示するかどうか（最後のユーザーメッセージでローディング中、かつreadモード）
              const showReadMark =
                isLastUserMessage && env.assistantProcessingStyle === 'read';

              return (
                <ChatMessageComponent
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  reasoning={message.reasoning}
                  isStreaming={
                    message.id === 'streaming' &&
                    env.assistantProcessingStyle === 'streaming'
                  }
                  showSpinner={showSpinner}
                  showReadMark={showReadMark}
                />
              );
            })}

            {/* ローディング表示（非ストリーミングモードでスピナー） */}
            {isLoading &&
              env.assistantProcessingStyle === 'spinner' &&
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
);

ChatContainer.displayName = 'ChatContainer';
