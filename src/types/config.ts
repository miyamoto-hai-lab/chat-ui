export interface AppConfig {
  base_path: string;
  app: {
    title: string;
    description?: string;
  };
  llm: {
    defaults: {
      provider: 'openai' | 'gemini' | 'anthropic' | 'grok' | 'deepseek';
      endpoint_url?: string;
      model: string;
      api_key?: string;
      system_prompt?: string;
      enable_thinking?: boolean;
    };
    permissions: {
      allow_change_config: boolean;
      allow_change_system_prompt: boolean;
      allow_toggle_thinking: boolean;
    };
  };
  chat: {
    initial_sender: 'user' | 'assistant';
    max_turns: number;
    on_limit_reached: {
      action: 'modal' | 'inline' | 'none';
      auto_exit_delay_sec: number;
    };
    exit_redirect_url: string;
  };
  ui: {
    styles: {
      generation_style: 'streaming' | 'spinner' | 'read' | 'instant';
      message_style: 'bubble' | 'flat';
    };
    components: {
      exit_button_visibility: 'always' | 'on_limit' | 'never';
      allow_import: boolean;
      allow_export: boolean;
    };
    turn_counter: {
      style: 'hidden' | 'fraction' | 'custom';
      custom_label?: string;
    };
    export: {
      filename_prefix: string;
    };
  };
  system: {
    security: {
      password_auth_enabled: boolean;
      auth_server_url?: string;
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