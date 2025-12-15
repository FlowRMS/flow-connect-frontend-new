'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  mockIncomingShipments,
  getWarehouseFactories,
  addIncomingShipment,
  updateShipmentStatus,
  completeShipmentReceiving,
  getAllShipmentRequests,
  updateShipmentRequestStatus,
} from '@/lib/data/warehouse-mock';
import {
  IncomingShipment,
  shipmentStatusColors,
  shipmentStatusLabels,
  ShipmentStatus,
  ShipmentRequest,
  shipmentRequestStatusColors,
  shipmentRequestStatusLabels,
  shipmentRequestMethodLabels,
  ShipmentRequestStatus,
} from '@/lib/types/warehouse';
import ReceiveShipmentModal from './modals/ReceiveShipmentModal';
import RequestShipmentModal from './modals/RequestShipmentModal';
import CreateShipmentRecordModal, { ShipmentRecord } from './modals/CreateShipmentRecordModal';
import ShipmentDetailModal from './modals/ShipmentDetailModal';
import ShipmentRequestDetailModal from './modals/ShipmentRequestDetailModal';
import WarehouseSelector from './WarehouseSelector';
import { useWarehouse } from './WarehouseContext';

type TabType = 'shipments' | 'requests';
type StatFilter = 'all' | 'today' | 'week' | 'pending' | 'in_transit';

export default function WarehouseDeliveriesContent() {
  const { selectedWarehouse } = useWarehouse();
  const [activeTab, setActiveTab] = useState<TabType>('shipments');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | 'all'>('all');
  const [requestStatusFilter, setRequestStatusFilter] = useState<ShipmentRequestStatus | 'all'>('all');
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const [selectedShipment, setSelectedShipment] = useState<IncomingShipment | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ShipmentRequest | null>(null);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showCreateRecordModal, setShowCreateRecordModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRequestDetailModal, setShowRequestDetailModal] = useState(false);
  const [activeStatFilter, setActiveStatFilter] = useState<StatFilter>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  const factories = useMemo(() => getWarehouseFactories(), []);
  const shipmentRequests = useMemo(() => getAllShipmentRequests(), [refreshKey]);

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
        shipment.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter;
      const matchesVendor = vendorFilter === 'all' || shipment.vendorId === vendorFilter;
      return matchesSearch && matchesStatus && matchesVendor;
    });
  }, [searchTerm, statusFilter, vendorFilter, activeStatFilter, refreshKey]);

  const filteredRequests = useMemo(() => {
    return shipmentRequests.filter(request => {
      const matchesSearch =
        request.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = requestStatusFilter === 'all' || request.status === requestStatusFilter;
      const matchesVendor = vendorFilter === 'all' || request.vendorId === vendorFilter;
      return matchesSearch && matchesStatus && matchesVendor;
    });
  }, [shipmentRequests, searchTerm, requestStatusFilter, vendorFilter]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
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
      pendingRequests: shipmentRequests.filter(r => r.status === 'PENDING' || r.status === 'SENT').length,
    };
  }, [refreshKey, shipmentRequests]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleReceive = (shipment: IncomingShipment) => {
    setSelectedShipment(shipment);
    setShowDetailModal(false);
    setShowReceiveModal(true);
  };

  const handleViewDetails = (shipment: IncomingShipment) => {
    setSelectedShipment(shipment);
    setShowDetailModal(true);
  };

  const handleRequestShipment = useCallback((request: ShipmentRequest) => {
    setShowRequestModal(false);
    setRefreshKey(prev => prev + 1);
    setActiveTab('requests');
  }, []);

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

  const handleCancelRequest = useCallback((requestId: string) => {
    updateShipmentRequestStatus(requestId, 'CANCELLED');
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleConfirmRequest = useCallback((requestId: string) => {
    updateShipmentRequestStatus(requestId, 'CONFIRMED', {
      confirmedAt: new Date().toISOString(),
    });
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleViewRequestDetails = useCallback((request: ShipmentRequest) => {
    setSelectedRequest(request);
    setShowRequestDetailModal(true);
  }, []);

  const handleRequestDetailConfirm = useCallback(() => {
    if (!selectedRequest) return;
    handleConfirmRequest(selectedRequest.id);
    setShowRequestDetailModal(false);
    setSelectedRequest(null);
  }, [selectedRequest, handleConfirmRequest]);

  const handleRequestDetailCancel = useCallback(() => {
    if (!selectedRequest) return;
    handleCancelRequest(selectedRequest.id);
    setShowRequestDetailModal(false);
    setSelectedRequest(null);
  }, [selectedRequest, handleCancelRequest]);

  const handleRequestStatusUpdate = useCallback((status: ShipmentRequestStatus) => {
    if (!selectedRequest) return;
    updateShipmentRequestStatus(selectedRequest.id, status);
    setRefreshKey(prev => prev + 1);
    setShowRequestDetailModal(false);
    setSelectedRequest(null);
  }, [selectedRequest]);

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
        <div className="flex items-center gap-3">
          <WarehouseSelector />
          <button
            onClick={() => setShowCreateRecordModal(true)}
            className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            Create Shipment Record
          </button>
          <button
            onClick={() => setShowRequestModal(true)}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
            Request Shipment
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div
          className={getStatCardClass('today')}
          onClick={() => { setActiveTab('shipments'); handleStatCardClick('today'); }}
        >
          <div className="text-sm text-[var(--muted-foreground)]">Expected Today</div>
          <div className="text-2xl font-semibold text-[var(--foreground)] mt-1">{stats.expectedToday}</div>
          <div className="text-xs text-[var(--muted-foreground)] mt-1">
            {activeStatFilter === 'today' ? <span className="text-[var(--primary)]">Filter active</span> : 'Shipments arriving'}
          </div>
        </div>
        <div
          className={getStatCardClass('week')}
          onClick={() => { setActiveTab('shipments'); handleStatCardClick('week'); }}
        >
          <div className="text-sm text-[var(--muted-foreground)]">Expected This Week</div>
          <div className="text-2xl font-semibold text-blue-600 mt-1">{stats.expectedThisWeek}</div>
          <div className="text-xs text-[var(--muted-foreground)] mt-1">
            {activeStatFilter === 'week' ? <span className="text-[var(--primary)]">Filter active</span> : 'Next 7 days'}
          </div>
        </div>
        <div
          className={getStatCardClass('pending')}
          onClick={() => { setActiveTab('shipments'); handleStatCardClick('pending'); }}
        >
          <div className="text-sm text-[var(--muted-foreground)]">Pending Receiving</div>
          <div className="text-2xl font-semibold text-yellow-600 mt-1">{stats.pendingReceiving}</div>
          <div className="text-xs text-[var(--muted-foreground)] mt-1">
            {activeStatFilter === 'pending' ? <span className="text-[var(--primary)]">Filter active</span> : 'Ready to receive'}
          </div>
        </div>
        <div
          className={getStatCardClass('in_transit')}
          onClick={() => { setActiveTab('shipments'); handleStatCardClick('in_transit'); }}
        >
          <div className="text-sm text-[var(--muted-foreground)]">In Transit</div>
          <div className="text-2xl font-semibold text-indigo-600 mt-1">{stats.inTransit}</div>
          <div className="text-xs text-[var(--muted-foreground)] mt-1">
            {activeStatFilter === 'in_transit' ? <span className="text-[var(--primary)]">Filter active</span> : 'On the way'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-[var(--border)]">
          <nav className="flex gap-4">
            <button
              onClick={() => { setActiveTab('shipments'); setActiveStatFilter('all'); }}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'shipments'
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              Incoming Shipments
              <span className="ml-2 px-2 py-0.5 bg-[var(--muted)] rounded-full text-xs">
                {mockIncomingShipments.length}
              </span>
            </button>
            <button
              onClick={() => { setActiveTab('requests'); setActiveStatFilter('all'); }}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'requests'
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              Shipment Requests
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                stats.pendingRequests > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-[var(--muted)]'
              }`}>
                {shipmentRequests.length}
              </span>
            </button>
          </nav>
        </div>
      </div>

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
              placeholder={activeTab === 'shipments' ? "Search by PO number or vendor..." : "Search by request number or vendor..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
          </div>

          {activeTab === 'shipments' ? (
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
          ) : (
            <select
              value={requestStatusFilter}
              onChange={(e) => setRequestStatusFilter(e.target.value as ShipmentRequestStatus | 'all')}
              className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            >
              <option value="all">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="SENT">Sent</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="SHIPPED">Shipped</option>
              <option value="RECEIVED">Received</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          )}

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

      {/* Content based on active tab */}
      {activeTab === 'shipments' ? (
        /* Shipments Table */
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
                          onClick={() => handleViewDetails(shipment)}
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
      ) : (
        /* Requests Table */
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
          <div className="px-6 py-4 border-b border-[var(--border)]">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Shipment Requests
              <span className="ml-2 text-sm font-normal text-[var(--muted-foreground)]">
                ({filteredRequests.length})
              </span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Request #</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Total Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Requested Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-[var(--muted)]/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-[var(--foreground)]">{request.requestNumber}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        {formatDate(request.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-[var(--foreground)]">{request.vendorName}</div>
                      {request.contactName && (
                        <div className="text-xs text-[var(--muted-foreground)]">{request.contactName}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${
                        request.requestMethod === 'EMAIL' ? 'bg-blue-100 text-blue-700' :
                        request.requestMethod === 'CALL' ? 'bg-green-100 text-green-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {request.requestMethod === 'EMAIL' && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                          </svg>
                        )}
                        {request.requestMethod === 'CALL' && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72"/>
                          </svg>
                        )}
                        {request.requestMethod === 'MANUFACTURER_SYSTEM' && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                            <line x1="8" y1="21" x2="16" y2="21"/>
                            <line x1="12" y1="17" x2="12" y2="21"/>
                          </svg>
                        )}
                        {shipmentRequestMethodLabels[request.requestMethod]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--foreground)]">{request.items.length}</td>
                    <td className="px-6 py-4 text-sm text-[var(--foreground)]">{request.totalQuantity}</td>
                    <td className="px-6 py-4 text-sm text-[var(--foreground)]">{formatDate(request.requestedDeliveryDate)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                        request.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                        request.priority === 'expedited' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {request.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${shipmentRequestStatusColors[request.status]}`}>
                        {shipmentRequestStatusLabels[request.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(request.status === 'PENDING' || request.status === 'SENT') && (
                          <>
                            <button
                              onClick={() => handleConfirmRequest(request.id)}
                              className="px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50 rounded transition-colors"
                              title="Mark as Confirmed"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => handleCancelRequest(request.id)}
                              className="px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 rounded transition-colors"
                              title="Cancel Request"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleViewRequestDetails(request)}
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
          {filteredRequests.length === 0 && (
            <div className="px-6 py-12 text-center text-[var(--muted-foreground)]">
              <p>No shipment requests found</p>
              <button
                onClick={() => setShowRequestModal(true)}
                className="mt-2 text-sm text-[var(--primary)] hover:underline"
              >
                Create your first request
              </button>
            </div>
          )}
        </div>
      )}

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

      {showRequestModal && (
        <RequestShipmentModal
          onClose={() => setShowRequestModal(false)}
          onSubmit={handleRequestShipment}
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

      {showRequestDetailModal && selectedRequest && (
        <ShipmentRequestDetailModal
          request={selectedRequest}
          onClose={() => {
            setShowRequestDetailModal(false);
            setSelectedRequest(null);
          }}
          onConfirm={handleRequestDetailConfirm}
          onCancel={handleRequestDetailCancel}
          onUpdateStatus={handleRequestStatusUpdate}
        />
      )}
    </main>
  );
}
