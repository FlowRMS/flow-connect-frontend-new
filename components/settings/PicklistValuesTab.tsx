'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePicklistSettings } from '@/contexts/UserSettingsContext';
import type { PicklistValue } from '@/components/lib/graphql/settings';
import {
  getAllPicklistOptions,
  validatePicklistValue,
  normalizePicklistValue,
  getDefaultValues,
  getLabelMap,
  DEFAULT_ORDER_TYPES,
  ORDER_TYPE_LABELS,
  PICKLIST_CONFIGS,
  type PicklistKey,
} from './picklistValues';
import { showSuccessToast, showErrorToast } from '@/components/lib/toast';

// Default picklist value structure
const createDefaultPicklistValue = (picklistKey: PicklistKey): PicklistValue => {
  const config = PICKLIST_CONFIGS[picklistKey];
  return {
    defaultValues: config?.defaultValues || [],
    customValues: [],
    labelMap: config?.labelMap || {},
  };
};

export function PicklistValuesTab() {
  // Use generic hook for orderTypes (can be extended for other picklists)
  const { settings: orderTypesSettings, saveSettings: saveOrderTypes, isLoading, isInitialized } = usePicklistSettings('orderTypes');
  
  const [localOrderTypes, setLocalOrderTypes] = useState<PicklistValue | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [newValue, setNewValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Initialize local settings when context loads
  useEffect(() => {
    if (isInitialized) {
      const settingsToUse = orderTypesSettings || createDefaultPicklistValue('orderTypes');
      setLocalOrderTypes(settingsToUse);
      setHasChanges(false);
    }
  }, [isInitialized, orderTypesSettings]);

  const handleAddValue = (picklistKey: PicklistKey) => {
    if (!localOrderTypes) return;

    const trimmedValue = newValue.trim();
    if (!trimmedValue) {
      setError('Value cannot be empty');
      return;
    }

    const validation = validatePicklistValue(
      picklistKey,
      trimmedValue,
      localOrderTypes.customValues || []
    );

    if (!validation.isValid) {
      setError(validation.error || 'Invalid value');
      return;
    }

    const normalizedValue = normalizePicklistValue(trimmedValue);
    setLocalOrderTypes((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        customValues: [...(prev.customValues || []), normalizedValue],
      };
    });
    setNewValue('');
    setError(null);
    setHasChanges(true);
  };

  const handleRemoveValue = (value: string) => {
    if (!localOrderTypes) return;

    setLocalOrderTypes((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        customValues: (prev.customValues || []).filter((v) => v !== value),
      };
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!localOrderTypes) return;

    setIsSaving(true);
    try {
      const success = await saveOrderTypes(localOrderTypes);
      if (success) {
        showSuccessToast('Order types saved successfully');
        setHasChanges(false);
      } else {
        showErrorToast('Failed to save order types');
      }
    } catch (error) {
      console.error('Error saving order types:', error);
      showErrorToast('Failed to save order types');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddValue('orderTypes');
    }
  };

  const handleInputChange = (value: string) => {
    if (!localOrderTypes) return;

    setNewValue(value);
    setError(null);
    // Real-time validation
    if (value.trim()) {
      const validation = validatePicklistValue(
        'orderTypes',
        value,
        localOrderTypes.customValues || []
      );
      if (!validation.isValid) {
        setError(validation.error || 'Invalid value');
      }
    }
  };

  if (isLoading || !localOrderTypes) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)] mx-auto mb-3" />
          <p className="text-sm text-[var(--muted-foreground)]">Loading picklist values...</p>
        </div>
      </div>
    );
  }

  const defaultValues = getDefaultValues('orderTypes');
  const labelMap = getLabelMap('orderTypes');
  const customValues = localOrderTypes.customValues || [];
  const allOptions = getAllPicklistOptions('orderTypes', customValues);

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Picklist Values</h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Manage picklist values for dropdowns throughout the system. Default values cannot be deleted.
            <span className="block mt-1 text-xs text-amber-600">
              Only administrators can modify these settings. Changes apply to all users in your organization.
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              hasChanges && !isSaving
                ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Order Types Section */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
        <h3 className="font-semibold text-[var(--foreground)] mb-1">Order Types</h3>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          Manage order type values. Default values (Normal, Blanket, Release, Tag, Hold for Release) are always available and cannot be deleted.
        </p>

        <div className="p-4 border border-[var(--border)] rounded-lg bg-[var(--background)]">
          {/* Default Values */}
          {defaultValues.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-[var(--muted-foreground)] mb-2 uppercase tracking-wide">
                Default Values
              </p>
              <div className="flex flex-wrap gap-2">
                {defaultValues.map((value) => (
                  <span
                    key={value}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-900"
                    title="Default value cannot be deleted"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    {labelMap[value] || value}
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-medium rounded">
                      Default
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Custom Values */}
          <div className={defaultValues.length > 0 ? 'mb-4' : ''}>
            {customValues.length > 0 && (
              <p className="text-xs font-medium text-[var(--muted-foreground)] mb-2 uppercase tracking-wide">
                Custom Values
              </p>
            )}
            <div className="flex flex-wrap gap-2 mb-3">
              {customValues.map((value) => (
                <span
                  key={value}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-[var(--muted)] rounded-full text-sm text-[var(--foreground)]"
                >
                  {value}
                  <button
                    onClick={() => handleRemoveValue(value)}
                    className="ml-1 hover:text-red-500 transition-colors"
                    title="Remove value"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M15 9l-6 6M9 9l6 6" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Add New Value Input */}
          <div>
            <input
              type="text"
              value={newValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add new order type..."
              className={`w-full px-0 py-1 bg-transparent text-sm ${
                error
                  ? 'text-red-600 placeholder:text-red-400'
                  : 'text-[var(--muted-foreground)] placeholder:text-[var(--muted-foreground)]'
              } focus:outline-none`}
            />
            {error && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                {error}
              </p>
            )}
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Press Enter to add. Values are automatically converted to uppercase.
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-blue-500 flex-shrink-0 mt-0.5"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-800">About Picklist Values</p>
            <p className="text-xs text-blue-600 mt-1">
              Default values are system-defined and cannot be removed. You can add custom values that will appear
              alongside the defaults in dropdown menus. All values are automatically converted to uppercase for
              consistency. These settings are configured at the tenant level and apply to all users in your organization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PicklistValuesTab;
