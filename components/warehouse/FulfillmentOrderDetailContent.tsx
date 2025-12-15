'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getFulfillmentOrderById, mockWarehouses, updateFulfillmentOrder } from '@/lib/data/warehouse-mock';
import {
  fulfillmentOrderStatusColors,
  fulfillmentOrderStatusLabels,
  FulfillmentOrderStatus,
  FulfillmentMethod,
  shipStatusColors,
  shipStatusLabels,
} from '@/lib/types/warehouse';

interface FulfillmentOrderDetailContentProps {
  fulfillmentOrderId: string;
}

const statusSteps: FulfillmentOrderStatus[] = ['PENDING', 'RELEASED', 'PICKING', 'PICKED', 'PACKING', 'PACKED', 'SHIPPED'];

export default function FulfillmentOrderDetailContent({ fulfillmentOrderId }: FulfillmentOrderDetailContentProps) {
  const router = useRouter();
  const [_, setForceUpdate] = useState(0);

  // Get fulfillment order directly from shared mock data
  const fulfillmentOrder = getFulfillmentOrderById(fulfillmentOrderId);

  // Editable state
  const [warehouseId, setWarehouseId] = useState(fulfillmentOrder?.warehouseId || '');
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>(fulfillmentOrder?.fulfillmentMethod || 'SHIP');
  const [shipToName, setShipToName] = useState(fulfillmentOrder?.shipTo.name || '');
  const [shipToAddressLine1, setShipToAddressLine1] = useState(fulfillmentOrder?.shipTo.addressLine1 || '');
  const [shipToAddressLine2, setShipToAddressLine2] = useState(fulfillmentOrder?.shipTo.addressLine2 || '');
  const [shipToCity, setShipToCity] = useState(fulfillmentOrder?.shipTo.city || '');
  const [shipToState, setShipToState] = useState(fulfillmentOrder?.shipTo.state || '');
  const [shipToPostalCode, setShipToPostalCode] = useState(fulfillmentOrder?.shipTo.postalCode || '');
  const [shipToPhone, setShipToPhone] = useState(fulfillmentOrder?.shipTo.contactPhone || '');
  const [needByDate, setNeedByDate] = useState(fulfillmentOrder?.needByDate || '');
  const [carrier, setCarrier] = useState(fulfillmentOrder?.carrier || '');
  const [trackingNumbers, setTrackingNumbers] = useState(fulfillmentOrder?.trackingNumbers?.join(', ') || '');

  if (!fulfillmentOrder) {
    return (
      <main className="flex-1 overflow-hidden bg-[var(--background)] flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">Fulfillment Order Not Found</h1>
          <p className="text-[var(--muted-foreground)] mb-4">The requested fulfillment order could not be found.</p>
          <button
            onClick={() => router.push('/warehouse/fulfillment')}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
          >
            Back to Fulfillment
          </button>
        </div>
      </main>
    );
  }

  const getStatusStepIndex = (status: FulfillmentOrderStatus) => {
    const index = statusSteps.indexOf(status);
    return index >= 0 ? index : 0;
  };

  const currentStepIndex = getStatusStepIndex(fulfillmentOrder.status);
  const isReleased = fulfillmentOrder.status !== 'PENDING';

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

  const handleReleaseToWarehouse = () => {
    if (fulfillmentOrder.status !== 'PENDING') return;

    const now = new Date().toISOString();
    updateFulfillmentOrder(fulfillmentOrder.id, {
      status: 'RELEASED',
      releasedAt: now,
      releasedBy: 'Current User',
      updatedAt: now,
    });
    setForceUpdate(prev => prev + 1);
  };

  const handleStartPicking = () => {
    if (fulfillmentOrder.status !== 'RELEASED') return;

    const now = new Date().toISOString();
    updateFulfillmentOrder(fulfillmentOrder.id, {
      status: 'PICKING',
      pickStartedAt: now,
      pickStartedBy: 'Current User',
      updatedAt: now,
    });
    setForceUpdate(prev => prev + 1);
  };

  const handleCompletePicking = () => {
    if (fulfillmentOrder.status !== 'PICKING') return;

    const now = new Date().toISOString();
    updateFulfillmentOrder(fulfillmentOrder.id, {
      status: 'PICKED',
      pickCompletedAt: now,
      pickCompletedBy: 'Current User',
      updatedAt: now,
    });
    setForceUpdate(prev => prev + 1);
  };

  const handleConfirmShipment = () => {
    if (!['PACKED', 'PACKING'].includes(fulfillmentOrder.status)) return;

    const now = new Date().toISOString();
    updateFulfillmentOrder(fulfillmentOrder.id, {
      status: 'SHIPPED',
      shipStatus: 'SHIPPED',
      shipConfirmedAt: now,
      updatedAt: now,
    });
    setForceUpdate(prev => prev + 1);
  };

  return (
    <main className="flex-1 overflow-auto bg-[var(--background)]">
      <div className="max-w-[1400px] mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.push('/warehouse/fulfillment')}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-[var(--foreground)]">
                {fulfillmentOrder.fulfillmentOrderNumber}
              </h1>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${fulfillmentOrderStatusColors[fulfillmentOrder.status]}`}>
                {fulfillmentOrderStatusLabels[fulfillmentOrder.status]}
              </span>
              {/* FO Lock Indicator */}
              <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-medium border border-amber-200" title="Order lines are locked to this fulfillment order">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Locked
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-[var(--muted-foreground)]">From order:</span>
              <Link
                href={`/orders/${fulfillmentOrder.orderId}`}
                className="text-sm text-[var(--primary)] hover:underline font-medium"
              >
                {fulfillmentOrder.orderNumber}
              </Link>
              <span className="text-sm text-[var(--muted-foreground)]">|</span>
              <span className="text-sm text-[var(--muted-foreground)]">{fulfillmentOrder.customerName}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 border border-[var(--border)] rounded-lg font-medium text-sm hover:bg-[var(--muted)] transition-colors">
              Print Pick List
            </button>

            {/* Dynamic Action Buttons based on status */}
            {fulfillmentOrder.status === 'PENDING' && (
              <button
                onClick={handleReleaseToWarehouse}
                className="px-3 py-1.5 bg-cyan-600 text-white rounded-lg font-medium text-sm hover:bg-cyan-700 transition-colors flex items-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Release to Warehouse
              </button>
            )}

            {fulfillmentOrder.status === 'RELEASED' && (
              <button
                onClick={handleStartPicking}
                className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg font-medium text-sm hover:bg-yellow-700 transition-colors"
              >
                Start Picking
              </button>
            )}

            {fulfillmentOrder.status === 'PICKING' && (
              <button
                onClick={handleCompletePicking}
                className="px-3 py-1.5 bg-amber-600 text-white rounded-lg font-medium text-sm hover:bg-amber-700 transition-colors"
              >
                Complete Picking
              </button>
            )}

            {['PACKED', 'PACKING'].includes(fulfillmentOrder.status) && (
              <button
                onClick={handleConfirmShipment}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition-colors"
              >
                Confirm Shipment
              </button>
            )}

            <button className="px-3 py-1.5 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors">
              Save
            </button>
          </div>
        </div>

        {/* Status Progress - Compact */}
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4 mb-4">
          <div className="flex items-center justify-between">
            {statusSteps.slice(0, 6).map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <React.Fragment key={step}>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
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
                    </div>
                    <span className={`text-xs ${isCurrent ? 'text-[var(--primary)] font-medium' : 'text-[var(--muted-foreground)]'}`}>
                      {fulfillmentOrderStatusLabels[step]}
                    </span>
                  </div>
                  {index < 5 && (
                    <div className={`flex-1 h-0.5 mx-2 rounded ${isCompleted ? 'bg-green-500' : 'bg-[var(--muted)]'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Left Column - Fulfillment Details */}
          <div className="col-span-2 space-y-4">
            {/* Warehouse & Method Row */}
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Warehouse</label>
                  <select
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    disabled={isReleased}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {mockWarehouses.map(wh => (
                      <option key={wh.id} value={wh.id}>{wh.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Fulfillment Method</label>
                  <select
                    value={fulfillmentMethod}
                    onChange={(e) => setFulfillmentMethod(e.target.value as FulfillmentMethod)}
                    disabled={isReleased}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="SHIP">Ship</option>
                    <option value="WILL_CALL">Will Call</option>
                    <option value="JOBSITE">Jobsite Delivery</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Need By Date</label>
                  <input
                    type="date"
                    value={needByDate}
                    onChange={(e) => setNeedByDate(e.target.value)}
                    disabled={isReleased}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Ship To - Component Fields */}
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-2">Ship To</label>
              <div className="grid grid-cols-4 gap-3 mb-3">
                <div className="col-span-2">
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">Name</label>
                  <input
                    type="text"
                    value={shipToName}
                    onChange={(e) => setShipToName(e.target.value)}
                    disabled={isReleased}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--muted)]/30"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">Phone</label>
                  <input
                    type="text"
                    value={shipToPhone}
                    onChange={(e) => setShipToPhone(e.target.value)}
                    disabled={isReleased}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--muted)]/30"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-3">
                <div className="col-span-2">
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">Address Line 1</label>
                  <input
                    type="text"
                    value={shipToAddressLine1}
                    onChange={(e) => setShipToAddressLine1(e.target.value)}
                    disabled={isReleased}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--muted)]/30"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">Address Line 2</label>
                  <input
                    type="text"
                    value={shipToAddressLine2}
                    onChange={(e) => setShipToAddressLine2(e.target.value)}
                    disabled={isReleased}
                    placeholder="Apt, Suite, etc."
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--muted)]/30"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">City</label>
                  <input
                    type="text"
                    value={shipToCity}
                    onChange={(e) => setShipToCity(e.target.value)}
                    disabled={isReleased}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--muted)]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">State</label>
                  <input
                    type="text"
                    value={shipToState}
                    onChange={(e) => setShipToState(e.target.value)}
                    disabled={isReleased}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--muted)]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={shipToPostalCode}
                    onChange={(e) => setShipToPostalCode(e.target.value)}
                    disabled={isReleased}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--muted)]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">Country</label>
                  <input
                    type="text"
                    value="USA"
                    disabled
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--muted)]/30 text-sm opacity-50 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Options & Outcome */}
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Ship Status</label>
                  <span className={`inline-flex items-center px-2 py-1.5 rounded text-xs font-medium ${shipStatusColors[fulfillmentOrder.shipStatus]}`}>
                    {shipStatusLabels[fulfillmentOrder.shipStatus]}
                  </span>
                  {fulfillmentOrder.shipConfirmedAt && (
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">{formatDateTime(fulfillmentOrder.shipConfirmedAt)}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Carrier</label>
                  <input
                    type="text"
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    placeholder="e.g., UPS, FedEx"
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Tracking #</label>
                  <input
                    type="text"
                    value={trackingNumbers}
                    onChange={(e) => setTrackingNumbers(e.target.value)}
                    placeholder="Enter tracking numbers"
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Audit Timestamps */}
          <div className="space-y-4">
            {/* Release Authority */}
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <div className="flex items-center gap-2 mb-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-600">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <h3 className="text-sm font-semibold text-[var(--foreground)]">Release Authority</h3>
              </div>
              {isReleased ? (
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-[var(--muted-foreground)]">Released By</label>
                    <p className="text-sm font-medium">{fulfillmentOrder.releasedBy || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--muted-foreground)]">Released At</label>
                    <p className="text-sm font-medium">{formatDateTime(fulfillmentOrder.releasedAt)}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--muted-foreground)] italic">Not yet released</p>
              )}
            </div>

            {/* Pick Timestamps */}
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <div className="flex items-center gap-2 mb-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-600">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
                <h3 className="text-sm font-semibold text-[var(--foreground)]">Pick Timestamps</h3>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-[var(--muted-foreground)]">Started By</label>
                  <p className="text-sm font-medium">{fulfillmentOrder.pickStartedBy || '-'}</p>
                </div>
                <div>
                  <label className="text-xs text-[var(--muted-foreground)]">Started At</label>
                  <p className="text-sm font-medium">{formatDateTime(fulfillmentOrder.pickStartedAt)}</p>
                </div>
                <div className="border-t border-[var(--border)] pt-2 mt-2">
                  <label className="text-xs text-[var(--muted-foreground)]">Completed By</label>
                  <p className="text-sm font-medium">{fulfillmentOrder.pickCompletedBy || '-'}</p>
                </div>
                <div>
                  <label className="text-xs text-[var(--muted-foreground)]">Completed At</label>
                  <p className="text-sm font-medium">{formatDateTime(fulfillmentOrder.pickCompletedAt)}</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Line Items Table */}
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Line Items</h3>
              <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-medium border border-amber-200" title="These order lines are locked to this FO">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                FO Locked
              </span>
            </div>
            <span className="text-xs text-[var(--muted-foreground)]">{fulfillmentOrder.lineItems.length} items</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/20">
                <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Part #</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Product</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase">UOM</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">Ordered</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">Reserved</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">Picked</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">Shipped</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">Backorder</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Pick Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {fulfillmentOrder.lineItems.map((lineItem) => (
                <tr key={lineItem.id} className="hover:bg-[var(--muted)]/20 transition-colors">
                  <td className="px-4 py-2 text-sm font-medium text-[var(--foreground)]">{lineItem.partNumber}</td>
                  <td className="px-4 py-2 text-sm text-[var(--foreground)]">{lineItem.productName}</td>
                  <td className="px-4 py-2 text-sm text-[var(--muted-foreground)] text-center">{lineItem.uom}</td>
                  <td className="px-4 py-2 text-sm text-[var(--foreground)] text-right">{lineItem.orderedQty}</td>
                  <td className="px-4 py-2 text-sm text-[var(--foreground)] text-right">{lineItem.allocatedQty}</td>
                  <td className="px-4 py-2 text-sm text-[var(--foreground)] text-right">0</td>
                  <td className="px-4 py-2 text-sm text-[var(--foreground)] text-right">{lineItem.shippedQty}</td>
                  <td className="px-4 py-2 text-sm text-[var(--foreground)] text-right">{lineItem.backorderQty}</td>
                  <td className="px-4 py-2">
                    <span className="text-sm text-[var(--muted-foreground)]">
                      {lineItem.pickLocation || '-'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
