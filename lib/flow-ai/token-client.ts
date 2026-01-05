'use client';

export const TOKENS_REFRESHED_EVENT = 'flowscan:tokens-refreshed';
export const TOKEN_REFRESH_FAILED_EVENT = 'flowscan:token-refresh-failed';

type TokenPayload = {
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: number | null;
  refreshTokenExpiresAt: number | null;
};

function normalizeBase64Url(input: string): string {
  let normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  while (normalized.length % 4 !== 0) {
    normalized += '=';
  }
  return normalized;
}

function decodeJwtExp(token: string | null): number | null {
  if (!token) return null;
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const decoded = atob(normalizeBase64Url(payload));
    const parsed = JSON.parse(decoded) as { exp?: number };
    return typeof parsed.exp === 'number' ? parsed.exp : null;
  } catch (error) {
    console.warn('Failed to decode JWT expiry', error);
    return null;
  }
}

export async function fetchTokenPayload(): Promise<TokenPayload | null> {
  try {
    const response = await fetch('/api/get-tokens', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch tokens: ${response.status}`);
    }

    const payload = (await response.json()) as TokenPayload;

    // Fallback: if server didn't include expiry, derive it client-side
    return {
      ...payload,
      accessTokenExpiresAt:
        payload.accessTokenExpiresAt ?? decodeJwtExp(payload.accessToken),
      refreshTokenExpiresAt:
        payload.refreshTokenExpiresAt ?? decodeJwtExp(payload.refreshToken),
    };
  } catch (error) {
    console.error('Failed to fetch tokens from server:', error);
    return null;
  }
}

export function persistTokenPayload(payload: TokenPayload | null): void {
  if (typeof window === 'undefined') return;

  if (payload?.accessToken) {
    localStorage.setItem('flowrms_access_token', payload.accessToken);
  } else {
    localStorage.removeItem('flowrms_access_token');
  }

  if (payload?.refreshToken) {
    localStorage.setItem('flowrms_refresh_token', payload.refreshToken);
  } else {
    localStorage.removeItem('flowrms_refresh_token');
  }

  if (payload?.accessTokenExpiresAt) {
    localStorage.setItem(
      'flowrms_access_token_exp',
      String(payload.accessTokenExpiresAt)
    );
  } else {
    localStorage.removeItem('flowrms_access_token_exp');
  }

  if (payload?.refreshTokenExpiresAt) {
    localStorage.setItem(
      'flowrms_refresh_token_exp',
      String(payload.refreshTokenExpiresAt)
    );
  } else {
    localStorage.removeItem('flowrms_refresh_token_exp');
  }
}

export function getAccessTokenExpiry(): number | null {
  if (typeof window === 'undefined') return null;

  const storedExp = localStorage.getItem('flowrms_access_token_exp');
  if (storedExp) {
    const parsed = Number.parseInt(storedExp, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  const token = localStorage.getItem('flowrms_access_token');
  return decodeJwtExp(token);
}

export function clearStoredTokens(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('flowrms_access_token');
  localStorage.removeItem('flowrms_refresh_token');
  localStorage.removeItem('flowrms_access_token_exp');
  localStorage.removeItem('flowrms_refresh_token_exp');
}

export type { TokenPayload };

export function notifyTokensRefreshed(detail?: Partial<TokenPayload>): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(TOKENS_REFRESHED_EVENT, {
      detail: detail ?? null,
    })
  );
}

export function notifyTokenRefreshFailed(detail?: { requiresLogin?: boolean }): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(TOKEN_REFRESH_FAILED_EVENT, {
      detail: detail ?? null,
    })
  );
}





