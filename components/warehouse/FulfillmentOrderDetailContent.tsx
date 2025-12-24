'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getFulfillmentOrderById, updateFulfillmentOrder } from '@/lib/data/warehouse-mock';
import { FulfillmentOrderStatus, FulfillmentMethod } from '@/lib/types/warehouse';

// Import new sub-components
import FulfillmentHeader from './fulfillment-detail/FulfillmentHeader';
import StatusProgress from './fulfillment-detail/StatusProgress';
import PickingInterface from './fulfillment-detail/PickingInterface';
import PackingInterface from './fulfillment-detail/PackingInterface';
import ShippingInterface from './fulfillment-detail/ShippingInterface';
import ShippedInterface from './fulfillment-detail/ShippedInterface';
import FulfillmentDetailsForm from './fulfillment-detail/FulfillmentDetailsForm';
import AuditTimestamps from './fulfillment-detail/AuditTimestamps';
import LineItemsTable from './fulfillment-detail/LineItemsTable';
import { PackingBoxType } from './fulfillment-detail/packing/PackingBox';

// Import modal components
import PackingSlipModal from './fulfillment-detail/modals/PackingSlipModal';
import ShippingLabelsModal from './fulfillment-detail/modals/ShippingLabelsModal';
import BillOfLadingModal from './fulfillment-detail/modals/BillOfLadingModal';
import SignatureCaptureModal from './fulfillment-detail/modals/SignatureCaptureModal';

interface FulfillmentOrderDetailContentProps {
  fulfillmentOrderId: string;
}

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

  // Picking state
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

  // Packing state
  const [packingBoxes, setPackingBoxes] = useState<PackingBoxType[]>([
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
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [selectedPackingTemplate, setSelectedPackingTemplate] = useState('standard');
  const [selectedLabelFormat, setSelectedLabelFormat] = useState('4x6');

  // Shipping state
  const [shippingMethod, setShippingMethod] = useState<'SHIP' | 'WILL_CALL'>(fulfillmentOrder?.fulfillmentMethod === 'JOBSITE' ? 'SHIP' : (fulfillmentOrder?.fulfillmentMethod || 'SHIP'));
  const [carrierType, setCarrierType] = useState<'parcel' | 'freight'>((fulfillmentOrder as any)?.carrierType || 'parcel');
  const [selectedCarrier, setSelectedCarrier] = useState(fulfillmentOrder?.carrier || '');
  const [freightClass, setFreightClass] = useState((fulfillmentOrder as any)?.freightClass || '');
  const [bolNumber, setBolNumber] = useState((fulfillmentOrder as any)?.bolNumber || '');
  const [proNumber, setProNumber] = useState((fulfillmentOrder as any)?.proNumber || '');
  const [shippingNotes, setShippingNotes] = useState((fulfillmentOrder as any)?.shippingNotes || '');
  const [isShippingConfigLocked, setIsShippingConfigLocked] = useState(false);
  const [isShippingConfigCollapsed, setIsShippingConfigCollapsed] = useState(false);

  // Pickup / Handoff state
  const [pickupName, setPickupName] = useState((fulfillmentOrder as any)?.pickupCustomerName || '');
  const [driverName, setDriverName] = useState((fulfillmentOrder as any)?.pickupDriverName || '');
  const [pickupSignature, setPickupSignature] = useState<string | null>((fulfillmentOrder as any)?.pickupSignature || null);
  const [pickupTimestamp, setPickupTimestamp] = useState<Date | null>((fulfillmentOrder as any)?.pickupTimestamp ? new Date((fulfillmentOrder as any).pickupTimestamp) : null);
  const [pickupNotes, setPickupNotes] = useState((fulfillmentOrder as any)?.pickupNotes || '');

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

  // Use viewing status if set, otherwise use actual status
  const displayStatus = viewingStatus || fulfillmentOrder.status;
  const isReleased = displayStatus !== 'PENDING';
  const isPicking = displayStatus === 'PICKING';
  const isPacking = displayStatus === 'PACKING';
  const isShipping = displayStatus === 'SHIPPING';
  const isShipped = displayStatus === 'SHIPPED';

  // Picking handlers
  const handleMarkAsPicked = (lineItemId: string, qty: number) => {
    setPickedItems(prev => ({ ...prev, [lineItemId]: qty }));
  };

  const handlePickAll = (lineItemId: string, allocatedQty: number) => {
    setPickedItems(prev => ({ ...prev, [lineItemId]: allocatedQty }));
  };

  const handleSimulateQRScan = (lineItemId: string, allocatedQty: number) => {
    handlePickAll(lineItemId, allocatedQty);
  };

  const handleUpdateNote = (lineItemId: string, note: string) => {
    setPickingNotes(prev => ({ ...prev, [lineItemId]: note }));
  };

  // Packing handlers
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
  const addNewBox = () => {
    const newBox: PackingBoxType = {
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

  const updateBox = (boxId: string, updates: Partial<PackingBoxType>) => {
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
    setVerifiedItems(prev => ({ ...prev, [lineItemId]: true }));
  };

  const getUnassignedItems = () => {
    const assignedIds = packingBoxes.flatMap(b => b.lineItemIds);
    return fulfillmentOrder.lineItems.filter(li => !assignedIds.includes(li.id));
  };

  const addAllItemsToBox = (boxId: string) => {
    const unassignedIds = getUnassignedItems().map(li => li.id);
    setPackingBoxes(prev => prev.map(box => {
      if (box.id === boxId) {
        return { ...box, lineItemIds: [...box.lineItemIds, ...unassignedIds] };
      }
      return box;
    }));
    const newVerified: Record<string, boolean> = {};
    unassignedIds.forEach(id => { newVerified[id] = true; });
    setVerifiedItems(prev => ({ ...prev, ...newVerified }));
  };

  const removeItemFromBox = (boxId: string, lineItemId: string) => {
    setPackingBoxes(prev => prev.map(b => ({
      ...b,
      lineItemIds: b.lineItemIds.filter(id => id !== lineItemId)
    })));
    setVerifiedItems(prev => ({ ...prev, [lineItemId]: false }));
  };

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

  const getBoxWeight = (box: PackingBoxType): string => {
    if (box.useCustomWeight && box.customWeight) {
      return box.customWeight;
    }
    const itemsInBox = fulfillmentOrder.lineItems.filter(li => box.lineItemIds.includes(li.id));
    const calculated = itemsInBox.reduce((sum, li) => sum + (li.allocatedQty * 0.5), 0);
    return calculated > 0 ? calculated.toFixed(1) : '0.0';
  };

  // Status transition handlers
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
    const requiresSignature = (shippingMethod === 'SHIP' && carrierType === 'freight') || shippingMethod === 'WILL_CALL';
    if (requiresSignature && !pickupSignature) {
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

  const handleContinue = () => {
    if (fulfillmentOrder.status === 'PENDING') handleReleaseToWarehouse();
    else if (fulfillmentOrder.status === 'RELEASED') handleStartPicking();
    else if (fulfillmentOrder.status === 'PICKING') handleCompletePicking();
    else if (fulfillmentOrder.status === 'PACKING') handleCompletePacking();
    else if (fulfillmentOrder.status === 'SHIPPING') handleCompleteShipping();
  };

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Save clicked');
  };

  const handleStatusClick = (status: FulfillmentOrderStatus) => {
    setViewingStatus(status === fulfillmentOrder.status ? null : status);
  };

  const handleClearSignature = () => {
    setPickupSignature(null);
    setPickupTimestamp(null);
    setPickupName('');
    setDriverName('');
    setPickupNotes('');
  };

  // Get continue button props
  const getContinueButtonProps = () => {
    const statusMap: Record<FulfillmentOrderStatus, { text: string; color: string; canContinue: boolean }> = {
      'PENDING': { text: 'Continue', color: 'bg-cyan-600 hover:bg-cyan-700', canContinue: true },
      'RELEASED': { text: 'Continue', color: 'bg-yellow-600 hover:bg-yellow-700', canContinue: true },
      'PICKING': { text: 'Continue', color: 'bg-amber-600 hover:bg-amber-700', canContinue: true },
      'PACKING': { text: 'Continue', color: 'bg-orange-600 hover:bg-orange-700', canContinue: true },
      'SHIPPING': {
        text: (shippingMethod === 'SHIP' && carrierType === 'freight') || shippingMethod === 'WILL_CALL' && !pickupSignature ? 'Capture Signature' : 'Continue',
        color: (shippingMethod === 'SHIP' && carrierType === 'freight') || shippingMethod === 'WILL_CALL' && !pickupSignature ? 'bg-purple-600 hover:bg-purple-700' : 'bg-green-600 hover:bg-green-700',
        canContinue: true
      },
      'SHIPPED': { text: 'Completed', color: 'bg-gray-400', canContinue: false },
      'PARTIAL_SHIPPED': { text: 'Completed', color: 'bg-gray-400', canContinue: false },
      'DELIVERED': { text: 'Completed', color: 'bg-gray-400', canContinue: false },
      'CANCELLED': { text: 'Cancelled', color: 'bg-gray-400', canContinue: false },
    };
    return statusMap[fulfillmentOrder.status] || { text: 'Continue', color: 'bg-[var(--primary)]', canContinue: false };
  };

  const { text: continueButtonText, color: continueButtonColor, canContinue } = getContinueButtonProps();

  // Shipped data for ShippedInterface
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

  return (
    <main className="flex-1 overflow-auto bg-[var(--background)]">
      <div className="max-w-[1400px] mx-auto p-6">
        {/* Header */}
        <FulfillmentHeader
          fulfillmentOrder={fulfillmentOrder}
          onSave={handleSave}
          onContinue={handleContinue}
          canContinue={canContinue}
          continueButtonText={continueButtonText}
          continueButtonColor={continueButtonColor}
        />

        {/* Status Progress */}
        <StatusProgress
          currentStatus={fulfillmentOrder.status}
          viewingStatus={viewingStatus}
          onStatusClick={handleStatusClick}
          onBackToCurrent={() => setViewingStatus(null)}
        />

        {/* Picking Interface */}
        {isPicking && (
          <div className="mb-4">
            <PickingInterface
              fulfillmentOrder={fulfillmentOrder}
              pickedItems={pickedItems}
              pickingNotes={pickingNotes}
              expandedNoteId={expandedNoteId}
              onMarkAsPicked={handleMarkAsPicked}
              onPickAll={handlePickAll}
              onSimulateQRScan={handleSimulateQRScan}
              onUpdateNote={handleUpdateNote}
              onExpandNote={setExpandedNoteId}
              onCompletePicking={handleCompletePicking}
            />
          </div>
        )}

        {/* Packing Interface */}
        {isPacking && (
          <div className="mb-4">
            <PackingInterface
              fulfillmentOrder={fulfillmentOrder}
              packingBoxes={packingBoxes}
              draggedItemId={draggedItemId}
              onAddNewBox={addNewBox}
              onRemoveBox={removeBox}
              onUpdateBox={updateBox}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              onAddAllItemsToBox={addAllItemsToBox}
              onRemoveItemFromBox={removeItemFromBox}
              onCompletePacking={handleCompletePacking}
              onShowPackingSlipModal={() => setShowPackingSlipModal(true)}
              getUnassignedItems={getUnassignedItems}
            />
          </div>
        )}

        {/* Shipping Interface */}
        {isShipping && (
          <div className="mb-4">
            <ShippingInterface
              fulfillmentOrder={fulfillmentOrder}
              packingBoxes={packingBoxes}
              shippingMethod={shippingMethod}
              carrierType={carrierType}
              selectedCarrier={selectedCarrier}
              trackingNumbers={trackingNumbers}
              proNumber={proNumber}
              bolNumber={bolNumber}
              freightClass={freightClass}
              shippingNotes={shippingNotes}
              pickupSignature={pickupSignature}
              pickupTimestamp={pickupTimestamp}
              pickupName={pickupName}
              driverName={driverName}
              pickupNotes={pickupNotes}
              isShippingConfigLocked={isShippingConfigLocked}
              isShippingConfigCollapsed={isShippingConfigCollapsed}
              onShippingMethodChange={setShippingMethod}
              onCarrierTypeChange={setCarrierType}
              onCarrierChange={setSelectedCarrier}
              onTrackingNumbersChange={setTrackingNumbers}
              onProNumberChange={setProNumber}
              onBolNumberChange={setBolNumber}
              onFreightClassChange={setFreightClass}
              onShippingNotesChange={setShippingNotes}
              onToggleLock={() => setIsShippingConfigLocked(!isShippingConfigLocked)}
              onToggleCollapse={() => setIsShippingConfigCollapsed(!isShippingConfigCollapsed)}
              onShowPackingSlipModal={() => setShowPackingSlipModal(true)}
              onShowShippingLabelsModal={() => setShowShippingLabelsModal(true)}
              onShowBOLModal={() => setShowBOLModal(true)}
              onShowSignatureModal={() => setShowSignatureModal(true)}
              onClearSignature={handleClearSignature}
              onCompleteShipping={handleCompleteShipping}
              getBoxWeight={getBoxWeight}
            />
          </div>
        )}

        {/* Shipped Interface */}
        {isShipped && (
          <div className="mb-4">
            <ShippedInterface
              fulfillmentOrder={fulfillmentOrder}
              packingBoxes={packingBoxes}
              shippingMethod={shippingMethod}
              shippedData={shippedData}
              onShowPackingSlipModal={() => setShowPackingSlipModal(true)}
              onShowShippingLabelsModal={() => setShowShippingLabelsModal(true)}
              onShowBOLModal={() => setShowBOLModal(true)}
            />
          </div>
        )}

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Left Column - Fulfillment Details */}
          <FulfillmentDetailsForm
            fulfillmentOrder={fulfillmentOrder}
            warehouseId={warehouseId}
            fulfillmentMethod={fulfillmentMethod}
            needByDate={needByDate}
            shipToName={shipToName}
            shipToAddressLine1={shipToAddressLine1}
            shipToAddressLine2={shipToAddressLine2}
            shipToCity={shipToCity}
            shipToState={shipToState}
            shipToPostalCode={shipToPostalCode}
            shipToPhone={shipToPhone}
            carrier={carrier}
            trackingNumbers={trackingNumbers}
            shipToDifferentFromPO={shipToDifferentFromPO}
            isReleased={isReleased}
            onWarehouseIdChange={setWarehouseId}
            onFulfillmentMethodChange={setFulfillmentMethod}
            onNeedByDateChange={setNeedByDate}
            onShipToNameChange={setShipToName}
            onShipToAddressLine1Change={setShipToAddressLine1}
            onShipToAddressLine2Change={setShipToAddressLine2}
            onShipToCityChange={setShipToCity}
            onShipToStateChange={setShipToState}
            onShipToPostalCodeChange={setShipToPostalCode}
            onShipToPhoneChange={setShipToPhone}
            onCarrierChange={setCarrier}
            onTrackingNumbersChange={setTrackingNumbers}
            onShipToDifferentFromPOChange={setShipToDifferentFromPO}
          />

          {/* Right Column - Audit Timestamps */}
          <AuditTimestamps
            fulfillmentOrder={fulfillmentOrder}
            isReleased={isReleased}
            onReleaseToWarehouse={handleReleaseToWarehouse}
          />
        </div>

        {/* Line Items Table */}
        <LineItemsTable fulfillmentOrder={fulfillmentOrder} />
      </div>

      {/* Modals */}
      <PackingSlipModal
        isOpen={showPackingSlipModal}
        fulfillmentOrder={fulfillmentOrder}
        packingBoxes={packingBoxes}
        onClose={() => setShowPackingSlipModal(false)}
        onPrint={() => alert('Printing packing slips...')}
      />

      <ShippingLabelsModal
        isOpen={showShippingLabelsModal}
        fulfillmentOrder={fulfillmentOrder}
        packingBoxes={packingBoxes}
        onClose={() => setShowShippingLabelsModal(false)}
        onPrint={() => alert('Printing shipping labels...')}
      />

      <BillOfLadingModal
        isOpen={showBOLModal}
        fulfillmentOrder={fulfillmentOrder}
        onClose={() => setShowBOLModal(false)}
        onPrint={() => window.print()}
      />

      <SignatureCaptureModal
        isOpen={showSignatureModal}
        pickupName={pickupName}
        driverName={driverName}
        pickupNotes={pickupNotes}
        onPickupNameChange={setPickupName}
        onDriverNameChange={setDriverName}
        onPickupNotesChange={setPickupNotes}
        onClose={() => setShowSignatureModal(false)}
        onConfirm={(signatureData, timestamp) => {
          setPickupSignature(signatureData);
          setPickupTimestamp(timestamp);
          setShowSignatureModal(false);
        }}
      />
    </main>
  );
}
