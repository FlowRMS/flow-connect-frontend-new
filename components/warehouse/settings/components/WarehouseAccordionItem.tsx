import React from 'react';
import type { Warehouse } from '@/lib/types/warehouse';
import type { WarehouseWithSettings, WarehouseWorker } from '../types';
import WarehouseDetailsForm from './WarehouseDetailsForm';
import LocationHierarchySection from './LocationHierarchySection';
import TeamMembersSection from './TeamMembersSection';

// Skeleton for warehouse details form
function WarehouseDetailsSkeleton() {
  return (
    <div className="mb-6 pb-4 border-b border-[var(--border)] animate-pulse">
      <div className="h-4 w-32 bg-[var(--muted)] rounded mb-3" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <div className="h-3 w-12 bg-[var(--muted)] rounded mb-1" />
          <div className="h-9 bg-[var(--muted)] rounded-lg" />
        </div>
        <div>
          <div className="h-3 w-16 bg-[var(--muted)] rounded mb-1" />
          <div className="h-9 bg-[var(--muted)] rounded-lg" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <div className="h-3 w-8 bg-[var(--muted)] rounded mb-1" />
            <div className="h-9 bg-[var(--muted)] rounded-lg" />
          </div>
          <div>
            <div className="h-3 w-10 bg-[var(--muted)] rounded mb-1" />
            <div className="h-9 bg-[var(--muted)] rounded-lg" />
          </div>
          <div>
            <div className="h-3 w-8 bg-[var(--muted)] rounded mb-1" />
            <div className="h-9 bg-[var(--muted)] rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Skeleton for location hierarchy section
function LocationHierarchySkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-36 bg-[var(--muted)] rounded mb-3" />
      <div className="bg-[var(--background)] rounded-lg border border-[var(--border)] p-3 space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2" style={{ paddingLeft: `${i * 16}px` }}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[var(--muted)] rounded" />
              <div className="h-4 w-16 bg-[var(--muted)] rounded" />
            </div>
            <div className="w-10 h-5 bg-[var(--muted)] rounded-full" />
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-10 bg-[var(--muted)] rounded-lg" />
        <div className="h-10 bg-[var(--muted)] rounded-lg" />
      </div>
    </div>
  );
}

// Skeleton for team members section
function TeamMembersSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 w-28 bg-[var(--muted)] rounded" />
        <div className="h-6 w-24 bg-[var(--muted)] rounded" />
      </div>
      <div className="bg-[var(--background)] rounded-lg border border-[var(--border)] p-3 space-y-3">
        <div className="h-3 w-20 bg-[var(--muted)] rounded" />
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[var(--muted)] rounded-full" />
              <div>
                <div className="h-4 w-24 bg-[var(--muted)] rounded mb-1" />
                <div className="h-3 w-32 bg-[var(--muted)] rounded" />
              </div>
            </div>
            <div className="w-20 h-8 bg-[var(--muted)] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface WarehouseAccordionItemProps {
  warehouse: WarehouseWithSettings;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  onUpdateField: (field: keyof Warehouse, value: string) => void;
  onToggleLevel: (level: string) => void;
  onUpdateWorkerRole: (workerId: string, role: 'worker' | 'manager') => void;
  onRemoveWorker: (workerId: string) => void;
  onShowAddWorker: () => void;
  onShowLayout: () => void;
  onShowQRCodes: () => void;
  getWorkerById: (workerId: string) => WarehouseWorker | undefined;
  hasChanges: boolean;
  isSaving: boolean;
  onSave: () => Promise<void>;
  isLoadingDetails?: boolean;
}

export default function WarehouseAccordionItem({
  warehouse,
  isExpanded,
  onToggleExpansion,
  onUpdateField,
  onToggleLevel,
  onUpdateWorkerRole,
  onRemoveWorker,
  onShowAddWorker,
  onShowLayout,
  onShowQRCodes,
  getWorkerById,
  hasChanges,
  isSaving,
  onSave,
  isLoadingDetails = false,
}: WarehouseAccordionItemProps) {
  const enabledLevels = warehouse.settings.locationLevels.filter((l) => l.enabled);

  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
      {/* Warehouse Header - Clickable */}
      <div
        onClick={onToggleExpansion}
        className="w-full flex items-center justify-between p-4 hover:bg-[var(--muted)]/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <div
            className={`p-2 rounded-lg ${warehouse.isActive ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <div className="text-left">
            <div className="font-medium text-[var(--foreground)] flex items-center gap-2">
              {warehouse.name}
              {warehouse.isActive ? (
                <span className="px-1.5 py-0.5 text-xs rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Active
                </span>
              ) : (
                <span className="px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  Inactive
                </span>
              )}
            </div>
            <div className="text-sm text-[var(--muted-foreground)]">
              {warehouse.city}, {warehouse.state} • {warehouse.settings.workers.length} team members
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-[var(--muted-foreground)] hidden sm:block">
            {enabledLevels.length} levels
          </div>
          {/* Save button in header when there are changes */}
          {hasChanges && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSave();
              }}
              disabled={isSaving}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save
                </>
              )}
            </button>
          )}
          <svg
            className={`w-5 h-5 text-[var(--muted-foreground)] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-[var(--border)] p-4">
          {isLoadingDetails ? (
            <>
              {/* Skeleton Loading State */}
              <WarehouseDetailsSkeleton />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <LocationHierarchySkeleton />
                </div>
                <TeamMembersSkeleton />
              </div>
            </>
          ) : (
            <>
              {/* Warehouse Details Section */}
              <WarehouseDetailsForm warehouse={warehouse} onUpdateField={onUpdateField} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Location Hierarchy + Options */}
                <div className="space-y-4">
                  <LocationHierarchySection
                    warehouse={warehouse}
                    onToggleLevel={onToggleLevel}
                    onShowLayout={onShowLayout}
                    onShowQRCodes={onShowQRCodes}
                  />
                </div>

                {/* Right Column: Team Members */}
                <TeamMembersSection
                  warehouse={warehouse}
                  onUpdateWorkerRole={onUpdateWorkerRole}
                  onRemoveWorker={onRemoveWorker}
                  onShowAddWorker={onShowAddWorker}
                  getWorkerById={getWorkerById}
                />
              </div>

              {/* Save Button */}
              {hasChanges && (
                <div className="mt-6 pt-4 border-t border-[var(--border)] flex justify-end">
                  <button
                    onClick={onSave}
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                  >
                    {isSaving ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
