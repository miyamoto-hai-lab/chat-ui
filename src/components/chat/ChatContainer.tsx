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
import { logChatMessage } from '@/lib/event-logger';
import { performAppExit } from '@/lib/navigation';
import { replacePlaceholders } from '@/lib/placeholder';
import { cn } from '@/lib/utils';
import { type ChatMessage } from '@/types/chat';
import { Loader2, LogOut } from 'lucide-react';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CandidatesBar } from './CandidatesBar';
import { ChatInput } from './ChatInput';
import { ChatMessage as ChatMessageComponent } from './ChatMessage';
import { ChatTurnCounter } from './ChatTurnCounter';
import { MarkdownRenderer } from './MarkdownRenderer';

export interface ChatContainerHandle {
  setMessages: (messages: ChatMessage[]) => void;
  getContainerState: () => { messages: ChatMessage[]; currentTurns: number };
}

interface ChatContainerProps {
  password?: string;
  onLimitChange?: (isLimitReached: boolean) => void;
  onCurrentTurnsChange?: (turns: number) => void;
}

export const ChatContainer = forwardRef<ChatContainerHandle, ChatContainerProps>(
  ({ password, onLimitChange, onCurrentTurnsChange }, ref) => {
    const { t } = useTranslation();
    const { settings } = useSettings();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
      // 初期メッセージのロード
      if (
        __APP_CONFIG__.chat.prefill_messages &&
        __APP_CONFIG__.chat.prefill_messages.length > 0
      ) {
        return __APP_CONFIG__.chat.prefill_messages.map((msg, index) => ({
          id: `prefill-${index}`,
          role: msg.role,
          content: msg.text,
          reasoning: msg.reasoning,
          createdAt: new Date(),
          isPrefilled: true,
        }));
      }
      return [];
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | undefined>(undefined);
    const [streamingContent, setStreamingContent] = useState('');
    const [streamingReasoning, setStreamingReasoning] = useState('');
    const abortControllerRef = useRef<AbortController | null>(null);
    const accumulatedRef = useRef({ content: '', reasoning: '' });

    const hasInitialized = useRef(false);

    useImperativeHandle(
      ref,
      () => ({
        setMessages: (newMessages: ChatMessage[]) => {
          setMessages(newMessages);
        },
        getContainerState: () => ({
          messages,
          currentTurns: Math.floor(
            messages.filter((m) => m.role !== 'system').length / 2
          ),
        }),
      }),
      [messages]
    );

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

    // ターン数の計算（systemメッセージを除外）
    const currentTurns = Math.floor(
      messages.filter((m) => m.role !== 'system').length / 2
    );
    const isLimitReached = __APP_CONFIG__.chat.max_turns > 0 && currentTurns >= __APP_CONFIG__.chat.max_turns;

    // 候補リストの状態管理
    const [candidates, setCandidates] = useState<string[]>(() => {
      // Configから初期値を読み込み
      return __APP_CONFIG__.ui.components.candidates?.contents || [];
    });

    // 候補の表示判定
    const candidatesConfig = __APP_CONFIG__.ui.components.candidates;
    const showCandidates = 
      candidatesConfig &&
      candidates.length > 0 &&
      currentTurns >= candidatesConfig.show_turn &&
      currentTurns < candidatesConfig.hide_turn &&
      !isLimitReached;

    // 現在表示すべき候補リスト（実際のレンダリングにはcandidatesステートを使用）
    const visibleCandidates = showCandidates ? candidates : [];

    // 最後に選択された候補（送信時の挙動に使用）
    const [lastSelectedCandidate, setLastSelectedCandidate] = useState<string | null>(null);

    // Limit Reached時のカウントダウン
    const [countDown, setCountDown] = useState<number | null>(null);
    // モーダル表示制御用の状態
    const [isModalOpen, setIsModalOpen] = useState(false);

    // モーダル遅延と自動退出の制御
    useEffect(() => {
        if (!isLimitReached) {
            setIsModalOpen(false);
            setCountDown(null);
            return;
        }

        const limitConfig = __APP_CONFIG__.chat.on_limit_reached;

        // モーダル表示遅延
        if (limitConfig.action === 'modal') {
             const delaySec = limitConfig.modal_delay_sec ?? 1.0;
             const timer = setTimeout(() => {
                 setIsModalOpen(true);
             }, delaySec * 1000);
             return () => clearTimeout(timer);
        } else {
             // inlineの場合は即座には表示できないが、レンダリング条件で制御
             // inline表示用のステートは特に設けていないが、必要なら追加検討
        }

    }, [isLimitReached]);

    // カウントダウン処理
    useEffect(() => {
        const limitConfig = __APP_CONFIG__.chat.on_limit_reached;
        if (isLimitReached && limitConfig.auto_exit_delay_sec > 0) {
             if (countDown === null) {
                setCountDown(limitConfig.auto_exit_delay_sec);
             }

             // 0.1秒ごとに更新して小数点対応
             const intervalMs = 100;
             const decrement = 0.1;
             
             const timer = setInterval(() => {
                setCountDown((prev) => {
                    if (prev === null) return limitConfig.auto_exit_delay_sec;
                    const next = prev - decrement;
                    // 浮動小数点の誤差を考慮して少し余裕を持つか、toFixedで管理
                    if (next <= 0) {
                        clearInterval(timer);
                        performAppExit(password);
                        return 0;
                    }
                    return next;
                });
             }, intervalMs);

             return () => clearInterval(timer);
        }
    }, [isLimitReached, password, countDown]);

    // 候補選択ハンドラー
    const handleCandidateSelect = (text: string) => {
      // 入力をセット
      setInput(text);
      // 選択状態を保存
      setLastSelectedCandidate(text);
    };

    // ターン数の変更を通知
    useEffect(() => {
      onCurrentTurnsChange?.(currentTurns);
    }, [currentTurns, onCurrentTurnsChange]);

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
        
        logChatMessage(
            'assistant', 
            assistantMessage.content, 
            currentTurns + 1, 
            assistantMessage.reasoning
        );
        
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

    // LLMが先に発話する場合の初期メッセージ生成
    useEffect(() => {
      if (
        !hasInitialized.current &&
        __APP_CONFIG__.chat.start_role === 'assistant' &&
        !isLoading
      ) {
        hasInitialized.current = true;
        executeSendMessage(messages);
      }
    }, [messages, isLoading, executeSendMessage]);

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

      // 候補の更新ロジック (used_contents_behavior)
      if (
        candidatesConfig?.used_contents_behavior &&
        candidatesConfig.used_contents_behavior !== 'none' &&
        lastSelectedCandidate &&
        input.includes(lastSelectedCandidate)
      ) {
        setCandidates((prev) => {
          const next = [...prev];
          const index = next.indexOf(lastSelectedCandidate);
          
          if (index > -1) {
             if (candidatesConfig.used_contents_behavior === 'remove') {
               next.splice(index, 1);
             } else if (candidatesConfig.used_contents_behavior === 'move_to_end') {
               next.splice(index, 1);
               next.push(lastSelectedCandidate);
             }
          }
          return next;
        });
      }
      setLastSelectedCandidate(null);
      
      await executeSendMessage(newMessages);
    };

    // アプリ説明の表示
    const rawDescription = typeof __APP_CONFIG__.app.description === 'object' 
        ? __APP_CONFIG__.app.description.contents 
        : (__APP_CONFIG__.app.description || '');
        
    const descPosition = typeof __APP_CONFIG__.app.description === 'object' 
        ? (__APP_CONFIG__.app.description.position || 'top') 
        : 'top';
        
    const descMaxHeight = typeof __APP_CONFIG__.app.description === 'object'
        ? (__APP_CONFIG__.app.description.max_height || '12rem')
        : '12rem';

    const descWidth = typeof __APP_CONFIG__.app.description === 'object'
        ? (__APP_CONFIG__.app.description.width || '16rem')
        : '16rem';

    const descStyle = typeof __APP_CONFIG__.app.description === 'object'
        ? (__APP_CONFIG__.app.description.style || 'fixed')
        : 'fixed';

    const description = replacePlaceholders(rawDescription, {
      PASSWORD: password ?? '',
    });
    const showDescription = !!description;

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
        {/* ターン数制限到達時のポップアップ (modalモード) */}
        <Dialog open={isModalOpen && __APP_CONFIG__.chat.on_limit_reached.action === 'modal'}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-xl font-bold text-destructive">
                {t('chat.limitReachedTitle') || '会話終了です'}
              </DialogTitle>
              <DialogDescription className="text-center text-base pt-4 whitespace-pre-wrap">
                {t('chat.limitReachedBody', { max: __APP_CONFIG__.chat.max_turns }) || 
                 `ターン数が${__APP_CONFIG__.chat.max_turns}回に達しました。\n以下の「チャットから退出」ボタンを押して次に進んでください。`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center pt-4">
              <Button 
                variant="destructive" 
                className="w-full sm:w-auto min-w-[200px]"
                onClick={() => {
                  performAppExit(password);
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t('chat.exitChat') || 'チャットから退出'}
              </Button>
            </DialogFooter>
            {countDown !== null && countDown > 0 && (
              <p className="text-center text-sm text-muted-foreground mt-2 font-mono">
                {t('chat.autoExitMessage', { seconds: countDown.toFixed(1) }) || `${countDown.toFixed(1)}秒後に自動的に移動します...`}
              </p>
            )}
          </DialogContent>
        </Dialog>

        {/* アプリ説明 (Top) */}
        {showDescription && descPosition === 'top' && (
          <ScrollArea className="border-b bg-muted/30" style={{ maxHeight: descMaxHeight }}>
            <MarkdownRenderer
              className="p-4"
              content={description}
            />
          </ScrollArea>
        )}

        {/* アプリ説明 (Floating Left) */}
        {showDescription && descPosition === 'left' && descStyle === 'floating' && (
             <div className="hidden md:block absolute top-4 left-4 z-20 border bg-background/95 backdrop-blur shadow-lg rounded-lg overflow-hidden" 
                  style={{ width: descWidth, maxHeight: descMaxHeight }}>
               <ScrollArea className="h-full" style={{ maxHeight: descMaxHeight }}>
                  <MarkdownRenderer
                    className="p-4"
                    content={description}
                  />
               </ScrollArea>
             </div>
        )}

        {/* アプリ説明 (Floating Right) */}
        {showDescription && descPosition === 'right' && descStyle === 'floating' && (
             <div className="hidden md:block absolute top-4 right-4 z-20 border bg-background/95 backdrop-blur shadow-lg rounded-lg overflow-hidden" 
                  style={{ width: descWidth, maxHeight: descMaxHeight }}>
               <ScrollArea className="h-full" style={{ maxHeight: descMaxHeight }}>
                  <MarkdownRenderer
                    className="p-4"
                    content={description}
                  />
               </ScrollArea>
             </div>
        )}

        <div className="flex flex-1 min-h-0 overflow-hidden relative">
          {/* アプリ説明 (Left - Desktop only - Fixed Mode) */}
          {showDescription && descPosition === 'left' && descStyle === 'fixed' && (
            <div className="hidden md:block border-r bg-muted/30 flex-shrink-0 overflow-hidden" style={{ width: descWidth }}>
               <ScrollArea className="h-full">
                  <MarkdownRenderer
                    className="p-4"
                    content={description}
                  />
               </ScrollArea>
            </div>
          )}

          <div className="flex flex-col flex-1 min-h-0 relative">
             {/* アプリ説明 (Left/Right Fallback on Mobile - render as Top) */}
             {showDescription && (descPosition === 'left' || descPosition === 'right') && (
                <div className="lg:hidden border-b bg-muted/30">
                  <ScrollArea style={{ maxHeight: descMaxHeight }}>
                    <MarkdownRenderer
                      className="p-4"
                      content={description}
                    />
                  </ScrollArea>
                </div>
             )}

            {/* ターン数カウンター (Mobile or when floating is not suitable) */}
            {/* 
                Desktop: Floating badge
                Mobile: Fixed bar at top 
            */}
            
            {/* Mobile View: Fixed Bar at Top */}
            <div className="block md:hidden p-4 border-b flex-shrink-0">
              <ChatTurnCounter currentTurns={currentTurns} />
            </div>

            {/* Desktop View: Floating Badge */}
            {/* Position logic:
                - If Description is LEFT (Fixed or Floating): Badge goes top-RIGHT
                - If Description is RIGHT (Fixed or Floating): Badge goes top-LEFT
                - If Description is TOP/BOTTOM/NONE: Badge goes top-LEFT
            */}
            <div className={cn(
                "hidden md:block absolute z-10 top-4",
                descPosition === 'left' ? "right-6" : "left-6"
            )}>
                <ChatTurnCounter 
                    currentTurns={currentTurns} 
                    className="bg-background/80 backdrop-blur-sm border shadow-sm px-3 py-1 rounded-full text-sm font-medium" 
                />
            </div>

            {/* メッセージリスト */}
            <div className="flex-1 min-h-0 relative"> {/* Added relative for absolute positioning context if needed, though Badge is in flex-col container which is relative */}
              <ScrollArea className="h-full" ref={scrollRef}>
              <div className="max-w-4xl mx-auto p-4 pt-10 md:pt-4"> {/* Add top padding on mobile only if needed, or rely on scroll area structure */}
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
                    __APP_CONFIG__.ui.styles.generation_style === 'spinner';

                  // 既読マークを表示するかどうか（最後のユーザーメッセージでローディング中、かつreadモード）
                  const showReadMark =
                    isLastUserMessage && __APP_CONFIG__.ui.styles.generation_style === 'read';
                  return (
                    <ChatMessageComponent
                      key={message.id}
                      role={message.role}
                      content={message.content}
                      reasoning={message.reasoning}
                      isStreaming={
                        message.id === 'streaming' &&
                        __APP_CONFIG__.ui.styles.generation_style === 'streaming'
                      }
                      showSpinner={showSpinner}
                      showReadMark={showReadMark}
                    />
                  );
                })}

                {/* ローディング表示（非ストリーミングモードでスピナー） */}
                {isLoading &&
                  __APP_CONFIG__.ui.styles.generation_style === 'spinner' &&
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

                {/* Inline Limit Reached Display */}
                {isLimitReached && __APP_CONFIG__.chat.on_limit_reached.action === 'inline' && (
                  <div className="mt-8 border-t-2 border-dashed pt-8 pb-4 animate-in fade-in slide-in-from-bottom-5">
                    <div className="flex flex-col items-center justify-center space-y-4 text-center">
                      <h3 className="text-lg font-bold text-destructive">
                        {t('chat.limitReachedTitle') || '会話終了です'}
                      </h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {t('chat.limitReachedBody', { max: __APP_CONFIG__.chat.max_turns }) || 
                         `ターン数が${__APP_CONFIG__.chat.max_turns}回に達しました。\n以下のボタンを押して次に進んでください。`}
                      </p>
                      
                      <Button 
                        variant="destructive" 
                        size="lg"
                        onClick={() => performAppExit(password)}
                        className="animate-pulse"
                      >
                        <LogOut className="mr-2 h-5 w-5" />
                        {t('chat.exitChat') || 'チャットから退出'}
                      </Button>

                      {countDown !== null && countDown > 0 && (
                        <p className="text-sm font-medium text-muted-foreground font-mono">
                          {t('chat.autoExitMessage', { seconds: countDown.toFixed(1) }) || `${countDown.toFixed(1)}秒後に自動的に移動します...`}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              </ScrollArea>
            </div>
             
             {/* アプリ説明 (Bottom) */}
            {showDescription && descPosition === 'bottom' && (
              <ScrollArea className="border-t bg-muted/30" style={{ maxHeight: descMaxHeight }}>
                <MarkdownRenderer
                  className="p-4"
                  content={description}
                />
              </ScrollArea>
            )}

            {/* 入力フォーム */}
            <div className="p-4 border-t bg-background flex-shrink-0">
              <div className="max-w-4xl mx-auto space-y-2">
                {/* 候補バー (条件付き表示) */}
            {showCandidates ? (
              <CandidatesBar
                candidates={visibleCandidates}
                onSelect={handleCandidateSelect}
                className="animate-in fade-in slide-in-from-bottom-2"
              />
            ) : (
                candidatesConfig && !isLimitReached && (
                  (currentTurns < candidatesConfig.show_turn && candidatesConfig.before_show_text) ? (
                    <div className="flex items-center h-8 px-3 text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-2">
                       {candidatesConfig.before_show_text}
                    </div>
                  ) : (currentTurns >= candidatesConfig.hide_turn && candidatesConfig.after_hide_text) ? (
                    <div className="flex items-center h-8 px-3 text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-2">
                       {candidatesConfig.after_hide_text}
                   </div>
                  ) : null
                )
            )}
            
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

          {/* アプリ説明 (Right - Desktop only - Fixed Mode) */}
          {showDescription && descPosition === 'right' && descStyle === 'fixed' && (
             <div className="hidden lg:block border-l bg-muted/30 flex-shrink-0 overflow-hidden" style={{ width: descWidth }}>
               <ScrollArea className="h-full">
                  <MarkdownRenderer
                    className="p-4"
                    content={description}
                  />
               </ScrollArea>
             </div>
          )}

        </div>
      </div>
    );
  }
);

ChatContainer.displayName = 'ChatContainer';
