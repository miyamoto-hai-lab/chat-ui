export const PROVIDER_CONFIG = {
  openai: {
    defaultUrl: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-5.1',
    placeholderKey: 'sk-...',
    apiKeyHelpUrl: 'https://platform.openai.com/api-keys',
  },
  gemini: {
    defaultUrl: 'https://generativelanguage.googleapis.com/v1beta/models/',
    defaultModel: 'gemini-2.5-flash',
    placeholderKey: 'AIza...',
    apiKeyHelpUrl: 'https://aistudio.google.com/app/api-keys',
  },
  anthropic: {
    defaultUrl: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-sonnet-4-5',
    placeholderKey: 'sk-ant-...',
    apiKeyHelpUrl: 'https://console.anthropic.com/dashboard',
  },
  grok: {
    defaultUrl: 'https://api.x.ai/v1/chat/completions',
    defaultModel: 'grok-4-1-fast',
    placeholderKey: 'xai-...',
    apiKeyHelpUrl: 'https://console.x.ai/',
  },
  deepseek: {
    defaultUrl: 'https://api.deepseek.com/chat/completions',
    defaultModel: 'deepseek-reasoner',
    placeholderKey: 'sk-...',
    apiKeyHelpUrl: 'https://platform.deepseek.com/api_keys',
  },
} as const;
