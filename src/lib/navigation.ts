import { replacePlaceholders } from '@/lib/placeholder';

/**
 * Executes the application exit logic.
 * If an exit redirect URL is configured, it replaces placeholders (including password) and redirects there.
 * Otherwise, it reloads the current page.
 * 
 * @param password - The current authentication password, if any.
 */
export function performAppExit(password?: string): void {
  // Ensure we are in the browser environment
  if (typeof window === 'undefined') return;

  if (__APP_CONFIG__.chat.exit_redirect_url) {
    window.location.href = replacePlaceholders(__APP_CONFIG__.chat.exit_redirect_url, {
      PASSWORD: password ?? '',
    });
  } else {
    window.location.reload();
  }
}
