export function replacePlaceholders(
  template: string,
  variables: Record<string, string> = {}
): string {
  // variables map overrides default behvior or provides PASSWORD logic if passed as "PASSWORD"
  // But user request implies logic should be built-in.
  
  // Allow lowercase in keys (e.g. PARAM.source)
  return template.replace(/\$\{([a-zA-Z0-9_.]+)\}/g, (match, key) => {
    // 1. Check explicit variables passed (fallback/override)
    if (key in variables) {
      return variables[key];
    }

    // 2. Handle PASSWORD / PASSWORD_BASE64
    // We expect the password to be passed in 'variables' usually, but if we want it "global",
    // we might need to rely on the caller passing it, OR accessed via some other way.
    // However, since this is a pure function, we stick to the caller passing 'PASSWORD' in variables
    // for now, OR valid logic if 'param'
    
    // Check PARAM.<key>
    if (key.startsWith('PARAM.')) {
      if (typeof window !== 'undefined') {
        const paramName = key.substring(6); // remove 'PARAM.'
        const params = new URLSearchParams(window.location.search);
        const val = params.get(paramName);
        if (val !== null) return val;
      }
      // If not found or not browser, return empty string as requested
      return '';
    }
    
    // 3. Handle specific PASSWORD keys if NOT passed in variables (maybe empty defaults)
    if (key === 'PASSWORD' || key === 'PASSWORD_BASE64') {
        // If it wasn't in variables, return empty string as per requirement
        return '';
    }

    // Default: return match (no replacement) -> Wait, user asked for "PARAM..+" to be replaced with empty if missing.
    // But for unknown placeholders (e.g. ${UNKNOWN}), should we leave them? 
    // The user said: "`${PARAM\..+}`に該当する文字列すべてに対して展開を行い，クエリパラメータがないものに関しては空文字列を入れる"
    // So only PARAM.* should become empty. Other things can stay match.
    // My logic above does exactly that: if key starts with PARAM., return ''.
    return match;
  });
}
