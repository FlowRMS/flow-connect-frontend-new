'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  mockIncomingShipments,
  getWarehouseFactories,
  addIncomingShipment,
  updateShipmentStatus,
  completeShipmentReceiving,
} from '@/lib/data/warehouse-mock';
import {
  IncomingShipment,
  shipmentStatusColors,
  shipmentStatusLabels,
  ShipmentStatus,
} from '@/lib/types/warehouse';
import ReceiveShipmentModal from './modals/ReceiveShipmentModal';
import CreateShipmentRecordModal, { ShipmentRecord } from './modals/CreateShipmentRecordModal';
import ShipmentDetailModal from './modals/ShipmentDetailModal';
import WarehouseSelector from './WarehouseSelector';
import { useWarehouse } from './WarehouseContext';

type StatFilter = 'all' | 'today' | 'week' | 'pending' | 'in_transit';
type ViewMode = 'table' | 'cards';

// Mock recent activity data
interface RecentActivity {
  id: string;
  type: 'received' | 'arrived' | 'created' | 'updated';
  poNumber: string;
  vendorName: string;
  description: string;
  timestamp: string;
  user: string;
  quantity?: number;
}

const mockRecentActivity: RecentActivity[] = [
  {
    id: 'RA-001',
    type: 'received',
    poNumber: 'PO-2024-780',
    vendorName: 'Legrand North America',
    description: 'Received 150 units of LED fixtures',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    user: 'John Smith',
    quantity: 150,
  },
  {
    id: 'RA-002',
    type: 'arrived',
    poNumber: 'PO-2024-783',
    vendorName: 'Johnson Controls',
    description: 'Shipment arrived at dock 3',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    user: 'System',
  },
  {
    id: 'RA-003',
    type: 'created',
    poNumber: 'PO-2024-785',
    vendorName: 'Legrand North America',
    description: 'New shipment record created',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    user: 'Sarah Mitchell',
  },
  {
    id: 'RA-004',
    type: 'updated',
    poNumber: 'PO-2024-781',
    vendorName: 'Acuity Brands',
    description: 'Status updated to In Transit',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    user: 'System',
  },
];

// Carrier tracking URLs
const carrierTrackingUrls: Record<string, string> = {
  'UPS': 'https://www.ups.com/track?tracknum=',
  'FedEx': 'https://www.fedex.com/fedextrack/?trknbr=',
  'USPS': 'https://tools.usps.com/go/TrackConfirmAction?tLabels=',
  'DHL': 'https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=',
};

export default function WarehouseDeliveriesContent() {
  const router = useRouter();
  const { selectedWarehouse } = useWarehouse();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | 'all'>('all');
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const [selectedShipment, setSelectedShipment] = useState<IncomingShipment | null>(null);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showCreateRecordModal, setShowCreateRecordModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeStatFilter, setActiveStatFilter] = useState<StatFilter>('all');
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [quickScanInput, setQuickScanInput] = useState('');
  const [showQuickActions, setShowQuickActions] = useState<string | null>(null);

  const factories = useMemo(() => getWarehouseFactories(), []);

  const handleStatCardClick = (filter: StatFilter) => {
    setActiveStatFilter(prev => prev === filter ? 'all' : filter);
  };

  const getStatCardClass = (filter: StatFilter) => {
    const baseClass = "bg-[var(--card)] rounded-lg border p-4 transition-all cursor-pointer hover:shadow-md";
    if (activeStatFilter === filter) {
      return `${baseClass} border-[var(--primary)] ring-2 ring-[var(--primary)]/20`;
    }
    return `${baseClass} border-[var(--border)] hover:border-[var(--primary)]/50`;
  };

  const filteredShipments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    return mockIncomingShipments.filter(shipment => {
      if (activeStatFilter === 'today') {
        const eta = new Date(shipment.eta);
        eta.setHours(0, 0, 0, 0);
        if (eta.getTime() !== today.getTime() || shipment.status === 'RECEIVED') return false;
      } else if (activeStatFilter === 'week') {
        const eta = new Date(shipment.eta);
        if (eta < today || eta >= weekEnd || shipment.status === 'RECEIVED') return false;
      } else if (activeStatFilter === 'pending') {
        if (shipment.status !== 'ARRIVED') return false;
      } else if (activeStatFilter === 'in_transit') {
        if (shipment.status !== 'IN_TRANSIT') return false;
      }

      const matchesSearch =
        shipment.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (shipment.trackingNumber && shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter;
      const matchesVendor = vendorFilter === 'all' || shipment.vendorId === vendorFilter;
      return matchesSearch && matchesStatus && matchesVendor;
    });
  }, [searchTerm, statusFilter, vendorFilter, activeStatFilter, refreshKey]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const receivedToday = mockIncomingShipments.filter(s => {
      if (s.status !== 'RECEIVED' || !s.receivedAt) return false;
      const received = new Date(s.receivedAt);
      received.setHours(0, 0, 0, 0);
      return received.getTime() === today.getTime();
    });

    return {
      expectedToday: mockIncomingShipments.filter(s => {
        const eta = new Date(s.eta);
        eta.setHours(0, 0, 0, 0);
        return eta.getTime() === today.getTime() && s.status !== 'RECEIVED';
      }).length,
      expectedThisWeek: mockIncomingShipments.filter(s => {
        const eta = new Date(s.eta);
        return eta >= today && eta < weekEnd && s.status !== 'RECEIVED';
      }).length,
      pendingReceiving: mockIncomingShipments.filter(s => s.status === 'ARRIVED').length,
      inTransit: mockIncomingShipments.filter(s => s.status === 'IN_TRANSIT').length,
      receivedToday: receivedToday.length,
      unitsReceivedToday: receivedToday.reduce((sum, s) => sum + s.items.reduce((itemSum, item) => itemSum + item.receivedQuantity, 0), 0),
    };
  }, [refreshKey]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const handleReceive = (shipment: IncomingShipment) => {
    setSelectedShipment(shipment);
    setShowDetailModal(false);
    setShowReceiveModal(true);
    setShowQuickActions(null);
  };

  const handleViewDetails = (shipment: IncomingShipment) => {
    // Navigate to the receiving detail page
    router.push(`/warehouse/deliveries/${shipment.id}`);
    setShowQuickActions(null);
  };

  const handleCreateRecord = useCallback((record: ShipmentRecord) => {
    const newShipment = addIncomingShipment({
      poNumber: record.poNumber,
      vendorId: record.vendorId,
      vendorName: record.vendorName,
      warehouseId: record.warehouseId,
      warehouseName: record.warehouseName,
      eta: record.eta,
      status: record.status,
      trackingNumber: record.trackingNumber,
      carrier: record.carrier,
      expectedItems: record.items.map((item, index) => ({
        id: `EI-NEW-${index}`,
        productId: item.productId,
        productName: item.productName,
        partNumber: item.partNumber,
        expectedQuantity: item.expectedQuantity,
        receivedQuantity: 0,
        status: 'pending' as const,
      })),
      items: record.items.map((item, index) => ({
        id: `SLI-NEW-${index}`,
        productId: item.productId,
        productName: item.productName,
        partNumber: item.partNumber,
        expectedQuantity: item.expectedQuantity,
        receivedQuantity: 0,
      })),
      itemCount: record.items.length,
      expectedQuantity: record.items.reduce((sum, item) => sum + item.expectedQuantity, 0),
      notes: record.notes,
    });

    setShowCreateRecordModal(false);
    setRefreshKey(prev => prev + 1);
    setSelectedShipment(newShipment);
    setShowDetailModal(true);
  }, []);

  const handleUpdateShipmentStatus = useCallback((status: ShipmentStatus) => {
    if (!selectedShipment) return;
    const updated = updateShipmentStatus(selectedShipment.id, status);
    if (updated) {
      setSelectedShipment(updated);
      setRefreshKey(prev => prev + 1);
    }
  }, [selectedShipment]);

  const handleQuickStatusUpdate = useCallback((shipmentId: string, status: ShipmentStatus) => {
    const updated = updateShipmentStatus(shipmentId, status);
    if (updated) {
      setRefreshKey(prev => prev + 1);
    }
    setShowQuickActions(null);
  }, []);

  const handleReceiveComplete = useCallback(() => {
    if (!selectedShipment) return;
    const updatedItems = selectedShipment.items.map(item => ({
      productId: item.productId,
      receivedQuantity: item.expectedQuantity,
    }));
    completeShipmentReceiving(selectedShipment.id, updatedItems);
    setShowReceiveModal(false);
    setSelectedShipment(null);
    setRefreshKey(prev => prev + 1);
  }, [selectedShipment]);

  const handleQuickScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickScanInput.trim()) return;

    // Search for shipment by PO number or tracking number
    const found = mockIncomingShipments.find(
      s => s.poNumber.toLowerCase() === quickScanInput.toLowerCase() ||
           (s.trackingNumber && s.trackingNumber.toLowerCase() === quickScanInput.toLowerCase())
    );

    if (found) {
      setSelectedShipment(found);
      if (found.status === 'ARRIVED' || found.status === 'RECEIVING') {
        setShowReceiveModal(true);
      } else {
        setShowDetailModal(true);
      }
    } else {
      alert(`No shipment found with PO/Tracking: ${quickScanInput}`);
    }
    setQuickScanInput('');
  };

  const getTrackingUrl = (carrier: string | undefined, trackingNumber: string | undefined) => {
    if (!carrier || !trackingNumber) return null;
    const baseUrl = carrierTrackingUrls[carrier];
    return baseUrl ? `${baseUrl}${trackingNumber}` : null;
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'received':
        return (
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'arrived':
        return (
          <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
        );
      case 'created':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
        );
      case 'updated':
        return (
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        );
    }
  };

  const getEtaStatus = (eta: string, status: ShipmentStatus) => {
    if (status === 'RECEIVED') return null;
    const etaDate = new Date(eta);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    etaDate.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((etaDate.getTime() - today.getTime()) / 86400000);

    if (diffDays < 0) return { label: 'Overdue', color: 'text-red-600 bg-red-50' };
    if (diffDays === 0) return { label: 'Today', color: 'text-green-600 bg-green-50' };
    if (diffDays === 1) return { label: 'Tomorrow', color: 'text-blue-600 bg-blue-50' };
    return null;
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)]">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Deliveries & Receiving</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Track incoming shipments and receive inventory
            </p>
          </div>
          <div className="flex items-center gap-3">
            <WarehouseSelector />
            <button
              onClick={() => setShowCreateRecordModal(true)}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
              Create Shipment Record
            </button>
          </div>
        </div>

        {/* Quick Scan Section */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-4 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Quick Scan / Lookup</h3>
                <p className="text-sm text-white/80">Scan a barcode or enter PO/tracking number to quickly find and receive shipments</p>
              </div>
            </div>
            <form onSubmit={handleQuickScan} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Enter PO or tracking number..."
                value={quickScanInput}
                onChange={(e) => setQuickScanInput(e.target.value)}
                className="px-4 py-2 rounded-lg bg-white/20 border border-white/30 placeholder-white/60 text-white w-64 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-white text-indigo-600 font-medium rounded-lg hover:bg-white/90 transition-colors"
              >
                Find
              </button>
            </form>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div
            className={getStatCardClass('today')}
            onClick={() => handleStatCardClick('today')}
          >
            <div className="text-sm text-[var(--muted-foreground)]">Expected Today</div>
            <div className="text-2xl font-semibold text-[var(--foreground)] mt-1">{stats.expectedToday}</div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">
              {activeStatFilter === 'today' ? <span className="text-[var(--primary)]">Filter active</span> : 'Shipments arriving'}
            </div>
          </div>
          <div
            className={getStatCardClass('week')}
            onClick={() => handleStatCardClick('week')}
          >
            <div className="text-sm text-[var(--muted-foreground)]">Expected This Week</div>
            <div className="text-2xl font-semibold text-blue-600 mt-1">{stats.expectedThisWeek}</div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">
              {activeStatFilter === 'week' ? <span className="text-[var(--primary)]">Filter active</span> : 'Next 7 days'}
            </div>
          </div>
          <div
            className={getStatCardClass('pending')}
            onClick={() => handleStatCardClick('pending')}
          >
            <div className="text-sm text-[var(--muted-foreground)]">Pending Receiving</div>
            <div className="text-2xl font-semibold text-yellow-600 mt-1">{stats.pendingReceiving}</div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">
              {activeStatFilter === 'pending' ? <span className="text-[var(--primary)]">Filter active</span> : 'Ready to receive'}
            </div>
          </div>
          <div
            className={getStatCardClass('in_transit')}
            onClick={() => handleStatCardClick('in_transit')}
          >
            <div className="text-sm text-[var(--muted-foreground)]">In Transit</div>
            <div className="text-2xl font-semibold text-indigo-600 mt-1">{stats.inTransit}</div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">
              {activeStatFilter === 'in_transit' ? <span className="text-[var(--primary)]">Filter active</span> : 'On the way'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Content - Shipments */}
          <div className="col-span-2">
            {/* Filters */}
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] mb-6">
              <div className="p-4 flex items-center gap-4">
                <div className="flex-1 relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8"/>
                    <path d="M21 21l-4.35-4.35"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by PO, tracking, or vendor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ShipmentStatus | 'all')}
                  className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                >
                  <option value="all">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="IN_TRANSIT">In Transit</option>
                  <option value="ARRIVED">Arrived</option>
                  <option value="RECEIVING">Receiving</option>
                  <option value="RECEIVED">Received</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>

                <select
                  value={vendorFilter}
                  onChange={(e) => setVendorFilter(e.target.value)}
                  className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                >
                  <option value="all">All Vendors</option>
                  {factories.map((factory) => (
                    <option key={factory.id} value={factory.id}>
                      {factory.name}
                    </option>
                  ))}
                </select>

                <div className="flex items-center border border-[var(--border)] rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 ${viewMode === 'table' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--background)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]'}`}
                    title="Table view"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="3" y1="6" x2="21" y2="6"/>
                      <line x1="3" y1="12" x2="21" y2="12"/>
                      <line x1="3" y1="18" x2="21" y2="18"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`p-2 ${viewMode === 'cards' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--background)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]'}`}
                    title="Card view"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7"/>
                      <rect x="14" y="3" width="7" height="7"/>
                      <rect x="14" y="14" width="7" height="7"/>
                      <rect x="3" y="14" width="7" height="7"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Shipments Table or Cards */}
            {viewMode === 'table' ? (
              <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
                <div className="px-6 py-4 border-b border-[var(--border)]">
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">
                    Incoming Shipments
                    <span className="ml-2 text-sm font-normal text-[var(--muted-foreground)]">
                      ({filteredShipments.length})
                    </span>
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Shipment</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Vendor</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Items</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">ETA</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {filteredShipments.map((shipment) => {
                        const etaStatus = getEtaStatus(shipment.eta, shipment.status);
                        const trackingUrl = getTrackingUrl(shipment.carrier, shipment.trackingNumber);

                        return (
                          <tr
                            key={shipment.id}
                            className="hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
                            onClick={() => handleViewDetails(shipment)}
                          >
                            <td className="px-4 py-3">
                              <div className="font-medium text-[var(--foreground)]">{shipment.poNumber}</div>
                              {shipment.trackingNumber && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  {trackingUrl ? (
                                    <a
                                      href={trackingUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                      <span>{shipment.carrier}: {shipment.trackingNumber}</span>
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                    </a>
                                  ) : (
                                    <span className="text-xs text-[var(--muted-foreground)]">
                                      {shipment.carrier && `${shipment.carrier}: `}{shipment.trackingNumber}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-[var(--foreground)]">{shipment.vendorName}</td>
                            <td className="px-4 py-3 text-center">
                              <div className="text-sm font-medium text-[var(--foreground)]">{shipment.itemCount}</div>
                              <div className="text-xs text-[var(--muted-foreground)]">{shipment.expectedQuantity} units</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-[var(--foreground)]">{formatDate(shipment.eta)}</div>
                              {etaStatus && (
                                <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${etaStatus.color}`}>
                                  {etaStatus.label}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${shipmentStatusColors[shipment.status]}`}>
                                {shipmentStatusLabels[shipment.status]}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1 relative">
                                {(shipment.status === 'ARRIVED' || shipment.status === 'RECEIVING') && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReceive(shipment);
                                    }}
                                    className="px-2.5 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors"
                                  >
                                    Receive
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewDetails(shipment);
                                  }}
                                  className="p-1.5 hover:bg-[var(--muted)] rounded transition-colors"
                                  title="View Details"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                  </svg>
                                </button>
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowQuickActions(showQuickActions === shipment.id ? null : shipment.id);
                                    }}
                                    className="p-1.5 hover:bg-[var(--muted)] rounded transition-colors"
                                    title="More actions"
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <circle cx="12" cy="12" r="1"/>
                                      <circle cx="12" cy="5" r="1"/>
                                      <circle cx="12" cy="19" r="1"/>
                                    </svg>
                                  </button>
                                  {showQuickActions === shipment.id && (
                                    <div className="absolute right-0 top-full mt-1 w-48 bg-[var(--card)] rounded-lg border border-[var(--border)] shadow-lg z-10 py-1">
                                      {shipment.status === 'PENDING' && (
                                        <button
                                          onClick={() => handleQuickStatusUpdate(shipment.id, 'CONFIRMED')}
                                          className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors"
                                        >
                                          Mark as Confirmed
                                        </button>
                                      )}
                                      {shipment.status === 'CONFIRMED' && (
                                        <button
                                          onClick={() => handleQuickStatusUpdate(shipment.id, 'IN_TRANSIT')}
                                          className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors"
                                        >
                                          Mark In Transit
                                        </button>
                                      )}
                                      {shipment.status === 'IN_TRANSIT' && (
                                        <button
                                          onClick={() => handleQuickStatusUpdate(shipment.id, 'ARRIVED')}
                                          className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors"
                                        >
                                          Mark as Arrived
                                        </button>
                                      )}
                                      {shipment.status !== 'RECEIVED' && shipment.status !== 'CANCELLED' && (
                                        <button
                                          onClick={() => handleQuickStatusUpdate(shipment.id, 'CANCELLED')}
                                          className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                          Cancel Shipment
                                        </button>
                                      )}
                                      <hr className="my-1 border-[var(--border)]" />
                                      <button
                                        onClick={() => {
                                          handleViewDetails(shipment);
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors"
                                      >
                                        View Full Details
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {filteredShipments.length === 0 && (
                  <div className="px-6 py-12 text-center text-[var(--muted-foreground)]">
                    No shipments found matching your criteria
                  </div>
                )}
              </div>
            ) : (
              /* Card View */
              <div className="space-y-4">
                {filteredShipments.length === 0 ? (
                  <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] px-6 py-12 text-center text-[var(--muted-foreground)]">
                    No shipments found matching your criteria
                  </div>
                ) : (
                  filteredShipments.map((shipment) => {
                    const etaStatus = getEtaStatus(shipment.eta, shipment.status);
                    const trackingUrl = getTrackingUrl(shipment.carrier, shipment.trackingNumber);

                    return (
                      <div
                        key={shipment.id}
                        className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleViewDetails(shipment)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-[var(--foreground)]">{shipment.poNumber}</h3>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${shipmentStatusColors[shipment.status]}`}>
                                {shipmentStatusLabels[shipment.status]}
                              </span>
                              {etaStatus && (
                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${etaStatus.color}`}>
                                  {etaStatus.label}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-[var(--muted-foreground)] mt-1">{shipment.vendorName}</p>
                          </div>
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            {(shipment.status === 'ARRIVED' || shipment.status === 'RECEIVING') && (
                              <button
                                onClick={() => handleReceive(shipment)}
                                className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors"
                              >
                                Receive
                              </button>
                            )}
                            <button
                              onClick={() => handleViewDetails(shipment)}
                              className="px-3 py-1.5 border border-[var(--border)] text-sm font-medium rounded hover:bg-[var(--muted)] transition-colors"
                            >
                              Details
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-[var(--border)]">
                          <div>
                            <div className="text-xs text-[var(--muted-foreground)]">Items</div>
                            <div className="text-sm font-medium text-[var(--foreground)]">{shipment.itemCount} products</div>
                          </div>
                          <div>
                            <div className="text-xs text-[var(--muted-foreground)]">Quantity</div>
                            <div className="text-sm font-medium text-[var(--foreground)]">{shipment.expectedQuantity} units</div>
                          </div>
                          <div>
                            <div className="text-xs text-[var(--muted-foreground)]">ETA</div>
                            <div className="text-sm font-medium text-[var(--foreground)]">{formatDate(shipment.eta)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-[var(--muted-foreground)]">Carrier</div>
                            <div className="text-sm font-medium text-[var(--foreground)]">{shipment.carrier || '-'}</div>
                          </div>
                        </div>

                        {shipment.trackingNumber && (
                          <div className="mt-3 pt-3 border-t border-[var(--border)]">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {trackingUrl ? (
                                <a
                                  href={trackingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline"
                                >
                                  Track: {shipment.trackingNumber}
                                </a>
                              ) : (
                                <span className="text-sm text-[var(--muted-foreground)]">
                                  Tracking: {shipment.trackingNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Activity Feed & Quick Stats */}
          <div className="space-y-6">
            {/* Today's Summary */}
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <h3 className="font-semibold text-[var(--foreground)] mb-4">Today&apos;s Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Shipments Received</span>
                  <span className="text-sm font-semibold text-green-600">{stats.receivedToday}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Units Received</span>
                  <span className="text-sm font-semibold text-[var(--foreground)]">{stats.unitsReceivedToday}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Awaiting Receipt</span>
                  <span className="text-sm font-semibold text-yellow-600">{stats.pendingReceiving}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">In Transit</span>
                  <span className="text-sm font-semibold text-indigo-600">{stats.inTransit}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <h3 className="font-semibold text-[var(--foreground)] mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setShowCreateRecordModal(true)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-[var(--muted)] rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span>Create Shipment Record</span>
                </button>
                <button
                  onClick={() => setActiveStatFilter('pending')}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-[var(--muted)] rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <span>View Pending Receipts</span>
                </button>
                <button
                  onClick={() => {
                    // Focus on quick scan input
                    const input = document.querySelector('input[placeholder*="PO or tracking"]') as HTMLInputElement;
                    if (input) input.focus();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-[var(--muted)] rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <span>Scan Barcode</span>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <h3 className="font-semibold text-[var(--foreground)] mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {mockRecentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--foreground)]">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-blue-600 font-medium">{activity.poNumber}</span>
                        <span className="text-xs text-[var(--muted-foreground)]">·</span>
                        <span className="text-xs text-[var(--muted-foreground)]">{formatTimeAgo(activity.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-sm text-[var(--primary)] hover:underline">
                View all activity
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showReceiveModal && selectedShipment && (
        <ReceiveShipmentModal
          shipment={selectedShipment}
          onClose={() => {
            setShowReceiveModal(false);
            setSelectedShipment(null);
          }}
          onComplete={handleReceiveComplete}
        />
      )}

      {showCreateRecordModal && (
        <CreateShipmentRecordModal
          onClose={() => setShowCreateRecordModal(false)}
          onSubmit={handleCreateRecord}
        />
      )}

      {showDetailModal && selectedShipment && (
        <ShipmentDetailModal
          shipment={selectedShipment}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedShipment(null);
          }}
          onReceive={() => handleReceive(selectedShipment)}
          onUpdateStatus={handleUpdateShipmentStatus}
        />
      )}

      {/* Click outside handler for quick actions dropdown */}
      {showQuickActions && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowQuickActions(null)}
        />
      )}
    </main>
  );
}
