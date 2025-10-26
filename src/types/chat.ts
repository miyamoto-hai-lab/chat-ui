export interface ChatSettings {
  apiServerUrl: string;
  apiKey: string;
  modelName: string;
  systemPrompt: string;
  showThinking: boolean;
  language: string;
}

export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  createdAt?: Date;
}

export type ResponseMode = 'streaming' | 'spinner' | 'read' | 'instant';

export type EventType = 'KEY_INPUT' | 'CHAT_MESSAGE';

export interface EventData {
  eventType: EventType;
  timestamp: string;
  data: Record<string, any>;
}

export interface PasswordAuthState {
  isAuthenticated: boolean;
  password: string;
}
