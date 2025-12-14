import { replacePlaceholders } from '@/lib/placeholder';

export async function sendHeartbeat(password?: string) {
  const config = __APP_CONFIG__.system.heartbeat;

  if (!config || !config.enabled || !config.url) {
    return;
  }

  // Define variables for placeholders
  // Even if password is undefined, we pass it (as "" or undefined)
  // replacePlaceholders handles missing variables by default or we can explicitly pass ""
  // But per requirements, we should pass it.
  const variables: Record<string, string> = {};
  if (password) {
      variables['PASSWORD'] = password;
      variables['PASSWORD_BASE64'] = btoa(password);
  } else {
      variables['PASSWORD'] = '';
      variables['PASSWORD_BASE64'] = '';
  }

  try {
    const url = replacePlaceholders(config.url, variables);
    const method = config.method || 'GET';
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

    // Ignore errors as requested
    await fetch(url, {
      method,
      headers,
      body,
    }).catch(err => {
      console.warn('Heartbeat failed:', err);
    });

  } catch (e) {
    console.warn('Heartbeat preparation failed:', e);
  }
}
