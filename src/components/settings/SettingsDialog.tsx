'use client';

import { useSettings } from '@/components/providers/SettingsProvider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { env } from '@/lib/env';
import { PROVIDER_CONFIG } from '@/lib/provider-config';
import { HelpCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SimpleTooltip({ children, content }: { children: React.ReactNode; content: string }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-md whitespace-nowrap z-50 border">
          {content}
        </div>
      )}
    </div>
  );
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { t, i18n } = useTranslation();
  const { settings, updateSettings } = useSettings();
  
  const [localSettings, setLocalSettings] = useState(settings);
  const [apiKeyError, setApiKeyError] = useState(false);

  useEffect(() => {
    if (open) {
      setLocalSettings(settings);
      setApiKeyError(false);
    }
  }, [settings, open]);

  const handleSave = () => {
    if (!localSettings.apiKey) {
      setApiKeyError(true);
      return;
    }
    updateSettings(localSettings);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setLocalSettings(settings);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('settings.title')}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* APIサーバー設定 */}
          {env.allowUserApiServer && (
            <>
              <div className="space-y-2">
                <Label htmlFor="provider">{t('settings.provider')}</Label>
                <select
                  id="provider"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={localSettings.provider || 'openai'}
                  onChange={(e) => {
                    const provider = e.target.value as keyof typeof PROVIDER_CONFIG;
                    
                    setLocalSettings((prev) => ({
                      ...prev,
                      provider,
                      // Do not overwrite URL and Model with defaults, only update provider
                      // Placeholders will update automatically based on provider
                    }));
                  }}
                >
                  <option value="openai">OpenAI</option>
                  <option value="gemini">Google Gemini</option>
                  <option value="anthropic">Anthropic Claude</option>
                  <option value="grok">xAI Grok</option>
                  <option value="deepseek">DeepSeek</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiServerUrl">{t('settings.apiServer')}</Label>
                <Input
                  id="apiServerUrl"
                  type="url"
                  placeholder={PROVIDER_CONFIG[localSettings.provider || 'openai'].defaultUrl}
                  value={localSettings.apiServerUrl}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      apiServerUrl: e.target.value,
                    }))
                  }
                  onBlur={() => {
                    if (localSettings.provider === 'gemini') {
                      const url = localSettings.apiServerUrl;
                      // Check if URL ends with specific pattern and trim it
                      // Pattern: .../models/{model}:{method}
                      // We look for /models/ and then trim after the next slash if it looks like a model name followed by method
                      if (url.includes('/models/')) {
                        const parts = url.split('/models/');
                        if (parts.length === 2) {
                          const afterModels = parts[1];
                          if (afterModels.includes(':')) {
                             // Likely has :streamGenerateContent or :generateContent
                             const newUrl = parts[0] + '/models/';
                             setLocalSettings(prev => ({
                               ...prev,
                               apiServerUrl: newUrl
                             }));
                          }
                        }
                      }
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="apiKey">{t('settings.apiKey')}</Label>
                  {apiKeyError && (
                    <div className="flex items-center gap-1 text-red-500 text-sm">
                      <span>{t('settings.apiKeyError')}</span>
                      <SimpleTooltip content={t('settings.apiKeyHelp')}>
                        <a 
                          href={PROVIDER_CONFIG[localSettings.provider || 'openai'].apiKeyHelpUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-red-600 transition-colors"
                        >
                          <HelpCircle className="h-4 w-4" />
                        </a>
                      </SimpleTooltip>
                    </div>
                  )}
                </div>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder={PROVIDER_CONFIG[localSettings.provider || 'openai'].placeholderKey}
                  value={localSettings.apiKey}
                  className={apiKeyError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  onChange={(e) => {
                    setLocalSettings((prev) => ({
                      ...prev,
                      apiKey: e.target.value,
                    }));
                    if (e.target.value) {
                      setApiKeyError(false);
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modelName">{t('settings.modelName')}</Label>
                <Input
                  id="modelName"
                  type="text"
                  placeholder={PROVIDER_CONFIG[localSettings.provider || 'openai'].defaultModel}
                  value={localSettings.modelName}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      modelName: e.target.value,
                    }))
                  }
                />
              </div>
            </>
          )}

          {/* システムプロンプト */}
          {env.allowUserSystemPrompt && (
            <div className="space-y-2">
              <Label htmlFor="systemPrompt">{t('settings.systemPrompt')}</Label>
              <Textarea
                id="systemPrompt"
                placeholder={t('settings.systemPrompt')}
                value={localSettings.systemPrompt}
                onChange={(e) =>
                  setLocalSettings((prev) => ({
                    ...prev,
                    systemPrompt: e.target.value,
                  }))
                }
                rows={4}
              />
            </div>
          )}

          {/* Thinking表示設定 */}
          {env.allowUserShowThinking && (
            <div className="flex items-center justify-between">
              <Label htmlFor="showThinking">{t('settings.showThinking')}</Label>
              <Switch
                id="showThinking"
                checked={localSettings.showThinking}
                onCheckedChange={(checked) =>
                  setLocalSettings((prev) => ({
                    ...prev,
                    showThinking: checked,
                  }))
                }
              />
            </div>
          )}


          {/* 言語設定 */}
          <div className="space-y-2">
            <Label htmlFor="language">{t('settings.language')}</Label>
            <select
              id="language"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={localSettings.language}
              onChange={(e) => {
                const lang = e.target.value;
                setLocalSettings((prev) => ({
                  ...prev,
                  language: lang,
                }));
                i18n.changeLanguage(lang);
              }}
            >
              <option value="ja">日本語</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        {/* ボタン */}
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={handleCancel}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave}>{t('common.save')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
