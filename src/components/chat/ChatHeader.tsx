'use client';

import { Button } from '@/components/ui/button';
import { performAppExit } from '@/lib/navigation';
import { Download, LogOut, Settings, Upload } from 'lucide-react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface ChatHeaderProps {
  onSettingsClick: () => void;
  onExportClick: () => void;
  onImportClick?: (file: File) => void;
  isLimitReached?: boolean;
  password?: string;
}

export function ChatHeader({ onSettingsClick, onExportClick, onImportClick, isLimitReached, password }: ChatHeaderProps) { // Added onImportClick
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null); // Added useRef

  const handleImportClick = () => { // Added handleImportClick
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { // Added handleFileChange
    const file = e.target.files?.[0];
    if (file && onImportClick) {
      onImportClick(file);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 終了ボタンを表示するかどうか
  const showExitButton = (() => {
    if (__APP_CONFIG__.ui.components.exit_button_visibility === 'never') return false;
    if (__APP_CONFIG__.ui.components.exit_button_visibility === 'always') return true;
    if (__APP_CONFIG__.ui.components.exit_button_visibility === 'on_limit') return !!isLimitReached;
    return true;
  })();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4">
        <h1 className="text-xl font-semibold">{__APP_CONFIG__.app.title}</h1>
        
        <div className="flex items-center gap-2">
          {__APP_CONFIG__.ui.components.allow_import && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".json"
                onChange={handleFileChange}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleImportClick}
                title={t('common.import') || 'インポート'}
              >
                <Upload className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">{t('common.import') || 'インポート'}</span>
              </Button>
            </>
          )}

          {__APP_CONFIG__.ui.components.allow_export && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onExportClick}
              title={t('common.export')}
            >
              <Download className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">{t('common.export')}</span>
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onSettingsClick}
            title={t('common.settings')}
          >
            <Settings className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">{t('common.settings')}</span>
          </Button>

          {showExitButton && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                performAppExit(password);
              }}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <LogOut className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">{t('common.exit')}</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
