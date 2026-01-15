export interface ThinkingTag {
  start: string;
  end: string;
}

export interface AppConfig {
  base_path: string;
  app: {
    title: string;
    description?: string | {
      contents: string;
      position?: 'top' | 'bottom' | 'left' | 'right';
      max_height?: string;
      width?: string;
    };
  };
  llm: {
    provider: 'openai' | 'gemini' | 'anthropic' | 'grok' | 'deepseek';
    endpoint_url?: string;
    model: string;
    api_key?: string;
    system_prompt?: string;
    enable_thinking?: boolean;
    thinking_tags?: ThinkingTag[];
    permissions: {
      allow_change_config: boolean;
      allow_change_system_prompt: boolean;
      allow_toggle_thinking: boolean;
    };
  };
  chat: {
    start_role: 'user' | 'assistant';
    max_turns: number;
    on_limit_reached: {
      action: 'modal' | 'inline' | 'none';
      auto_exit_delay_sec: number;
    };
    exit_redirect_url: string;
    prefill_messages?: {
      role: 'user' | 'assistant';
      text: string;
      reasoning?: string;
    }[];
    user_name?: string;
    assistant_name?: string;
  };
  ui: {
    styles: {
      generation_style: 'streaming' | 'spinner' | 'read' | 'instant';
      message_style: 'bubble' | 'flat';
    };
    components: {
      exit_button_visibility: 'always' | 'on_limit' | 'never' | number;
      allow_import: boolean;
      allow_export: boolean;
      candidates?: {
        show_turn: number;
        hide_turn: number;
        contents: string[];
      };
    };
    turn_counter: {
      style: 'hidden' | 'fraction' | 'custom';
      custom_label?: string;
    };
    export: {
      filename_prefix: string;
      include_settings?: boolean;
    };
    theme?: {
      base?: 'light' | 'dark' | 'system';
      colors?: {
        background?: string;
        user_bubble?: string;
        user_bubble_text?: string;
        assistant_bubble?: string;
        assistant_bubble_text?: string;
      };
    };
  };
  system: {
    security: {
      password_auth_enabled: boolean;
      auth_request?: {
        url: string;
        method?: 'GET' | 'POST' | 'PUT';
        headers?: Record<string, string>;
        body?: string;
      };
    };
    logging: {
      endpoint_url?: string;
      target_events: string[];
    };
    heartbeat: {
      enabled: boolean;
      interval_sec?: number;
      url?: string;
      method: 'GET' | 'POST' | 'PUT';
      headers?: Record<string, string>;
      body?: string;
    };
  };
}