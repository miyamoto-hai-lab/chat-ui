'use client';

import { Button } from '@/components/ui/button';
import { env } from '@/lib/env';
import { Download, ExternalLink, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ChatHeaderProps {
  onSettingsClick: () => void;
  onExportClick: () => void;
}

export function ChatHeader({ onSettingsClick, onExportClick }: ChatHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4">
        <h1 className="text-xl font-semibold">{env.appTitle}</h1>
        
        <div className="flex items-center gap-2">
          {env.allowExport && (
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

          {env.redirectUrlOnExit && (
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <a href={env.redirectUrlOnExit} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">{t('common.exit')}</span>
              </a>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
