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

const statusSteps: FulfillmentOrderStatus[] = ['PENDING', 'RELEASED', 'PICKING', 'PACKING', 'PACKED', 'SHIPPED'];

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
  const [shipToDifferentFromPO, setShipToDifferentFromPO] = useState(false);
  const [carrier, setCarrier] = useState(fulfillmentOrder?.carrier || '');
  const [trackingNumbers, setTrackingNumbers] = useState(fulfillmentOrder?.trackingNumbers?.join(', ') || '');

  // Picking state - track picked quantities per line item
  // View state - allows navigating to see different status screens
  const [viewingStatus, setViewingStatus] = useState<FulfillmentOrderStatus | null>(null);

  const [pickedItems, setPickedItems] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    fulfillmentOrder?.lineItems.forEach(item => {
      initial[item.id] = 0;
    });
    return initial;
  });
  const [pickingNotes, setPickingNotes] = useState<Record<string, string>>({});
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  // Packing state - multi-box support
  interface PackingBox {
    id: string;
    packagingType: string;
    customWeight: string;
    useCustomWeight: boolean;
    customDimensions: { length: string; width: string; height: string };
    lineItemIds: string[]; // Items assigned to this box
  }

  const packagingOptions = [
    { value: 'small_box', label: 'Small Box', dimensions: { length: '12', width: '10', height: '8' } },
    { value: 'medium_box', label: 'Medium Box', dimensions: { length: '18', width: '14', height: '12' } },
    { value: 'large_box', label: 'Large Box', dimensions: { length: '24', width: '18', height: '18' } },
    { value: 'pallet', label: 'Pallet', dimensions: { length: '48', width: '40', height: '6' } },
    { value: 'envelope', label: 'Envelope/Mailer', dimensions: { length: '12', width: '9', height: '1' } },
    { value: 'custom', label: 'Custom', dimensions: { length: '', width: '', height: '' } },
  ];

  const [packingBoxes, setPackingBoxes] = useState<PackingBox[]>([
    {
      id: 'box-1',
      packagingType: 'small_box',
      customWeight: '',
      useCustomWeight: false,
      customDimensions: { length: '', width: '', height: '' },
      lineItemIds: [],
    }
  ]);
  const [verifiedItems, setVerifiedItems] = useState<Record<string, boolean>>({});
  const [packingNotes, setPackingNotes] = useState<Record<string, string>>({});
  const [expandedPackingNoteId, setExpandedPackingNoteId] = useState<string | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

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

  // Use viewing status if set, otherwise use actual status
  const displayStatus = viewingStatus || fulfillmentOrder.status;
  const isReleased = displayStatus !== 'PENDING';
  const isPicking = displayStatus === 'PICKING';
  const isPacking = displayStatus === 'PACKING';

  // Picking helper functions
  const handleMarkAsPicked = (lineItemId: string, qty: number) => {
    setPickedItems(prev => ({
      ...prev,
      [lineItemId]: qty
    }));
  };

  const handlePickAll = (lineItemId: string, allocatedQty: number) => {
    setPickedItems(prev => ({
      ...prev,
      [lineItemId]: allocatedQty
    }));
  };

  const handleSimulateQRScan = (lineItemId: string, allocatedQty: number) => {
    // Simulate QR code scan - in real app this would use device camera
    handlePickAll(lineItemId, allocatedQty);
  };

  const totalToPick = fulfillmentOrder.lineItems.reduce((sum, li) => sum + li.allocatedQty, 0);
  const totalPicked = Object.values(pickedItems).reduce((sum, qty) => sum + qty, 0);
  const allItemsPicked = fulfillmentOrder.lineItems.every(li => pickedItems[li.id] >= li.allocatedQty);

  const handleUpdateNote = (lineItemId: string, note: string) => {
    setPickingNotes(prev => ({
      ...prev,
      [lineItemId]: note
    }));
  };

  // Packing helper functions
  const handleVerifyItem = (lineItemId: string) => {
    setVerifiedItems(prev => ({
      ...prev,
      [lineItemId]: !prev[lineItemId]
    }));
  };

  const handleUpdatePackingNote = (lineItemId: string, note: string) => {
    setPackingNotes(prev => ({
      ...prev,
      [lineItemId]: note
    }));
  };

  // Box management functions
  const addNewBox = () => {
    const newBox: PackingBox = {
      id: `box-${packingBoxes.length + 1}`,
      packagingType: 'small_box',
      customWeight: '',
      useCustomWeight: false,
      customDimensions: { length: '', width: '', height: '' },
      lineItemIds: [],
    };
    setPackingBoxes(prev => [...prev, newBox]);
  };

  const removeBox = (boxId: string) => {
    if (packingBoxes.length <= 1) return;
    setPackingBoxes(prev => prev.filter(b => b.id !== boxId));
  };

  const updateBox = (boxId: string, updates: Partial<PackingBox>) => {
    setPackingBoxes(prev => prev.map(box =>
      box.id === boxId ? { ...box, ...updates } : box
    ));
  };

  const assignItemToBox = (lineItemId: string, boxId: string) => {
    setPackingBoxes(prev => prev.map(box => ({
      ...box,
      lineItemIds: box.id === boxId
        ? [...box.lineItemIds.filter(id => id !== lineItemId), lineItemId]
        : box.lineItemIds.filter(id => id !== lineItemId)
    })));
    // Also verify the item when assigned
    setVerifiedItems(prev => ({ ...prev, [lineItemId]: true }));
  };

  const getBoxForItem = (lineItemId: string): string | null => {
    const box = packingBoxes.find(b => b.lineItemIds.includes(lineItemId));
    return box?.id || null;
  };

  const getUnassignedItems = () => {
    const assignedIds = packingBoxes.flatMap(b => b.lineItemIds);
    return fulfillmentOrder.lineItems.filter(li => !assignedIds.includes(li.id));
  };

  const getBoxDimensions = (box: PackingBox) => {
    if (box.packagingType === 'custom') {
      return box.customDimensions;
    }
    const packaging = packagingOptions.find(p => p.value === box.packagingType);
    return packaging?.dimensions || { length: '', width: '', height: '' };
  };

  // Mock weight calculation (in real app, would come from product data)
  const calculateBoxWeight = (box: PackingBox): number => {
    const itemsInBox = fulfillmentOrder.lineItems.filter(li => box.lineItemIds.includes(li.id));
    // Mock: 0.5 lbs per unit
    return itemsInBox.reduce((sum, li) => sum + (li.allocatedQty * 0.5), 0);
  };

  const getBoxWeight = (box: PackingBox): string => {
    if (box.useCustomWeight && box.customWeight) {
      return box.customWeight;
    }
    const calculated = calculateBoxWeight(box);
    return calculated > 0 ? calculated.toFixed(1) : '0.0';
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, lineItemId: string) => {
    setDraggedItemId(lineItemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, boxId: string) => {
    e.preventDefault();
    if (draggedItemId) {
      assignItemToBox(draggedItemId, boxId);
      setDraggedItemId(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
  };

  const allItemsVerified = fulfillmentOrder.lineItems.every(li => verifiedItems[li.id]);
  const allItemsAssigned = getUnassignedItems().length === 0;
  const verifiedCount = fulfillmentOrder.lineItems.filter(li => verifiedItems[li.id]).length;

  const handleCompletePacking = () => {
    if (fulfillmentOrder.status !== 'PACKING') return;

    const now = new Date().toISOString();
    updateFulfillmentOrder(fulfillmentOrder.id, {
      status: 'PACKED',
      updatedAt: now,
    });
    setForceUpdate(prev => prev + 1);
  };

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
      status: 'PACKING',
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

  // Picking Interface Component - shown when status is PICKING
  const pickingInterface = (
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
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Picking Mode</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              {totalPicked} of {totalToPick} items picked
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {allItemsPicked && (
            <button
              onClick={handleCompletePicking}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-green-700 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Complete Picking
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {fulfillmentOrder.lineItems.map((lineItem) => {
          const isPicked = pickedItems[lineItem.id] >= lineItem.allocatedQty;
          const pickedQty = pickedItems[lineItem.id] || 0;
          const hasNote = !!pickingNotes[lineItem.id];
          const isNoteExpanded = expandedNoteId === lineItem.id;

          return (
            <div
              key={lineItem.id}
              className={`transition-colors ${isPicked ? 'bg-green-50' : 'hover:bg-[var(--muted)]/20'}`}
            >
              <div className="p-4 flex items-center gap-4">
                {/* Status indicator */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isPicked ? 'bg-green-500' : 'bg-[var(--muted)]'
                }`}>
                  {isPicked ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <span className="text-lg font-bold text-[var(--muted-foreground)]">{lineItem.allocatedQty}</span>
                  )}
                </div>

                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--foreground)]">{lineItem.partNumber}</span>
                    <span className="text-xs px-2 py-0.5 bg-[var(--muted)] rounded">{lineItem.uom}</span>
                    {hasNote && !isNoteExpanded && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                        </svg>
                        Note
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)] truncate">{lineItem.productName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span className="text-sm font-medium text-amber-600">{lineItem.pickLocation || 'No location'}</span>
                  </div>
                </div>

                {/* Quantity display */}
                <div className="text-right mr-4">
                  <div className="text-2xl font-bold text-[var(--foreground)]">
                    {pickedQty} / {lineItem.allocatedQty}
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)]">picked</div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Note button */}
                  <button
                    onClick={() => setExpandedNoteId(isNoteExpanded ? null : lineItem.id)}
                    className={`p-3 border rounded-lg transition-colors ${
                      hasNote
                        ? 'border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100'
                        : 'border-[var(--border)] hover:bg-[var(--muted)] text-[var(--muted-foreground)]'
                    }`}
                    title="Add note"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                  </button>
                  {!isPicked && (
                    <>
                      <button
                        onClick={() => handleSimulateQRScan(lineItem.id, lineItem.allocatedQty)}
                        className="p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                        title="Scan QR to pick"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="7" height="7"/>
                          <rect x="14" y="3" width="7" height="7"/>
                          <rect x="3" y="14" width="7" height="7"/>
                          <rect x="14" y="14" width="7" height="7"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => handlePickAll(lineItem.id, lineItem.allocatedQty)}
                        className="px-4 py-3 bg-yellow-500 text-white rounded-lg font-medium text-sm hover:bg-yellow-600 transition-colors flex items-center gap-2"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                        Pick All
                      </button>
                    </>
                  )}
                  {isPicked && (
                    <button
                      onClick={() => handleMarkAsPicked(lineItem.id, 0)}
                      className="px-4 py-3 border border-[var(--border)] rounded-lg font-medium text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
                    >
                      Undo
                    </button>
                  )}
                </div>
              </div>

              {/* Expandable note input */}
              {isNoteExpanded && (
                <div className="px-4 pb-4 pt-0">
                  <div className="ml-16 flex gap-2">
                    <input
                      type="text"
                      value={pickingNotes[lineItem.id] || ''}
                      onChange={(e) => handleUpdateNote(lineItem.id, e.target.value)}
                      placeholder="Add a note for this item..."
                      className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      autoFocus
                    />
                    <button
                      onClick={() => setExpandedNoteId(null)}
                      className="px-3 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // Packing Interface Component - shown when status is PACKING
  const packingInterface = (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-[var(--card)] rounded-lg border-2 border-orange-400 overflow-hidden">
        <div className="px-4 py-3 bg-orange-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-400 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--foreground)]">Packing Mode</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Drag items into boxes • {packingBoxes.length} box{packingBoxes.length > 1 ? 'es' : ''} • {getUnassignedItems().length} items to assign
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={addNewBox}
              className="px-3 py-2 border border-orange-400 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-50 transition-colors flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Box
            </button>
            {allItemsAssigned && (
              <button
                onClick={handleCompletePacking}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-green-700 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                Complete Packing
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Unassigned Items */}
      {getUnassignedItems().length > 0 && (
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)] bg-amber-50">
            <h4 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Items to Pack ({getUnassignedItems().length})
            </h4>
            <p className="text-xs text-amber-600 mt-1">Drag items to a box below, or click to assign</p>
          </div>
          <div className="p-3 flex flex-wrap gap-2">
            {getUnassignedItems().map((lineItem) => (
              <div
                key={lineItem.id}
                draggable
                onDragStart={(e) => handleDragStart(e, lineItem.id)}
                onDragEnd={handleDragEnd}
                className={`px-3 py-2 bg-white border border-[var(--border)] rounded-lg cursor-grab active:cursor-grabbing hover:border-orange-400 hover:shadow-sm transition-all flex items-center gap-2 ${
                  draggedItemId === lineItem.id ? 'opacity-50' : ''
                }`}
              >
                <span className="w-6 h-6 rounded bg-[var(--muted)] flex items-center justify-center text-xs font-bold">
                  {lineItem.allocatedQty}
                </span>
                <div>
                  <div className="text-sm font-medium">{lineItem.partNumber}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">{lineItem.uom}</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)] ml-1">
                  <circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/>
                  <circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>
                </svg>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Boxes Grid */}
      <div className="grid grid-cols-2 gap-4">
        {packingBoxes.map((box, boxIndex) => {
          const boxDims = getBoxDimensions(box);
          const boxItems = fulfillmentOrder.lineItems.filter(li => box.lineItemIds.includes(li.id));
          const calculatedWeight = calculateBoxWeight(box);
          const displayWeight = getBoxWeight(box);
          const isCustom = box.packagingType === 'custom';

          return (
            <div
              key={box.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, box.id)}
              className={`bg-[var(--card)] rounded-lg border-2 overflow-hidden transition-colors ${
                draggedItemId ? 'border-orange-300 border-dashed' : 'border-[var(--border)]'
              }`}
            >
              {/* Box Header */}
              <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-500">
                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                  </svg>
                  <span className="font-semibold text-[var(--foreground)]">Box {boxIndex + 1}</span>
                  <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
                    {boxItems.length} item{boxItems.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-1.5 hover:bg-[var(--muted)] rounded transition-colors" title="Print label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 6 2 18 2 18 9"/>
                      <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
                      <rect x="6" y="14" width="12" height="8"/>
                    </svg>
                  </button>
                  {packingBoxes.length > 1 && (
                    <button
                      onClick={() => removeBox(box.id)}
                      className="p-1.5 hover:bg-red-100 text-red-500 rounded transition-colors"
                      title="Remove box"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Box Config */}
              <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/10">
                <div className="grid grid-cols-2 gap-3">
                  {/* Packaging Type */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Package</label>
                    <select
                      value={box.packagingType}
                      onChange={(e) => updateBox(box.id, { packagingType: e.target.value })}
                      className="w-full px-2 py-1.5 border border-[var(--border)] rounded bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    >
                      {packagingOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label} {opt.value !== 'custom' ? `(${opt.dimensions.length}x${opt.dimensions.width}x${opt.dimensions.height})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dimensions */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">
                      Dimensions (in)
                    </label>
                    <div className="flex gap-1 items-center">
                      <input
                        type="text"
                        value={boxDims.length}
                        onChange={(e) => updateBox(box.id, { customDimensions: { ...box.customDimensions, length: e.target.value } })}
                        disabled={!isCustom}
                        placeholder="L"
                        className="w-full px-2 py-1.5 border border-[var(--border)] rounded bg-[var(--background)] text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:bg-[var(--muted)]/50 disabled:text-[var(--muted-foreground)]"
                      />
                      <span className="text-xs text-[var(--muted-foreground)]">x</span>
                      <input
                        type="text"
                        value={boxDims.width}
                        onChange={(e) => updateBox(box.id, { customDimensions: { ...box.customDimensions, width: e.target.value } })}
                        disabled={!isCustom}
                        placeholder="W"
                        className="w-full px-2 py-1.5 border border-[var(--border)] rounded bg-[var(--background)] text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:bg-[var(--muted)]/50 disabled:text-[var(--muted-foreground)]"
                      />
                      <span className="text-xs text-[var(--muted-foreground)]">x</span>
                      <input
                        type="text"
                        value={boxDims.height}
                        onChange={(e) => updateBox(box.id, { customDimensions: { ...box.customDimensions, height: e.target.value } })}
                        disabled={!isCustom}
                        placeholder="H"
                        className="w-full px-2 py-1.5 border border-[var(--border)] rounded bg-[var(--background)] text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:bg-[var(--muted)]/50 disabled:text-[var(--muted-foreground)]"
                      />
                    </div>
                  </div>
                </div>

                {/* Weight */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase">Weight (lbs)</label>
                    <label className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={box.useCustomWeight}
                        onChange={(e) => updateBox(box.id, { useCustomWeight: e.target.checked })}
                        className="rounded border-[var(--border)]"
                      />
                      Different than calculated
                    </label>
                  </div>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={box.useCustomWeight ? box.customWeight : calculatedWeight.toFixed(1)}
                      onChange={(e) => updateBox(box.id, { customWeight: e.target.value })}
                      disabled={!box.useCustomWeight}
                      className="w-24 px-2 py-1.5 border border-[var(--border)] rounded bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:bg-[var(--muted)]/50 disabled:text-[var(--muted-foreground)]"
                    />
                    {!box.useCustomWeight && boxItems.length > 0 && (
                      <span className="text-xs text-[var(--muted-foreground)]">
                        (calculated from {boxItems.reduce((sum, li) => sum + li.allocatedQty, 0)} units)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Items in Box */}
              <div className="min-h-[80px]">
                {boxItems.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2 opacity-50">
                      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                    </svg>
                    Drop items here
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--border)]">
                    {boxItems.map((lineItem) => (
                      <div
                        key={lineItem.id}
                        className="px-4 py-2 flex items-center gap-3 bg-green-50 hover:bg-green-100 transition-colors"
                      >
                        <div className="w-8 h-8 rounded bg-green-500 flex items-center justify-center flex-shrink-0">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <path d="M20 6L9 17l-5-5"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{lineItem.partNumber}</div>
                          <div className="text-xs text-[var(--muted-foreground)] truncate">{lineItem.productName}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold">{lineItem.allocatedQty}</div>
                          <div className="text-xs text-[var(--muted-foreground)]">{lineItem.uom}</div>
                        </div>
                        <button
                          onClick={() => {
                            setPackingBoxes(prev => prev.map(b => ({
                              ...b,
                              lineItemIds: b.lineItemIds.filter(id => id !== lineItem.id)
                            })));
                            setVerifiedItems(prev => ({ ...prev, [lineItem.id]: false }));
                          }}
                          className="p-1 hover:bg-red-100 text-red-500 rounded transition-colors"
                          title="Remove from box"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Print Actions */}
      <div className="flex gap-2">
        <button className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          Print All Packing Slips
        </button>
        <button className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M3 9h18"/>
            <path d="M9 21V9"/>
          </svg>
          Print All Shipping Labels
        </button>
      </div>
    </div>
  );

  // Line Items Table Component - rendered in different positions based on release status
  const lineItemsTable = (
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
  );

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

        {/* Status Progress - Compact & Clickable */}
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4 mb-4">
          {viewingStatus && viewingStatus !== fulfillmentOrder.status && (
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-[var(--border)]">
              <span className="text-xs text-[var(--muted-foreground)]">
                Viewing: <span className="font-medium text-[var(--foreground)]">{fulfillmentOrderStatusLabels[viewingStatus]}</span>
                <span className="mx-2">•</span>
                Actual status: <span className="font-medium text-[var(--primary)]">{fulfillmentOrderStatusLabels[fulfillmentOrder.status]}</span>
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
            {statusSteps.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isViewing = viewingStatus === step;

              return (
                <React.Fragment key={step}>
                  <button
                    onClick={() => setViewingStatus(step === fulfillmentOrder.status ? null : step)}
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
                      {fulfillmentOrderStatusLabels[step]}
                    </span>
                  </button>
                  {index < statusSteps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 rounded ${isCompleted ? 'bg-green-500' : 'bg-[var(--muted)]'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Picking Interface - Show at top when in PICKING status */}
        {isPicking && (
          <div className="mb-4">
            {pickingInterface}
          </div>
        )}

        {/* Packing Interface - Show at top when in PACKING status */}
        {isPacking && (
          <div className="mb-4">
            {packingInterface}
          </div>
        )}

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
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase">Ship To</label>
                {!isReleased && !shipToDifferentFromPO && (
                  <button
                    onClick={() => setShipToDifferentFromPO(true)}
                    className="text-xs text-[var(--primary)] hover:underline font-medium"
                  >
                    Different than what's on the PO
                  </button>
                )}
                {shipToDifferentFromPO && (
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-amber-600 font-medium">Modified from PO</span>
                    {!isReleased && (
                      <button
                        onClick={() => setShipToDifferentFromPO(false)}
                        className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      >
                        Reset
                      </button>
                    )}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-3 mb-3">
                <div className="col-span-2">
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">Name</label>
                  <input
                    type="text"
                    value={shipToName}
                    onChange={(e) => setShipToName(e.target.value)}
                    disabled={isReleased || !shipToDifferentFromPO}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--muted)]/30"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">Phone</label>
                  <input
                    type="text"
                    value={shipToPhone}
                    onChange={(e) => setShipToPhone(e.target.value)}
                    disabled={isReleased || !shipToDifferentFromPO}
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
                    disabled={isReleased || !shipToDifferentFromPO}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--muted)]/30"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">Address Line 2</label>
                  <input
                    type="text"
                    value={shipToAddressLine2}
                    onChange={(e) => setShipToAddressLine2(e.target.value)}
                    disabled={isReleased || !shipToDifferentFromPO}
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
                    disabled={isReleased || !shipToDifferentFromPO}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--muted)]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">State</label>
                  <input
                    type="text"
                    value={shipToState}
                    onChange={(e) => setShipToState(e.target.value)}
                    disabled={isReleased || !shipToDifferentFromPO}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--muted)]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={shipToPostalCode}
                    onChange={(e) => setShipToPostalCode(e.target.value)}
                    disabled={isReleased || !shipToDifferentFromPO}
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
                <div className="space-y-3">
                  <p className="text-sm text-[var(--muted-foreground)] italic">Not yet released</p>
                  <button
                    onClick={handleReleaseToWarehouse}
                    className="w-full px-3 py-2 bg-cyan-600 text-white rounded-lg font-medium text-sm hover:bg-cyan-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Release to Warehouse
                  </button>
                </div>
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

        {/* Line Items Table - Always show at bottom */}
        {lineItemsTable}
      </div>
    </main>
  );
}
