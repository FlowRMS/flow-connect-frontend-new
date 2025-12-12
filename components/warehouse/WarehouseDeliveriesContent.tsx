'use client';

import React, { useState, useMemo } from 'react';
import { mockIncomingShipments, getWarehouseFactories } from '@/lib/data/warehouse-mock';
import { IncomingShipment, shipmentStatusColors, shipmentStatusLabels, ShipmentStatus } from '@/lib/types/warehouse';
import ReceiveShipmentModal from './modals/ReceiveShipmentModal';

// Filter types for stat card clicks
type StatFilter = 'all' | 'today' | 'week' | 'pending' | 'in_transit';

export default function WarehouseDeliveriesContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | 'all'>('all');
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const [selectedShipment, setSelectedShipment] = useState<IncomingShipment | null>(null);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [activeStatFilter, setActiveStatFilter] = useState<StatFilter>('all');

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
      // Apply stat card filter first
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
        shipment.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter;
      const matchesVendor = vendorFilter === 'all' || shipment.vendorId === vendorFilter;
      return matchesSearch && matchesStatus && matchesVendor;
    });
  }, [searchTerm, statusFilter, vendorFilter, activeStatFilter]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

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
    };
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleReceive = (shipment: IncomingShipment) => {
    setSelectedShipment(shipment);
    setShowReceiveModal(true);
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Deliveries & Receiving</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Track incoming shipments and receive inventory
          </p>
        </div>
        <button className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Create PO
        </button>
      </div>

      {/* Stats Cards - Clickable to filter */}
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

      {/* Filters */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] mb-6">
        <div className="p-4 flex items-center gap-4">
          {/* Search */}
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
              placeholder="Search by PO number or vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
          </div>

          {/* Status Filter */}
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

          {/* Vendor Filter */}
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
        </div>
      </div>

      {/* Shipments Table */}
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
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">PO Number</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Expected Qty</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">ETA</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Carrier</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredShipments.map((shipment) => (
                <tr key={shipment.id} className="hover:bg-[var(--muted)]/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-[var(--foreground)]">{shipment.poNumber}</div>
                    {shipment.trackingNumber && (
                      <div className="text-xs text-[var(--muted-foreground)]">
                        Tracking: {shipment.trackingNumber}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--foreground)]">{shipment.vendorName}</td>
                  <td className="px-6 py-4 text-sm text-[var(--foreground)]">{shipment.itemCount}</td>
                  <td className="px-6 py-4 text-sm text-[var(--foreground)]">{shipment.expectedQuantity}</td>
                  <td className="px-6 py-4 text-sm text-[var(--foreground)]">{formatDate(shipment.eta)}</td>
                  <td className="px-6 py-4 text-sm text-[var(--foreground)]">{shipment.carrier || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${shipmentStatusColors[shipment.status]}`}>
                      {shipmentStatusLabels[shipment.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {(shipment.status === 'ARRIVED' || shipment.status === 'RECEIVING') && (
                        <button
                          onClick={() => handleReceive(shipment)}
                          className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors"
                        >
                          Receive
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedShipment(shipment)}
                        className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
                        title="View Details"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredShipments.length === 0 && (
          <div className="px-6 py-12 text-center text-[var(--muted-foreground)]">
            No shipments found matching your criteria
          </div>
        )}
      </div>

      {/* Receive Modal */}
      {showReceiveModal && selectedShipment && (
        <ReceiveShipmentModal
          shipment={selectedShipment}
          onClose={() => {
            setShowReceiveModal(false);
            setSelectedShipment(null);
          }}
          onComplete={() => {
            setShowReceiveModal(false);
            setSelectedShipment(null);
          }}
        />
      )}
    </main>
  );
}
