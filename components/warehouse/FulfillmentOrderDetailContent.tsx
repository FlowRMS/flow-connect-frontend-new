'use client';

import React, { useState, useRef, useEffect } from 'react';
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

const statusSteps: FulfillmentOrderStatus[] = ['PENDING', 'RELEASED', 'PICKING', 'PACKING', 'SHIPPING', 'SHIPPED'];

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
    { value: 'pallet_48x40x6', label: 'Pallet (48x40x6)', dimensions: { length: '48', width: '40', height: '6' } },
    { value: 'small_box', label: 'Small Box', dimensions: { length: '12', width: '10', height: '8' } },
    { value: 'medium_box', label: 'Medium Box', dimensions: { length: '18', width: '14', height: '12' } },
    { value: 'large_box', label: 'Large Box', dimensions: { length: '24', width: '18', height: '18' } },
    { value: 'extra_large_box', label: 'Extra Large Box', dimensions: { length: '30', width: '24', height: '24' } },
    { value: 'custom', label: 'Custom', dimensions: { length: '', width: '', height: '' } },
  ];

  const [packingBoxes, setPackingBoxes] = useState<PackingBox[]>([
    {
      id: 'box-1',
      packagingType: 'pallet_48x40x6',
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

  // Modal state
  const [showPackingSlipModal, setShowPackingSlipModal] = useState(false);
  const [showShippingLabelsModal, setShowShippingLabelsModal] = useState(false);
  const [showBOLModal, setShowBOLModal] = useState(false);
  const [selectedPackingTemplate, setSelectedPackingTemplate] = useState('standard');
  const [selectedLabelFormat, setSelectedLabelFormat] = useState('4x6');

  // Shipping state - initialize from fulfillment order if available
  const [shippingMethod, setShippingMethod] = useState<'SHIP' | 'WILL_CALL'>(fulfillmentOrder?.fulfillmentMethod === 'JOBSITE' ? 'SHIP' : (fulfillmentOrder?.fulfillmentMethod || 'SHIP'));
  const [carrierType, setCarrierType] = useState<'parcel' | 'freight'>((fulfillmentOrder as any)?.carrierType || 'parcel');
  const [selectedCarrier, setSelectedCarrier] = useState(fulfillmentOrder?.carrier || '');
  const [freightClass, setFreightClass] = useState((fulfillmentOrder as any)?.freightClass || '');
  const [bolNumber, setBolNumber] = useState((fulfillmentOrder as any)?.bolNumber || '');
  const [proNumber, setProNumber] = useState((fulfillmentOrder as any)?.proNumber || '');
  const [shippingNotes, setShippingNotes] = useState((fulfillmentOrder as any)?.shippingNotes || '');

  // Pickup / Handoff state - initialize from fulfillment order if available
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [pickupName, setPickupName] = useState((fulfillmentOrder as any)?.pickupCustomerName || '');
  const [driverName, setDriverName] = useState((fulfillmentOrder as any)?.pickupDriverName || '');
  const [pickupSignature, setPickupSignature] = useState<string | null>((fulfillmentOrder as any)?.pickupSignature || null);
  const [pickupTimestamp, setPickupTimestamp] = useState<Date | null>((fulfillmentOrder as any)?.pickupTimestamp ? new Date((fulfillmentOrder as any).pickupTimestamp) : null);
  const [pickupNotes, setPickupNotes] = useState((fulfillmentOrder as any)?.pickupNotes || '');
  const [isDrawing, setIsDrawing] = useState(false);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);

  // Shipping config lock/collapse state
  const [isShippingConfigLocked, setIsShippingConfigLocked] = useState(false);
  const [isShippingConfigCollapsed, setIsShippingConfigCollapsed] = useState(false);

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
  const isShipping = displayStatus === 'SHIPPING';
  const isShipped = displayStatus === 'SHIPPED';

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

  const addAllItemsToBox = (boxId: string) => {
    const unassignedIds = getUnassignedItems().map(li => li.id);
    setPackingBoxes(prev => prev.map(box => {
      if (box.id === boxId) {
        return {
          ...box,
          lineItemIds: [...box.lineItemIds, ...unassignedIds]
        };
      }
      return box;
    }));
    // Verify all items when added
    const newVerified: Record<string, boolean> = {};
    unassignedIds.forEach(id => {
      newVerified[id] = true;
    });
    setVerifiedItems(prev => ({ ...prev, ...newVerified }));
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
      status: 'SHIPPING',
      updatedAt: now,
    });
    setForceUpdate(prev => prev + 1);
  };

  const handleCompleteShipping = () => {
    if (fulfillmentOrder.status !== 'SHIPPING') return;

    const now = new Date().toISOString();
    updateFulfillmentOrder(fulfillmentOrder.id, {
      status: 'SHIPPED',
      shipStatus: 'SHIPPED',
      carrier: carrier,
      trackingNumbers: trackingNumbers.split(',').map(t => t.trim()).filter(t => t),
      shipConfirmedAt: now,
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

  const handleStartShipping = () => {
    if (fulfillmentOrder.status !== 'PACKING') return;

    const now = new Date().toISOString();
    updateFulfillmentOrder(fulfillmentOrder.id, {
      status: 'SHIPPING',
      updatedAt: now,
    });
    setForceUpdate(prev => prev + 1);
  };

  const handleConfirmShipment = () => {
    if (!['SHIPPING', 'PACKING'].includes(fulfillmentOrder.status)) return;

    // For Freight or Will Call, require signature before completing
    const requiresSignature = (shippingMethod === 'SHIP' && carrierType === 'freight') || shippingMethod === 'WILL_CALL';
    if (requiresSignature && !pickupSignature) {
      // Open signature modal if signature is required but not captured
      setShowSignatureModal(true);
      return;
    }

    const now = new Date().toISOString();
    updateFulfillmentOrder(fulfillmentOrder.id, {
      status: 'SHIPPED',
      shipStatus: 'SHIPPED',
      carrier: carrier,
      trackingNumbers: trackingNumbers.split(',').map(t => t.trim()).filter(t => t),
      shipConfirmedAt: now,
      updatedAt: now,
      // Include signature data if captured
      ...(pickupSignature && {
        pickupSignature,
        pickupTimestamp: pickupTimestamp?.toISOString(),
        pickupCustomerName: pickupName,
        pickupDriverName: driverName,
        pickupNotes,
      }),
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
                Drag items into pallets • {packingBoxes.length} pallet{packingBoxes.length > 1 ? 's' : ''} • {getUnassignedItems().length} items to assign
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
              Add Pallet
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
          <div className="px-4 py-3 border-b border-[var(--border)] bg-amber-50 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Items to Pack ({getUnassignedItems().length})
              </h4>
              <p className="text-xs text-amber-600 mt-1">Drag items to a pallet below, or click to assign</p>
            </div>
            {packingBoxes.length === 1 && (
              <button
                onClick={() => addAllItemsToBox(packingBoxes[0].id)}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
                Add All to Pallet
              </button>
            )}
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
                  <span className="font-semibold text-[var(--foreground)]">Pallet {boxIndex + 1}</span>
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
                      title="Remove pallet"
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
                <div className="grid grid-cols-3 gap-3">
                  {/* Container Type */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Container</label>
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

                  {/* Weight */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Weight (lbs)</label>
                    <input
                      type="text"
                      value={box.useCustomWeight ? box.customWeight : calculatedWeight.toFixed(1)}
                      onChange={(e) => updateBox(box.id, { customWeight: e.target.value })}
                      disabled={!box.useCustomWeight}
                      className="w-full px-2 py-1.5 border border-[var(--border)] rounded bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:bg-[var(--muted)]/50 disabled:text-[var(--muted-foreground)]"
                    />
                    <label className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] cursor-pointer mt-1.5">
                      <input
                        type="checkbox"
                        checked={box.useCustomWeight}
                        onChange={(e) => updateBox(box.id, { useCustomWeight: e.target.checked })}
                        className="rounded border-[var(--border)]"
                      />
                      Different than calculated
                    </label>
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

      {/* Print Actions - Packing Screen */}
      <div className="mt-4">
        <button
          onClick={() => setShowPackingSlipModal(true)}
          className="px-6 py-4 bg-[var(--card)] border-2 border-[var(--border)] rounded-xl font-medium hover:border-[var(--primary)] hover:shadow-md transition-all flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
          </div>
          <div className="text-left">
            <div className="text-base font-semibold">Print Packing Slips</div>
            <div className="text-sm text-[var(--muted-foreground)]">{packingBoxes.length} pallet{packingBoxes.length > 1 ? 's' : ''} ready</div>
          </div>
        </button>
      </div>

      {/* Packing Slip Modal */}
      {showPackingSlipModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                    <polyline points="6 9 6 2 18 2 18 9"/>
                    <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
                    <rect x="6" y="14" width="12" height="8"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Print Packing Slips</h2>
                  <p className="text-sm text-[var(--muted-foreground)]">{packingBoxes.length} packing slip{packingBoxes.length > 1 ? 's' : ''} to print</p>
                </div>
              </div>
              <button
                onClick={() => setShowPackingSlipModal(false)}
                className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-6">
              {/* Template Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Packing Slip Template</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'standard', name: 'Standard', desc: 'Basic packing slip with item list' },
                    { id: 'detailed', name: 'Detailed', desc: 'Includes product descriptions & locations' },
                    { id: 'minimal', name: 'Minimal', desc: 'Compact format for small shipments' },
                  ].map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedPackingTemplate(template.id)}
                      className={`p-4 border-2 rounded-lg text-left transition-colors ${
                        selectedPackingTemplate === template.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-[var(--border)] hover:border-blue-300'
                      }`}
                    >
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs text-[var(--muted-foreground)] mt-1">{template.desc}</div>
                    </button>
                  ))}
                </div>
                <a
                  href="/pdf-templates?type=packing-slip"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 text-sm text-[var(--primary)] hover:underline flex items-center gap-1"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  Manage PDF Templates
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-1">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              </div>

              {/* Preview */}
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="px-4 py-2 bg-[var(--muted)]/30 border-b border-[var(--border)] text-sm font-medium">
                  Preview - {selectedPackingTemplate.charAt(0).toUpperCase() + selectedPackingTemplate.slice(1)} Template
                </div>
                <div className="p-6 bg-white min-h-[400px]">
                  {/* Standard Template Preview */}
                  {selectedPackingTemplate === 'standard' && (
                    <div className="max-w-md mx-auto border border-gray-200 p-6 text-sm">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <div className="text-xl font-bold">PACKING SLIP</div>
                          <div className="text-gray-500 mt-1">{fulfillmentOrder.fulfillmentOrderNumber}</div>
                        </div>
                        <div className="text-right text-gray-500">
                          <div>{new Date().toLocaleDateString()}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                          <div className="font-semibold text-gray-700 mb-1">Ship To:</div>
                          <div>{fulfillmentOrder.shipTo.name}</div>
                          <div>{fulfillmentOrder.shipTo.addressLine1}</div>
                          <div>{fulfillmentOrder.shipTo.city}, {fulfillmentOrder.shipTo.state} {fulfillmentOrder.shipTo.postalCode}</div>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-700 mb-1">Order Info:</div>
                          <div>PO: {fulfillmentOrder.orderNumber}</div>
                          <div>Customer: {fulfillmentOrder.customerName}</div>
                        </div>
                      </div>

                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-300">
                            <th className="text-left py-2">Item</th>
                            <th className="text-left py-2">Description</th>
                            <th className="text-right py-2">Qty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {packingBoxes[0]?.lineItemIds.slice(0, 3).map((itemId) => {
                            const item = fulfillmentOrder.lineItems.find(li => li.id === itemId);
                            return item ? (
                              <tr key={item.id} className="border-b border-gray-100">
                                <td className="py-2">{item.partNumber}</td>
                                <td className="py-2 text-gray-600">{item.productName.slice(0, 30)}...</td>
                                <td className="py-2 text-right">{item.allocatedQty}</td>
                              </tr>
                            ) : null;
                          })}
                          {(packingBoxes[0]?.lineItemIds.length || 0) > 3 && (
                            <tr>
                              <td colSpan={3} className="py-2 text-center text-gray-400">
                                ... and {(packingBoxes[0]?.lineItemIds.length || 0) - 3} more items
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>

                      <div className="mt-6 pt-4 border-t border-gray-200 text-center text-gray-400 text-xs">
                        Pallet 1 of {packingBoxes.length}
                      </div>
                    </div>
                  )}

                  {/* Detailed Template Preview */}
                  {selectedPackingTemplate === 'detailed' && (
                    <div className="max-w-lg mx-auto border border-gray-200 p-6 text-sm">
                      <div className="flex justify-between items-start mb-4 pb-4 border-b-2 border-gray-800">
                        <div>
                          <div className="text-2xl font-bold tracking-tight">PACKING SLIP</div>
                          <div className="text-gray-500 mt-1 font-mono">{fulfillmentOrder.fulfillmentOrderNumber}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Date</div>
                          <div className="font-medium">{new Date().toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500 mt-2">Need By</div>
                          <div className="font-medium text-orange-600">{fulfillmentOrder.needByDate ? new Date(fulfillmentOrder.needByDate).toLocaleDateString() : 'N/A'}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="font-semibold text-gray-700 mb-2 text-xs uppercase tracking-wide">Ship To</div>
                          <div className="font-medium">{fulfillmentOrder.shipTo.name}</div>
                          <div className="text-gray-600">{fulfillmentOrder.shipTo.addressLine1}</div>
                          {fulfillmentOrder.shipTo.addressLine2 && <div className="text-gray-600">{fulfillmentOrder.shipTo.addressLine2}</div>}
                          <div className="text-gray-600">{fulfillmentOrder.shipTo.city}, {fulfillmentOrder.shipTo.state} {fulfillmentOrder.shipTo.postalCode}</div>
                          <div className="text-gray-500 mt-1 text-xs">Phone: {fulfillmentOrder.shipTo.contactPhone || 'N/A'}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="font-semibold text-gray-700 mb-2 text-xs uppercase tracking-wide">Order Details</div>
                          <div className="grid grid-cols-2 gap-1 text-xs">
                            <span className="text-gray-500">PO Number:</span>
                            <span className="font-medium">{fulfillmentOrder.orderNumber}</span>
                            <span className="text-gray-500">Customer:</span>
                            <span className="font-medium">{fulfillmentOrder.customerName}</span>
                            <span className="text-gray-500">Warehouse:</span>
                            <span className="font-medium">{mockWarehouses.find(w => w.id === fulfillmentOrder.warehouseId)?.name || 'N/A'}</span>
                            <span className="text-gray-500">Method:</span>
                            <span className="font-medium">{fulfillmentOrder.fulfillmentMethod}</span>
                          </div>
                        </div>
                      </div>

                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b-2 border-gray-300 bg-gray-50">
                            <th className="text-left py-2 px-2">Item #</th>
                            <th className="text-left py-2 px-2">Description</th>
                            <th className="text-left py-2 px-2">Location</th>
                            <th className="text-center py-2 px-2">UOM</th>
                            <th className="text-right py-2 px-2">Qty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {packingBoxes[0]?.lineItemIds.slice(0, 3).map((itemId) => {
                            const item = fulfillmentOrder.lineItems.find(li => li.id === itemId);
                            return item ? (
                              <tr key={item.id} className="border-b border-gray-100">
                                <td className="py-2 px-2 font-mono">{item.partNumber}</td>
                                <td className="py-2 px-2">
                                  <div className="font-medium">{item.productName}</div>
                                  <div className="text-gray-400 text-[10px]">SKU: {item.partNumber}</div>
                                </td>
                                <td className="py-2 px-2 text-gray-500">A-12-3</td>
                                <td className="py-2 px-2 text-center">{item.uom}</td>
                                <td className="py-2 px-2 text-right font-bold">{item.allocatedQty}</td>
                              </tr>
                            ) : null;
                          })}
                        </tbody>
                      </table>

                      <div className="mt-4 grid grid-cols-3 gap-4 text-xs">
                        <div className="border border-gray-200 p-2 rounded">
                          <div className="text-gray-500">Total Items</div>
                          <div className="font-bold text-lg">{packingBoxes[0]?.lineItemIds.length || 0}</div>
                        </div>
                        <div className="border border-gray-200 p-2 rounded">
                          <div className="text-gray-500">Pallet Weight</div>
                          <div className="font-bold text-lg">{getBoxWeight(packingBoxes[0])} lbs</div>
                        </div>
                        <div className="border border-gray-200 p-2 rounded">
                          <div className="text-gray-500">Dimensions</div>
                          <div className="font-bold text-lg">{getBoxDimensions(packingBoxes[0]).length}x{getBoxDimensions(packingBoxes[0]).width}x{getBoxDimensions(packingBoxes[0]).height}</div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-gray-400 text-xs">
                        <span>Pallet 1 of {packingBoxes.length}</span>
                        <span>Packed by: ____________</span>
                        <span>Verified: ____________</span>
                      </div>
                    </div>
                  )}

                  {/* Minimal Template Preview */}
                  {selectedPackingTemplate === 'minimal' && (
                    <div className="max-w-sm mx-auto border border-gray-200 p-4 text-sm">
                      <div className="text-center mb-4 pb-3 border-b border-gray-200">
                        <div className="text-lg font-bold">PACKING SLIP</div>
                        <div className="text-xs text-gray-500 font-mono">{fulfillmentOrder.fulfillmentOrderNumber}</div>
                      </div>

                      <div className="text-xs mb-4">
                        <div className="font-medium">{fulfillmentOrder.shipTo.name}</div>
                        <div className="text-gray-500">{fulfillmentOrder.shipTo.city}, {fulfillmentOrder.shipTo.state} {fulfillmentOrder.shipTo.postalCode}</div>
                      </div>

                      <div className="border-t border-b border-gray-200 py-2 mb-3">
                        {packingBoxes[0]?.lineItemIds.slice(0, 4).map((itemId) => {
                          const item = fulfillmentOrder.lineItems.find(li => li.id === itemId);
                          return item ? (
                            <div key={item.id} className="flex justify-between py-1 text-xs">
                              <span className="font-mono">{item.partNumber}</span>
                              <span className="font-bold">x{item.allocatedQty}</span>
                            </div>
                          ) : null;
                        })}
                        {(packingBoxes[0]?.lineItemIds.length || 0) > 4 && (
                          <div className="text-center text-gray-400 text-xs py-1">
                            +{(packingBoxes[0]?.lineItemIds.length || 0) - 4} more
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between text-xs text-gray-500">
                        <span>PO: {fulfillmentOrder.orderNumber}</span>
                        <span>Pallet 1/{packingBoxes.length}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/20 flex justify-between items-center">
              <div className="text-sm text-[var(--muted-foreground)]">
                {packingBoxes.length} packing slip{packingBoxes.length > 1 ? 's' : ''} will be generated
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPackingSlipModal(false)}
                  className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Mock print action
                    alert('Printing packing slips...');
                    setShowPackingSlipModal(false);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 6 2 18 2 18 9"/>
                    <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
                    <rect x="6" y="14" width="12" height="8"/>
                  </svg>
                  Print All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Labels Modal */}
      {showShippingLabelsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M3 9h18"/>
                    <path d="M9 21V9"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Print Shipping Labels</h2>
                  <p className="text-sm text-[var(--muted-foreground)]">{packingBoxes.length} label{packingBoxes.length > 1 ? 's' : ''} to print</p>
                </div>
              </div>
              <button
                onClick={() => setShowShippingLabelsModal(false)}
                className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-6">
              {/* Label Format Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Label Size</label>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { id: '4x6', name: '4" x 6"', desc: 'Standard shipping' },
                    { id: '4x4', name: '4" x 4"', desc: 'Compact' },
                    { id: '2x1', name: '2" x 1"', desc: 'Small packages' },
                    { id: 'letter', name: 'Letter', desc: '8.5" x 11"' },
                  ].map((format) => (
                    <button
                      key={format.id}
                      onClick={() => setSelectedLabelFormat(format.id)}
                      className={`p-3 border-2 rounded-lg text-center transition-colors ${
                        selectedLabelFormat === format.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-[var(--border)] hover:border-green-300'
                      }`}
                    >
                      <div className="font-medium">{format.name}</div>
                      <div className="text-xs text-[var(--muted-foreground)] mt-1">{format.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Carrier Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Carrier</label>
                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  >
                    <option value="">Select carrier...</option>
                    <option value="ups">UPS</option>
                    <option value="fedex">FedEx</option>
                    <option value="usps">USPS</option>
                    <option value="dhl">DHL</option>
                    <option value="other">Other</option>
                  </select>
                  <input
                    type="text"
                    value={trackingNumbers}
                    onChange={(e) => setTrackingNumbers(e.target.value)}
                    placeholder="Tracking number(s)"
                    className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  />
                </div>
              </div>

              {/* Labels Preview Grid */}
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="px-4 py-2 bg-[var(--muted)]/30 border-b border-[var(--border)] text-sm font-medium flex justify-between">
                  <span>Label Preview</span>
                  <span className="text-[var(--muted-foreground)]">{packingBoxes.length} label{packingBoxes.length > 1 ? 's' : ''}</span>
                </div>
                <div className="p-6 bg-gray-100 grid grid-cols-2 gap-4">
                  {packingBoxes.map((box, idx) => {
                    const boxItems = fulfillmentOrder.lineItems.filter(li => box.lineItemIds.includes(li.id));
                    const dims = getBoxDimensions(box);
                    const weight = getBoxWeight(box);

                    return (
                      <div key={box.id} className="bg-white border-2 border-gray-300 rounded p-4 text-xs">
                        {/* Mock Shipping Label */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="font-bold text-lg">{carrier.toUpperCase() || 'CARRIER'}</div>
                          <div className="text-right text-gray-500">
                            Pallet {idx + 1} of {packingBoxes.length}
                          </div>
                        </div>

                        <div className="border-t border-b border-gray-200 py-3 my-3">
                          <div className="text-gray-500 text-[10px] uppercase mb-1">Ship To:</div>
                          <div className="font-bold">{fulfillmentOrder.shipTo.name}</div>
                          <div>{fulfillmentOrder.shipTo.addressLine1}</div>
                          <div>{fulfillmentOrder.shipTo.city}, {fulfillmentOrder.shipTo.state} {fulfillmentOrder.shipTo.postalCode}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div>
                            <span className="text-gray-500">Weight:</span> {weight} lbs
                          </div>
                          <div>
                            <span className="text-gray-500">Dims:</span> {dims.length}x{dims.width}x{dims.height}
                          </div>
                          <div>
                            <span className="text-gray-500">Items:</span> {boxItems.length}
                          </div>
                          <div>
                            <span className="text-gray-500">Ref:</span> {fulfillmentOrder.orderNumber}
                          </div>
                        </div>

                        {/* Barcode placeholder */}
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="bg-gray-800 h-12 flex items-center justify-center">
                            <div className="flex gap-0.5">
                              {Array.from({ length: 30 }).map((_, i) => (
                                <div key={i} className="bg-white" style={{ width: Math.random() > 0.5 ? 2 : 1, height: 32 }} />
                              ))}
                            </div>
                          </div>
                          <div className="text-center mt-1 font-mono text-[10px] tracking-wider">
                            {trackingNumbers || '1Z999AA10123456784'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/20 flex justify-between items-center">
              <div className="text-sm text-[var(--muted-foreground)]">
                {packingBoxes.length} shipping label{packingBoxes.length > 1 ? 's' : ''} will be printed
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowShippingLabelsModal(false)}
                  className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Mock print action
                    alert('Printing shipping labels...');
                    setShowShippingLabelsModal(false);
                  }}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 6 2 18 2 18 9"/>
                    <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
                    <rect x="6" y="14" width="12" height="8"/>
                  </svg>
                  Print All Labels
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bill of Lading Modal */}
      {showBOLModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <path d="M14 2v6h6"/>
                    <path d="M16 13H8"/>
                    <path d="M16 17H8"/>
                    <path d="M10 9H8"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">Bill of Lading</h2>
                  <p className="text-sm text-[var(--muted-foreground)]">Preview and print BOL document</p>
                </div>
              </div>
              <button
                onClick={() => setShowBOLModal(false)}
                className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* BOL Preview */}
              <div className="bg-white border-2 border-gray-300 rounded-lg p-6 text-sm text-black max-w-2xl mx-auto">
                {/* BOL Header */}
                <div className="border-b-2 border-black pb-4 mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight">BILL OF LADING</h1>
                      <p className="text-gray-600 text-xs mt-1">STRAIGHT - NON-NEGOTIABLE</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">BOL #</div>
                      <div className="font-mono font-bold">{bolNumber || fulfillmentOrder.fulfillmentOrderNumber}</div>
                      <div className="text-xs text-gray-500 mt-2">Date</div>
                      <div className="font-medium">{new Date().toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>

                {/* Ship From / Ship To */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="border border-gray-300 rounded p-3">
                    <div className="text-xs font-bold text-gray-500 uppercase mb-2">Ship From</div>
                    <div className="font-semibold">{fulfillmentOrder.warehouseName || 'Main Warehouse'}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      123 Warehouse Dr<br/>
                      Houston, TX 77001
                    </div>
                  </div>
                  <div className="border border-gray-300 rounded p-3">
                    <div className="text-xs font-bold text-gray-500 uppercase mb-2">Ship To</div>
                    <div className="font-semibold">{fulfillmentOrder.shipTo.name}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {fulfillmentOrder.shipTo.addressLine1}<br/>
                      {fulfillmentOrder.shipTo.city}, {fulfillmentOrder.shipTo.state} {fulfillmentOrder.shipTo.postalCode}
                    </div>
                  </div>
                </div>

                {/* Carrier Info */}
                <div className="grid grid-cols-3 gap-4 mb-6 text-xs">
                  <div className="border border-gray-300 rounded p-2">
                    <div className="font-bold text-gray-500 uppercase">Carrier</div>
                    <div className="font-medium mt-1">{carrier || selectedCarrier || '—'}</div>
                  </div>
                  <div className="border border-gray-300 rounded p-2">
                    <div className="font-bold text-gray-500 uppercase">PRO #</div>
                    <div className="font-medium font-mono mt-1">{proNumber || '—'}</div>
                  </div>
                  <div className="border border-gray-300 rounded p-2">
                    <div className="font-bold text-gray-500 uppercase">PO #</div>
                    <div className="font-medium font-mono mt-1">{fulfillmentOrder.orderNumber}</div>
                  </div>
                </div>

                {/* Line Items Table */}
                <table className="w-full border-collapse border border-gray-300 text-xs mb-6">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-2 py-1 text-left font-bold">QTY</th>
                      <th className="border border-gray-300 px-2 py-1 text-left font-bold">DESCRIPTION</th>
                      <th className="border border-gray-300 px-2 py-1 text-left font-bold">WEIGHT</th>
                      <th className="border border-gray-300 px-2 py-1 text-left font-bold">CLASS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1">{packingBoxes.length}</td>
                      <td className="border border-gray-300 px-2 py-1">
                        Pallets containing: {fulfillmentOrder.lineItems.map(li => `${li.partNumber} (${li.allocatedQty})`).join(', ')}
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        {packingBoxes.reduce((sum, box) => sum + parseFloat(box.customWeight || '0'), 0).toFixed(1)} lbs
                      </td>
                      <td className="border border-gray-300 px-2 py-1">{freightClass || '70'}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Totals */}
                <div className="grid grid-cols-4 gap-4 mb-6 text-xs">
                  <div className="border border-gray-300 rounded p-2 text-center">
                    <div className="font-bold text-gray-500 uppercase">Pallets</div>
                    <div className="text-lg font-bold mt-1">{packingBoxes.length}</div>
                  </div>
                  <div className="border border-gray-300 rounded p-2 text-center">
                    <div className="font-bold text-gray-500 uppercase">Pieces</div>
                    <div className="text-lg font-bold mt-1">{fulfillmentOrder.lineItems.reduce((sum, li) => sum + li.allocatedQty, 0)}</div>
                  </div>
                  <div className="border border-gray-300 rounded p-2 text-center">
                    <div className="font-bold text-gray-500 uppercase">Total Weight</div>
                    <div className="text-lg font-bold mt-1">{packingBoxes.reduce((sum, box) => sum + parseFloat(box.customWeight || '0'), 0).toFixed(1)} lbs</div>
                  </div>
                  <div className="border border-gray-300 rounded p-2 text-center">
                    <div className="font-bold text-gray-500 uppercase">Freight Class</div>
                    <div className="text-lg font-bold mt-1">{freightClass || '70'}</div>
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-300">
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase mb-2">Shipper Signature</div>
                    <div className="border-b border-gray-400 h-8"></div>
                    <div className="text-xs text-gray-500 mt-1">Date: _______________</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase mb-2">Driver Signature</div>
                    <div className="border-b border-gray-400 h-8"></div>
                    <div className="text-xs text-gray-500 mt-1">Date: _______________</div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-gray-200 text-center text-[10px] text-gray-400">
                  This is to certify that the above named materials are properly classified, described, packaged, marked and labeled, and are in proper condition for transportation.
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/20 flex justify-between items-center">
              <div className="text-sm text-[var(--muted-foreground)]">
                Bill of Lading for {fulfillmentOrder.fulfillmentOrderNumber}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBOLModal(false)}
                  className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    window.print();
                    setShowBOLModal(false);
                  }}
                  className="px-6 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 6 2 18 2 18 9"/>
                    <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
                    <rect x="6" y="14" width="12" height="8"/>
                  </svg>
                  Print BOL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Shipping Interface Component - shown when status is SHIPPING
  const shippingInterface = (
    <div className="bg-[var(--card)] rounded-lg border-2 border-purple-400 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border)] bg-purple-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <rect x="1" y="3" width="15" height="13"/>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Shipping Mode</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Finalize outbound logistics • {packingBoxes.length} pallet{packingBoxes.length > 1 ? 's' : ''} to ship
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Lock & Collapse Buttons */}
          <button
            onClick={() => setIsShippingConfigLocked(!isShippingConfigLocked)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
              isShippingConfigLocked
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted)]/80'
            }`}
          >
            {isShippingConfigLocked ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Unlock
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
                </svg>
                Lock
              </>
            )}
          </button>
          {!isShippingConfigCollapsed && (
            <button
              onClick={() => setIsShippingConfigCollapsed(true)}
              className="px-3 py-1.5 bg-[var(--muted)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--muted)]/80 transition-colors flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 15l-6-6-6 6"/>
              </svg>
              Collapse
            </button>
          )}
          {isShippingConfigCollapsed && (
            <button
              onClick={() => setIsShippingConfigCollapsed(false)}
              className="px-3 py-1.5 bg-[var(--muted)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-[var(--muted)]/80 transition-colors flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6"/>
              </svg>
              Expand
            </button>
          )}
          {selectedCarrier && trackingNumbers && (
            <button
              onClick={handleCompleteShipping}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-green-700 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Confirm Shipment
            </button>
          )}
        </div>
      </div>

      {/* Shipping Configuration Panel - Collapsible */}
      <div className="border-b border-[var(--border)]">
        {/* Collapsed Summary View */}
        {isShippingConfigCollapsed ? (
          <div className="px-4 py-3 bg-[var(--muted)]/20">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                  {shippingMethod === 'SHIP' ? (
                    <>
                      <rect x="1" y="3" width="15" height="13"/>
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                      <circle cx="5.5" cy="18.5" r="2.5"/>
                      <circle cx="18.5" cy="18.5" r="2.5"/>
                    </>
                  ) : (
                    <>
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </>
                  )}
                </svg>
                <span className="font-medium text-sm">{shippingMethod === 'SHIP' ? 'Ship' : 'Will Call'}</span>
              </div>
              {shippingMethod === 'SHIP' && (
                <>
                  <span className="text-[var(--muted-foreground)]">•</span>
                  <span className="text-sm text-[var(--muted-foreground)]">
                    {carrierType === 'parcel' ? 'Parcel' : 'Freight/LTL'}
                  </span>
                  {selectedCarrier && (
                    <>
                      <span className="text-[var(--muted-foreground)]">•</span>
                      <span className="text-sm text-[var(--muted-foreground)] capitalize">{selectedCarrier.replace('_', ' ')}</span>
                    </>
                  )}
                </>
              )}
              {isShippingConfigLocked && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Locked
                </span>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Delivery Method Selection */}
            <div className={`px-4 py-4 bg-[var(--muted)]/10 ${isShippingConfigLocked ? 'opacity-60 pointer-events-none' : ''}`}>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-3">Delivery Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShippingMethod('SHIP')}
                  disabled={isShippingConfigLocked}
                  className={`p-4 border-2 rounded-xl text-left transition-all ${
                    shippingMethod === 'SHIP'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-[var(--border)] hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      shippingMethod === 'SHIP' ? 'bg-purple-500 text-white' : 'bg-[var(--muted)]'
                    }`}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="1" y="3" width="15" height="13"/>
                        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                        <circle cx="5.5" cy="18.5" r="2.5"/>
                        <circle cx="18.5" cy="18.5" r="2.5"/>
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold">Ship</div>
                      <div className="text-xs text-[var(--muted-foreground)]">Carrier delivery</div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setShippingMethod('WILL_CALL')}
                  disabled={isShippingConfigLocked}
                  className={`p-4 border-2 rounded-xl text-left transition-all ${
                    shippingMethod === 'WILL_CALL'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-[var(--border)] hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      shippingMethod === 'WILL_CALL' ? 'bg-purple-500 text-white' : 'bg-[var(--muted)]'
                    }`}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold">Will Call</div>
                      <div className="text-xs text-[var(--muted-foreground)]">Customer pickup</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Carrier Type Selection - only show if Ship method */}
            {shippingMethod === 'SHIP' && (
              <div className={`px-4 py-4 border-t border-[var(--border)] ${isShippingConfigLocked ? 'opacity-60 pointer-events-none' : ''}`}>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-3">Carrier Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setCarrierType('parcel')}
                    disabled={isShippingConfigLocked}
                    className={`p-4 border-2 rounded-xl text-left transition-all ${
                      carrierType === 'parcel'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-[var(--border)] hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        carrierType === 'parcel' ? 'bg-purple-500 text-white' : 'bg-[var(--muted)]'
                      }`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                          <line x1="12" y1="22.08" x2="12" y2="12"/>
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold">Parcel</div>
                        <div className="text-xs text-[var(--muted-foreground)]">UPS, FedEx, USPS, DHL</div>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setCarrierType('freight')}
                    disabled={isShippingConfigLocked}
                    className={`p-4 border-2 rounded-xl text-left transition-all ${
                      carrierType === 'freight'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-[var(--border)] hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        carrierType === 'freight' ? 'bg-purple-500 text-white' : 'bg-[var(--muted)]'
                      }`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="1" y="6" width="22" height="12" rx="2"/>
                          <path d="M6 6V4a2 2 0 012-2h8a2 2 0 012 2v2"/>
                          <line x1="12" y1="10" x2="12" y2="14"/>
                          <line x1="8" y1="10" x2="8" y2="14"/>
                          <line x1="16" y1="10" x2="16" y2="14"/>
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold">Freight / LTL</div>
                        <div className="text-xs text-[var(--muted-foreground)]">Pallets, heavy shipments</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Carrier Selection & Tracking */}
            {shippingMethod === 'SHIP' && (
              <div className={`px-4 py-4 border-t border-[var(--border)] ${isShippingConfigLocked ? 'opacity-60 pointer-events-none' : ''}`}>
                <div className="grid grid-cols-2 gap-4">
                  {/* Carrier Selection */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                      {carrierType === 'parcel' ? 'Parcel Carrier' : 'Freight Carrier'}
                    </label>
                    <select
                      value={selectedCarrier}
                      onChange={(e) => setSelectedCarrier(e.target.value)}
                      disabled={isShippingConfigLocked}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50"
                    >
                      <option value="">Select carrier...</option>
                      {carrierType === 'parcel' ? (
                        <>
                          <option value="ups">UPS</option>
                          <option value="fedex">FedEx</option>
                          <option value="usps">USPS</option>
                          <option value="dhl">DHL</option>
                          <option value="other_parcel">Other</option>
                        </>
                      ) : (
                        <>
                          <option value="estes">Estes Express</option>
                          <option value="xpo">XPO Logistics</option>
                          <option value="saia">SAIA</option>
                          <option value="old_dominion">Old Dominion</option>
                          <option value="yrc">YRC Freight</option>
                          <option value="abf">ABF Freight</option>
                          <option value="r+l">R+L Carriers</option>
                          <option value="other_freight">Other</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Tracking Number */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                      {carrierType === 'parcel' ? 'Tracking Number(s)' : 'PRO Number'}
                    </label>
                    <input
                      type="text"
                      value={carrierType === 'parcel' ? trackingNumbers : proNumber}
                      onChange={(e) => carrierType === 'parcel' ? setTrackingNumbers(e.target.value) : setProNumber(e.target.value)}
                      placeholder={carrierType === 'parcel' ? 'Enter tracking number(s)' : 'Enter PRO number'}
                      disabled={isShippingConfigLocked}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Freight-specific fields */}
                {carrierType === 'freight' && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">BOL Number</label>
                      <input
                        type="text"
                        value={bolNumber}
                        onChange={(e) => setBolNumber(e.target.value)}
                        placeholder="Bill of Lading number"
                        disabled={isShippingConfigLocked}
                        className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Freight Class</label>
                      <select
                        value={freightClass}
                        onChange={(e) => setFreightClass(e.target.value)}
                        disabled={isShippingConfigLocked}
                        className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50"
                      >
                        <option value="">Select class...</option>
                        <option value="50">Class 50</option>
                        <option value="55">Class 55</option>
                        <option value="60">Class 60</option>
                        <option value="65">Class 65</option>
                        <option value="70">Class 70</option>
                        <option value="77.5">Class 77.5</option>
                        <option value="85">Class 85</option>
                        <option value="92.5">Class 92.5</option>
                        <option value="100">Class 100</option>
                        <option value="110">Class 110</option>
                        <option value="125">Class 125</option>
                        <option value="150">Class 150</option>
                        <option value="175">Class 175</option>
                        <option value="200">Class 200</option>
                        <option value="250">Class 250</option>
                        <option value="300">Class 300</option>
                        <option value="400">Class 400</option>
                        <option value="500">Class 500</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

          </>
        )}
      </div>

      {/* Will Call specific info */}
      {shippingMethod === 'WILL_CALL' && (
        <div className="px-4 py-4 border-b border-[var(--border)] bg-blue-50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <div className="font-semibold text-blue-900">Will Call Pickup</div>
              <div className="text-sm text-blue-700 mt-1">
                Customer will pick up from: <strong>{mockWarehouses.find(w => w.id === fulfillmentOrder.warehouseId)?.name || 'Warehouse'}</strong>
              </div>
              <div className="text-xs text-blue-600 mt-2">
                Make sure all items are staged and ready for pickup. Customer should bring valid ID.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shipment Summary */}
      <div className="px-4 py-4 border-b border-[var(--border)]">
        <label className="block text-sm font-medium text-[var(--foreground)] mb-3">Shipment Summary</label>
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-[var(--muted)]/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-[var(--foreground)]">{packingBoxes.length}</div>
            <div className="text-xs text-[var(--muted-foreground)]">Pallets</div>
          </div>
          <div className="bg-[var(--muted)]/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-[var(--foreground)]">
              {packingBoxes.reduce((sum, box) => sum + parseFloat(getBoxWeight(box) || '0'), 0).toFixed(1)}
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">Total lbs</div>
          </div>
          <div className="bg-[var(--muted)]/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-[var(--foreground)]">
              {fulfillmentOrder.lineItems.reduce((sum, li) => sum + li.allocatedQty, 0)}
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">Items</div>
          </div>
          <div className="bg-[var(--muted)]/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-[var(--foreground)]">
              {fulfillmentOrder.lineItems.length}
            </div>
            <div className="text-xs text-[var(--muted-foreground)]">Line Items</div>
          </div>
        </div>
      </div>

      {/* Action Buttons - Conditional based on shipping method and carrier type */}
      <div className="px-4 py-4 bg-[var(--muted)]/10">
        <div className={`grid gap-4 ${
          shippingMethod === 'WILL_CALL'
            ? 'grid-cols-2'
            : (shippingMethod === 'SHIP' && carrierType === 'parcel' ? 'grid-cols-2' : 'grid-cols-3')
        }`}>
          {/* Print Packing Slips - Always shown */}
          <button
            onClick={() => setShowPackingSlipModal(true)}
            className="px-6 py-4 bg-[var(--card)] border-2 border-[var(--border)] rounded-xl font-medium hover:border-purple-400 hover:shadow-md transition-all flex items-center justify-center gap-3"
          >
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
            </div>
            <div className="text-left">
              <div className="text-base font-semibold">Print Packing Slips</div>
              <div className="text-sm text-[var(--muted-foreground)]">{packingBoxes.length} slip{packingBoxes.length > 1 ? 's' : ''} ready</div>
            </div>
          </button>

          {/* SHIP + Parcel: Print Parcel Labels */}
          {shippingMethod === 'SHIP' && carrierType === 'parcel' && (
            <button
              onClick={() => setShowShippingLabelsModal(true)}
              className="px-6 py-4 bg-[var(--card)] border-2 border-[var(--border)] rounded-xl font-medium hover:border-purple-400 hover:shadow-md transition-all flex items-center justify-center gap-3"
            >
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M3 9h18"/>
                  <path d="M9 21V9"/>
                </svg>
              </div>
              <div className="text-left">
                <div className="text-base font-semibold">Print Parcel Labels</div>
                <div className="text-sm text-[var(--muted-foreground)]">{packingBoxes.length} label{packingBoxes.length > 1 ? 's' : ''} to print</div>
              </div>
            </button>
          )}

          {/* SHIP + Freight/LTL: Print Pallet Labels */}
          {shippingMethod === 'SHIP' && carrierType === 'freight' && (
            <button
              onClick={() => setShowShippingLabelsModal(true)}
              className="px-6 py-4 bg-[var(--card)] border-2 border-[var(--border)] rounded-xl font-medium hover:border-purple-400 hover:shadow-md transition-all flex items-center justify-center gap-3"
            >
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M3 9h18"/>
                  <path d="M9 21V9"/>
                </svg>
              </div>
              <div className="text-left">
                <div className="text-base font-semibold">Print Pallet Labels</div>
                <div className="text-sm text-[var(--muted-foreground)]">{packingBoxes.length} label{packingBoxes.length > 1 ? 's' : ''} to print</div>
              </div>
            </button>
          )}

          {/* SHIP + Freight/LTL: Print Bill of Lading */}
          {shippingMethod === 'SHIP' && carrierType === 'freight' && (
            <button
              onClick={() => setShowBOLModal(true)}
              className="px-6 py-4 bg-[var(--card)] border-2 border-[var(--border)] rounded-xl font-medium hover:border-purple-400 hover:shadow-md transition-all flex items-center justify-center gap-3"
            >
              <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <path d="M14 2v6h6"/>
                  <path d="M16 13H8"/>
                  <path d="M16 17H8"/>
                  <path d="M10 9H8"/>
                </svg>
              </div>
              <div className="text-left">
                <div className="text-base font-semibold">Print Bill of Lading</div>
                <div className="text-sm text-[var(--muted-foreground)]">BOL document</div>
              </div>
            </button>
          )}

          {/* WILL_CALL: Print Pallet Labels */}
          {shippingMethod === 'WILL_CALL' && (
            <button
              onClick={() => setShowShippingLabelsModal(true)}
              className="px-6 py-4 bg-[var(--card)] border-2 border-[var(--border)] rounded-xl font-medium hover:border-purple-400 hover:shadow-md transition-all flex items-center justify-center gap-3"
            >
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M3 9h18"/>
                  <path d="M9 21V9"/>
                </svg>
              </div>
              <div className="text-left">
                <div className="text-base font-semibold">Print Pallet Labels</div>
                <div className="text-sm text-[var(--muted-foreground)]">{packingBoxes.length} label{packingBoxes.length > 1 ? 's' : ''} to print</div>
              </div>
            </button>
          )}
        </div>

        {/* Pickup / Handoff Section - Only for Ship (Freight) or Will Call */}
        {((shippingMethod === 'SHIP' && carrierType === 'freight') || shippingMethod === 'WILL_CALL') && (
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                </svg>
                <h4 className="text-sm font-semibold text-[var(--foreground)]">Pickup / Handoff</h4>
              </div>
              {pickupSignature && (
                <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                  Signed
                </span>
              )}
            </div>

            {pickupSignature ? (
              // Show captured signature info
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="text-xs text-green-700 font-medium">Name</label>
                    <p className="text-sm font-semibold text-green-900">{pickupName}</p>
                  </div>
                  <div>
                    <label className="text-xs text-green-700 font-medium">Timestamp</label>
                    <p className="text-sm font-semibold text-green-900">
                      {pickupTimestamp?.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="text-xs text-green-700 font-medium">Signature</label>
                  <div className="mt-1 bg-white border border-green-300 rounded p-2">
                    <img src={pickupSignature} alt="Signature" className="h-16 object-contain" />
                  </div>
                </div>
                {pickupNotes && (
                  <div>
                    <label className="text-xs text-green-700 font-medium">Notes</label>
                    <p className="text-sm text-green-800">{pickupNotes}</p>
                  </div>
                )}
                <button
                  onClick={() => {
                    setPickupSignature(null);
                    setPickupTimestamp(null);
                    setPickupName('');
                    setDriverName('');
                    setPickupNotes('');
                  }}
                  className="mt-3 text-xs text-green-700 hover:text-green-900 underline"
                >
                  Clear and re-capture
                </button>
              </div>
            ) : (
              // Show button to capture signature
              <button
                onClick={() => setShowSignatureModal(true)}
                className="w-full px-4 py-6 bg-purple-50 border-2 border-dashed border-purple-300 rounded-lg text-purple-700 font-medium hover:bg-purple-100 hover:border-purple-400 transition-colors flex items-center justify-center gap-2"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                </svg>
                Signature & Release
              </button>
            )}

            {/* Print Proof of Pickup - shown after signature is captured */}
            {pickupSignature && (
              <button
                onClick={() => setShowBOLModal(true)}
                className="w-full mt-3 px-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/50 transition-colors flex items-center justify-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <path d="M9 15l2 2 4-4"/>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-[var(--foreground)]">Print Proof of Pickup</div>
                  <div className="text-sm text-[var(--muted-foreground)]">Signed BOL document</div>
                </div>
              </button>
            )}
          </div>
        )}

        {/* Shipping Notes */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Shipping Notes</label>
          <textarea
            value={shippingNotes}
            onChange={(e) => setShippingNotes(e.target.value)}
            placeholder="Add any special shipping instructions or notes..."
            rows={2}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
          />
        </div>
      </div>

      {/* Signature Capture Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-[var(--card)] z-50 flex flex-col">
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-purple-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--foreground)]">Signature & Release</h2>
                <p className="text-sm text-[var(--muted-foreground)]">Capture handoff signature for proof of pickup</p>
              </div>
            </div>
            <button
              onClick={() => setShowSignatureModal(false)}
              className="p-3 hover:bg-purple-100 rounded-xl transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Modal Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Name Fields Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Name Field */}
                <div>
                  <label className="block text-base font-semibold text-[var(--foreground)] mb-2">
                    Customer Name <span className="text-[var(--muted-foreground)] font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={pickupName}
                    onChange={(e) => setPickupName(e.target.value)}
                    placeholder="Customer or company name"
                    className="w-full px-4 py-3 border-2 border-[var(--border)] rounded-xl bg-[var(--background)] text-base focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                  />
                </div>

                {/* Driver Name Field */}
                <div>
                  <label className="block text-base font-semibold text-[var(--foreground)] mb-2">
                    Driver / Pickup Name <span className="text-[var(--muted-foreground)] font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Name of person picking up"
                    className="w-full px-4 py-3 border-2 border-[var(--border)] rounded-xl bg-[var(--background)] text-base focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Signature Canvas - Large */}
              <div>
                <label className="block text-base font-semibold text-[var(--foreground)] mb-2">
                  Signature <span className="text-red-500">*</span>
                </label>
                <div className="relative border-2 border-dashed border-purple-300 rounded-xl bg-white overflow-hidden">
                  <canvas
                    ref={signatureCanvasRef}
                    width={800}
                    height={300}
                    className="w-full touch-none cursor-crosshair"
                    style={{ minHeight: '250px' }}
                    onMouseDown={(e) => {
                      setIsDrawing(true);
                      const canvas = signatureCanvasRef.current;
                      if (canvas) {
                        const ctx = canvas.getContext('2d');
                        const rect = canvas.getBoundingClientRect();
                        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
                        const y = (e.clientY - rect.top) * (canvas.height / rect.height);
                        ctx?.beginPath();
                        ctx?.moveTo(x, y);
                      }
                    }}
                    onMouseMove={(e) => {
                      if (!isDrawing) return;
                      const canvas = signatureCanvasRef.current;
                      if (canvas) {
                        const ctx = canvas.getContext('2d');
                        const rect = canvas.getBoundingClientRect();
                        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
                        const y = (e.clientY - rect.top) * (canvas.height / rect.height);
                        if (ctx) {
                          ctx.lineWidth = 3;
                          ctx.lineCap = 'round';
                          ctx.strokeStyle = '#1a1a1a';
                          ctx.lineTo(x, y);
                          ctx.stroke();
                        }
                      }
                    }}
                    onMouseUp={() => setIsDrawing(false)}
                    onMouseLeave={() => setIsDrawing(false)}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      setIsDrawing(true);
                      const canvas = signatureCanvasRef.current;
                      if (canvas) {
                        const ctx = canvas.getContext('2d');
                        const rect = canvas.getBoundingClientRect();
                        const touch = e.touches[0];
                        const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
                        const y = (touch.clientY - rect.top) * (canvas.height / rect.height);
                        ctx?.beginPath();
                        ctx?.moveTo(x, y);
                      }
                    }}
                    onTouchMove={(e) => {
                      e.preventDefault();
                      if (!isDrawing) return;
                      const canvas = signatureCanvasRef.current;
                      if (canvas) {
                        const ctx = canvas.getContext('2d');
                        const rect = canvas.getBoundingClientRect();
                        const touch = e.touches[0];
                        const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
                        const y = (touch.clientY - rect.top) * (canvas.height / rect.height);
                        if (ctx) {
                          ctx.lineWidth = 3;
                          ctx.lineCap = 'round';
                          ctx.strokeStyle = '#1a1a1a';
                          ctx.lineTo(x, y);
                          ctx.stroke();
                        }
                      }
                    }}
                    onTouchEnd={() => setIsDrawing(false)}
                  />
                  <div className="absolute bottom-3 left-4 text-sm text-gray-400">
                    Sign above using finger or stylus
                  </div>
                  <button
                    onClick={() => {
                      const canvas = signatureCanvasRef.current;
                      if (canvas) {
                        const ctx = canvas.getContext('2d');
                        ctx?.clearRect(0, 0, canvas.width, canvas.height);
                      }
                    }}
                    className="absolute top-3 right-3 px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Clear Signature
                  </button>
                </div>
              </div>

              {/* Timestamp */}
              <div>
                <label className="block text-base font-semibold text-[var(--foreground)] mb-2">Timestamp</label>
                <div className="px-4 py-3 bg-[var(--muted)]/30 border-2 border-[var(--border)] rounded-xl text-base text-[var(--muted-foreground)]">
                  {new Date().toLocaleString()}
                </div>
              </div>

              {/* Notes (Optional) */}
              <div>
                <label className="block text-base font-semibold text-[var(--foreground)] mb-2">
                  Notes <span className="text-[var(--muted-foreground)] font-normal">(Optional)</span>
                </label>
                <textarea
                  value={pickupNotes}
                  onChange={(e) => setPickupNotes(e.target.value)}
                  placeholder="Any additional notes about the pickup or delivery..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-[var(--border)] rounded-xl bg-[var(--background)] text-base focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer - Fixed at bottom */}
          <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/20 flex justify-center gap-4">
            <button
              onClick={() => {
                setShowSignatureModal(false);
                setPickupName('');
                setDriverName('');
                setPickupNotes('');
                const canvas = signatureCanvasRef.current;
                if (canvas) {
                  const ctx = canvas.getContext('2d');
                  ctx?.clearRect(0, 0, canvas.width, canvas.height);
                }
              }}
              className="px-8 py-3 border-2 border-[var(--border)] rounded-xl text-base font-semibold hover:bg-[var(--muted)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                const canvas = signatureCanvasRef.current;
                if (canvas) {
                  const signatureData = canvas.toDataURL('image/png');
                  setPickupSignature(signatureData);
                  setPickupTimestamp(new Date());
                  setShowSignatureModal(false);
                }
              }}
              className="px-8 py-3 rounded-xl text-base font-semibold flex items-center gap-2 bg-purple-600 text-white hover:bg-purple-700 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Confirm & Save
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Shipped Interface Component - shown when status is SHIPPED
  // Get shipped data from fulfillment order or fall back to state
  const shippedData = {
    carrierType: (fulfillmentOrder as any)?.carrierType || carrierType,
    carrier: fulfillmentOrder?.carrier || selectedCarrier,
    trackingNumbers: fulfillmentOrder?.trackingNumbers?.join(', ') || trackingNumbers,
    shipConfirmedAt: fulfillmentOrder?.shipConfirmedAt,
    pickupSignature: (fulfillmentOrder as any)?.pickupSignature || pickupSignature,
    pickupTimestamp: (fulfillmentOrder as any)?.pickupTimestamp ? new Date((fulfillmentOrder as any).pickupTimestamp) : pickupTimestamp,
    pickupCustomerName: (fulfillmentOrder as any)?.pickupCustomerName || pickupName,
    pickupDriverName: (fulfillmentOrder as any)?.pickupDriverName || driverName,
    pickupNotes: (fulfillmentOrder as any)?.pickupNotes || pickupNotes,
    shippingNotes: (fulfillmentOrder as any)?.shippingNotes || shippingNotes,
    bolNumber: (fulfillmentOrder as any)?.bolNumber || bolNumber,
    proNumber: (fulfillmentOrder as any)?.proNumber || proNumber,
  };

  const shippedInterface = (
    <div className="bg-[var(--card)] rounded-lg border-2 border-green-400 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border)] bg-green-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Shipment Complete</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Order fulfilled on {shippedData.shipConfirmedAt ? new Date(shippedData.shipConfirmedAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
          Shipped
        </span>
      </div>

      {/* Shipment Summary */}
      <div className="p-4 space-y-4">
        {/* Delivery Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[var(--muted)]/20 rounded-lg p-3">
            <div className="text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Delivery Method</div>
            <div className="text-sm font-semibold text-[var(--foreground)]">
              {shippingMethod === 'SHIP' ? (shippedData.carrierType === 'parcel' ? 'Ship (Parcel)' : 'Ship (Freight)') : 'Will Call'}
            </div>
          </div>
          <div className="bg-[var(--muted)]/20 rounded-lg p-3">
            <div className="text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Carrier</div>
            <div className="text-sm font-semibold text-[var(--foreground)] capitalize">
              {shippedData.carrier?.replace(/_/g, ' ') || 'N/A'}
            </div>
          </div>
          <div className="bg-[var(--muted)]/20 rounded-lg p-3">
            <div className="text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Pallets</div>
            <div className="text-sm font-semibold text-[var(--foreground)]">
              {packingBoxes.length || 1} pallet{packingBoxes.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="bg-[var(--muted)]/20 rounded-lg p-3">
            <div className="text-xs font-medium text-[var(--muted-foreground)] uppercase mb-1">Ship Date</div>
            <div className="text-sm font-semibold text-[var(--foreground)]">
              {shippedData.shipConfirmedAt ? new Date(shippedData.shipConfirmedAt).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>

        {/* Tracking Information */}
        {shippedData.trackingNumbers && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span className="text-sm font-semibold text-blue-900">Tracking Information</span>
            </div>
            <div className="text-sm text-blue-800 font-mono">{shippedData.trackingNumbers}</div>
          </div>
        )}

        {/* BOL / PRO Numbers for Freight */}
        {(shippedData.bolNumber || shippedData.proNumber) && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <span className="text-sm font-semibold text-amber-900">Freight Documents</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {shippedData.bolNumber && (
                <div>
                  <div className="text-xs font-medium text-amber-700 uppercase">BOL Number</div>
                  <div className="text-sm text-amber-900 font-mono">{shippedData.bolNumber}</div>
                </div>
              )}
              {shippedData.proNumber && (
                <div>
                  <div className="text-xs font-medium text-amber-700 uppercase">PRO Number</div>
                  <div className="text-sm text-amber-900 font-mono">{shippedData.proNumber}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pickup / Handoff Record - Only shown if signature was captured */}
        {shippedData.pickupSignature && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
              </svg>
              <span className="text-sm font-semibold text-purple-900">Pickup / Handoff Record</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                {shippedData.pickupCustomerName && (
                  <div className="mb-2">
                    <div className="text-xs font-medium text-purple-700 uppercase">Customer Name</div>
                    <div className="text-sm text-purple-900">{shippedData.pickupCustomerName}</div>
                  </div>
                )}
                {shippedData.pickupDriverName && (
                  <div className="mb-2">
                    <div className="text-xs font-medium text-purple-700 uppercase">Driver / Pickup Name</div>
                    <div className="text-sm text-purple-900">{shippedData.pickupDriverName}</div>
                  </div>
                )}
                {shippedData.pickupTimestamp && (
                  <div className="mb-2">
                    <div className="text-xs font-medium text-purple-700 uppercase">Pickup Time</div>
                    <div className="text-sm text-purple-900">{shippedData.pickupTimestamp.toLocaleString()}</div>
                  </div>
                )}
                {shippedData.pickupNotes && (
                  <div>
                    <div className="text-xs font-medium text-purple-700 uppercase">Notes</div>
                    <div className="text-sm text-purple-900">{shippedData.pickupNotes}</div>
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs font-medium text-purple-700 uppercase mb-1">Signature</div>
                <div className="bg-white border border-purple-200 rounded-lg p-2 inline-block">
                  <img src={shippedData.pickupSignature || ''} alt="Signature" className="max-h-20" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timeline / Activity Log */}
        <div className="border border-[var(--border)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span className="text-sm font-semibold text-[var(--foreground)]">Fulfillment Timeline</span>
          </div>
          <div className="space-y-3">
            {shippedData.shipConfirmedAt && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"/>
                <div>
                  <div className="text-sm font-medium text-[var(--foreground)]">Shipment Confirmed</div>
                  <div className="text-xs text-[var(--muted-foreground)]">{new Date(shippedData.shipConfirmedAt).toLocaleString()}</div>
                </div>
              </div>
            )}
            {shippedData.pickupTimestamp && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 flex-shrink-0"/>
                <div>
                  <div className="text-sm font-medium text-[var(--foreground)]">Signature Captured</div>
                  <div className="text-xs text-[var(--muted-foreground)]">{shippedData.pickupTimestamp.toLocaleString()}</div>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 flex-shrink-0"/>
              <div>
                <div className="text-sm font-medium text-[var(--foreground)]">Shipping Started</div>
                <div className="text-xs text-[var(--muted-foreground)]">Carrier: {shippedData.carrier?.replace(/_/g, ' ') || 'N/A'}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0"/>
              <div>
                <div className="text-sm font-medium text-[var(--foreground)]">Packing Completed</div>
                <div className="text-xs text-[var(--muted-foreground)]">{packingBoxes.length} pallet{packingBoxes.length !== 1 ? 's' : ''} packed</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"/>
              <div>
                <div className="text-sm font-medium text-[var(--foreground)]">Picking Completed</div>
                <div className="text-xs text-[var(--muted-foreground)]">All items picked</div>
              </div>
            </div>
            {fulfillmentOrder.releasedAt && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-cyan-500 mt-1.5 flex-shrink-0"/>
                <div>
                  <div className="text-sm font-medium text-[var(--foreground)]">Released to Warehouse</div>
                  <div className="text-xs text-[var(--muted-foreground)]">{new Date(fulfillmentOrder.releasedAt).toLocaleString()}</div>
                </div>
              </div>
            )}
            {fulfillmentOrder.createdAt && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-gray-400 mt-1.5 flex-shrink-0"/>
                <div>
                  <div className="text-sm font-medium text-[var(--foreground)]">Order Created</div>
                  <div className="text-xs text-[var(--muted-foreground)]">{new Date(fulfillmentOrder.createdAt).toLocaleString()}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reprint Documents */}
        <div className="border border-[var(--border)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
              <path d="M6 9V2h12v7"/>
              <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            <span className="text-sm font-semibold text-[var(--foreground)]">Reprint Documents</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => setShowPackingSlipModal(true)}
              className="px-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/50 transition-colors flex flex-col items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
              <span className="text-xs font-medium text-[var(--foreground)]">Packing Slip</span>
            </button>
            <button
              onClick={() => setShowShippingLabelsModal(true)}
              className="px-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/50 transition-colors flex flex-col items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M7 7h.01M7 12h.01M7 17h.01M12 7h.01M12 12h.01M12 17h.01M17 7h.01M17 12h.01M17 17h.01"/>
                </svg>
              </div>
              <span className="text-xs font-medium text-[var(--foreground)]">Pallet Labels</span>
            </button>
            {((shippingMethod === 'SHIP' && shippedData.carrierType === 'freight') || shippingMethod === 'WILL_CALL') && (
              <button
                onClick={() => setShowBOLModal(true)}
                className="px-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/50 transition-colors flex flex-col items-center gap-2"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </div>
                <span className="text-xs font-medium text-[var(--foreground)]">Bill of Lading</span>
              </button>
            )}
            {shippedData.pickupSignature && (
              <button
                onClick={() => setShowBOLModal(true)}
                className="px-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/50 transition-colors flex flex-col items-center gap-2"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <path d="M9 15l2 2 4-4"/>
                  </svg>
                </div>
                <span className="text-xs font-medium text-[var(--foreground)]">Proof of Pickup</span>
              </button>
            )}
          </div>
        </div>

        {/* Shipping Notes */}
        {shippedData.shippingNotes && (
          <div className="bg-[var(--muted)]/20 border border-[var(--border)] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <span className="text-sm font-semibold text-[var(--foreground)]">Shipping Notes</span>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">{shippedData.shippingNotes}</p>
          </div>
        )}
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
          <div className="flex items-center gap-3">
            {/* Save Button - Always visible */}
            <button className="px-5 py-2.5 border-2 border-[var(--border)] rounded-lg font-semibold text-sm hover:bg-[var(--muted)] transition-colors">
              Save
            </button>

            {/* Dynamic Continue Button based on status */}
            {fulfillmentOrder.status === 'PENDING' && (
              <button
                onClick={handleReleaseToWarehouse}
                className="px-5 py-2.5 bg-cyan-600 text-white rounded-lg font-semibold text-sm hover:bg-cyan-700 transition-colors flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Continue
              </button>
            )}

            {fulfillmentOrder.status === 'RELEASED' && (
              <button
                onClick={handleStartPicking}
                className="px-5 py-2.5 bg-yellow-600 text-white rounded-lg font-semibold text-sm hover:bg-yellow-700 transition-colors flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Continue
              </button>
            )}

            {fulfillmentOrder.status === 'PICKING' && (
              <button
                onClick={handleCompletePicking}
                className="px-5 py-2.5 bg-amber-600 text-white rounded-lg font-semibold text-sm hover:bg-amber-700 transition-colors flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Continue
              </button>
            )}

            {fulfillmentOrder.status === 'PACKING' && (
              <button
                onClick={handleStartShipping}
                className="px-5 py-2.5 bg-orange-600 text-white rounded-lg font-semibold text-sm hover:bg-orange-700 transition-colors flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Continue
              </button>
            )}

            {fulfillmentOrder.status === 'SHIPPING' && (() => {
              const requiresSignature = (shippingMethod === 'SHIP' && carrierType === 'freight') || shippingMethod === 'WILL_CALL';
              const needsSignature = requiresSignature && !pickupSignature;
              return (
                <button
                  onClick={handleConfirmShipment}
                  className={`px-5 py-2.5 ${needsSignature ? 'bg-purple-600 hover:bg-purple-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg font-semibold text-sm transition-colors flex items-center gap-2`}
                >
                  {needsSignature ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                      </svg>
                      Capture Signature
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Continue
                    </>
                  )}
                </button>
              );
            })()}

            {fulfillmentOrder.status === 'SHIPPED' && (
              <button
                disabled
                className="px-5 py-2.5 bg-gray-400 text-white rounded-lg font-semibold text-sm cursor-not-allowed flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                Completed
              </button>
            )}
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

        {/* Shipping Interface - Show at top when in SHIPPING status */}
        {isShipping && (
          <div className="mb-4">
            {shippingInterface}
          </div>
        )}

        {/* Shipped Interface - Show at top when in SHIPPED status */}
        {isShipped && (
          <div className="mb-4">
            {shippedInterface}
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
