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
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { t, i18n } = useTranslation();
  const { settings, updateSettings } = useSettings();
  
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    if (open) {
      setLocalSettings(settings);
    }
  }, [settings, open]);

  const handleSave = () => {
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
                <Label htmlFor="apiServerUrl">{t('settings.apiServer')}</Label>
                <Input
                  id="apiServerUrl"
                  type="url"
                  placeholder={t('settings.apiServerPlaceholder')}
                  value={localSettings.apiServerUrl}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      apiServerUrl: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">{t('settings.apiKey')}</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder={t('settings.apiKeyPlaceholder')}
                  value={localSettings.apiKey}
                  onChange={(e) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      apiKey: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modelName">{t('settings.modelName')}</Label>
                <Input
                  id="modelName"
                  type="text"
                  placeholder={t('settings.modelNamePlaceholder')}
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
                placeholder={t('settings.systemPromptPlaceholder')}
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
