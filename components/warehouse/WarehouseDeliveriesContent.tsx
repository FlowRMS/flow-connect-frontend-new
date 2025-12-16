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

type ViewMode = 'table' | 'cards';

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
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [showQuickActions, setShowQuickActions] = useState<string | null>(null);

  const factories = useMemo(() => getWarehouseFactories(), []);

  const filteredShipments = useMemo(() => {
    return mockIncomingShipments.filter(shipment => {
      const matchesSearch =
        shipment.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (shipment.trackingNumber && shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter;
      const matchesVendor = vendorFilter === 'all' || shipment.vendorId === vendorFilter;
      return matchesSearch && matchesStatus && matchesVendor;
    });
  }, [searchTerm, statusFilter, vendorFilter, refreshKey]);

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

  const getTrackingUrl = (carrier: string | undefined, trackingNumber: string | undefined) => {
    if (!carrier || !trackingNumber) return null;
    const baseUrl = carrierTrackingUrls[carrier];
    return baseUrl ? `${baseUrl}${trackingNumber}` : null;
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

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
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
              className="w-full pl-10 pr-4 py-2 bg-transparent text-sm focus:outline-none border-b border-[var(--border)] focus:border-[var(--primary)]"
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
                                  onClick={(e) => e.stopPropagation()}
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
                              onClick={(e) => e.stopPropagation()}
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
