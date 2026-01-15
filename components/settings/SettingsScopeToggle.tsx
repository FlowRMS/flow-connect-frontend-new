'use client';

import React from 'react';
import type { SettingScope } from '@/contexts/UserSettingsContext';

interface SettingsScopeToggleProps {
  scope: SettingScope;
  onChange: (scope: SettingScope) => void;
  hasMySettings: boolean;
  hasTenantSettings: boolean;
}

export function SettingsScopeToggle({
  scope,
  onChange,
  hasMySettings,
  hasTenantSettings,
}: SettingsScopeToggleProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-[var(--foreground)]">Settings Scope</h4>
        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          {hasMySettings && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              My Settings
            </span>
          )}
          {hasTenantSettings && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Tenant Settings
            </span>
          )}
        </div>
      </div>
      <div className="inline-flex rounded-lg border border-[var(--border)] p-1 bg-[var(--muted)]">
        <button
          onClick={() => onChange('my')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            scope === 'my'
              ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            My Settings
          </span>
        </button>
        <button
          onClick={() => onChange('tenant')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            scope === 'tenant'
              ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Tenant Settings
          </span>
        </button>
      </div>
      <p className="mt-2 text-xs text-[var(--muted-foreground)]">
        {scope === 'my'
          ? 'These settings are personal and only apply to you. They override tenant-wide settings.'
          : 'These settings apply to all users in your organization.'}
      </p>
    </div>
  );
}

export default SettingsScopeToggle;
