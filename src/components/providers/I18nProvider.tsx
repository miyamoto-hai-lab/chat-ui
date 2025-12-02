'use client';

import i18n from '@/lib/i18n';
import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // i18nの初期化を確認
    if (!i18n.isInitialized) {
      i18n.init();
    }
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
