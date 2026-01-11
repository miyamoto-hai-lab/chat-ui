export interface ChatSettings {
  provider: 'openai' | 'gemini' | 'anthropic' | 'grok' | 'deepseek';
  apiServerUrl: string;
  apiKey: string;
  modelName: string;
  systemPrompt: string;
  showThinking: boolean;
  thinkingTags: { start: string; end: string }[];
  language: string;
}

export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  reasoning?: string;
  createdAt?: Date;
}

export type ResponseMode = 'streaming' | 'spinner' | 'read' | 'instant';

export type EventType = 'KEY_INPUT' | 'CHAT_MESSAGE';

export interface EventData {
  eventType: EventType;
  timestamp: string;
  data: Record<string, any>;
  parameters?: Record<string, string>;
}

export interface PasswordAuthState {
  isAuthenticated: boolean;
  password: string;
}
