'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SettingsToggle } from './SettingsToggle';
import { SettingsScopeToggle } from './SettingsScopeToggle';
import { ColumnConfigEditor } from './ColumnConfigEditor';
import { useOrderSettings, type SettingScope } from '@/contexts/UserSettingsContext';
import type { OrderSettingsValue, OrderColumnConfig } from '@/components/lib/graphql/settings';
import { DEFAULT_VISIBLE_COLUMNS, COLUMN_LABELS } from '@/components/orders/detail/constants';
import type { ColumnKey } from '@/components/orders/detail/types';
import { showSuccessToast, showErrorToast } from '@/components/lib/toast';

// All available columns for orders
const ALL_ORDER_COLUMNS: ColumnKey[] = [
  'partNumber',
  'custPartNumber',
  'description',
  'quantity',
  'uom',
  'divisor',
  'unitPrice',
  'shippedQty',
  'lineStatus',
  'linkedQuote',
  'linkedInvoice',
  'linkedCheck',
  'linkedFulfillment',
  'sellTotal',
  'commissionPercent',
  'commission',
  'commissionTotal',
  'invoiced',
  'percentOver',
  'commissionAmount',
  'ovgPercent',
  'ovgAmount',
  'earnPercent',
  'earnAmount',
  'iconAcknowledgement',
  'iconDocumentSpecific',
  'iconWarehouse',
  'iconCredit',
];

// Columns that are coming soon (not yet implemented)
const COMING_SOON_COLUMNS: string[] = [
  'invoiced',
  'percentOver',
  'commissionAmount',
  'ovgPercent',
  'ovgAmount',
  'earnPercent',
  'earnAmount',
  'iconAcknowledgement',
  'iconDocumentSpecific',
  'iconWarehouse',
  'iconCredit',
];

// Create default column config from constants
const defaultOrderColumnConfig: OrderColumnConfig[] = ALL_ORDER_COLUMNS.map((key) => ({
  key,
  label: COLUMN_LABELS[key],
  visible: DEFAULT_VISIBLE_COLUMNS.includes(key),
}));

const defaultOrderSettings: OrderSettingsValue = {
  columnConfig: defaultOrderColumnConfig,
  showEndUserPerLine: false,
  showOutsideRepPerLine: false,
  showInsideRepPerLine: false,
};

export function OrderSettingsTab() {
  const { settings, mySettings, tenantSettings, saveSettings, isLoading, isInitialized } = useOrderSettings();
  const [scope, setScope] = useState<SettingScope>('my');
  const [localSettings, setLocalSettings] = useState<OrderSettingsValue | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Get the active settings based on scope
  const activeSettings = scope === 'my' ? mySettings : tenantSettings;

  // Initialize local settings when context loads or scope changes
  useEffect(() => {
    if (isInitialized) {
      const settingsToUse = activeSettings || defaultOrderSettings;
      setLocalSettings(settingsToUse);
      setHasChanges(false);
    }
  }, [isInitialized, activeSettings, scope]);

  const handleSettingChange = useCallback((key: keyof OrderSettingsValue, value: unknown) => {
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
        showSuccessToast(`Order settings saved to ${scope === 'my' ? 'My Settings' : 'Tenant Settings'}`);
        setHasChanges(false);
      } else {
        showErrorToast('Failed to save order settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showErrorToast('Failed to save order settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setLocalSettings(defaultOrderSettings);
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
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Order Settings</h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Configure default settings for orders
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

      {/* Line Item Settings */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Line Item Settings</h3>

        <div className="space-y-1">
          <SettingsToggle
            enabled={localSettings.showEndUserPerLine}
            onChange={(enabled) => handleSettingChange('showEndUserPerLine', enabled)}
            label="Specify end user per line item"
            description={
              localSettings.showEndUserPerLine
                ? 'End user can be set on each line item'
                : 'End user is set in header for all lines'
            }
          />

          <SettingsToggle
            enabled={localSettings.showOutsideRepPerLine}
            onChange={(enabled) => handleSettingChange('showOutsideRepPerLine', enabled)}
            label="Outside rep at line item level"
            description={
              localSettings.showOutsideRepPerLine
                ? 'Set outside rep per line item'
                : 'Outside rep is set in header for all lines'
            }
          />

          <SettingsToggle
            enabled={localSettings.showInsideRepPerLine}
            onChange={(enabled) => handleSettingChange('showInsideRepPerLine', enabled)}
            label="Inside rep at line item level"
            description={
              localSettings.showInsideRepPerLine
                ? 'Set inside rep per line item'
                : 'Inside rep is set in header for all lines'
            }
          />
        </div>
      </div>

      {/* Column Configuration */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Default Column Configuration</h3>
        <p className="text-xs text-[var(--muted-foreground)] mb-3">
          Configure which columns are visible by default when viewing orders
        </p>
        <ColumnConfigEditor
          columns={localSettings.columnConfig}
          onChange={(columns) => handleSettingChange('columnConfig', columns as OrderColumnConfig[])}
          title="Order Line Item Columns"
          groupBy={false}
          comingSoonKeys={COMING_SOON_COLUMNS}
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
              These settings will be automatically applied when viewing orders.
              Personal settings (My Settings) override tenant-wide settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderSettingsTab;
