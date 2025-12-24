import React from 'react';
import type { Warehouse } from '@/lib/types/warehouse';
import type { WarehouseWithSettings, WarehouseWorker } from '../types';
import WarehouseDetailsForm from './WarehouseDetailsForm';
import LocationHierarchySection from './LocationHierarchySection';
import TeamMembersSection from './TeamMembersSection';

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
}: WarehouseAccordionItemProps) {
  const enabledLevels = warehouse.settings.locationLevels.filter((l) => l.enabled);

  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
      {/* Warehouse Header */}
      <button
        onClick={onToggleExpansion}
        className="w-full flex items-center justify-between p-4 hover:bg-[var(--accent)]/50 transition-colors"
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
          <svg
            className={`w-5 h-5 text-[var(--muted-foreground)] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-[var(--border)] p-4">
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
        </div>
      )}
    </div>
  );
}
