'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SettingsToggle } from './SettingsToggle';
import { SettingsScopeToggle } from './SettingsScopeToggle';
import { ColumnConfigEditor } from './ColumnConfigEditor';
import { useQuoteSettings, type SettingScope } from '@/contexts/UserSettingsContext';
import type { QuoteSettingsValue, PriceLevelConfig } from '@/components/lib/graphql/settings';
import { defaultColumnConfigV2, defaultQuoteSettingsV2 } from '@/components/quotes-v2/data/mockData';
import { showSuccessToast, showErrorToast } from '@/components/lib/toast';

const defaultPriceLevels: PriceLevelConfig[] = [
  { id: 'l1', name: 'L1', percent: 10, description: 'Standard contractor' },
  { id: 'l2', name: 'L2', percent: 15, description: 'Preferred contractor' },
  { id: 'l3', name: 'L3', percent: 20, description: 'List price / MSRP' },
];

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

      {/* Outside Rep Population Source - Tenant Only */}
      <div className={`bg-[var(--card)] rounded-lg border border-[var(--border)] p-6 ${scope === 'my' ? 'opacity-50' : ''}`}>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Outside Rep Population Source</h3>
          <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">Tenant Only</span>
        </div>
        {scope === 'my' ? (
          <p className="text-xs text-[var(--muted-foreground)]">
            This is a tenant-wide setting. Switch to Tenant Settings to configure.
          </p>
        ) : (
          <>
            <p className="text-xs text-[var(--muted-foreground)] mb-3">Choose which customer&apos;s outside reps auto-populate when selected</p>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="quoteOutsideRepSource"
                  checked={(localSettings.outsideRepSource || 'end_user') === 'end_user'}
                  onChange={() => handleSettingChange('outsideRepSource', 'end_user')}
                  className="w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <span className="text-sm text-[var(--foreground)]">End User</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="quoteOutsideRepSource"
                  checked={localSettings.outsideRepSource === 'sold_to'}
                  onChange={() => handleSettingChange('outsideRepSource', 'sold_to')}
                  className="w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <span className="text-sm text-[var(--foreground)]">Sold To Customer</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="quoteOutsideRepSource"
                  checked={localSettings.outsideRepSource === 'bill_to'}
                  onChange={() => handleSettingChange('outsideRepSource', 'bill_to')}
                  className="w-4 h-4 text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <span className="text-sm text-[var(--foreground)]">Bill To Customer</span>
              </label>
            </div>
          </>
        )}
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

      {/* Price Levels */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">Price Levels</h3>
        <p className="text-xs text-[var(--muted-foreground)] mb-4">
          Configure pricing tiers for different customer types (e.g., contractor levels, MSRP)
        </p>
        <div className="space-y-3">
          {(localSettings.priceLevels || defaultPriceLevels).map((level, index) => (
            <div key={level.id} className="flex items-center gap-3">
              <input
                type="text"
                value={level.name}
                onChange={(e) => {
                  const newLevels = [...(localSettings.priceLevels || defaultPriceLevels)];
                  newLevels[index] = { ...newLevels[index], name: e.target.value };
                  handleSettingChange('priceLevels', newLevels);
                }}
                className="w-16 px-2 py-1.5 text-sm text-center border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                placeholder="Name"
              />
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={level.percent}
                  onChange={(e) => {
                    const newLevels = [...(localSettings.priceLevels || defaultPriceLevels)];
                    newLevels[index] = { ...newLevels[index], percent: parseFloat(e.target.value) || 0 };
                    handleSettingChange('priceLevels', newLevels);
                  }}
                  className="w-20 px-2 py-1.5 text-sm text-center border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  placeholder="0"
                  step="0.1"
                />
                <span className="text-sm text-[var(--muted-foreground)]">%</span>
              </div>
              <input
                type="text"
                value={level.description}
                onChange={(e) => {
                  const newLevels = [...(localSettings.priceLevels || defaultPriceLevels)];
                  newLevels[index] = { ...newLevels[index], description: e.target.value };
                  handleSettingChange('priceLevels', newLevels);
                }}
                placeholder="Description"
                className="flex-1 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
              {(localSettings.priceLevels || defaultPriceLevels).length > 1 && (
                <button
                  onClick={() => {
                    const newLevels = (localSettings.priceLevels || defaultPriceLevels).filter((_, i) => i !== index);
                    handleSettingChange('priceLevels', newLevels);
                  }}
                  className="p-1.5 text-[var(--muted-foreground)] hover:text-red-500 rounded hover:bg-[var(--muted)] transition-colors"
                  title="Remove price level"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={() => {
            const currentLevels = localSettings.priceLevels || defaultPriceLevels;
            const newLevel: PriceLevelConfig = {
              id: `l${currentLevels.length + 1}`,
              name: `L${currentLevels.length + 1}`,
              percent: 0,
              description: '',
            };
            handleSettingChange('priceLevels', [...currentLevels, newLevel]);
          }}
          className="mt-4 flex items-center gap-2 text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 5v10M5 10h10" strokeLinecap="round" />
          </svg>
          Add price level
        </button>
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
