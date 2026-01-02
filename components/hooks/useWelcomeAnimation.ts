'use client';

import { useState, useEffect, useCallback } from 'react';

const WELCOME_SHOWN_KEY = 'flowcrm_welcome_animation_shown';

/**
 * Hook to manage welcome animation state
 * Shows animation once per browser session (until tab/window closes)
 * Uses sessionStorage which clears when tab closes
 */
export function useWelcomeAnimation() {
  // Start with false to match SSR - will update immediately on client
  const [showWelcome, setShowWelcome] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if we've already shown the welcome animation this session
    const hasShownWelcome = sessionStorage.getItem(WELCOME_SHOWN_KEY);

    if (!hasShownWelcome) {
      // First time visiting dashboard this session - show welcome
      setShowWelcome(true);
      // Mark as shown immediately to prevent race conditions
      sessionStorage.setItem(WELCOME_SHOWN_KEY, 'true');
    }
    // If hasShownWelcome is true, showWelcome stays false (default)

    setIsReady(true);
  }, []);

  const completeWelcome = useCallback(() => {
    setShowWelcome(false);
  }, []);

  // Reset welcome (for testing - can call from browser console)
  const resetWelcome = useCallback(() => {
    sessionStorage.removeItem(WELCOME_SHOWN_KEY);
    setShowWelcome(true);
  }, []);

  return {
    showWelcome,
    isReady,
    completeWelcome,
    resetWelcome,
  };
}
