'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SettingsToggle } from './SettingsToggle';
import { SettingsScopeToggle } from './SettingsScopeToggle';
import { ColumnConfigEditor } from './ColumnConfigEditor';
import { useQuoteSettings, type SettingScope } from '@/contexts/UserSettingsContext';
import type { QuoteSettingsValue } from '@/components/lib/graphql/settings';
import { defaultColumnConfigV2, defaultQuoteSettingsV2 } from '@/components/quotes-v2/data/mockData';
import { showSuccessToast, showErrorToast } from '@/components/lib/toast';

export function QuoteSettingsTab() {
  const { settings, mySettings, tenantSettings, saveSettings, isLoading, isInitialized } = useQuoteSettings();
  const [scope, setScope] = useState<SettingScope>('my');
  const [localSettings, setLocalSettings] = useState<QuoteSettingsValue | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Get the active settings based on scope
  const activeSettings = scope === 'my' ? mySettings : tenantSettings;

  // Initialize local settings when context loads or scope changes
  useEffect(() => {
    if (isInitialized) {
      const settingsToUse = activeSettings || {
        ...defaultQuoteSettingsV2,
        columnConfig: defaultColumnConfigV2,
      };
      setLocalSettings(settingsToUse);
      setHasChanges(false);
    }
  }, [isInitialized, activeSettings, scope]);

  const handleSettingChange = useCallback((key: keyof QuoteSettingsValue, value: unknown) => {
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
        showSuccessToast(`Quote settings saved to ${scope === 'my' ? 'My Settings' : 'Tenant Settings'}`);
        setHasChanges(false);
      } else {
        showErrorToast('Failed to save quote settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showErrorToast('Failed to save quote settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setLocalSettings({
      ...defaultQuoteSettingsV2,
      columnConfig: defaultColumnConfigV2,
    });
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
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Quote Settings</h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Configure default settings for new quotes
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
            enabled={localSettings.specifyEndUserPerLine}
            onChange={(enabled) => handleSettingChange('specifyEndUserPerLine', enabled)}
            label="Specify end user per line item"
            description={
              localSettings.specifyEndUserPerLine
                ? 'End user can be set on each line item'
                : 'End user is set in header for all lines'
            }
          />

          <SettingsToggle
            enabled={localSettings.outsideRepAtLineLevel}
            onChange={(enabled) => handleSettingChange('outsideRepAtLineLevel', enabled)}
            label="Outside rep at line item level"
            description={
              localSettings.outsideRepAtLineLevel
                ? 'Set outside rep per line item'
                : 'Set outside rep in header for all lines'
            }
          />

          <SettingsToggle
            enabled={localSettings.insideRepAtLineLevel}
            onChange={(enabled) => handleSettingChange('insideRepAtLineLevel', enabled)}
            label="Inside rep at line item level"
            description={
              localSettings.insideRepAtLineLevel
                ? 'Set inside rep per line item'
                : 'Set inside rep in header for all lines'
            }
          />

          <SettingsToggle
            enabled={localSettings.factoryPerLineItem}
            onChange={(enabled) => handleSettingChange('factoryPerLineItem', enabled)}
            label="Manufacturer per line item"
            description={
              localSettings.factoryPerLineItem
                ? 'Set manufacturer on each line item'
                : 'Set manufacturer in header for all lines'
            }
          />
        </div>
      </div>

      {/* Customer Part Number Source */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Customer Part Number Source</h3>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="cpnSource"
              checked={localSettings.customerPartNumberSource === 'sold_to'}
              onChange={() => handleSettingChange('customerPartNumberSource', 'sold_to')}
              className="w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)]"
            />
            <span className="text-sm text-[var(--foreground)]">Sold To Customer</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="cpnSource"
              checked={localSettings.customerPartNumberSource === 'end_user'}
              onChange={() => handleSettingChange('customerPartNumberSource', 'end_user')}
              className="w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)]"
            />
            <span className="text-sm text-[var(--foreground)]">End User</span>
          </label>
        </div>
      </div>

      {/* Column Configuration */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Default Column Configuration</h3>
        <p className="text-xs text-[var(--muted-foreground)] mb-3">
          Configure which columns are visible by default when creating new quotes
        </p>
        <ColumnConfigEditor
          columns={localSettings.columnConfig}
          onChange={(columns) => handleSettingChange('columnConfig', columns)}
          title="Quote Line Item Columns"
          groupBy={true}
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
              When you create a new quote, these settings will be automatically applied as defaults.
              Personal settings (My Settings) override tenant-wide settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuoteSettingsTab;
