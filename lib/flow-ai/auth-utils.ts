/**
 * ⚠️ DEPRECATED - Legacy authentication utilities
 * 
 * This file is DEPRECATED and should NOT be used for new code.
 * 
 * Flowscan now uses OAuth 2.0 Authorization Code + PKCE flow with Keycloak.
 * Tokens are stored in HttpOnly cookies, not localStorage.
 * 
 * See:
 * - /lib/auth-cookies.ts for cookie management
 * - /lib/pkce.ts for PKCE utilities and token validation
 * - /app/auth/login/route.ts for authentication flow
 * - /app/auth/callback/route.ts for OAuth callback handling
 * 
 * This file is kept only for backward compatibility during migration.
 * It may be removed in a future version.
 */

/**
 * @deprecated Use HttpOnly cookies via /lib/auth-cookies.ts instead
 * Kept for backward compatibility only
 */
export function getStoredTokens() {
  if (typeof window === 'undefined') return { accessToken: null, refreshToken: null };
  
  const accessToken = localStorage.getItem('flowrms_access_token');
  const refreshToken = localStorage.getItem('flowrms_refresh_token');
  
  return { accessToken, refreshToken };
}

/**
 * @deprecated Use isTokenExpired from /lib/pkce.ts instead
 * Kept for backward compatibility only
 */
export function isTokenExpired(token: string): boolean {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch {
    return true;
  }
}

/**
 * @deprecated Authentication flow now uses /auth/login route
 * Kept for backward compatibility only
 */
export function shouldRedirectToAuth(): boolean {
  const { accessToken, refreshToken } = getStoredTokens();
  
  // No tokens stored
  if (!accessToken || !refreshToken) {
    return true;
  }
  
  // Access token expired
  if (isTokenExpired(accessToken)) {
    return true;
  }
  
  return false;
}

/**
 * @deprecated Use window.location.href directly
 * Kept for backward compatibility only
 */
export function redirectToFlowRMSApp() {
  const appUrl = process.env.NEXT_PUBLIC_FLOWRMS_APP_URL;
  if (appUrl && typeof window !== 'undefined') {
    window.location.href = appUrl;
  }
}

/**
 * @deprecated Use clearAuthCookies from /lib/auth-cookies.ts instead
 * Kept for backward compatibility only
 */
export function clearStoredTokens() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('flowrms_access_token');
    localStorage.removeItem('flowrms_refresh_token');
  }
}




