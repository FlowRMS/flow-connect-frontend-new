'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { UnauthorizedModal } from '@/components/UnauthorizedModal';

interface UnauthorizedContextType {
  triggerUnauthorized: () => void;
  isUnauthorized: boolean;
}

const UnauthorizedContext = createContext<UnauthorizedContextType | undefined>(undefined);

// Delay before starting to check for UserNotFoundError (in milliseconds)
// This prevents false positives during initial authentication setup after login
const UNAUTHORIZED_CHECK_DELAY_MS = 10000; // 10 seconds

// Track when the app started to implement the delay
let appStartTime: number | null = null;

/**
 * Initialize the app start time - called when the provider mounts
 */
function initializeAppStartTime(): void {
  if (appStartTime === null) {
    appStartTime = Date.now();
  }
}

/**
 * Check if enough time has passed since app start to begin checking for unauthorized errors
 */
function isCheckDelayPassed(): boolean {
  if (appStartTime === null) return false;
  return Date.now() - appStartTime >= UNAUTHORIZED_CHECK_DELAY_MS;
}

/**
 * Check if an error response contains a UserNotFoundError
 * This error indicates the user is not authorized on the current tenancy
 *
 * NOTE: This will return false during the first 10 seconds after app load
 * to prevent false positives during initial authentication setup
 */
export function isUserNotFoundError(errors: Array<{ message?: string; extensions?: { type?: string; code?: string } }> | undefined): boolean {
  // Don't check during the initial delay period after login
  if (!isCheckDelayPassed()) {
    return false;
  }

  if (!errors || !Array.isArray(errors)) return false;

  return errors.some((error) => {
    // Check for UserNotFoundError type in extensions
    if (error.extensions?.type === 'UserNotFoundError') return true;

    // Check for the specific error message
    if (error.message?.toLowerCase().includes('user not found in the system')) return true;

    // Check for DOWNSTREAM_SERVICE_ERROR with UserNotFoundError type
    if (
      error.extensions?.code === 'DOWNSTREAM_SERVICE_ERROR' &&
      error.extensions?.type === 'UserNotFoundError'
    ) {
      return true;
    }

    return false;
  });
}

// Global flag to prevent multiple triggers
let hasTriggeredGlobal = false;

/**
 * Reset the global trigger flag (useful for testing)
 */
export function resetUnauthorizedTrigger(): void {
  hasTriggeredGlobal = false;
}

export function UnauthorizedProvider({ children }: { children: ReactNode }) {
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  // Initialize the app start time when the provider mounts
  useEffect(() => {
    initializeAppStartTime();
  }, []);

  const triggerUnauthorized = useCallback(() => {
    // Prevent multiple triggers
    if (hasTriggeredGlobal) return;
    hasTriggeredGlobal = true;
    setIsUnauthorized(true);
  }, []);

  return (
    <UnauthorizedContext.Provider value={{ triggerUnauthorized, isUnauthorized }}>
      {children}
      <UnauthorizedModal isOpen={isUnauthorized} />
    </UnauthorizedContext.Provider>
  );
}

export function useUnauthorized(): UnauthorizedContextType {
  const context = useContext(UnauthorizedContext);
  if (context === undefined) {
    throw new Error('useUnauthorized must be used within an UnauthorizedProvider');
  }
  return context;
}

// Global function that can be called from non-React contexts (like the GraphQL client)
let globalTriggerUnauthorized: (() => void) | null = null;

export function setGlobalUnauthorizedTrigger(trigger: () => void): void {
  globalTriggerUnauthorized = trigger;
}

export function triggerGlobalUnauthorized(): void {
  if (hasTriggeredGlobal) return;

  if (globalTriggerUnauthorized) {
    globalTriggerUnauthorized();
  } else {
    // Fallback if context isn't available yet - redirect directly
    hasTriggeredGlobal = true;
    console.error('User not authorized on tenancy - redirecting to sign-in');
    window.location.href = '/sign-in';
  }
}
