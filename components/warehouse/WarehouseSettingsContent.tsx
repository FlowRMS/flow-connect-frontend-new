'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Warehouse,
  WarehouseLocationLevelConfig,
  defaultLocationLevels,
} from '@/lib/types/warehouse';
import { mockWarehouses } from '@/lib/data/warehouse-mock';
import WarehouseLayoutModal from './WarehouseLayoutModal';
import WarehouseQRCodesModal from './WarehouseQRCodesModal';

// Mock warehouse workers data
interface WarehouseWorker {
  id: string;
  name: string;
  email: string;
  role: 'worker' | 'manager';
  avatar?: string;
}

// Shipping carrier interface with comprehensive warehouse fields
interface ShippingCarrier {
  id: string;
  name: string;
  code?: string; // SCAC code or carrier abbreviation
  isActive: boolean;
  // Account & Billing
  accountNumber?: string;
  billingAddress?: string;
  paymentTerms?: string;
  // API Integration
  apiKey?: string;
  apiEndpoint?: string;
  trackingUrlTemplate?: string; // e.g., https://www.fedex.com/track?trknbr={tracking_number}
  // Contact Information
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  // Service Configuration
  serviceTypes?: string[]; // e.g., ['Ground', 'Express', '2-Day', 'Overnight']
  defaultServiceType?: string;
  // Shipping Settings
  maxWeight?: number; // in lbs
  maxDimensions?: string; // e.g., "108x108x108"
  residentialSurcharge?: number;
  fuelSurchargePercent?: number;
  // Pickup Settings
  pickupSchedule?: string; // e.g., "Daily at 3:00 PM"
  pickupLocation?: string;
  // Notes
  remarks?: string;
  internalNotes?: string;
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

// Mock shipping carriers with comprehensive data
const mockShippingCarriers: ShippingCarrier[] = [
  {
    id: 'SC001',
    name: 'FedEx',
    code: 'FEDX',
    isActive: true,
    accountNumber: '1234567890',
    billingAddress: '123 Corporate Blvd, Memphis, TN 38118',
    paymentTerms: 'Net 30',
    apiKey: '••••••••••••••••',
    trackingUrlTemplate: 'https://www.fedex.com/fedextrack/?trknbr={tracking_number}',
    contactName: 'John Smith',
    contactPhone: '(800) 463-3339',
    contactEmail: 'support@fedex.com',
    serviceTypes: ['Ground', 'Express Saver', '2Day', 'Priority Overnight', 'Standard Overnight'],
    defaultServiceType: 'Ground',
    maxWeight: 150,
    maxDimensions: '108x108x165',
    fuelSurchargePercent: 12.5,
    pickupSchedule: 'Daily at 4:00 PM',
    pickupLocation: 'Loading Dock A',
  },
  {
    id: 'SC002',
    name: 'UPS',
    code: 'UPSS',
    isActive: true,
    accountNumber: '9876543210',
    paymentTerms: 'Net 30',
    trackingUrlTemplate: 'https://www.ups.com/track?tracknum={tracking_number}',
    contactName: 'Sarah Johnson',
    contactPhone: '(800) 742-5877',
    contactEmail: 'support@ups.com',
    serviceTypes: ['Ground', '3 Day Select', '2nd Day Air', 'Next Day Air', 'Next Day Air Saver'],
    defaultServiceType: 'Ground',
    maxWeight: 150,
    fuelSurchargePercent: 11.75,
    pickupSchedule: 'Daily at 3:30 PM',
    pickupLocation: 'Loading Dock A',
  },
  {
    id: 'SC003',
    name: 'Old Dominion',
    code: 'ODFL',
    isActive: true,
    accountNumber: 'OD-445566',
    contactName: 'Shawn Him',
    contactPhone: '(800) 432-6335',
    contactEmail: 'shawn.him@olddominion.com',
    serviceTypes: ['LTL Standard', 'LTL Expedited', 'LTL Guaranteed'],
    defaultServiceType: 'LTL Standard',
    maxWeight: 20000,
    pickupSchedule: 'On Request',
    remarks: 'We have a login to arrange shipments with Old Dominion in Navigator.',
    internalNotes: 'Preferred carrier for LTL shipments over 500 lbs',
  },
  {
    id: 'SC004',
    name: 'ABF Freight',
    code: 'ABFS',
    isActive: true,
    accountNumber: 'ABF-778899',
    contactPhone: '(800) 610-5544',
    serviceTypes: ['LTL', 'Volume LTL', 'Truckload'],
    defaultServiceType: 'LTL',
    maxWeight: 44000,
    pickupSchedule: 'Call for pickup',
  },
  {
    id: 'SC005',
    name: 'TForce Freight',
    code: 'TFRC',
    isActive: true,
    accountNumber: 'TF-112233',
    contactPhone: '(800) 333-7400',
    serviceTypes: ['Standard LTL', 'Guaranteed', 'Time Critical'],
    defaultServiceType: 'Standard LTL',
  },
  {
    id: 'SC006',
    name: 'Estes Express',
    code: 'EXLA',
    isActive: true,
    accountNumber: 'EST-554433',
    contactPhone: '(804) 353-1900',
    serviceTypes: ['LTL', 'Volume', 'Truckload', 'Final Mile'],
    defaultServiceType: 'LTL',
    maxWeight: 20000,
  },
  {
    id: 'SC007',
    name: 'AAA Cooper',
    code: 'AACT',
    isActive: false,
    accountNumber: 'AAA-998877',
    contactPhone: '(334) 793-2284',
    serviceTypes: ['Regional LTL', 'Guaranteed'],
    internalNotes: 'Account on hold - billing dispute',
  },
];

// Container type interface
interface ContainerType {
  id: string;
  name: string;
  length: number; // in inches
  width: number;  // in inches
  height: number; // in inches
  weight: number; // tare weight in lbs
  order: number;  // order in dropdown
}

// Mock container types
const mockContainerTypes: ContainerType[] = [
  { id: 'CT001', name: 'Pallet (48x40x6)', length: 48, width: 40, height: 6, weight: 30, order: 0 },
  { id: 'CT002', name: 'Small Box', length: 12, width: 10, height: 8, weight: 0.5, order: 1 },
  { id: 'CT003', name: 'Medium Box', length: 18, width: 14, height: 12, weight: 1, order: 2 },
  { id: 'CT004', name: 'Large Box', length: 24, width: 18, height: 18, weight: 1.5, order: 3 },
  { id: 'CT005', name: 'Extra Large Box', length: 30, width: 24, height: 24, weight: 2, order: 4 },
];

interface WarehouseSettingsState {
  locationLevels: WarehouseLocationLevelConfig[];
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

type SettingsTab = 'warehouses' | 'shipping-carriers' | 'containers';

const settingsTabs: { id: SettingsTab; label: string }[] = [
  { id: 'warehouses', label: 'Warehouses' },
  { id: 'shipping-carriers', label: 'Shipping Carriers' },
  { id: 'containers', label: 'Containers' },
];

export default function WarehouseSettingsContent() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('warehouses');
  const [warehouses, setWarehouses] = useState<WarehouseWithSettings[]>(initializeWarehouses);
  const [expandedWarehouse, setExpandedWarehouse] = useState<string | null>(warehouses[0]?.id || null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showNewWarehouseModal, setShowNewWarehouseModal] = useState(false);
  const [showAddWorkerModal, setShowAddWorkerModal] = useState<string | null>(null);
  const [showLayoutModal, setShowLayoutModal] = useState<string | null>(null);
  const [showQRCodesModal, setShowQRCodesModal] = useState<string | null>(null);
  const [shippingCarriers, setShippingCarriers] = useState<ShippingCarrier[]>(mockShippingCarriers);
  const [expandedCarrierId, setExpandedCarrierId] = useState<string | null>(null);
  const [newCarrierName, setNewCarrierName] = useState('');
  const [newCarrierAccount, setNewCarrierAccount] = useState('');
  const [newCarrierRemarks, setNewCarrierRemarks] = useState('');

  // Container state
  const [containerTypes, setContainerTypes] = useState<ContainerType[]>(mockContainerTypes);
  const [editingContainerId, setEditingContainerId] = useState<string | null>(null);
  const [draggedContainerId, setDraggedContainerId] = useState<string | null>(null);

  const toggleWarehouseExpansion = (warehouseId: string) => {
    setExpandedWarehouse(prev => prev === warehouseId ? null : warehouseId);
  };

  const toggleCarrierExpansion = (carrierId: string) => {
    setExpandedCarrierId(prev => prev === carrierId ? null : carrierId);
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

  const updateLocationLevels = (warehouseId: string, levels: WarehouseLocationLevelConfig[]) => {
    setWarehouses(prev =>
      prev.map(wh =>
        wh.id === warehouseId
          ? {
              ...wh,
              settings: {
                ...wh.settings,
                locationLevels: levels,
              },
            }
          : wh
      )
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsSaving(false);
    setHasChanges(false);
  };

  const getWorkerById = (workerId: string) => mockAvailableWorkers.find(w => w.id === workerId);

  const handleAddCarrier = () => {
    if (newCarrierName.trim()) {
      const newCarrier: ShippingCarrier = {
        id: `SC${Date.now()}`,
        name: newCarrierName.trim(),
        isActive: true,
        accountNumber: newCarrierAccount.trim() || undefined,
        remarks: newCarrierRemarks.trim() || undefined,
      };
      setShippingCarriers([...shippingCarriers, newCarrier]);
      setNewCarrierName('');
      setNewCarrierAccount('');
      setNewCarrierRemarks('');
      setHasChanges(true);
      // Expand the newly added carrier
      setExpandedCarrierId(newCarrier.id);
    }
  };

  const handleDeleteCarrier = (id: string) => {
    setShippingCarriers(shippingCarriers.filter(c => c.id !== id));
    setHasChanges(true);
  };

  const handleUpdateCarrier = (id: string, updates: Partial<ShippingCarrier>) => {
    setShippingCarriers(shippingCarriers.map(c =>
      c.id === id ? { ...c, ...updates } : c
    ));
    setHasChanges(true);
  };

  // Container management functions
  const handleAddContainer = () => {
    const newContainer: ContainerType = {
      id: `CT${Date.now()}`,
      name: 'New Container',
      length: 12,
      width: 12,
      height: 12,
      weight: 0,
      order: containerTypes.length,
    };
    setContainerTypes([...containerTypes, newContainer]);
    setEditingContainerId(newContainer.id);
    setHasChanges(true);
  };

  const handleUpdateContainer = (id: string, updates: Partial<ContainerType>) => {
    setContainerTypes(containerTypes.map(c =>
      c.id === id ? { ...c, ...updates } : c
    ));
    setHasChanges(true);
  };

  const handleDeleteContainer = (id: string) => {
    const filtered = containerTypes.filter(c => c.id !== id);
    // Re-order remaining containers
    const reordered = filtered.map((c, idx) => ({ ...c, order: idx }));
    setContainerTypes(reordered);
    setHasChanges(true);
  };

  const handleContainerDragStart = (e: React.DragEvent, containerId: string) => {
    setDraggedContainerId(containerId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleContainerDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedContainerId || draggedContainerId === targetId) return;

    const draggedIndex = containerTypes.findIndex(c => c.id === draggedContainerId);
    const targetIndex = containerTypes.findIndex(c => c.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newContainers = [...containerTypes];
    const [draggedItem] = newContainers.splice(draggedIndex, 1);
    newContainers.splice(targetIndex, 0, draggedItem);

    // Update order values
    const reordered = newContainers.map((c, idx) => ({ ...c, order: idx }));
    setContainerTypes(reordered);
  };

  const handleContainerDragEnd = () => {
    setDraggedContainerId(null);
    setHasChanges(true);
  };

  const sortedContainers = [...containerTypes].sort((a, b) => a.order - b.order);

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
              Configure warehouses, shipping carriers, and team assignments
            </p>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === 'warehouses' && (
              <button
                onClick={() => setShowNewWarehouseModal(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Warehouse
              </button>
            )}
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

      {/* Horizontal Tabs */}
      <div className="border-b border-[var(--border)] mb-6">
        <div className="flex gap-0">
          {settingsTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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

      {/* Warehouses Tab Content */}
      {activeTab === 'warehouses' && (
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
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-medium text-[var(--foreground)]">Location Hierarchy</h3>
                        </div>
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

                        {/* View/Edit Warehouse Layout Button */}
                        <button
                          onClick={() => setShowLayoutModal(warehouse.id)}
                          className="w-full mt-3 px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                          </svg>
                          View/Edit Warehouse Layout
                        </button>
                      </div>

                      {/* QR Codes Button */}
                      <div>
                        <button
                          onClick={() => setShowQRCodesModal(warehouse.id)}
                          className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                          </svg>
                          See and Print QR Codes
                        </button>
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
      </div>
      )}

      {/* Shipping Carriers Tab Content */}
      {activeTab === 'shipping-carriers' && (
        <div className="space-y-4">
          {/* Carriers List - Accordion Style */}
          {shippingCarriers.map((carrier) => {
            const isExpanded = expandedCarrierId === carrier.id;

            return (
              <div
                key={carrier.id}
                className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden"
              >
                {/* Carrier Header - Clickable */}
                <button
                  onClick={() => toggleCarrierExpansion(carrier.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-[var(--accent)]/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${carrier.isActive ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'}`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-[var(--foreground)] flex items-center gap-2">
                        {carrier.name}
                        {carrier.code && (
                          <span className="px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 font-mono">
                            {carrier.code}
                          </span>
                        )}
                        {carrier.isActive ? (
                          <span className="px-1.5 py-0.5 text-xs rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</span>
                        ) : (
                          <span className="px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">Inactive</span>
                        )}
                      </div>
                      <div className="text-sm text-[var(--muted-foreground)]">
                        {carrier.accountNumber ? `Account: ${carrier.accountNumber}` : 'No account configured'}
                        {carrier.serviceTypes && carrier.serviceTypes.length > 0 && ` • ${carrier.serviceTypes.length} services`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {carrier.defaultServiceType && (
                      <div className="text-sm text-[var(--muted-foreground)] hidden sm:block">
                        Default: {carrier.defaultServiceType}
                      </div>
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
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-[var(--border)] p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left Column */}
                      <div className="space-y-4">
                        {/* Basic Information */}
                        <div>
                          <h3 className="text-sm font-medium text-[var(--foreground)] mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Basic Information
                          </h3>
                          <div className="bg-[var(--background)] rounded-lg border border-[var(--border)] p-3 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-[var(--muted-foreground)] mb-1">Carrier Name</label>
                                <input
                                  type="text"
                                  value={carrier.name}
                                  onChange={(e) => handleUpdateCarrier(carrier.id, { name: e.target.value })}
                                  className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-[var(--muted-foreground)] mb-1">SCAC Code</label>
                                <input
                                  type="text"
                                  value={carrier.code || ''}
                                  onChange={(e) => handleUpdateCarrier(carrier.id, { code: e.target.value })}
                                  placeholder="e.g., FEDX"
                                  className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-[var(--foreground)]">Active</span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={carrier.isActive}
                                  onChange={(e) => handleUpdateCarrier(carrier.id, { isActive: e.target.checked })}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Account & Billing */}
                        <div>
                          <h3 className="text-sm font-medium text-[var(--foreground)] mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            Account & Billing
                          </h3>
                          <div className="bg-[var(--background)] rounded-lg border border-[var(--border)] p-3 space-y-3">
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)] mb-1">Account Number</label>
                              <input
                                type="text"
                                value={carrier.accountNumber || ''}
                                onChange={(e) => handleUpdateCarrier(carrier.id, { accountNumber: e.target.value })}
                                placeholder="Your carrier account number"
                                className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)] mb-1">Billing Address</label>
                              <input
                                type="text"
                                value={carrier.billingAddress || ''}
                                onChange={(e) => handleUpdateCarrier(carrier.id, { billingAddress: e.target.value })}
                                placeholder="Billing address for this carrier"
                                className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)] mb-1">Payment Terms</label>
                              <select
                                value={carrier.paymentTerms || ''}
                                onChange={(e) => handleUpdateCarrier(carrier.id, { paymentTerms: e.target.value })}
                                className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select payment terms</option>
                                <option value="Prepaid">Prepaid</option>
                                <option value="Net 15">Net 15</option>
                                <option value="Net 30">Net 30</option>
                                <option value="Net 45">Net 45</option>
                                <option value="Net 60">Net 60</option>
                                <option value="Collect">Collect</option>
                                <option value="Third Party">Third Party</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Contact Information */}
                        <div>
                          <h3 className="text-sm font-medium text-[var(--foreground)] mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Contact Information
                          </h3>
                          <div className="bg-[var(--background)] rounded-lg border border-[var(--border)] p-3 space-y-3">
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)] mb-1">Contact Name</label>
                              <input
                                type="text"
                                value={carrier.contactName || ''}
                                onChange={(e) => handleUpdateCarrier(carrier.id, { contactName: e.target.value })}
                                placeholder="Primary contact name"
                                className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-[var(--muted-foreground)] mb-1">Phone</label>
                                <input
                                  type="tel"
                                  value={carrier.contactPhone || ''}
                                  onChange={(e) => handleUpdateCarrier(carrier.id, { contactPhone: e.target.value })}
                                  placeholder="(800) 555-1234"
                                  className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-[var(--muted-foreground)] mb-1">Email</label>
                                <input
                                  type="email"
                                  value={carrier.contactEmail || ''}
                                  onChange={(e) => handleUpdateCarrier(carrier.id, { contactEmail: e.target.value })}
                                  placeholder="contact@carrier.com"
                                  className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-4">
                        {/* Service Configuration */}
                        <div>
                          <h3 className="text-sm font-medium text-[var(--foreground)] mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                            Service Configuration
                          </h3>
                          <div className="bg-[var(--background)] rounded-lg border border-[var(--border)] p-3 space-y-3">
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)] mb-1">Service Types</label>
                              {/* Selected service tags */}
                              <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
                                {carrier.serviceTypes?.map(service => (
                                  <span
                                    key={service}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                  >
                                    {service}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newServices = carrier.serviceTypes?.filter(s => s !== service) || [];
                                        handleUpdateCarrier(carrier.id, {
                                          serviceTypes: newServices,
                                          defaultServiceType: carrier.defaultServiceType === service ? '' : carrier.defaultServiceType
                                        });
                                      }}
                                      className="hover:text-blue-900 dark:hover:text-blue-200"
                                    >
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </span>
                                ))}
                              </div>
                              {/* Add service dropdown */}
                              <div className="relative">
                                <select
                                  value=""
                                  onChange={(e) => {
                                    if (e.target.value && !carrier.serviceTypes?.includes(e.target.value)) {
                                      handleUpdateCarrier(carrier.id, {
                                        serviceTypes: [...(carrier.serviceTypes || []), e.target.value]
                                      });
                                    }
                                  }}
                                  className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">+ Add service type...</option>
                                  <optgroup label="Parcel Services">
                                    {['Ground', 'Express Saver', '2Day', '2nd Day Air', '3 Day Select', 'Priority Overnight', 'Standard Overnight', 'Next Day Air', 'Next Day Air Saver', 'Same Day'].filter(s => !carrier.serviceTypes?.includes(s)).map(service => (
                                      <option key={service} value={service}>{service}</option>
                                    ))}
                                  </optgroup>
                                  <optgroup label="Freight Services">
                                    {['LTL', 'LTL Standard', 'LTL Expedited', 'LTL Guaranteed', 'Volume LTL', 'Truckload', 'Partial Truckload', 'Final Mile', 'White Glove'].filter(s => !carrier.serviceTypes?.includes(s)).map(service => (
                                      <option key={service} value={service}>{service}</option>
                                    ))}
                                  </optgroup>
                                  <optgroup label="Regional">
                                    {['Regional Ground', 'Regional LTL', 'Regional Express'].filter(s => !carrier.serviceTypes?.includes(s)).map(service => (
                                      <option key={service} value={service}>{service}</option>
                                    ))}
                                  </optgroup>
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)] mb-1">Default Service Type</label>
                              <select
                                value={carrier.defaultServiceType || ''}
                                onChange={(e) => handleUpdateCarrier(carrier.id, { defaultServiceType: e.target.value })}
                                className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select default service</option>
                                {carrier.serviceTypes?.map(service => (
                                  <option key={service} value={service}>{service}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* API Integration */}
                        <div>
                          <h3 className="text-sm font-medium text-[var(--foreground)] mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                            API Integration
                          </h3>
                          <div className="bg-[var(--background)] rounded-lg border border-[var(--border)] p-6 text-center">
                            <svg className="w-10 h-10 mx-auto text-[var(--muted-foreground)] opacity-50 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                            <p className="text-sm font-medium text-[var(--foreground)]">Coming Soon</p>
                            <p className="text-xs text-[var(--muted-foreground)] mt-1">Direct carrier API integration for real-time rates and tracking</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notes Section - Full Width */}
                    <div className="mt-4 pt-4 border-t border-[var(--border)]">
                      <h3 className="text-sm font-medium text-[var(--foreground)] mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Notes
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Remarks (visible to team)</label>
                          <textarea
                            value={carrier.remarks || ''}
                            onChange={(e) => handleUpdateCarrier(carrier.id, { remarks: e.target.value })}
                            placeholder="Notes visible to the team..."
                            rows={2}
                            className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Internal Notes (admin only)</label>
                          <textarea
                            value={carrier.internalNotes || ''}
                            onChange={(e) => handleUpdateCarrier(carrier.id, { internalNotes: e.target.value })}
                            placeholder="Private notes for administrators..."
                            rows={2}
                            className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Delete Action */}
                    <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-end">
                      <button
                        onClick={() => handleDeleteCarrier(carrier.id)}
                        className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Carrier
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty State */}
          {shippingCarriers.length === 0 && (
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-[var(--muted-foreground)] opacity-50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No Shipping Carriers Configured</h3>
              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                Get started by adding your first shipping carrier.
              </p>
            </div>
          )}

          {/* Add New Carrier Button */}
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] border-dashed p-4">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={newCarrierName}
                onChange={(e) => setNewCarrierName(e.target.value)}
                placeholder="Enter carrier name to add..."
                className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newCarrierName.trim()) {
                    handleAddCarrier();
                  }
                }}
              />
              <button
                onClick={handleAddCarrier}
                disabled={!newCarrierName.trim()}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  newCarrierName.trim()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Carrier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Containers Tab Content */}
      {activeTab === 'containers' && (
        <div className="space-y-4">
          {/* Info Banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">Container Types</h4>
                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                  Configure the container types available for packing. Drag rows to reorder how they appear in dropdowns.
                </p>
              </div>
            </div>
          </div>

          {/* Container List */}
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-[var(--muted)]/30 border-b border-[var(--border)] text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
              <div className="col-span-1"></div>
              <div className="col-span-4">Name</div>
              <div className="col-span-4">Dimensions (in)</div>
              <div className="col-span-2">Weight (lbs)</div>
              <div className="col-span-1"></div>
            </div>

            {/* Container Rows */}
            <div className="divide-y divide-[var(--border)]">
              {sortedContainers.map((container, index) => {
                const isEditing = editingContainerId === container.id;

                return (
                  <div
                    key={container.id}
                    draggable={!isEditing}
                    onDragStart={(e) => handleContainerDragStart(e, container.id)}
                    onDragOver={(e) => handleContainerDragOver(e, container.id)}
                    onDragEnd={handleContainerDragEnd}
                    className={`grid grid-cols-12 gap-4 px-4 py-3 items-center transition-colors ${
                      draggedContainerId === container.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 opacity-50'
                        : 'hover:bg-[var(--accent)]/50'
                    } ${!isEditing ? 'cursor-grab active:cursor-grabbing' : ''}`}
                  >
                    {/* Drag Handle */}
                    <div className="col-span-1 flex items-center gap-2">
                      <span className="text-xs text-[var(--muted-foreground)] w-4">{index + 1}</span>
                      <svg className="w-4 h-4 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                    </div>

                    {/* Name */}
                    <div className="col-span-4">
                      {isEditing ? (
                        <input
                          type="text"
                          value={container.name}
                          onChange={(e) => handleUpdateContainer(container.id, { name: e.target.value })}
                          className="w-full px-2 py-1 border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        <span className="text-sm font-medium text-[var(--foreground)]">{container.name}</span>
                      )}
                    </div>

                    {/* Dimensions */}
                    <div className="col-span-4">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={container.length}
                            onChange={(e) => handleUpdateContainer(container.id, { length: parseFloat(e.target.value) || 0 })}
                            className="w-16 px-2 py-1 border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="0"
                            step="0.5"
                          />
                          <span className="text-[var(--muted-foreground)]">×</span>
                          <input
                            type="number"
                            value={container.width}
                            onChange={(e) => handleUpdateContainer(container.id, { width: parseFloat(e.target.value) || 0 })}
                            className="w-16 px-2 py-1 border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="0"
                            step="0.5"
                          />
                          <span className="text-[var(--muted-foreground)]">×</span>
                          <input
                            type="number"
                            value={container.height}
                            onChange={(e) => handleUpdateContainer(container.id, { height: parseFloat(e.target.value) || 0 })}
                            className="w-16 px-2 py-1 border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="0"
                            step="0.5"
                          />
                        </div>
                      ) : (
                        <span className="text-sm text-[var(--foreground)] font-mono">
                          {container.length} × {container.width} × {container.height}
                        </span>
                      )}
                    </div>

                    {/* Weight */}
                    <div className="col-span-2">
                      {isEditing ? (
                        <input
                          type="number"
                          value={container.weight}
                          onChange={(e) => handleUpdateContainer(container.id, { weight: parseFloat(e.target.value) || 0 })}
                          className="w-20 px-2 py-1 border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                          step="0.1"
                        />
                      ) : (
                        <span className="text-sm text-[var(--foreground)]">{container.weight}</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex items-center justify-end gap-1">
                      {isEditing ? (
                        <button
                          onClick={() => setEditingContainerId(null)}
                          className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
                          title="Done editing"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          onClick={() => setEditingContainerId(container.id)}
                          className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] rounded transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteContainer(container.id)}
                        className="p-1.5 text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty State */}
            {containerTypes.length === 0 && (
              <div className="p-12 text-center">
                <svg className="w-16 h-16 mx-auto text-[var(--muted-foreground)] opacity-50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No Container Types</h3>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Add container types to use in packing operations.
                </p>
              </div>
            )}

            {/* Add Button */}
            <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--muted)]/10">
              <button
                onClick={handleAddContainer}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Container Type
              </button>
            </div>
          </div>

          {/* Dropdown Preview */}
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
            <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">Dropdown Preview</h3>
            <div className="max-w-xs">
              <select className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {sortedContainers.map((container) => (
                  <option key={container.id} value={container.id}>
                    {container.name} ({container.length}×{container.width}×{container.height})
                  </option>
                ))}
              </select>
              <p className="text-xs text-[var(--muted-foreground)] mt-2">
                This shows how containers will appear in the packing dropdown.
              </p>
            </div>
          </div>
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

      {/* Warehouse Layout Modal */}
      {showLayoutModal && (
        <WarehouseLayoutModal
          isOpen={true}
          onClose={() => setShowLayoutModal(null)}
          locationLevels={warehouses.find(w => w.id === showLayoutModal)?.settings.locationLevels || []}
          onSave={(levels) => updateLocationLevels(showLayoutModal, levels)}
          warehouseName={warehouses.find(w => w.id === showLayoutModal)?.name || ''}
          warehouseId={showLayoutModal}
        />
      )}

      {/* QR Codes Modal */}
      {showQRCodesModal && (
        <WarehouseQRCodesModal
          isOpen={true}
          onClose={() => setShowQRCodesModal(null)}
          warehouseId={showQRCodesModal}
          warehouseName={warehouses.find(w => w.id === showQRCodesModal)?.name || ''}
          locationLevels={warehouses.find(w => w.id === showQRCodesModal)?.settings.locationLevels || []}
        />
      )}

    </main>
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

