'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PasswordDialogProps {
  open: boolean;
  onAuthenticate: (password: string) => void;
  error?: { status: number; message: string } | null;
  isLoading?: boolean;
}

export function PasswordDialog({ open, onAuthenticate, error, isLoading }: PasswordDialogProps) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() && !isLoading) {
      onAuthenticate(password);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{t('password.title')}</DialogTitle>
          <DialogDescription>
            {t('password.description', '認証が必要です')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">{t('password.title')}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t('password.placeholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              disabled={isLoading}
            />
          </div>
          
          {error && (
            <div className="text-sm text-red-500 bg-red-50 p-2 rounded border border-red-200">
              <div className="font-bold">{t('password.authError')}</div>
              {error.status > 0 && <div>{t('password.status')}: {error.status}</div>}
              {error.message && (
                <div className="mt-1 whitespace-pre-wrap max-h-20 overflow-y-auto text-xs">
                    {t('password.response')}: {error.message}
                </div>
              )}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Authenticating...' : t('password.submit')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
