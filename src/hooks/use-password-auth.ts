'use client';

import { env } from '@/lib/env';
import { loadPassword, savePassword } from '@/lib/storage';
import { useEffect, useState } from 'react';

export function usePasswordAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // パスワード認証が無効の場合は常に認証済み
    if (!env.authPassword) {
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    // localStorageからパスワードを読み込み
    const stored = loadPassword();
    if (stored) {
      setPassword(stored);
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const authenticate = (inputPassword: string) => {
    setPassword(inputPassword);
    savePassword(inputPassword);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setPassword('');
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    password,
    isLoading,
    authenticate,
    logout,
    isEnabled: !!env.authPassword,
  };
}
