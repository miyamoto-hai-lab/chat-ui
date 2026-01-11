'use client';

import { replacePlaceholders } from '@/lib/placeholder';
import { loadPassword, savePassword } from '@/lib/storage';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

interface AuthError {
  status: number;
  message: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  password: string;
  isLoading: boolean;
  error: AuthError | null;
  authenticate: (password: string) => Promise<void>;
  logout: () => void;
  isEnabled: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  const performAuthRequest = useCallback(async (inputPassword: string) => {
    const config = __APP_CONFIG__.system.security.auth_request;
    if (!config || !config.url) {
      throw new Error('Auth server URL is not configured');
    }

    // register PASSWORD to placeholder variables
    const variables = {
      PASSWORD: inputPassword,
    };

    const url = replacePlaceholders(config.url, variables);
    const method = config.method || 'POST';
    const headers: Record<string, string> = {};

    if (config.headers) {
      for (const [key, value] of Object.entries(config.headers)) {
        headers[key] = replacePlaceholders(value, variables);
      }
    }
    if (!headers['Content-Type'] && method !== 'GET') {
      headers['Content-Type'] = 'application/json';
    }

    let body = undefined;
    if (config.body && method !== 'GET') {
      body = replacePlaceholders(config.body, variables);
    }

    const res = await fetch(url, {
      method,
      headers,
      body,
    });

    if (!res.ok) {
      const text = await res.text();
      throw { status: res.status, message: text };
    }
  }, []);

  const authenticateWithRetry = useCallback(
    async (inputPassword: string, maxRetries: number): Promise<boolean> => {
      let retries = 0;
      while (retries <= maxRetries) {
        try {
          await performAuthRequest(inputPassword);
          return true;
        } catch (err: unknown) {
          const authErr = err as { status?: number; message?: string };
          // 5xx or 429 errors -> Retry
          if (authErr.status && (authErr.status >= 500 || authErr.status === 429)) {
            retries++;
            if (retries > maxRetries) {
              setError({
                status: authErr.status,
                message: authErr.message || 'Unknown error',
              });
              return false;
            }
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * Math.pow(2, retries))
            );
            continue;
          }
          // Other errors (e.g. 401) -> Fail immediately
          setError({
            status: authErr.status || 0,
            message: authErr.message || 'Unknown error',
          });
          return false;
        }
      }
      return false;
    },
    [performAuthRequest]
  );

  useEffect(() => {
    const checkAuth = async () => {
      if (!__APP_CONFIG__.system.security.password_auth_enabled) {
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const queryPasswordB64 = params.get('p');
      if (queryPasswordB64) {
        try {
          const queryPassword = atob(queryPasswordB64);
          setPassword(queryPassword);
          const success = await authenticateWithRetry(queryPassword, 3);
          if (success) {
            setIsAuthenticated(true);
            savePassword(queryPassword);
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.error('Failed to decode password from query:', e);
        }
      }

      const stored = loadPassword();
      if (stored) {
        setPassword(stored);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [authenticateWithRetry]);

  const authenticate = useCallback(
    async (inputPassword: string) => {
      setError(null);
      setIsLoading(true);
      try {
        await performAuthRequest(inputPassword);
        setPassword(inputPassword);
        savePassword(inputPassword);
        setIsAuthenticated(true);
      } catch (err: unknown) {
        console.error('Auth check failed:', err);
        const authErr = err as { status?: number; message?: string };
        setError({
          status: authErr.status || 0,
          message: authErr.message || 'Unknown error',
        });
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    },
    [performAuthRequest]
  );

  const logout = useCallback(() => {
    setPassword('');
    savePassword('');
    setIsAuthenticated(false);
    setError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        password: isAuthenticated ? password : '',
        isLoading,
        error,
        authenticate,
        logout,
        isEnabled: !!__APP_CONFIG__.system.security.password_auth_enabled,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
