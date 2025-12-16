'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getShipmentById,
  updateShipmentStatus,
  mockWarehouses,
  mockBins,
} from '@/lib/data/warehouse-mock';
import {
  ShipmentStatus,
  shipmentStatusColors,
  shipmentStatusLabels,
} from '@/lib/types/warehouse';

interface ReceivingDetailContentProps {
  shipmentId: string;
}

// Receiving flow steps
const receivingSteps: ShipmentStatus[] = ['PENDING', 'CONFIRMED', 'IN_TRANSIT', 'ARRIVED', 'RECEIVING', 'RECEIVED'];

// Step metadata for display
const stepInfo: Record<ShipmentStatus, { label: string; icon: string; description: string }> = {
  PENDING: { label: 'Pending', icon: 'clock', description: 'Awaiting vendor confirmation' },
  CONFIRMED: { label: 'Confirmed', icon: 'check-circle', description: 'Vendor confirmed shipment' },
  IN_TRANSIT: { label: 'In Transit', icon: 'truck', description: 'Shipment on the way' },
  ARRIVED: { label: 'Arrived', icon: 'package', description: 'Shipment at dock' },
  RECEIVING: { label: 'Receiving', icon: 'clipboard', description: 'Validating & counting' },
  PROCESSING: { label: 'Processing', icon: 'loader', description: 'Processing items' },
  SHIPPED: { label: 'Shipped', icon: 'send', description: 'Shipped out' },
  DELIVERED: { label: 'Delivered', icon: 'home', description: 'Delivered' },
  RECEIVED: { label: 'Received', icon: 'check', description: 'Put away complete' },
  CANCELLED: { label: 'Cancelled', icon: 'x', description: 'Cancelled' },
};

// Damage condition types
type ConditionType = 'good' | 'damaged' | 'missing' | 'overage';

interface LineItemReceive {
  id: string;
  productId: string;
  productName: string;
  partNumber: string;
  expectedQty: number;
  receivedQty: number;
  damagedQty: number;
  binId: string;
  condition: ConditionType;
  notes: string;
  lotNumber: string;
  expirationDate: string;
  verified: boolean;
  putAway: boolean;
}

export default function ReceivingDetailContent({ shipmentId }: ReceivingDetailContentProps) {
  const router = useRouter();
  const [_, setForceUpdate] = useState(0);

  // Get shipment from mock data
  const shipment = getShipmentById(shipmentId);

  // View state for step navigation
  const [viewingStatus, setViewingStatus] = useState<ShipmentStatus | null>(null);

  // BOL (Bill of Lading) capture
  const [bolNumber, setBolNumber] = useState('');
  const [bolCaptured, setBolCaptured] = useState(false);
  const [bolNotes, setBolNotes] = useState('');

  // Receiving state - track quantities per line item
  const [lineItems, setLineItems] = useState<LineItemReceive[]>(() => {
    if (!shipment) return [];
    return shipment.items.map(item => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      partNumber: item.partNumber,
      expectedQty: item.expectedQuantity,
      receivedQty: 0,
      damagedQty: 0,
      binId: '',
      condition: 'good' as ConditionType,
      notes: '',
      lotNumber: '',
      expirationDate: '',
      verified: false,
      putAway: false,
    }));
  });

  // Discrepancy reporting
  const [discrepancies, setDiscrepancies] = useState<Array<{
    id: string;
    lineItemId: string;
    type: 'shortage' | 'overage' | 'damage' | 'wrong_item';
    quantity: number;
    description: string;
    photo?: string;
  }>>([]);
  const [showDiscrepancyForm, setShowDiscrepancyForm] = useState<string | null>(null);
  const [newDiscrepancy, setNewDiscrepancy] = useState<{ type: 'shortage' | 'overage' | 'damage' | 'wrong_item'; quantity: number; description: string }>({ type: 'shortage', quantity: 0, description: '' });

  // Expanded item for detailed entry
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  if (!shipment) {
    return (
      <main className="flex-1 overflow-hidden bg-[var(--background)] flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">Shipment Not Found</h1>
          <p className="text-[var(--muted-foreground)] mb-4">The requested shipment could not be found.</p>
          <button
            onClick={() => router.push('/warehouse/deliveries')}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
          >
            Back to Deliveries
          </button>
        </div>
      </main>
    );
  }

  const getStatusStepIndex = (status: ShipmentStatus) => {
    const index = receivingSteps.indexOf(status);
    return index >= 0 ? index : 0;
  };

  const currentStepIndex = getStatusStepIndex(shipment.status);
  const displayStatus = viewingStatus || shipment.status;
  const isArrived = displayStatus === 'ARRIVED' || currentStepIndex >= receivingSteps.indexOf('ARRIVED');
  const isReceiving = displayStatus === 'RECEIVING';
  const isReceived = displayStatus === 'RECEIVED';

  // Helper functions
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Calculate totals
  const totalExpected = lineItems.reduce((sum, item) => sum + item.expectedQty, 0);
  const totalReceived = lineItems.reduce((sum, item) => sum + item.receivedQty, 0);
  const totalDamaged = lineItems.reduce((sum, item) => sum + item.damagedQty, 0);
  const allItemsVerified = lineItems.every(item => item.verified);
  const allItemsPutAway = lineItems.every(item => item.putAway);
  const allBinsAssigned = lineItems.every(item => item.binId);

  // Status transition handlers
  const handleConfirmShipment = () => {
    if (shipment.status !== 'PENDING') return;
    updateShipmentStatus(shipment.id, 'CONFIRMED');
    setForceUpdate(prev => prev + 1);
  };

  const handleMarkInTransit = () => {
    if (shipment.status !== 'CONFIRMED') return;
    updateShipmentStatus(shipment.id, 'IN_TRANSIT');
    setForceUpdate(prev => prev + 1);
  };

  const handleMarkArrived = () => {
    if (shipment.status !== 'IN_TRANSIT') return;
    updateShipmentStatus(shipment.id, 'ARRIVED');
    setForceUpdate(prev => prev + 1);
  };

  const handleStartReceiving = () => {
    if (shipment.status !== 'ARRIVED') return;
    updateShipmentStatus(shipment.id, 'RECEIVING');
    setForceUpdate(prev => prev + 1);
  };

  const handleCompleteReceiving = () => {
    if (shipment.status !== 'RECEIVING') return;
    updateShipmentStatus(shipment.id, 'RECEIVED');
    setForceUpdate(prev => prev + 1);
  };

  // Line item handlers
  const handleUpdateLineItem = (itemId: string, updates: Partial<LineItemReceive>) => {
    setLineItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    ));
  };

  const handleVerifyItem = (itemId: string) => {
    setLineItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, verified: !item.verified } : item
    ));
  };

  const handleReceiveAll = (itemId: string, expectedQty: number) => {
    setLineItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, receivedQty: expectedQty, verified: true } : item
    ));
  };

  const handlePutAway = (itemId: string) => {
    setLineItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, putAway: true } : item
    ));
  };

  const handleAddDiscrepancy = (itemId: string) => {
    if (!newDiscrepancy.description) return;
    const newId = `DISC-${Date.now()}`;
    setDiscrepancies(prev => [...prev, {
      id: newId,
      lineItemId: itemId,
      ...newDiscrepancy,
    }]);
    setNewDiscrepancy({ type: 'shortage', quantity: 0, description: '' });
    setShowDiscrepancyForm(null);
  };

  const handleCaptureBOL = () => {
    if (!bolNumber.trim()) return;
    setBolCaptured(true);
  };

  // Receiving Interface Component
  const receivingInterface = (
    <div className="bg-[var(--card)] rounded-lg border-2 border-yellow-400 overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)] bg-yellow-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
              <path d="M9 14l2 2 4-4"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Receiving Mode</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              {totalReceived} of {totalExpected} items received · {totalDamaged > 0 ? `${totalDamaged} damaged` : 'No damage reported'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {allItemsVerified && allBinsAssigned && (
            <button
              onClick={handleCompleteReceiving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-green-700 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Complete Receiving
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/20">
        <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] mb-2">
          <span>Receiving Progress</span>
          <span>{Math.round((totalReceived / totalExpected) * 100)}%</span>
        </div>
        <div className="w-full h-2 bg-[var(--muted)] rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${(totalReceived / totalExpected) * 100}%` }}
          />
        </div>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {lineItems.map((lineItem) => {
          const isVerified = lineItem.verified;
          const isPutAway = lineItem.putAway;
          const hasDiscrepancy = discrepancies.some(d => d.lineItemId === lineItem.id);
          const isExpanded = expandedItemId === lineItem.id;

          return (
            <div
              key={lineItem.id}
              className={`transition-colors ${isVerified ? 'bg-green-50' : isPutAway ? 'bg-blue-50' : 'hover:bg-[var(--muted)]/20'}`}
            >
              <div className="p-4 flex items-center gap-4">
                {/* Status indicator */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isPutAway ? 'bg-blue-500' : isVerified ? 'bg-green-500' : 'bg-[var(--muted)]'
                }`}>
                  {isPutAway ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                      <path d="M9 12l2 2 4-4"/>
                    </svg>
                  ) : isVerified ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <span className="text-lg font-bold text-[var(--muted-foreground)]">{lineItem.expectedQty}</span>
                  )}
                </div>

                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--foreground)]">{lineItem.partNumber}</span>
                    {hasDiscrepancy && (
                      <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="8" x2="12" y2="12"/>
                          <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        Discrepancy
                      </span>
                    )}
                    {lineItem.lotNumber && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                        Lot: {lineItem.lotNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)] truncate">{lineItem.productName}</p>
                  {lineItem.binId && (
                    <div className="flex items-center gap-1 mt-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      <span className="text-xs text-amber-600 font-medium">
                        Bin {mockBins.find(b => b.id === lineItem.binId)?.letterCode || lineItem.binId}
                      </span>
                    </div>
                  )}
                </div>

                {/* Quantity display */}
                <div className="text-right mr-4">
                  <div className="text-2xl font-bold text-[var(--foreground)]">
                    {lineItem.receivedQty} / {lineItem.expectedQty}
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    {isVerified ? 'verified' : 'received'}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedItemId(isExpanded ? null : lineItem.id)}
                    className="p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                    title="Expand details"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    >
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </button>
                  {!isVerified && (
                    <>
                      <button
                        onClick={() => handleReceiveAll(lineItem.id, lineItem.expectedQty)}
                        className="px-4 py-3 bg-yellow-500 text-white rounded-lg font-medium text-sm hover:bg-yellow-600 transition-colors flex items-center gap-2"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                        Receive All
                      </button>
                    </>
                  )}
                  {isVerified && !isPutAway && lineItem.binId && (
                    <button
                      onClick={() => handlePutAway(lineItem.id)}
                      className="px-4 py-3 bg-blue-500 text-white rounded-lg font-medium text-sm hover:bg-blue-600 transition-colors flex items-center gap-2"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                      </svg>
                      Put Away
                    </button>
                  )}
                  {isVerified && (
                    <button
                      onClick={() => handleVerifyItem(lineItem.id)}
                      className="px-4 py-3 border border-[var(--border)] rounded-lg font-medium text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
                    >
                      Undo
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t border-[var(--border)] bg-[var(--muted)]/10">
                  <div className="ml-16 space-y-4 mt-4">
                    {/* Quantity Row */}
                    <div className="grid grid-cols-5 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                          Received Qty
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={lineItem.receivedQty}
                          onChange={(e) => handleUpdateLineItem(lineItem.id, { receivedQty: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                          Damaged Qty
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={lineItem.damagedQty}
                          onChange={(e) => handleUpdateLineItem(lineItem.id, { damagedQty: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                          Bin Location
                        </label>
                        <select
                          value={lineItem.binId}
                          onChange={(e) => handleUpdateLineItem(lineItem.id, { binId: e.target.value })}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                        >
                          <option value="">Select bin</option>
                          {mockBins.map((bin) => (
                            <option key={bin.id} value={bin.id}>
                              Bin {bin.letterCode}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                          Lot Number
                        </label>
                        <input
                          type="text"
                          value={lineItem.lotNumber}
                          onChange={(e) => handleUpdateLineItem(lineItem.id, { lotNumber: e.target.value })}
                          placeholder="Enter lot #"
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                          Expiration Date
                        </label>
                        <input
                          type="date"
                          value={lineItem.expirationDate}
                          onChange={(e) => handleUpdateLineItem(lineItem.id, { expirationDate: e.target.value })}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                        />
                      </div>
                    </div>

                    {/* Notes Row */}
                    <div>
                      <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                        Notes
                      </label>
                      <input
                        type="text"
                        value={lineItem.notes}
                        onChange={(e) => handleUpdateLineItem(lineItem.id, { notes: e.target.value })}
                        placeholder="Add notes for this item..."
                        className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                      />
                    </div>

                    {/* Discrepancy Section */}
                    <div className="pt-2 border-t border-[var(--border)]">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-sm font-medium text-[var(--foreground)]">Discrepancies</h5>
                        {showDiscrepancyForm !== lineItem.id && (
                          <button
                            onClick={() => setShowDiscrepancyForm(lineItem.id)}
                            className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="12" y1="5" x2="12" y2="19"/>
                              <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            Report Discrepancy
                          </button>
                        )}
                      </div>

                      {/* Existing discrepancies */}
                      {discrepancies.filter(d => d.lineItemId === lineItem.id).map(disc => (
                        <div key={disc.id} className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg mb-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              disc.type === 'shortage' ? 'bg-red-100 text-red-700' :
                              disc.type === 'overage' ? 'bg-blue-100 text-blue-700' :
                              disc.type === 'damage' ? 'bg-orange-100 text-orange-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              {disc.type.charAt(0).toUpperCase() + disc.type.slice(1)}
                            </span>
                            {disc.quantity > 0 && <span className="text-[var(--muted-foreground)]">Qty: {disc.quantity}</span>}
                          </div>
                          <p className="text-[var(--foreground)] mt-1">{disc.description}</p>
                        </div>
                      ))}

                      {/* New discrepancy form */}
                      {showDiscrepancyForm === lineItem.id && (
                        <div className="p-3 bg-[var(--muted)]/30 border border-[var(--border)] rounded-lg space-y-3">
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Type</label>
                              <select
                                value={newDiscrepancy.type}
                                onChange={(e) => setNewDiscrepancy(prev => ({ ...prev, type: e.target.value as 'shortage' | 'overage' | 'damage' | 'wrong_item' }))}
                                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
                              >
                                <option value="shortage">Shortage</option>
                                <option value="overage">Overage</option>
                                <option value="damage">Damage</option>
                                <option value="wrong_item">Wrong Item</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Quantity</label>
                              <input
                                type="number"
                                min="0"
                                value={newDiscrepancy.quantity}
                                onChange={(e) => setNewDiscrepancy(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
                              />
                            </div>
                            <div className="flex items-end gap-2">
                              <button
                                onClick={() => handleAddDiscrepancy(lineItem.id)}
                                className="px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
                              >
                                Add
                              </button>
                              <button
                                onClick={() => {
                                  setShowDiscrepancyForm(null);
                                  setNewDiscrepancy({ type: 'shortage', quantity: 0, description: '' });
                                }}
                                className="px-3 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Description</label>
                            <input
                              type="text"
                              value={newDiscrepancy.description}
                              onChange={(e) => setNewDiscrepancy(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Describe the discrepancy..."
                              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
                            />
                          </div>
                        </div>
                      )}

                      {discrepancies.filter(d => d.lineItemId === lineItem.id).length === 0 && showDiscrepancyForm !== lineItem.id && (
                        <p className="text-xs text-[var(--muted-foreground)]">No discrepancies reported</p>
                      )}
                    </div>

                    {/* Verify Button */}
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => handleVerifyItem(lineItem.id)}
                        disabled={!lineItem.binId}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                          lineItem.verified
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                        {lineItem.verified ? 'Verified' : 'Verify Item'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // Put-Away Interface Component
  const putAwayInterface = (
    <div className="bg-[var(--card)] rounded-lg border-2 border-blue-400 overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)] bg-blue-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Put-Away Mode</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Scan bins to put away verified items
            </p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {lineItems.filter(li => li.verified && !li.putAway).map(lineItem => (
            <div
              key={lineItem.id}
              className="p-4 bg-[var(--muted)]/20 border border-[var(--border)] rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">{lineItem.partNumber}</span>
                <span className="text-lg font-bold">{lineItem.receivedQty} units</span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] mb-3">{lineItem.productName}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-600">
                  Target: Bin {mockBins.find(b => b.id === lineItem.binId)?.letterCode || '-'}
                </span>
                <button
                  onClick={() => handlePutAway(lineItem.id)}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Confirm Put-Away
                </button>
              </div>
            </div>
          ))}
        </div>

        {lineItems.filter(li => li.verified && !li.putAway).length === 0 && (
          <div className="text-center py-8 text-[var(--muted-foreground)]">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 opacity-50">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            <p>All verified items have been put away</p>
          </div>
        )}
      </div>
    </div>
  );

  // Line Items Summary Table
  const lineItemsTable = (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Expected Items</h3>
          <span className="text-xs px-2 py-0.5 bg-[var(--muted)] rounded">
            {shipment.itemCount} line items
          </span>
        </div>
        <span className="text-xs text-[var(--muted-foreground)]">{totalExpected} units expected</span>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--muted)]/20">
            <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Part #</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Product</th>
            <th className="px-4 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">Expected</th>
            <th className="px-4 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">Received</th>
            <th className="px-4 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">Variance</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {lineItems.map((lineItem) => {
            const variance = lineItem.receivedQty - lineItem.expectedQty;
            return (
              <tr key={lineItem.id} className="hover:bg-[var(--muted)]/20 transition-colors">
                <td className="px-4 py-2 text-sm font-medium text-[var(--foreground)]">{lineItem.partNumber}</td>
                <td className="px-4 py-2 text-sm text-[var(--foreground)]">{lineItem.productName}</td>
                <td className="px-4 py-2 text-sm text-[var(--foreground)] text-right">{lineItem.expectedQty}</td>
                <td className="px-4 py-2 text-sm text-[var(--foreground)] text-right">{lineItem.receivedQty}</td>
                <td className="px-4 py-2 text-sm text-right">
                  <span className={variance === 0 ? 'text-green-600' : variance > 0 ? 'text-blue-600' : 'text-red-600'}>
                    {variance > 0 ? '+' : ''}{variance}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    lineItem.putAway ? 'bg-blue-100 text-blue-700' :
                    lineItem.verified ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {lineItem.putAway ? 'Put Away' : lineItem.verified ? 'Verified' : 'Pending'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <main className="flex-1 overflow-auto bg-[var(--background)]">
      <div className="max-w-[1400px] mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.push('/warehouse/deliveries')}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-[var(--foreground)]">
                {shipment.poNumber}
              </h1>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${shipmentStatusColors[shipment.status]}`}>
                {shipmentStatusLabels[shipment.status]}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-[var(--muted-foreground)]">From:</span>
              <span className="text-sm font-medium text-[var(--foreground)]">{shipment.vendorName}</span>
              <span className="text-sm text-[var(--muted-foreground)]">|</span>
              <span className="text-sm text-[var(--muted-foreground)]">ETA: {formatDate(shipment.eta)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 border border-[var(--border)] rounded-lg font-medium text-sm hover:bg-[var(--muted)] transition-colors flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              Print Receipt
            </button>

            {/* Dynamic Action Buttons based on status */}
            {shipment.status === 'PENDING' && (
              <button
                onClick={handleConfirmShipment}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                Confirm Shipment
              </button>
            )}

            {shipment.status === 'CONFIRMED' && (
              <button
                onClick={handleMarkInTransit}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="3" width="15" height="13"/>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                  <circle cx="5.5" cy="18.5" r="2.5"/>
                  <circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
                Mark In Transit
              </button>
            )}

            {shipment.status === 'IN_TRANSIT' && (
              <button
                onClick={handleMarkArrived}
                className="px-3 py-1.5 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                </svg>
                Mark Arrived
              </button>
            )}

            {shipment.status === 'ARRIVED' && (
              <button
                onClick={handleStartReceiving}
                className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg font-medium text-sm hover:bg-yellow-700 transition-colors flex items-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                  <rect x="9" y="3" width="6" height="4" rx="1"/>
                </svg>
                Start Receiving
              </button>
            )}

            {shipment.status === 'RECEIVING' && allItemsVerified && allBinsAssigned && (
              <button
                onClick={handleCompleteReceiving}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                Complete Receiving
              </button>
            )}
          </div>
        </div>

        {/* Status Progress - Compact & Clickable */}
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4 mb-4">
          {viewingStatus && viewingStatus !== shipment.status && (
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-[var(--border)]">
              <span className="text-xs text-[var(--muted-foreground)]">
                Viewing: <span className="font-medium text-[var(--foreground)]">{shipmentStatusLabels[viewingStatus]}</span>
                <span className="mx-2">·</span>
                Actual status: <span className="font-medium text-[var(--primary)]">{shipmentStatusLabels[shipment.status]}</span>
              </span>
              <button
                onClick={() => setViewingStatus(null)}
                className="text-xs text-[var(--primary)] hover:underline"
              >
                Back to current
              </button>
            </div>
          )}
          <div className="flex items-center justify-between">
            {receivingSteps.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isViewing = viewingStatus === step;

              return (
                <React.Fragment key={step}>
                  <button
                    onClick={() => setViewingStatus(step === shipment.status ? null : step)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium relative ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isCurrent
                            ? 'bg-[var(--primary)] text-white'
                            : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                      }`}
                    >
                      {isCompleted ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        index + 1
                      )}
                      {isViewing && !isCurrent && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <span className={`text-xs ${
                      isViewing && !isCurrent
                        ? 'text-amber-600 font-medium'
                        : isCurrent
                          ? 'text-[var(--primary)] font-medium'
                          : 'text-[var(--muted-foreground)]'
                    }`}>
                      {shipmentStatusLabels[step]}
                    </span>
                  </button>
                  {index < receivingSteps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 rounded ${isCompleted ? 'bg-green-500' : 'bg-[var(--muted)]'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* BOL Capture Section - Show when status is ARRIVED */}
        {displayStatus === 'ARRIVED' && !bolCaptured && (
          <div className="bg-[var(--card)] rounded-lg border-2 border-purple-400 p-4 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-400 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--foreground)]">Bill of Lading Capture</h3>
                <p className="text-sm text-[var(--muted-foreground)]">Enter or scan the BOL number from the shipment</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">BOL Number</label>
                <input
                  type="text"
                  value={bolNumber}
                  onChange={(e) => setBolNumber(e.target.value)}
                  placeholder="Enter or scan BOL number..."
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleCaptureBOL}
                  disabled={!bolNumber.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Capture BOL
                </button>
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Notes</label>
              <input
                type="text"
                value={bolNotes}
                onChange={(e) => setBolNotes(e.target.value)}
                placeholder="Add any notes about the shipment condition..."
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
            </div>
          </div>
        )}

        {/* BOL Captured Badge */}
        {bolCaptured && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <span className="text-sm font-medium text-purple-800">BOL Captured:</span>
              <span className="text-sm text-purple-700 font-mono">{bolNumber}</span>
            </div>
            <button
              onClick={() => setBolCaptured(false)}
              className="text-xs text-purple-600 hover:underline"
            >
              Edit
            </button>
          </div>
        )}

        {/* Receiving Interface - Show when status is RECEIVING */}
        {isReceiving && (
          <div className="mb-4">
            {receivingInterface}
          </div>
        )}

        {/* Put-Away Interface - Show items that are verified but not put away */}
        {isReceiving && lineItems.some(li => li.verified && !li.putAway) && (
          <div className="mb-4">
            {putAwayInterface}
          </div>
        )}

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Left Column - Shipment Details */}
          <div className="col-span-2 space-y-4">
            {/* Shipment Info Row */}
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Warehouse</label>
                  <p className="text-sm font-medium text-[var(--foreground)]">{shipment.warehouseName}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Carrier</label>
                  <p className="text-sm font-medium text-[var(--foreground)]">{shipment.carrier || '-'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Tracking #</label>
                  {shipment.trackingNumber ? (
                    <a
                      href={`https://www.ups.com/track?tracknum=${shipment.trackingNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      {shipment.trackingNumber}
                    </a>
                  ) : (
                    <p className="text-sm text-[var(--muted-foreground)]">-</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Expected Date</label>
                  <p className="text-sm font-medium text-[var(--foreground)]">{formatDate(shipment.eta)}</p>
                </div>
              </div>
            </div>

            {/* Vendor Info */}
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Vendor</label>
                  <p className="text-sm font-medium text-[var(--foreground)]">{shipment.vendorName}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Contact</label>
                  <p className="text-sm text-[var(--foreground)]">{shipment.vendorContact || '-'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Email</label>
                  <p className="text-sm text-[var(--foreground)]">{shipment.vendorEmail || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Receiving Summary */}
          <div className="space-y-4">
            {/* Receiving Stats */}
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <div className="flex items-center gap-2 mb-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                </svg>
                <h3 className="text-sm font-semibold text-[var(--foreground)]">Receiving Summary</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Expected</span>
                  <span className="text-sm font-semibold text-[var(--foreground)]">{totalExpected} units</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Received</span>
                  <span className="text-sm font-semibold text-green-600">{totalReceived} units</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Damaged</span>
                  <span className={`text-sm font-semibold ${totalDamaged > 0 ? 'text-red-600' : 'text-[var(--foreground)]'}`}>
                    {totalDamaged} units
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                  <span className="text-sm text-[var(--muted-foreground)]">Variance</span>
                  <span className={`text-sm font-semibold ${
                    totalReceived - totalExpected === 0 ? 'text-green-600' :
                    totalReceived - totalExpected > 0 ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    {totalReceived - totalExpected > 0 ? '+' : ''}{totalReceived - totalExpected} units
                  </span>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <div className="flex items-center gap-2 mb-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
                <h3 className="text-sm font-semibold text-[var(--foreground)]">Timestamps</h3>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-[var(--muted-foreground)]">Created</label>
                  <p className="text-sm font-medium">{formatDateTime(shipment.createdAt)}</p>
                </div>
                <div>
                  <label className="text-xs text-[var(--muted-foreground)]">Last Updated</label>
                  <p className="text-sm font-medium">{formatDateTime(shipment.updatedAt)}</p>
                </div>
                {shipment.receivedAt && (
                  <div>
                    <label className="text-xs text-[var(--muted-foreground)]">Received</label>
                    <p className="text-sm font-medium">{formatDateTime(shipment.receivedAt)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Discrepancies Summary */}
            {discrepancies.length > 0 && (
              <div className="bg-red-50 rounded-lg border border-red-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <h3 className="text-sm font-semibold text-red-800">Discrepancies ({discrepancies.length})</h3>
                </div>
                <div className="space-y-1">
                  {discrepancies.slice(0, 3).map(disc => (
                    <div key={disc.id} className="text-xs text-red-700">
                      · {disc.type}: {disc.description}
                    </div>
                  ))}
                  {discrepancies.length > 3 && (
                    <div className="text-xs text-red-600 font-medium">
                      +{discrepancies.length - 3} more...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Line Items Table - Always show at bottom */}
        {lineItemsTable}

        {/* Notes Section */}
        {shipment.notes && (
          <div className="mt-4 bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">Notes</h3>
            <p className="text-sm text-[var(--muted-foreground)]">{shipment.notes}</p>
          </div>
        )}
      </div>
    </main>
  );
}
