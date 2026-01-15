'use client';

import React from 'react';

interface SettingsToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function SettingsToggle({
  enabled,
  onChange,
  label,
  description,
  disabled = false,
}: SettingsToggleProps) {
  return (
    <div className={`flex items-center justify-between py-3 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-3">
        <button
          onClick={() => !disabled && onChange(!enabled)}
          disabled={disabled}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
            enabled ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'
          } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          aria-label={`Toggle ${label}`}
          role="switch"
          aria-checked={enabled}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
          {description && (
            <span className="text-xs text-[var(--muted-foreground)]">{description}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsToggle;
