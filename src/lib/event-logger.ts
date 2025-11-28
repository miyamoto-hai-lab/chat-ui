import type { EventData, EventType } from '@/types/chat';
import { env } from './env';

export async function logEvent(
  eventType: EventType,
  data: Record<string, any>
): Promise<void> {
  // イベントが有効化されていない場合は何もしない
  if (!env.enabledEvents.includes(eventType)) {
    return;
  }

  // エンドポイントが設定されていない場合は何もしない
  if (!env.eventEndpointUrl) {
    return;
  }

  const eventData: EventData = {
    eventType,
    timestamp: new Date().toISOString(),
    data,
  };

  try {
    await fetch(env.eventEndpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });
  } catch (error) {
    console.error('Failed to log event:', error);
    // イベントロギングの失敗は無視（ユーザー体験に影響を与えない）
  }
}

export function logKeyInput(inputValue: string): void {
  logEvent('KEY_INPUT', {
    inputValue,
    inputLength: inputValue.length,
  });
}

export function logChatMessage(
  role: 'user' | 'assistant',
  content: string,
  turnNumber: number
): void {
  logEvent('CHAT_MESSAGE', {
    role,
    content,
    turnNumber,
  });
}
