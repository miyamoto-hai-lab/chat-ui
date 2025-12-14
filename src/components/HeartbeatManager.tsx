'use client';

import { usePasswordAuth } from '@/hooks/use-password-auth';
import { sendHeartbeat } from '@/lib/heartbeat';
import { useEffect } from 'react';

export function HeartbeatManager() {
  const { password } = usePasswordAuth();

  useEffect(() => {
    const config = __APP_CONFIG__.system.heartbeat;
    if (!config || !config.enabled || !config.interval_sec) {
      return;
    }

    const intervalMs = config.interval_sec * 1000;
    
    // Initial call
    sendHeartbeat(password);

    const intervalId = setInterval(() => {
      sendHeartbeat(password);
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [password]);

  return null;
}
