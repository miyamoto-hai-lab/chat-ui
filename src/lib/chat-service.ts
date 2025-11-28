import { env } from '@/lib/env';
import { PROVIDER_CONFIG } from '@/lib/provider-config';
import type { ChatMessage, ChatSettings } from '@/types/chat';

export interface ChatRequestOptions {
  messages: ChatMessage[];
  settings: ChatSettings;
  password?: string;
  onUpdate: (content: string, reasoning?: string) => void;
  signal?: AbortSignal;
}

export class ChatService {
  static async sendMessage({
    messages,
    settings,
    password,
    onUpdate,
    signal,
  }: ChatRequestOptions): Promise<void> {
    const { provider } = settings;

    switch (provider) {
      case 'gemini':
        await this.sendGeminiRequest({ messages, settings, password, onUpdate, signal });
        break;
      case 'anthropic':
        await this.sendAnthropicRequest({ messages, settings, password, onUpdate, signal });
        break;
      case 'grok':
      case 'deepseek':
      case 'openai':
      default:
        await this.sendOpenAICompatibleRequest({ messages, settings, password, onUpdate, signal });
        break;
    }
  }

  private static async sendOpenAICompatibleRequest({
    messages,
    settings,
    password,
    onUpdate,
    signal,
  }: ChatRequestOptions): Promise<void> {
    const requestMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    if (settings.systemPrompt) {
      requestMessages.unshift({
        role: 'system',
        content: settings.systemPrompt,
      });
    }

    const provider = settings.provider || 'openai';
    const providerConfig = PROVIDER_CONFIG[provider as keyof typeof PROVIDER_CONFIG] || PROVIDER_CONFIG['openai'];

    const requestBody: Record<string, unknown> = {
      messages: requestMessages,
      stream: true,
    };

    if (settings.modelName) {
      requestBody.model = settings.modelName;
    } else {
      requestBody.model = providerConfig.defaultModel;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(settings.apiKey && { Authorization: `Bearer ${settings.apiKey}` }),
      ...(password && { 'chatui-password': password }),
    };

    const apiServerUrl = settings.apiServerUrl || providerConfig.defaultUrl;

    const response = await fetch(apiServerUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    if (!response.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedContent = '';
    let accumulatedReasoning = '';

    try {
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
              const delta = parsed.choices?.[0]?.delta;
              const content = delta?.content || '';
              const reasoning = delta?.reasoning_content || ''; // DeepSeek specific

              if (content) {
                accumulatedContent += content;
              }
              if (reasoning) {
                accumulatedReasoning += reasoning;
              }
              
              onUpdate(accumulatedContent, accumulatedReasoning);
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private static async sendGeminiRequest({
    messages,
    settings,
    password,
    onUpdate,
    signal,
  }: ChatRequestOptions): Promise<void> {
    // Gemini API implementation
    // https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?key={apiKey}
    
    const contents = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));


    // Construct URL with API key
    // Base URL should be like https://generativelanguage.googleapis.com/v1beta/models/
    // We append {model}:{method}
    
    const providerConfig = PROVIDER_CONFIG['gemini'];
    let baseUrl = settings.apiServerUrl || providerConfig.defaultUrl;
    if (!baseUrl.endsWith('/')) {
      baseUrl += '/';
    }
    
    // If the user entered a full URL including the model, we should probably respect it if it matches our expectations,
    // but the requirement is to construct it.
    // The settings dialog trims it to .../models/, so we assume that format.
    
    const modelName = settings.modelName || providerConfig.defaultModel;
    const method = env.assistantResponseMode === 'streaming' ? 'streamGenerateContent' : 'generateContent';
    const urlString = `${baseUrl}${modelName}:${method}`;
    
    const url = new URL(urlString);
    url.searchParams.append('key', settings.apiKey);
    
    const requestBody: any = {
      contents,
      generationConfig: {
        thinkingConfig: {
          includeThoughts: true
        }
      }
    };

    if (settings.systemPrompt) {
      requestBody.system_instruction = {
        parts: [{ text: settings.systemPrompt }]
      };
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API request failed: ${response.status} - ${errorText}`);
    }

    if (!response.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedContent = '';
    let accumulatedReasoning = '';
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Gemini returns a JSON array: [{...}, {...}] or stream of objects.
        // We need to parse complete JSON objects from the buffer.
        
        let braceCount = 0;
        let startIndex = 0;
        let inString = false;
        let escaped = false;
        let processedIndex = 0;

        for (let i = 0; i < buffer.length; i++) {
          const char = buffer[i];
          
          if (escaped) {
            escaped = false;
            continue;
          }
          
          if (char === '\\') {
            escaped = true;
            continue;
          }
          
          if (char === '"') {
            inString = !inString;
            continue;
          }
          
          if (!inString) {
            if (char === '{') {
              if (braceCount === 0) startIndex = i;
              braceCount++;
            } else if (char === '}') {
              braceCount--;
              if (braceCount === 0) {
                // Found a complete object
                const jsonStr = buffer.substring(startIndex, i + 1);
                try {
                  const parsed = JSON.parse(jsonStr);
                  // Process candidate
                  const candidate = parsed.candidates?.[0];
                  if (candidate?.content?.parts) {
                    for (const part of candidate.content.parts) {
                      if (part.thought) {
                        accumulatedReasoning += part.text;
                      } else {
                        accumulatedContent += part.text;
                      }
                    }
                    onUpdate(accumulatedContent, accumulatedReasoning);
                  }
                } catch (e) {
                  // console.error('JSON parse error', e);
                }
                processedIndex = i + 1;
              }
            }
          }
        }
        
        // Remove processed objects from buffer
        if (processedIndex > 0) {
          buffer = buffer.substring(processedIndex);
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private static async sendAnthropicRequest({
    messages,
    settings,
    password,
    onUpdate,
    signal,
  }: ChatRequestOptions): Promise<void> {
    // Anthropic API implementation
    // https://api.anthropic.com/v1/messages
    
    const requestMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
    })).filter(m => m.role !== 'system'); // System prompt is separate

    const systemMessage = settings.systemPrompt;

    const apiServerUrl = settings.apiServerUrl || PROVIDER_CONFIG['anthropic'].defaultUrl;

    const response = await fetch(apiServerUrl, {
      method: 'POST',
      headers: {
        'x-api-key': settings.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'dangerously-allow-browser': 'true' // Needed for client-side calls
      },
      body: JSON.stringify({
        model: settings.modelName || PROVIDER_CONFIG['anthropic'].defaultModel,
        messages: requestMessages,
        system: systemMessage,
        stream: true,
        max_tokens: 4096,
      }),
      signal,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API request failed: ${response.status} - ${errorText}`);
    }

    if (!response.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
            if (line.startsWith('event: ')) {
                // event type
            } else if (line.startsWith('data: ')) {
                const data = line.slice(6);
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.type === 'content_block_delta') {
                        accumulatedContent += parsed.delta.text;
                        onUpdate(accumulatedContent);
                    }
                } catch {}
            }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
