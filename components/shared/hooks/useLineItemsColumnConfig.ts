/**
 * useLineItemsColumnConfig Hook
 * Generic hook for managing line items column configuration with Settings API persistence
 * Works with Quotes, Orders, Invoices, and other entities that have columnConfig in their settings
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseLineItemsColumnConfigOptions<TColumnConfig, TSettingsValue> {
  // Settings hook result
  settings: TSettingsValue | null;
  isInitialized: boolean;
  saveSettings: (value: TSettingsValue, scope: 'my' | 'tenant') => Promise<boolean>;

  // Defaults
  defaultColumnConfig: TColumnConfig[];
  defaultSettings: TSettingsValue;

  // Config
  debounceMs?: number; // default: 500
  scope?: 'my' | 'tenant'; // default: 'my'

  // Getter/setter for columnConfig in settings
  getColumnConfig: (settings: TSettingsValue) => TColumnConfig[] | undefined;
  setColumnConfig: (settings: TSettingsValue, columnConfig: TColumnConfig[]) => TSettingsValue;
}

/**
 * Generic hook for managing line items column configuration with Settings API persistence
 * @param options - Configuration options
 * @returns Column configuration state and setter
 */
export function useLineItemsColumnConfig<TColumnConfig, TSettingsValue>(
  options: UseLineItemsColumnConfigOptions<TColumnConfig, TSettingsValue>
): {
  columnConfig: TColumnConfig[];
  setColumnConfig: (config: TColumnConfig[]) => void;
  isLoading: boolean;
} {
  const {
    settings,
    isInitialized,
    saveSettings,
    defaultColumnConfig,
    defaultSettings,
    debounceMs = 500,
    scope = 'my',
    getColumnConfig,
    setColumnConfig: setColumnConfigInSettings,
  } = options;

  // Column configuration state
  const [columnConfig, setColumnConfigState] = useState<TColumnConfig[]>(defaultColumnConfig);

  // Track if we've applied column settings to avoid re-applying
  const hasAppliedColumnSettings = useRef(false);

  // Debounce timer for saving column config to settings
  const saveColumnConfigTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Apply saved column configuration from settings
  // This runs once when settings are initialized
  useEffect(() => {
    if (isInitialized && !hasAppliedColumnSettings.current) {
      const savedConfig = settings ? getColumnConfig(settings) : undefined;
      if (savedConfig && savedConfig.length > 0) {
        // Apply column config from API settings (includes visible and pinned)
        setColumnConfigState(savedConfig);
      }
      hasAppliedColumnSettings.current = true;
    }
  }, [isInitialized, settings, getColumnConfig]);

  // Save column config to settings with debounce
  const saveColumnConfigToSettings = useCallback(
    (newColumnConfig: TColumnConfig[]) => {
      // Clear existing timeout
      if (saveColumnConfigTimeoutRef.current) {
        clearTimeout(saveColumnConfigTimeoutRef.current);
      }

      // Set new timeout to save
      saveColumnConfigTimeoutRef.current = setTimeout(async () => {
        try {
          // Get current settings and update only columnConfig
          const currentSettings = settings || defaultSettings;
          const updatedSettings = setColumnConfigInSettings(currentSettings, newColumnConfig);

          // Save to settings (personal or tenant)
          await saveSettings(updatedSettings, scope);
        } catch (error) {
          console.error('Failed to save column config to settings:', error);
        }
      }, debounceMs);
    },
    [settings, defaultSettings, saveSettings, scope, setColumnConfigInSettings, debounceMs]
  );

  // Wrapper for setColumnConfigState that also saves to settings
  const setColumnConfig = useCallback(
    (config: TColumnConfig[]) => {
      setColumnConfigState(config);
      // Save to settings with debounce
      saveColumnConfigToSettings(config);
    },
    [saveColumnConfigToSettings]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveColumnConfigTimeoutRef.current) {
        clearTimeout(saveColumnConfigTimeoutRef.current);
      }
    };
  }, []);

  return {
    columnConfig,
    setColumnConfig,
    isLoading: !isInitialized,
  };
}
