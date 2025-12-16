import React from 'react';
import Link from 'next/link';
import type { SettingsTab } from '../types';
import { settingsTabs } from '../constants';

interface WarehouseSettingsHeaderProps {
  activeTab: SettingsTab;
  hasChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  onAddWarehouse: () => void;
  onTabChange: (tab: SettingsTab) => void;
}

export default function WarehouseSettingsHeader({
  activeTab,
  hasChanges,
  isSaving,
  onSave,
  onAddWarehouse,
  onTabChange,
}: WarehouseSettingsHeaderProps) {
  return (
    <>
      {/* Breadcrumbs and Title */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-2">
          <Link href="/warehouse" className="hover:text-[var(--foreground)] transition-colors">
            Warehouse
          </Link>
          <span>/</span>
          <span className="text-[var(--foreground)]">Settings</span>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Warehouse Settings</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Configure warehouses, shipping carriers, and team assignments
            </p>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === 'warehouses' && (
              <button
                onClick={onAddWarehouse}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Warehouse
              </button>
            )}
            <button
              onClick={onSave}
              disabled={!hasChanges || isSaving}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                hasChanges
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
              }`}
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Tabs */}
      <div className="border-b border-[var(--border)] mb-6">
        <div className="flex gap-0">
          {settingsTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
