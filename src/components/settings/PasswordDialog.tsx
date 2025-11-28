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
}

export function PasswordDialog({ open, onAuthenticate }: PasswordDialogProps) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
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
            />
          </div>
          <Button type="submit" className="w-full">
            {t('password.submit')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
