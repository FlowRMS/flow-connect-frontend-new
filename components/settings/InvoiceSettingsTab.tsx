'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SettingsScopeToggle } from './SettingsScopeToggle';
import { ColumnConfigEditor } from './ColumnConfigEditor';
import { useInvoiceSettings, type SettingScope } from '@/contexts/UserSettingsContext';
import type { InvoiceSettingsValue, InvoiceColumnConfig } from '@/components/lib/graphql/settings';
import {
  DEFAULT_VISIBLE_COLUMNS,
  COLUMN_LABELS,
} from '@/components/invoices/detail/constants';
import type { ColumnKey } from '@/components/invoices/detail/types';
import { showSuccessToast, showErrorToast } from '@/components/lib/toast';

// All available columns for invoices
const ALL_INVOICE_COLUMNS: ColumnKey[] = [
  'partNumber',
  'custPartNumber',
  'description',
  'quantity',
  'uom',
  'divisor',
  'unitPrice',
  'linkedOrder',
  'linkedCheck',
  'sellTotal',
  'commissionPercent',
  'commission',
  'commissionTotal',
  'percentOver',
  'commissionAmount',
  'ovgPercent',
  'ovgAmount',
  'earnPercent',
  'earnAmount',
];

// Create default column config from constants
const defaultInvoiceColumnConfig: InvoiceColumnConfig[] = ALL_INVOICE_COLUMNS.map((key) => ({
  key,
  label: COLUMN_LABELS[key],
  visible: DEFAULT_VISIBLE_COLUMNS.includes(key),
}));

const defaultInvoiceSettings: InvoiceSettingsValue = {
  columnConfig: defaultInvoiceColumnConfig,
  dueDateOffset: 30,
};

export function InvoiceSettingsTab() {
  const { settings, mySettings, tenantSettings, saveSettings, isLoading, isInitialized } = useInvoiceSettings();
  const [scope, setScope] = useState<SettingScope>('my');
  const [localSettings, setLocalSettings] = useState<InvoiceSettingsValue | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Get the active settings based on scope
  const activeSettings = scope === 'my' ? mySettings : tenantSettings;

  // Initialize local settings when context loads or scope changes
  useEffect(() => {
    if (isInitialized) {
      if (activeSettings) {
        setLocalSettings(activeSettings);
      } else {
        setLocalSettings({
          ...defaultInvoiceSettings,
          dueDateOffset: undefined,
        });
      }
      setHasChanges(false);
    }
  }, [isInitialized, activeSettings, scope]);

  const handleColumnConfigChange = useCallback((columns: InvoiceColumnConfig[]) => {
    setLocalSettings((prev) => {
      if (!prev) return prev;
      return { ...prev, columnConfig: columns };
    });
    setHasChanges(true);
  }, []);

  const handleSettingChange = useCallback((key: keyof InvoiceSettingsValue, value: unknown) => {
    setLocalSettings((prev) => {
      if (!prev) return prev;
      return { ...prev, [key]: value };
    });
    setHasChanges(true);
  }, []);

  const handleSave = async () => {
    if (!localSettings) return;

    setIsSaving(true);
    try {
      const success = await saveSettings(localSettings, scope);
      if (success) {
        showSuccessToast(`Invoice settings saved to ${scope === 'my' ? 'My Settings' : 'Tenant Settings'}`);
        setHasChanges(false);
      } else {
        showErrorToast('Failed to save invoice settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showErrorToast('Failed to save invoice settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setLocalSettings(defaultInvoiceSettings);
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
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Invoice Settings</h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Configure default settings for invoices
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

      {/* Note about inherited settings */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-3">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-amber-500 flex-shrink-0 mt-0.5"
          >
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.072 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-amber-800">Settings inherited from orders</p>
            <p className="text-xs text-amber-600 mt-1">
              Line item settings (end user per line, rep assignments) are inherited from the linked order
              and cannot be changed on invoices. Only column configuration can be customized here.
            </p>
          </div>
        </div>
      </div>

      {/* Due Date Settings */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Due Date Settings</h3>
        <p className="text-xs text-[var(--muted-foreground)] mb-4">
          Configure default due date calculation when manufacturer payment terms are not available
        </p>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--foreground)]">
            Default Due Date Offset (Days)
          </label>
          <input
            type="number"
            min="0"
            value={localSettings.dueDateOffset ?? ''}
            placeholder="30"
            onChange={(e) => {
              const value = e.target.value === '' ? undefined : parseInt(e.target.value) || 0;
              handleSettingChange('dueDateOffset', value);
            }}
            className="w-full max-w-xs px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent placeholder:text-[var(--muted-foreground)]"
          />
          <p className="text-xs text-[var(--muted-foreground)]">
            Number of days to add to invoice date when calculating due date if the manufacturer has no payment terms configured
          </p>
        </div>
      </div>

      {/* Column Configuration */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Default Column Configuration</h3>
        <p className="text-xs text-[var(--muted-foreground)] mb-3">
          Configure which columns are visible by default when viewing invoices
        </p>
        <ColumnConfigEditor
          columns={localSettings.columnConfig}
          onChange={(columns) => handleColumnConfigChange(columns as InvoiceColumnConfig[])}
          title="Invoice Line Item Columns"
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
              These column settings will be automatically applied when viewing invoices.
              Personal settings (My Settings) override tenant-wide settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvoiceSettingsTab;
