/**
 * Google Maps Script Loader Hook
 * Handles lazy loading of Google Maps JavaScript API with Places (New) API
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GoogleMapsLoadStatus, GoogleMapsLoaderState } from '../types';

// Global state to track script loading across components
let globalLoadState: GoogleMapsLoadStatus = 'idle';
let loadPromise: Promise<void> | null = null;
const callbacks: Set<(status: GoogleMapsLoadStatus) => void> = new Set();

const GOOGLE_MAPS_SCRIPT_ID = 'google-maps-script';
const GOOGLE_MAPS_CALLBACK = 'initGoogleMapsCallback';

/**
 * Get the Google Maps API key from environment variables
 */
const getApiKey = (): string => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn('Google Maps API key not found. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable.');
  }
  return apiKey || '';
};

/**
 * Check if Google Maps is already loaded (with new Places API)
 */
const isGoogleMapsLoaded = (): boolean => {
  return typeof window !== 'undefined' &&
         typeof window.google !== 'undefined' &&
         typeof window.google.maps !== 'undefined' &&
         typeof window.google.maps.places !== 'undefined';
};

/**
 * Load the Google Maps script with Places (New) API
 */
const loadGoogleMapsScript = (): Promise<void> => {
  if (loadPromise) return loadPromise;

  if (isGoogleMapsLoaded()) {
    globalLoadState = 'ready';
    return Promise.resolve();
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    globalLoadState = 'error';
    return Promise.reject(new Error('Google Maps API key not configured'));
  }

  globalLoadState = 'loading';
  notifyCallbacks('loading');

  loadPromise = new Promise((resolve, reject) => {
    // Set up the callback that Google will call when loaded
    (window as unknown as Record<string, () => void>)[GOOGLE_MAPS_CALLBACK] = () => {
      globalLoadState = 'ready';
      notifyCallbacks('ready');
      resolve();
    };

    // Create script element
    const script = document.createElement('script');
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.type = 'text/javascript';
    script.async = true;
    script.defer = true;

    // Build the URL with the new Places API
    // Using 'places' library which now loads the new Places API
    const params = new URLSearchParams({
      key: apiKey,
      libraries: 'places,marker',
      callback: GOOGLE_MAPS_CALLBACK,
      v: 'weekly',
      loading: 'async',
    });

    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;

    script.onerror = () => {
      globalLoadState = 'error';
      notifyCallbacks('error');
      reject(new Error('Failed to load Google Maps script'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
};

/**
 * Notify all registered callbacks of status change
 */
const notifyCallbacks = (status: GoogleMapsLoadStatus): void => {
  callbacks.forEach(callback => callback(status));
};

/**
 * Hook to load and use Google Maps
 * Handles lazy loading and provides status updates
 */
export function useGoogleMapsLoader(): GoogleMapsLoaderState & {
  load: () => Promise<void>;
  isReady: boolean;
} {
  const [state, setState] = useState<GoogleMapsLoaderState>({
    status: isGoogleMapsLoaded() ? 'ready' : globalLoadState,
  });

  useEffect(() => {
    // If already loaded, update state
    if (isGoogleMapsLoaded() && state.status !== 'ready') {
      setState({ status: 'ready' });
      return;
    }

    // Register callback for status updates
    const callback = (status: GoogleMapsLoadStatus) => {
      setState({
        status,
        error: status === 'error' ? 'Failed to load Google Maps' : undefined
      });
    };

    callbacks.add(callback);

    // Sync with global state
    if (globalLoadState !== state.status) {
      setState({ status: globalLoadState });
    }

    return () => {
      callbacks.delete(callback);
    };
  }, [state.status]);

  const load = useCallback(async () => {
    if (isGoogleMapsLoaded()) {
      setState({ status: 'ready' });
      return;
    }

    try {
      await loadGoogleMapsScript();
    } catch (err) {
      setState({
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to load Google Maps'
      });
    }
  }, []);

  return {
    ...state,
    load,
    isReady: state.status === 'ready',
  };
}

/**
 * Preload Google Maps script (can be called early to improve UX)
 */
export function preloadGoogleMaps(): void {
  if (typeof window === 'undefined') return;
  if (globalLoadState !== 'idle') return;

  loadGoogleMapsScript().catch(() => {
    // Silently fail preload - will be handled when hook is used
  });
}
