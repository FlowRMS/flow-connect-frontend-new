"use client";

import { useEffect, useRef } from 'react';
import {
  clearStoredTokens,
  fetchTokenPayload,
  getAccessTokenExpiry,
  notifyTokenRefreshFailed,
  notifyTokensRefreshed,
  persistTokenPayload,
} from '@/lib/flow-ai/token-client';

const REFRESH_BUFFER_MS = 60 * 1000; // refresh 1 minute before expiry
const CHECK_INTERVAL_MS = 30 * 1000; // evaluate twice per minute

export function useTokenAutoRefresh() {
  const refreshingRef = useRef(false);

  useEffect(() => {
    let intervalId: number | null = null;

    const shouldRefresh = () => {
      const expiry = getAccessTokenExpiry();
      if (!expiry) {
        return false;
      }

      const msUntilExpiry = expiry * 1000 - Date.now();
      return msUntilExpiry <= REFRESH_BUFFER_MS;
    };

    const refreshNow = async () => {
      if (refreshingRef.current) return;
      refreshingRef.current = true;

      try {
        const response = await fetch('/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 400) {
            console.warn('[token-refresh] Refresh token invalid, forcing login');
            clearStoredTokens();
            notifyTokenRefreshFailed({ requiresLogin: true });
            return;
          }
          throw new Error(`Token refresh failed: ${response.status}`);
        }

        const payload = await fetchTokenPayload();
        persistTokenPayload(payload);
        notifyTokensRefreshed(payload ?? undefined);
        console.debug('[token-refresh] Tokens refreshed successfully');
      } catch (error) {
        console.error('[token-refresh] Failed to refresh tokens', error);
      } finally {
        refreshingRef.current = false;
      }
    };

    const tick = () => {
      if (shouldRefresh()) {
        void refreshNow();
      }
    };

    intervalId = window.setInterval(tick, CHECK_INTERVAL_MS);
    // Run immediately in case we already need a refresh
    tick();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);
}





