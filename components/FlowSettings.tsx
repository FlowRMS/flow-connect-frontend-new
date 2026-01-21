'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFlowAISettings } from '@/contexts/UserSettingsContext';
import type { FlowAISettingsValue, ProcessingMode } from '@/components/lib/graphql/settings';

export type { ProcessingMode };

export type FlowSettingsType = FlowAISettingsValue;

const defaultSettings: FlowSettingsType = {
  quotes: 'manual',
  orders: 'manual',
  invoices: 'manual',
  checks: 'manual',
  associations: 'manual',
  jobs: 'manual',
  preOpportunities: 'manual',
  confidenceThreshold: 85,
};

const STORAGE_KEY = 'flow-settings';

interface FlowSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FlowSettings({ isOpen, onClose }: FlowSettingsProps) {
  const { settings: apiSettings, saveSettings, isInitialized } = useFlowAISettings();
  const [settings, setSettings] = useState<FlowSettingsType>(defaultSettings);
  const [tempThreshold, setTempThreshold] = useState(defaultSettings.confidenceThreshold);
  const [hasChanges, setHasChanges] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load settings from API or localStorage on mount
  useEffect(() => {
    if (isInitialized && apiSettings) {
      // Use API settings
      setSettings(apiSettings);
      setTempThreshold(apiSettings.confidenceThreshold);
      // Also update localStorage cache
      localStorage.setItem(STORAGE_KEY, JSON.stringify(apiSettings));
    } else {
      // Fallback to localStorage while API loads
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSettings(parsed);
          setTempThreshold(parsed.confidenceThreshold);
        } catch (e) {
          console.error('Failed to parse stored settings:', e);
        }
      }
    }
  }, [isInitialized, apiSettings]);

  // Save settings to API with debounce and update localStorage cache
  const saveToApi = useCallback(async (newSettings: FlowSettingsType) => {
    // Update localStorage cache immediately
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));

    // Debounce API save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        // Save FlowAI settings directly
        await saveSettings(newSettings, 'my');
        setHasChanges(false);
      } catch (error) {
        console.error('Failed to save settings to API:', error);
      }
    }, 1000);
  }, [saveSettings]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleToggle = (key: keyof Omit<FlowSettingsType, 'confidenceThreshold'>) => {
    const newSettings = {
      ...settings,
      [key]: settings[key] === 'automatic' ? 'manual' : 'automatic',
    };
    setSettings(newSettings);
    setHasChanges(true);
    saveToApi(newSettings);
  };

  const handleThresholdChange = (value: number) => {
    setTempThreshold(value);
    const newSettings = {
      ...settings,
      confidenceThreshold: value,
    };
    setSettings(newSettings);
    setHasChanges(true);
    saveToApi(newSettings);
  };

  const setThresholdForAll = () => {
    // Just use the current threshold - it's already set
    // This button demonstrates that the threshold applies across all items set to automatic
  };

  const settingsItems: Array<{
    key: keyof Omit<FlowSettingsType, 'confidenceThreshold'>;
    label: string;
  }> = [
    { key: 'quotes', label: 'Quotes' },
    { key: 'orders', label: 'Orders' },
    { key: 'invoices', label: 'Invoices' },
    { key: 'checks', label: 'Checks' },
    { key: 'associations', label: 'Associations' },
    { key: 'jobs', label: 'Jobs' },
    { key: 'preOpportunities', label: 'Pre-Opportunities' },
  ];

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path
                  d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16.25 10c0 .344-.031.688-.094 1.031l1.719 1.344a.625.625 0 01.156.781l-1.562 2.688a.625.625 0 01-.75.281l-2.031-.813a6.188 6.188 0 01-1.782 1.032l-.406 2.156a.625.625 0 01-.625.5h-3.125a.625.625 0 01-.625-.5l-.406-2.156a6.188 6.188 0 01-1.782-1.032l-2.031.813a.625.625 0 01-.75-.281L.844 13.156a.625.625 0 01.156-.781l1.719-1.344A6.25 6.25 0 012.625 10c0-.344.031-.688.094-1.031L1 7.625a.625.625 0 01-.156-.781l1.562-2.688a.625.625 0 01.75-.281l2.031.813a6.188 6.188 0 011.782-1.032L7.375.5a.625.625 0 01.625-.5h3.125c.281 0 .531.188.625.5l.406 2.156a6.188 6.188 0 011.782 1.032l2.031-.813a.625.625 0 01.75.281l1.562 2.688a.625.625 0 01-.156.781l-1.719 1.344c.063.343.094.687.094 1.031z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Flow Settings</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
              aria-label="Close settings"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 5l10 10M15 5l-10 10" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Processing Modes */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                Processing Modes
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                Configure whether each item type should be processed automatically or manually.
                Items processed automatically will only be auto-approved if they meet the confidence threshold.
              </p>
              <div className="space-y-3">
                {settingsItems.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-4 bg-[var(--background)] rounded-lg border border-[var(--border)]"
                  >
                    <span className="font-medium text-[var(--foreground)]">{item.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-[var(--muted-foreground)] min-w-[70px] text-right">
                        {settings[item.key] === 'automatic' ? 'Automatic' : 'Manual'}
                      </span>
                      <button
                        onClick={() => handleToggle(item.key)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings[item.key] === 'automatic'
                            ? 'bg-[var(--primary)]'
                            : 'bg-[var(--muted)]'
                        }`}
                        aria-label={`Toggle ${item.label}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings[item.key] === 'automatic' ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Confidence Threshold */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                Confidence Threshold
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                Items with automatic processing enabled will only be auto-approved if their confidence score
                is above this threshold. Items below this threshold will go to the manual queue.
              </p>
              <div className="p-4 bg-[var(--background)] rounded-lg border border-[var(--border)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-[var(--foreground)]">Threshold</span>
                  <span className="text-2xl font-semibold text-[var(--primary)]">{tempThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={tempThreshold}
                  onChange={(e) => handleThresholdChange(parseInt(e.target.value))}
                  className="w-full h-2 bg-[var(--muted)] rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
                />
                <div className="flex justify-between text-xs text-[var(--muted-foreground)] mt-2">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
                <button
                  onClick={setThresholdForAll}
                  className="mt-4 w-full px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg font-medium text-sm transition-colors"
                >
                  Apply {tempThreshold}% Threshold to All Automatic Items
                </button>
              </div>
            </div>

            {/* Note about settings page */}
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
                  <p className="text-sm font-medium text-blue-800">Settings Sync</p>
                  <p className="text-xs text-blue-600 mt-1">
                    These settings are automatically saved to your account and can also be managed
                    from Settings &gt; Preferences &gt; Chat Settings.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-[var(--border)] flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg font-medium text-sm transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
