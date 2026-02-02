'use client';

import React, { useState, useRef } from 'react';
import { SettingsScopeToggle } from './SettingsScopeToggle';
import { PicklistEditor } from '@/lib/picklists/components';
import { PicklistKey } from '@/lib/picklists/enums';
import { useUserSettings, type SettingScope } from '@/contexts/UserSettingsContext';
import { showSuccessToast, showErrorToast } from '@/components/lib/toast';

export function PreOpportunitySettingsTab() {
  const { isLoading, isInitialized, mySettings, tenantSettings } = useUserSettings();
  const [scope, setScope] = useState<SettingScope>('my');
  
  // Picklist state
  const [picklistHasChanges, setPicklistHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const picklistSaveRef = useRef<(() => Promise<boolean>) | null>(null);

  const handleSave = async () => {
    if (!picklistHasChanges || !picklistSaveRef.current) return;

    setIsSaving(true);
    try {
      const success = await picklistSaveRef.current();
      if (success) {
        showSuccessToast('Pre-opportunity settings saved to Tenant Settings');
        setPicklistHasChanges(false);
      } else {
        showErrorToast('Failed to save pre-opportunity settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showErrorToast('Failed to save pre-opportunity settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !isInitialized) {
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
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-[var(--background)] pb-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Pre Opportunity Settings</h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Configure default settings for pre-opportunities
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={!picklistHasChanges || isSaving}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                picklistHasChanges && !isSaving
                  ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]'
                  : 'bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed'
              }`}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>

      <SettingsScopeToggle
        scope={scope}
        onChange={setScope}
        hasMySettings={!!mySettings}
        hasTenantSettings={!!tenantSettings}
      />

      {/* Pre-Opportunity Status Picklist - Only visible for tenant settings */}
      {scope === 'tenant' && (
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
          <PicklistEditor 
            picklistKey={PicklistKey.PRE_OPPORTUNITY_STATUS} 
            onHasChangesChange={setPicklistHasChanges}
            onSaveReady={(saveFn) => { picklistSaveRef.current = saveFn; }}
          />
        </div>
      )}

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
              These settings will be automatically applied when viewing pre-opportunities.
              Personal settings (My Settings) override tenant-wide settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PreOpportunitySettingsTab;
