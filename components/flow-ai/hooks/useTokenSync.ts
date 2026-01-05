"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchTokenPayload, persistTokenPayload } from '@/lib/flow-ai/token-client';

/**
 * Mirror HttpOnly cookie tokens into localStorage for features (WebSockets, legacy fetches)
 * that cannot read secure cookies directly.
 * 
 * Returns true when initial sync is complete, false while syncing.
 */
export function useTokenSync(): boolean {
  const syncingRef = useRef(false);
  const rerunRef = useRef(false);
  const [isInitialSyncComplete, setIsInitialSyncComplete] = useState(false);
  const hasRunInitialSync = useRef(false);

  const syncTokens = useCallback(async (isInitial = false, retryCount = 0) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 500; // ms
    
    if (syncingRef.current) {
      rerunRef.current = true;
      return;
    }

    syncingRef.current = true;
    try {
      const payload = await fetchTokenPayload();
      
      // If this is the initial sync and no tokens found, retry a few times
      // This handles edge cases where cookies haven't propagated yet
      if (isInitial && !payload && retryCount < MAX_RETRIES) {
        console.debug(`[token-sync] No tokens on initial sync, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
        syncingRef.current = false;
        setTimeout(() => {
          void syncTokens(true, retryCount + 1);
        }, RETRY_DELAY);
        return;
      }
      
      persistTokenPayload(payload);

      if (payload) {
        console.debug('[token-sync] Copied HttpOnly tokens into localStorage');
      } else {
        console.debug('[token-sync] No cookies present, cleared localStorage tokens');
      }
      
      // Mark initial sync as complete
      if (isInitial) {
        setIsInitialSyncComplete(true);
        console.debug('[token-sync] Initial sync complete');
      }
    } catch (error) {
      console.error('[token-sync] Failed to mirror cookies', error);
      
      // Retry on initial sync if failed
      if (isInitial && retryCount < MAX_RETRIES) {
        console.debug(`[token-sync] Error on initial sync, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
        syncingRef.current = false;
        setTimeout(() => {
          void syncTokens(true, retryCount + 1);
        }, RETRY_DELAY);
        return;
      }
      
      // Still mark as complete even on error to prevent infinite loading
      if (isInitial) {
        setIsInitialSyncComplete(true);
      }
    } finally {
      syncingRef.current = false;
      if (rerunRef.current) {
        rerunRef.current = false;
        void syncTokens(false, 0);
      }
    }
  }, []);

  useEffect(() => {
    // Run initial sync immediately
    if (!hasRunInitialSync.current) {
      hasRunInitialSync.current = true;
      void syncTokens(true);
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void syncTokens(false);
      }
    };

    const handleFocus = () => {
      void syncTokens(false);
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [syncTokens]);
  
  return isInitialSyncComplete;
}





