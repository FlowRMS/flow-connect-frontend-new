'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getOrganizationPreference,
  updateOrganizationPreference,
} from '@/lib/graphql/organization-preferences';
import { toast } from 'sonner';

async function getAccessToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/token');
    if (!response.ok) return null;
    const data = await response.json();
    return data.accessToken || null;
  } catch {
    return null;
  }
}

export interface UseMethodPreferenceOptions<T extends string, C> {
  /** Preference key: 'send_method' or 'receiving_method' */
  preferenceKey: string;
  /** Default method when no preference is saved */
  defaultMethod: T;
  /** Maps frontend method type to backend preference value */
  methodToPreference: Record<string, string>;
  /** Maps backend preference value to frontend method type */
  preferenceToMethod: Record<string, T>;
  /** Function to fetch the config */
  getConfig: () => Promise<C>;
  /** Extract the active method from config (since different configs have different property names) */
  getActiveMethod?: (config: C) => T | undefined;
  /** Methods that cannot be saved as preferences (e.g., 'flow-rms') */
  unsaveableMethods?: T[];
  /** Success message for toast */
  successMessage?: string;
  /** Error message for toast */
  errorMessage?: string;
}

export interface UseMethodPreferenceReturn<T extends string, C> {
  // State
  selectedMethod: T;
  initialMethod: T;
  config: C | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  accessToken: string | null;

  // Computed
  hasUnsavedChanges: boolean;
  canSaveMethod: boolean;

  // Actions
  setSelectedMethod: (method: T) => void;
  handleSave: () => Promise<void>;
  handleRetry: () => void;
}

export function useMethodPreference<T extends string, C>({
  preferenceKey,
  defaultMethod,
  methodToPreference,
  preferenceToMethod,
  getConfig,
  getActiveMethod,
  unsaveableMethods = [],
  successMessage = 'Method saved successfully',
  errorMessage = 'Failed to save method',
}: UseMethodPreferenceOptions<T, C>): UseMethodPreferenceReturn<T, C> {
  const [selectedMethod, setSelectedMethod] = useState<T>(defaultMethod);
  const [initialMethod, setInitialMethod] = useState<T>(defaultMethod);
  const [config, setConfig] = useState<C | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const fetchData = useCallback(async (signal: AbortSignal) => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch access token first
      const token = await getAccessToken();
      if (signal.aborted) return;
      setAccessToken(token);

      // Fetch config and saved preference in parallel
      const [data, savedPreference] = await Promise.all([
        getConfig(),
        token ? getOrganizationPreference('POS', preferenceKey, token) : null,
      ]);

      if (signal.aborted) return;
      setConfig(data);

      // Use saved preference if available, otherwise use config default
      const savedMethod = savedPreference?.value
        ? preferenceToMethod[savedPreference.value]
        : null;
      // Get active method from config using the provided getter, or fall back to default
      const configDefault = getActiveMethod ? getActiveMethod(data) : undefined;
      const method = savedMethod || configDefault || defaultMethod;
      setSelectedMethod(method);
      setInitialMethod(method);
    } catch (e) {
      if (signal.aborted) return;
      setError(e instanceof Error ? e.message : 'Failed to load configuration');
    } finally {
      if (!signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [getConfig, getActiveMethod, preferenceKey, preferenceToMethod, defaultMethod]);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  const handleRetry = useCallback(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
  }, [fetchData]);

  const handleSave = useCallback(async () => {
    if (!accessToken) {
      toast.error('Authentication required. Please sign in again.');
      return;
    }

    const preferenceValue = methodToPreference[selectedMethod];
    if (!preferenceValue) {
      toast.error('Invalid method selected');
      return;
    }

    setIsSaving(true);
    try {
      await updateOrganizationPreference('POS', preferenceKey, preferenceValue, accessToken);
      setInitialMethod(selectedMethod);
      toast.success(successMessage);
    } catch (e) {
      console.error(`Failed to save ${preferenceKey}:`, e);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [accessToken, selectedMethod, methodToPreference, preferenceKey, successMessage, errorMessage]);

  // Track if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return selectedMethod !== initialMethod;
  }, [selectedMethod, initialMethod]);

  // Check if the selected method can be saved
  const canSaveMethod = useMemo(() => {
    const isUnsaveable = unsaveableMethods.includes(selectedMethod);
    const hasMapping = methodToPreference[selectedMethod] !== undefined;
    return !isUnsaveable && hasMapping;
  }, [selectedMethod, unsaveableMethods, methodToPreference]);

  return {
    selectedMethod,
    initialMethod,
    config,
    isLoading,
    isSaving,
    error,
    accessToken,
    hasUnsavedChanges,
    canSaveMethod,
    setSelectedMethod,
    handleSave,
    handleRetry,
  };
}
