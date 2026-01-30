'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SettingsScopeToggle } from './SettingsScopeToggle';
import { ColumnConfigEditor } from './ColumnConfigEditor';
import { useCommissionSettings, type SettingScope } from '@/contexts/UserSettingsContext';
import type { CommissionSettingsValue, CommissionColumnConfig } from '@/components/lib/graphql/settings';
import { DEFAULT_VISIBLE_COLUMNS, COLUMN_LABELS } from '@/components/commissions/detail/constants';
import type { ColumnKey } from '@/components/commissions/detail/types';
import { showSuccessToast, showErrorToast } from '@/components/lib/toast';

// All available columns for commissions/checks
const ALL_COMMISSION_COLUMNS: ColumnKey[] = [
  'number',
  'orderNumber',
  'customer',
  'salesRep',
  'commissionRate',
  'expectedCommission',
  'paidCommission',
  'balance',
];

// Create default column config from constants
const defaultCommissionColumnConfig: CommissionColumnConfig[] = ALL_COMMISSION_COLUMNS.map((key) => ({
  key,
  label: COLUMN_LABELS[key],
  visible: DEFAULT_VISIBLE_COLUMNS.includes(key),
  pinned: false,
}));

const defaultCommissionSettings: CommissionSettingsValue = {
  columnConfig: defaultCommissionColumnConfig,
};

export function CommissionSettingsTab() {
  const { settings, mySettings, tenantSettings, saveSettings, isLoading, isInitialized } = useCommissionSettings();
  const [scope, setScope] = useState<SettingScope>('my');
  const [localSettings, setLocalSettings] = useState<CommissionSettingsValue | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Get the active settings based on scope
  const activeSettings = scope === 'my' ? mySettings : tenantSettings;

  // Initialize local settings when context loads or scope changes
  useEffect(() => {
    if (isInitialized) {
      const settingsToUse = activeSettings || defaultCommissionSettings;
      setLocalSettings(settingsToUse);
      setHasChanges(false);
    }
  }, [isInitialized, activeSettings, scope]);

  const handleColumnConfigChange = useCallback((columns: CommissionColumnConfig[]) => {
    setLocalSettings((prev) => {
      if (!prev) return prev;
      return { ...prev, columnConfig: columns };
    });
    setHasChanges(true);
  }, []);

  const handleSave = async () => {
    if (!localSettings) return;

    setIsSaving(true);
    try {
      const success = await saveSettings(localSettings, scope);
      if (success) {
        showSuccessToast(`Commission settings saved to ${scope === 'my' ? 'My Settings' : 'Tenant Settings'}`);
        setHasChanges(false);
      } else {
        showErrorToast('Failed to save commission settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showErrorToast('Failed to save commission settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setLocalSettings(defaultCommissionSettings);
    setHasChanges(true);
  };

  if (isLoading || !localSettings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)] mx-auto mb-3" />
          <p className="text-sm text-[var(--muted-foreground)]">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Commission Settings</h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Configure default settings for commissions/checks
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-md transition-colors"
          >
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              hasChanges && !isSaving
                ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      <SettingsScopeToggle
        scope={scope}
        onChange={setScope}
        hasMySettings={!!mySettings}
        hasTenantSettings={!!tenantSettings}
      />

      {/* Column Configuration */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Default Column Configuration</h3>
        <p className="text-xs text-[var(--muted-foreground)] mb-3">
          Configure which columns are visible by default when viewing commissions/checks
        </p>
        <ColumnConfigEditor
          columns={localSettings.columnConfig}
          onChange={(columns) => handleColumnConfigChange(columns as CommissionColumnConfig[])}
          title="Commission Line Item Columns"
          groupBy={false}
        />
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
            <p className="text-sm font-medium text-blue-800">How settings are applied</p>
            <p className="text-xs text-blue-600 mt-1">
              These settings will be automatically applied when viewing commissions/checks.
              Personal settings (My Settings) override tenant-wide settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommissionSettingsTab;
