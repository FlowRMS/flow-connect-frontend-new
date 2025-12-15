'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Warehouse,
  WarehouseLocationLevelConfig,
  defaultLocationLevels,
} from '@/lib/types/warehouse';
import { mockWarehouses } from '@/lib/data/warehouse-mock';

// Mock warehouse workers data
interface WarehouseWorker {
  id: string;
  name: string;
  email: string;
  role: 'worker' | 'manager';
  avatar?: string;
}

const mockAvailableWorkers: WarehouseWorker[] = [
  { id: 'W001', name: 'Marcus Johnson', email: 'marcus.j@company.com', role: 'worker' },
  { id: 'W002', name: 'Sarah Chen', email: 'sarah.c@company.com', role: 'manager' },
  { id: 'W003', name: 'David Rodriguez', email: 'david.r@company.com', role: 'worker' },
  { id: 'W004', name: 'Emily Thompson', email: 'emily.t@company.com', role: 'worker' },
  { id: 'W005', name: 'James Wilson', email: 'james.w@company.com', role: 'manager' },
  { id: 'W006', name: 'Lisa Park', email: 'lisa.p@company.com', role: 'worker' },
  { id: 'W007', name: 'Michael Brown', email: 'michael.b@company.com', role: 'worker' },
  { id: 'W008', name: 'Jennifer Davis', email: 'jennifer.d@company.com', role: 'worker' },
];

// Icon components for each level
const LevelIcons: Record<string, React.ReactNode> = {
  section: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  aisle: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  shelf: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  bay: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  row: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
  bin: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

const levelColors = [
  'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
];

interface WarehouseWorkerAssignment {
  workerId: string;
  role: 'worker' | 'manager';
}

interface WarehouseSettingsState {
  locationLevels: WarehouseLocationLevelConfig[];
  autoGenerateCodes: boolean;
  requireLocation: boolean;
  showLocationInPickLists: boolean;
  generateQRCodes: boolean;
  workers: WarehouseWorkerAssignment[];
}

interface WarehouseWithSettings extends Warehouse {
  settings: WarehouseSettingsState;
}

// Initialize warehouses with default settings
const initializeWarehouses = (): WarehouseWithSettings[] => {
  return mockWarehouses.map((wh, index) => ({
    ...wh,
    settings: {
      locationLevels: [...defaultLocationLevels],
      autoGenerateCodes: true,
      requireLocation: false,
      showLocationInPickLists: true,
      generateQRCodes: true,
      // Assign some workers to each warehouse for demo
      workers: index === 0
        ? [
            { workerId: 'W001', role: 'worker' },
            { workerId: 'W002', role: 'manager' },
            { workerId: 'W003', role: 'worker' },
            { workerId: 'W006', role: 'worker' },
          ]
        : [
            { workerId: 'W004', role: 'worker' },
            { workerId: 'W005', role: 'manager' },
            { workerId: 'W003', role: 'worker' }, // David is in both warehouses
          ],
    },
  }));
};

export default function WarehouseSettingsContent() {
  const [warehouses, setWarehouses] = useState<WarehouseWithSettings[]>(initializeWarehouses);
  const [expandedWarehouse, setExpandedWarehouse] = useState<string | null>(warehouses[0]?.id || null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showNewWarehouseModal, setShowNewWarehouseModal] = useState(false);
  const [showAddWorkerModal, setShowAddWorkerModal] = useState<string | null>(null);

  const toggleWarehouseExpansion = (warehouseId: string) => {
    setExpandedWarehouse(prev => prev === warehouseId ? null : warehouseId);
  };

  const toggleLevel = (warehouseId: string, level: string) => {
    setWarehouses(prev =>
      prev.map(wh =>
        wh.id === warehouseId
          ? {
              ...wh,
              settings: {
                ...wh.settings,
                locationLevels: wh.settings.locationLevels.map(l =>
                  l.level === level ? { ...l, enabled: !l.enabled } : l
                ),
              },
            }
          : wh
      )
    );
    setHasChanges(true);
  };

  const toggleSetting = (warehouseId: string, setting: keyof Omit<WarehouseSettingsState, 'locationLevels' | 'workers'>) => {
    setWarehouses(prev =>
      prev.map(wh =>
        wh.id === warehouseId
          ? {
              ...wh,
              settings: {
                ...wh.settings,
                [setting]: !wh.settings[setting],
              },
            }
          : wh
      )
    );
    setHasChanges(true);
  };

  const updateWorkerRole = (warehouseId: string, workerId: string, newRole: 'worker' | 'manager') => {
    setWarehouses(prev =>
      prev.map(wh =>
        wh.id === warehouseId
          ? {
              ...wh,
              settings: {
                ...wh.settings,
                workers: wh.settings.workers.map(w =>
                  w.workerId === workerId ? { ...w, role: newRole } : w
                ),
              },
            }
          : wh
      )
    );
    setHasChanges(true);
  };

  const removeWorker = (warehouseId: string, workerId: string) => {
    setWarehouses(prev =>
      prev.map(wh =>
        wh.id === warehouseId
          ? {
              ...wh,
              settings: {
                ...wh.settings,
                workers: wh.settings.workers.filter(w => w.workerId !== workerId),
              },
            }
          : wh
      )
    );
    setHasChanges(true);
  };

  const updateWarehouseField = (warehouseId: string, field: keyof Warehouse, value: string | boolean) => {
    setWarehouses(prev =>
      prev.map(wh =>
        wh.id === warehouseId
          ? { ...wh, [field]: value }
          : wh
      )
    );
    setHasChanges(true);
  };

  const addWorker = (warehouseId: string, workerId: string, role: 'worker' | 'manager') => {
    setWarehouses(prev =>
      prev.map(wh =>
        wh.id === warehouseId
          ? {
              ...wh,
              settings: {
                ...wh.settings,
                workers: [...wh.settings.workers, { workerId, role }],
              },
            }
          : wh
      )
    );
    setHasChanges(true);
    setShowAddWorkerModal(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsSaving(false);
    setHasChanges(false);
  };

  const getWorkerById = (workerId: string) => mockAvailableWorkers.find(w => w.id === workerId);

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header */}
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
              Configure warehouses, location hierarchy, and team assignments
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNewWarehouseModal(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Warehouse
            </button>
            <button
              onClick={handleSave}
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
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
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

      {/* Warehouses List */}
      <div className="space-y-4">
        {warehouses.map((warehouse) => {
          const isExpanded = expandedWarehouse === warehouse.id;
          const enabledLevels = warehouse.settings.locationLevels.filter(l => l.enabled);
          const managers = warehouse.settings.workers.filter(w => w.role === 'manager');
          const workers = warehouse.settings.workers.filter(w => w.role === 'worker');

          return (
            <div
              key={warehouse.id}
              className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden"
            >
              {/* Warehouse Header */}
              <button
                onClick={() => toggleWarehouseExpansion(warehouse.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-[var(--accent)]/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${warehouse.isActive ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-[var(--foreground)] flex items-center gap-2">
                      {warehouse.name}
                      {warehouse.isActive ? (
                        <span className="px-1.5 py-0.5 text-xs rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</span>
                      ) : (
                        <span className="px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">Inactive</span>
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
                  <div className="mb-6 pb-4 border-b border-[var(--border)]">
                    <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">Warehouse Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-[var(--muted-foreground)] mb-1">Name</label>
                        <input
                          type="text"
                          value={warehouse.name}
                          onChange={(e) => updateWarehouseField(warehouse.id, 'name', e.target.value)}
                          className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[var(--muted-foreground)] mb-1">Address</label>
                        <input
                          type="text"
                          value={warehouse.addressLine1}
                          onChange={(e) => updateWarehouseField(warehouse.id, 'addressLine1', e.target.value)}
                          className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-1">City</label>
                          <input
                            type="text"
                            value={warehouse.city}
                            onChange={(e) => updateWarehouseField(warehouse.id, 'city', e.target.value)}
                            className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-1">State</label>
                          <input
                            type="text"
                            value={warehouse.state}
                            onChange={(e) => updateWarehouseField(warehouse.id, 'state', e.target.value)}
                            className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-1">ZIP</label>
                          <input
                            type="text"
                            value={warehouse.postalCode}
                            onChange={(e) => updateWarehouseField(warehouse.id, 'postalCode', e.target.value)}
                            className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column: Location Hierarchy + Options */}
                    <div className="space-y-4">
                      {/* Location Hierarchy - Tree View */}
                      <div>
                        <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">Location Hierarchy</h3>
                        <div className="bg-[var(--background)] rounded-lg border border-[var(--border)] p-3">
                          <div className="space-y-1">
                            {warehouse.settings.locationLevels.map((level, index) => (
                              <div
                                key={level.level}
                                className="flex items-center justify-between py-1.5"
                                style={{ paddingLeft: index * 20 }}
                              >
                                <div className="flex items-center gap-2">
                                  {index > 0 && (
                                    <svg className="w-4 h-4 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  )}
                                  <div className={`p-1.5 rounded ${level.enabled ? levelColors[index] : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'}`}>
                                    {LevelIcons[level.level]}
                                  </div>
                                  <span className={`text-sm font-medium ${level.enabled ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)] line-through'}`}>
                                    {level.label}
                                  </span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={level.enabled}
                                    onChange={() => toggleLevel(warehouse.id, level.level)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                </label>
                              </div>
                            ))}
                          </div>

                          {/* Example Path */}
                          {enabledLevels.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center gap-2 text-sm">
                              <span className="text-[var(--muted-foreground)]">Example:</span>
                              <span className="bg-gray-100 dark:bg-gray-800 rounded px-2 py-0.5 font-mono text-xs">
                                {enabledLevels.map((l, i) => (
                                  <span key={l.level}>
                                    {i > 0 && <span className="text-[var(--muted-foreground)]">-</span>}
                                    <span>
                                      {l.level === 'section' && 'A'}
                                      {l.level === 'aisle' && '1'}
                                      {l.level === 'shelf' && '3'}
                                      {l.level === 'bay' && '2'}
                                      {l.level === 'row' && '1'}
                                      {l.level === 'bin' && 'B'}
                                    </span>
                                  </span>
                                ))}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Additional Settings - Compact */}
                      <div>
                        <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">Options</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <SettingToggle
                            label="Auto-generate Codes"
                            checked={warehouse.settings.autoGenerateCodes}
                            onChange={() => toggleSetting(warehouse.id, 'autoGenerateCodes')}
                          />
                          <SettingToggle
                            label="Require Location"
                            checked={warehouse.settings.requireLocation}
                            onChange={() => toggleSetting(warehouse.id, 'requireLocation')}
                          />
                          <SettingToggle
                            label="Show in Pick Lists"
                            checked={warehouse.settings.showLocationInPickLists}
                            onChange={() => toggleSetting(warehouse.id, 'showLocationInPickLists')}
                          />
                          <SettingToggle
                            label="Generate QR Codes"
                            checked={warehouse.settings.generateQRCodes}
                            onChange={() => toggleSetting(warehouse.id, 'generateQRCodes')}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Team Members */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-[var(--foreground)]">Team Members</h3>
                        <button
                          onClick={() => setShowAddWorkerModal(warehouse.id)}
                          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add Member
                        </button>
                      </div>

                      <div className="bg-[var(--background)] rounded-lg border border-[var(--border)] divide-y divide-[var(--border)]">
                        {/* Managers Section */}
                        {managers.length > 0 && (
                          <div className="p-3">
                            <div className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                              Managers ({managers.length})
                            </div>
                            <div className="space-y-1.5">
                              {managers.map(assignment => {
                                const worker = getWorkerById(assignment.workerId);
                                if (!worker) return null;
                                return (
                                  <WorkerRow
                                    key={worker.id}
                                    worker={worker}
                                    role={assignment.role}
                                    onRoleChange={(role) => updateWorkerRole(warehouse.id, worker.id, role)}
                                    onRemove={() => removeWorker(warehouse.id, worker.id)}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Workers Section */}
                        {workers.length > 0 && (
                          <div className="p-3">
                            <div className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Workers ({workers.length})
                            </div>
                            <div className="space-y-1.5">
                              {workers.map(assignment => {
                                const worker = getWorkerById(assignment.workerId);
                                if (!worker) return null;
                                return (
                                  <WorkerRow
                                    key={worker.id}
                                    worker={worker}
                                    role={assignment.role}
                                    onRoleChange={(role) => updateWorkerRole(warehouse.id, worker.id, role)}
                                    onRemove={() => removeWorker(warehouse.id, worker.id)}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Empty State */}
                        {warehouse.settings.workers.length === 0 && (
                          <div className="p-6 text-center">
                            <svg className="w-8 h-8 mx-auto text-[var(--muted-foreground)] opacity-50 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <p className="text-sm text-[var(--muted-foreground)]">No team members assigned</p>
                            <button
                              onClick={() => setShowAddWorkerModal(warehouse.id)}
                              className="mt-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            >
                              Add team members
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Warehouse Actions */}
                  {!warehouse.isActive && (
                    <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center">
                      <button className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 ml-auto">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {warehouses.length === 0 && (
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-[var(--muted-foreground)] opacity-50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No Warehouses Configured</h3>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            Get started by adding your first warehouse.
          </p>
          <button
            onClick={() => setShowNewWarehouseModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Add Warehouse
          </button>
        </div>
      )}

      {/* New Warehouse Modal */}
      {showNewWarehouseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Add New Warehouse</h2>
              <button
                onClick={() => setShowNewWarehouseModal(false)}
                className="p-1 hover:bg-[var(--accent)] rounded transition-colors"
              >
                <svg className="w-5 h-5 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Warehouse Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Chicago Distribution Center"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">City</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">State</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="State"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Address</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Street address"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-[var(--border)]">
              <button
                onClick={() => setShowNewWarehouseModal(false)}
                className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--accent)] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowNewWarehouseModal(false)}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Warehouse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Worker Modal */}
      {showAddWorkerModal && (
        <AddWorkerModal
          warehouseId={showAddWorkerModal}
          existingWorkerIds={warehouses.find(w => w.id === showAddWorkerModal)?.settings.workers.map(w => w.workerId) || []}
          availableWorkers={mockAvailableWorkers}
          onAdd={addWorker}
          onClose={() => setShowAddWorkerModal(null)}
        />
      )}
    </main>
  );
}

// Compact setting toggle component
function SettingToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--background)] border border-[var(--border)]">
      <span className="text-xs text-[var(--foreground)]">{label}</span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only peer"
        />
        <div className="w-7 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
      </label>
    </div>
  );
}

// Worker row component
function WorkerRow({
  worker,
  role,
  onRoleChange,
  onRemove
}: {
  worker: WarehouseWorker;
  role: 'worker' | 'manager';
  onRoleChange: (role: 'worker' | 'manager') => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--accent)]/50 group">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
          {worker.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <div className="text-sm font-medium text-[var(--foreground)]">{worker.name}</div>
          <div className="text-xs text-[var(--muted-foreground)]">{worker.email}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <select
          value={role}
          onChange={(e) => onRoleChange(e.target.value as 'worker' | 'manager')}
          className="text-xs px-2 py-1 rounded border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="worker">Worker</option>
          <option value="manager">Manager</option>
        </select>
        <button
          onClick={onRemove}
          className="p-1 text-[var(--muted-foreground)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Add Worker Modal
function AddWorkerModal({
  warehouseId,
  existingWorkerIds,
  availableWorkers,
  onAdd,
  onClose,
}: {
  warehouseId: string;
  existingWorkerIds: string[];
  availableWorkers: WarehouseWorker[];
  onAdd: (warehouseId: string, workerId: string, role: 'worker' | 'manager') => void;
  onClose: () => void;
}) {
  const [selectedWorker, setSelectedWorker] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'worker' | 'manager'>('worker');

  const unassignedWorkers = availableWorkers.filter(w => !existingWorkerIds.includes(w.id));

  const handleAdd = () => {
    if (selectedWorker) {
      onAdd(warehouseId, selectedWorker, selectedRole);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Add Team Member</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--accent)] rounded transition-colors"
          >
            <svg className="w-5 h-5 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 space-y-4">
          {unassignedWorkers.length > 0 ? (
            <>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Select Person</label>
                <select
                  value={selectedWorker}
                  onChange={(e) => setSelectedWorker(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a person...</option>
                  {unassignedWorkers.map(worker => (
                    <option key={worker.id} value={worker.id}>
                      {worker.name} ({worker.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as 'worker' | 'manager')}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="worker">Worker</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <svg className="w-10 h-10 mx-auto text-[var(--muted-foreground)] opacity-50 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm text-[var(--muted-foreground)]">All available workers are already assigned to this warehouse.</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 p-4 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--accent)] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!selectedWorker}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              selectedWorker
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
            }`}
          >
            Add Member
          </button>
        </div>
      </div>
    </div>
  );
}
