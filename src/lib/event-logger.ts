import { loadPassword } from '@/lib/storage';
import type { EventData, EventType } from '@/types/chat';

export async function logEvent(
  eventType: EventType,
  data: Record<string, any>
): Promise<void> {
  // イベントが有効化されていない場合は何もしない
  if (!__APP_CONFIG__.system.logging.target_events.includes(eventType)) {
    return;
  }

  // エンドポイントが設定されていない場合は何もしない
  if (!__APP_CONFIG__.system.logging.endpoint_url) {
    return;
  }

  // クエリパラメータの取得
  const parameters: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    new URLSearchParams(window.location.search).forEach((value, key) => {
      parameters[key] = value;
    });
  }

  const eventData: EventData = {
    eventType,
    timestamp: new Date().toISOString(),
    data,
    parameters,
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // パスワード認証が有効な場合はAuthorizationヘッダーを追加
  if (__APP_CONFIG__.system.security.password_auth_enabled) {
    const password = loadPassword();
    if (password) {
      try {
        headers['Authorization'] = `Bearer ${btoa(password)}`;
      } catch (e) {
        console.error('Failed to encode password for logging auth header:', e);
      }
    }
  }

  try {
    await fetch(__APP_CONFIG__.system.logging.endpoint_url, {
      method: 'POST',
      headers,
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
