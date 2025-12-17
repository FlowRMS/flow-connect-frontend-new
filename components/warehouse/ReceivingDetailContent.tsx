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
  const [bolImage, setBolImage] = useState<string | null>(null);
  const [bolInputMode, setBolInputMode] = useState<'scan' | 'manual' | null>(null);
  const [bolDiscrepancies, setBolDiscrepancies] = useState<Array<{
    field: string;
    expected: string;
    actual: string;
    resolved: boolean;
  }>>([]);
  const [isProcessingBol, setIsProcessingBol] = useState(false);

  // BOL Manual Entry Data
  const [bolManualData, setBolManualData] = useState<{
    proNumber: string;
    poNumber: string;
    shipDate: string;
    deliveryDate: string;
    carrier: string;
    shipperName: string;
    shipperAddress: string;
    shipperCity: string;
    shipperState: string;
    shipperZip: string;
    consigneeName: string;
    consigneeAddress: string;
    consigneeCity: string;
    consigneeState: string;
    consigneeZip: string;
    lineItems: Array<{
      quantity: number;
      units: string;
      description: string;
      weight: number;
      class: string;
      nmfc: string;
    }>;
    totalPieces: number;
    totalWeight: number;
    totalPallets: number;
    freightTerms: string;
    sealNumber: string;
    trailerNumber: string;
    specialInstructions: string;
  }>({
    proNumber: '',
    poNumber: '',
    shipDate: '',
    deliveryDate: '',
    carrier: '',
    shipperName: '',
    shipperAddress: '',
    shipperCity: '',
    shipperState: '',
    shipperZip: '',
    consigneeName: '',
    consigneeAddress: '',
    consigneeCity: '',
    consigneeState: '',
    consigneeZip: '',
    lineItems: [{ quantity: 0, units: 'pieces', description: '', weight: 0, class: '', nmfc: '' }],
    totalPieces: 0,
    totalWeight: 0,
    totalPallets: 0,
    freightTerms: '',
    sealNumber: '',
    trailerNumber: '',
    specialInstructions: '',
  });

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
  const [newDiscrepancy, setNewDiscrepancy] = useState<{ type: 'shortage' | 'overage' | 'damage' | 'wrong_item'; quantity: number; description: string }>({ type: 'damage', quantity: 0, description: '' });

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
  const totalIssues = discrepancies.reduce((sum, d) => sum + d.quantity, 0);
  const totalGood = Math.max(0, totalReceived - totalIssues);
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
    if (!newDiscrepancy.quantity) return;
    const newId = `DISC-${Date.now()}`;
    setDiscrepancies(prev => [...prev, {
      id: newId,
      lineItemId: itemId,
      ...newDiscrepancy,
    }]);
    setNewDiscrepancy({ type: 'damage', quantity: 0, description: '' });
    setShowDiscrepancyForm(null);
  };

  const handleCaptureBOL = () => {
    if (!bolNumber.trim() && !bolImage) return;

    // Simulate processing and discrepancy detection
    setIsProcessingBol(true);

    // Mock: Simulate OCR processing delay
    setTimeout(() => {
      // Mock discrepancy detection - compare BOL data with expected shipment
      const mockDiscrepancies: Array<{ field: string; expected: string; actual: string; resolved: boolean }> = [];

      // Compare PO number from BOL manual data with shipment
      if (bolManualData.poNumber && bolManualData.poNumber.toUpperCase() !== shipment.poNumber.toUpperCase()) {
        mockDiscrepancies.push({
          field: 'PO Number',
          expected: shipment.poNumber,
          actual: bolManualData.poNumber,
          resolved: false,
        });
      }

      // Compare shipper name with vendor name
      if (bolManualData.shipperName && !bolManualData.shipperName.toLowerCase().includes(shipment.vendorName.toLowerCase().split(' ')[0])) {
        mockDiscrepancies.push({
          field: 'Shipper/Vendor',
          expected: shipment.vendorName,
          actual: bolManualData.shipperName,
          resolved: false,
        });
      }

      // Compare total pieces with expected quantity
      const expectedTotal = shipment.items.reduce((sum, item) => sum + item.expectedQuantity, 0);
      if (bolManualData.totalPieces > 0 && bolManualData.totalPieces !== expectedTotal) {
        mockDiscrepancies.push({
          field: 'Total Quantity',
          expected: `${expectedTotal} units`,
          actual: `${bolManualData.totalPieces} units`,
          resolved: false,
        });
      }

      // Compare carrier if specified
      if (bolManualData.carrier && shipment.carrier && !bolManualData.carrier.toLowerCase().includes(shipment.carrier.toLowerCase())) {
        mockDiscrepancies.push({
          field: 'Carrier',
          expected: shipment.carrier,
          actual: bolManualData.carrier,
          resolved: false,
        });
      }

      // Compare line item quantities
      bolManualData.lineItems.forEach((bolItem, index) => {
        if (bolItem.description && bolItem.quantity > 0) {
          // Try to match by description to shipment items
          const matchedShipmentItem = shipment.items.find(si =>
            si.productName.toLowerCase().includes(bolItem.description.toLowerCase()) ||
            bolItem.description.toLowerCase().includes(si.productName.toLowerCase()) ||
            bolItem.description.toLowerCase().includes(si.partNumber.toLowerCase())
          );

          if (matchedShipmentItem && bolItem.quantity !== matchedShipmentItem.expectedQuantity) {
            mockDiscrepancies.push({
              field: `Line Item ${index + 1} Qty (${bolItem.description.substring(0, 20)}...)`,
              expected: `${matchedShipmentItem.expectedQuantity} units`,
              actual: `${bolItem.quantity} units`,
              resolved: false,
            });
          }
        }
      });

      setBolDiscrepancies(mockDiscrepancies);
      setIsProcessingBol(false);

      // Only mark as captured if no discrepancies
      if (mockDiscrepancies.length === 0) {
        setBolCaptured(true);
      }
    }, 1500);
  };

  const handleBolImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBolImage(reader.result as string);
        setBolInputMode('scan');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = () => {
    // In a real app, this would open the device camera
    // For now, we'll trigger the file input with camera capture
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setBolImage(reader.result as string);
          setBolInputMode('scan');
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleResolveDiscrepancy = (index: number) => {
    setBolDiscrepancies(prev => prev.map((d, i) =>
      i === index ? { ...d, resolved: true } : d
    ));
  };

  const handleConfirmBolWithDiscrepancies = () => {
    // Proceed despite discrepancies (user acknowledged them)
    setBolCaptured(true);
  };

  const handleClearBolImage = () => {
    setBolImage(null);
    setBolInputMode(null);
    setBolDiscrepancies([]);
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
              {totalReceived} of {totalExpected} items received · {totalIssues > 0 ? `${totalIssues} with issues` : 'No issues reported'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {allItemsVerified && (
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
                    <div className="grid grid-cols-4 gap-4">
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
                          Good Qty
                        </label>
                        <div className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-green-50 text-sm font-medium text-green-700">
                          {Math.max(0, lineItem.receivedQty - lineItem.damagedQty - discrepancies.filter(d => d.lineItemId === lineItem.id).reduce((sum, d) => sum + d.quantity, 0))}
                        </div>
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

                    {/* Discrepancy Section - Always show add button for multiple line items */}
                    <div className="pt-2 border-t border-[var(--border)]">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-sm font-medium text-[var(--foreground)]">Inventory Issues</h5>
                        <button
                          onClick={() => setShowDiscrepancyForm(lineItem.id)}
                          className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                          </svg>
                          Add Issue
                        </button>
                      </div>

                      {/* Existing discrepancies as line items */}
                      {discrepancies.filter(d => d.lineItemId === lineItem.id).map(disc => (
                        <div key={disc.id} className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg mb-2 text-sm flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              disc.type === 'damage' ? 'bg-orange-100 text-orange-700' :
                              disc.type === 'shortage' ? 'bg-red-100 text-red-700' :
                              disc.type === 'overage' ? 'bg-blue-100 text-blue-700' :
                              disc.type === 'wrong_item' ? 'bg-purple-100 text-purple-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {disc.type === 'damage' ? 'Damaged' :
                               disc.type === 'shortage' ? 'Missing / Shortage' :
                               disc.type === 'overage' ? 'Overage' :
                               'Wrong Item'}
                            </span>
                            <span className="font-medium text-[var(--foreground)]">Qty: {disc.quantity}</span>
                            {disc.description && <span className="text-[var(--muted-foreground)]">- {disc.description}</span>}
                          </div>
                          <button
                            onClick={() => setDiscrepancies(prev => prev.filter(d => d.id !== disc.id))}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </div>
                      ))}

                      {/* New discrepancy form - inline add */}
                      {showDiscrepancyForm === lineItem.id && (
                        <div className="p-3 bg-[var(--muted)]/30 border border-[var(--border)] rounded-lg space-y-3">
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Category</label>
                              <select
                                value={newDiscrepancy.type}
                                onChange={(e) => setNewDiscrepancy(prev => ({ ...prev, type: e.target.value as 'shortage' | 'overage' | 'damage' | 'wrong_item' }))}
                                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
                              >
                                <option value="damage">Damaged</option>
                                <option value="shortage">Missing / Shortage</option>
                                <option value="overage">Overage</option>
                                <option value="wrong_item">Wrong Item</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Quantity</label>
                              <input
                                type="number"
                                min="1"
                                value={newDiscrepancy.quantity || ''}
                                onChange={(e) => setNewDiscrepancy(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                                placeholder="Enter qty"
                                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
                              />
                            </div>
                            <div className="flex items-end gap-2">
                              <button
                                onClick={() => handleAddDiscrepancy(lineItem.id)}
                                disabled={!newDiscrepancy.quantity}
                                className="px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                              >
                                Add
                              </button>
                              <button
                                onClick={() => {
                                  setShowDiscrepancyForm(null);
                                  setNewDiscrepancy({ type: 'damage', quantity: 0, description: '' });
                                }}
                                className="px-3 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Notes (optional)</label>
                            <input
                              type="text"
                              value={newDiscrepancy.description}
                              onChange={(e) => setNewDiscrepancy(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Add details about this issue..."
                              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
                            />
                          </div>
                        </div>
                      )}

                      {discrepancies.filter(d => d.lineItemId === lineItem.id).length === 0 && showDiscrepancyForm !== lineItem.id && (
                        <p className="text-xs text-[var(--muted-foreground)]">No issues reported</p>
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

            {shipment.status === 'RECEIVING' && allItemsVerified && (
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
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
                  <p className="text-sm text-[var(--muted-foreground)]">Scan, upload, or manually enter the BOL</p>
                </div>
              </div>
              {isProcessingBol && (
                <div className="flex items-center gap-2 text-purple-600">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  <span className="text-sm font-medium">Processing...</span>
                </div>
              )}
            </div>

            {/* Capture Method Selection */}
            {!bolInputMode && !bolImage && (
              <div className="grid grid-cols-3 gap-4 mb-4">
                <button
                  onClick={handleCameraCapture}
                  className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-purple-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-500">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  <span className="text-sm font-medium text-purple-700">Take Photo</span>
                  <span className="text-xs text-[var(--muted-foreground)]">Use camera</span>
                </button>

                <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-purple-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors cursor-pointer">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-500">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span className="text-sm font-medium text-purple-700">Upload Image</span>
                  <span className="text-xs text-[var(--muted-foreground)]">From device</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBolImageUpload}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={() => setBolInputMode('manual')}
                  className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-purple-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-500">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  <span className="text-sm font-medium text-purple-700">Enter Manually</span>
                  <span className="text-xs text-[var(--muted-foreground)]">Type BOL #</span>
                </button>
              </div>
            )}

            {/* Image Preview */}
            {bolImage && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[var(--foreground)]">Uploaded BOL Image</span>
                  <button
                    onClick={handleClearBolImage}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
                <div className="relative rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--muted)]/20">
                  <img
                    src={bolImage}
                    alt="Bill of Lading"
                    className="w-full max-h-64 object-contain"
                  />
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                    Extracted BOL Number (verify or correct)
                  </label>
                  <input
                    type="text"
                    value={bolNumber}
                    onChange={(e) => setBolNumber(e.target.value)}
                    placeholder="BOL number will be extracted automatically..."
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              </div>
            )}

            {/* Manual Entry Mode - Full BOL Form */}
            {bolInputMode === 'manual' && !bolImage && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-[var(--foreground)]">Manual Entry</span>
                  <button
                    onClick={() => setBolInputMode(null)}
                    className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    Back to options
                  </button>
                </div>

                {/* BOL Header Info */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">BOL Number *</label>
                    <input
                      type="text"
                      value={bolNumber}
                      onChange={(e) => setBolNumber(e.target.value)}
                      placeholder="e.g., BOL-123456"
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">PRO Number</label>
                    <input
                      type="text"
                      value={bolManualData.proNumber}
                      onChange={(e) => setBolManualData(prev => ({ ...prev, proNumber: e.target.value }))}
                      placeholder="Progressive/tracking #"
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">PO Number</label>
                    <input
                      type="text"
                      value={bolManualData.poNumber}
                      onChange={(e) => setBolManualData(prev => ({ ...prev, poNumber: e.target.value }))}
                      placeholder="Purchase order #"
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Ship Date</label>
                    <input
                      type="date"
                      value={bolManualData.shipDate}
                      onChange={(e) => setBolManualData(prev => ({ ...prev, shipDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Delivery Date</label>
                    <input
                      type="date"
                      value={bolManualData.deliveryDate}
                      onChange={(e) => setBolManualData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Carrier</label>
                    <input
                      type="text"
                      value={bolManualData.carrier}
                      onChange={(e) => setBolManualData(prev => ({ ...prev, carrier: e.target.value }))}
                      placeholder="Carrier name"
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                </div>

                {/* Shipper & Consignee Info */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 border border-[var(--border)] rounded-lg bg-[var(--muted)]/10">
                    <h4 className="text-xs font-semibold text-[var(--foreground)] uppercase mb-3">Shipper (From)</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-[var(--muted-foreground)] mb-1">Company Name</label>
                        <input
                          type="text"
                          value={bolManualData.shipperName}
                          onChange={(e) => setBolManualData(prev => ({ ...prev, shipperName: e.target.value }))}
                          placeholder="Shipper company"
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[var(--muted-foreground)] mb-1">Address</label>
                        <input
                          type="text"
                          value={bolManualData.shipperAddress}
                          onChange={(e) => setBolManualData(prev => ({ ...prev, shipperAddress: e.target.value }))}
                          placeholder="Street address"
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={bolManualData.shipperCity}
                          onChange={(e) => setBolManualData(prev => ({ ...prev, shipperCity: e.target.value }))}
                          placeholder="City"
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                        <input
                          type="text"
                          value={bolManualData.shipperState}
                          onChange={(e) => setBolManualData(prev => ({ ...prev, shipperState: e.target.value }))}
                          placeholder="State"
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                        <input
                          type="text"
                          value={bolManualData.shipperZip}
                          onChange={(e) => setBolManualData(prev => ({ ...prev, shipperZip: e.target.value }))}
                          placeholder="ZIP"
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 border border-[var(--border)] rounded-lg bg-[var(--muted)]/10">
                    <h4 className="text-xs font-semibold text-[var(--foreground)] uppercase mb-3">Consignee (To)</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-[var(--muted-foreground)] mb-1">Company Name</label>
                        <input
                          type="text"
                          value={bolManualData.consigneeName}
                          onChange={(e) => setBolManualData(prev => ({ ...prev, consigneeName: e.target.value }))}
                          placeholder="Consignee company"
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[var(--muted-foreground)] mb-1">Address</label>
                        <input
                          type="text"
                          value={bolManualData.consigneeAddress}
                          onChange={(e) => setBolManualData(prev => ({ ...prev, consigneeAddress: e.target.value }))}
                          placeholder="Street address"
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={bolManualData.consigneeCity}
                          onChange={(e) => setBolManualData(prev => ({ ...prev, consigneeCity: e.target.value }))}
                          placeholder="City"
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                        <input
                          type="text"
                          value={bolManualData.consigneeState}
                          onChange={(e) => setBolManualData(prev => ({ ...prev, consigneeState: e.target.value }))}
                          placeholder="State"
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                        <input
                          type="text"
                          value={bolManualData.consigneeZip}
                          onChange={(e) => setBolManualData(prev => ({ ...prev, consigneeZip: e.target.value }))}
                          placeholder="ZIP"
                          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Freight Details */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-[var(--foreground)] uppercase">Line Items / Freight Details</h4>
                    <button
                      onClick={() => setBolManualData(prev => ({
                        ...prev,
                        lineItems: [...prev.lineItems, { quantity: 0, units: 'pieces', description: '', weight: 0, class: '', nmfc: '' }]
                      }))}
                      className="text-xs text-purple-600 hover:underline flex items-center gap-1"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Add Line Item
                    </button>
                  </div>
                  <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[var(--muted)]/30">
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)]">Qty</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)]">Units</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)]">Description</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)]">Weight (lbs)</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)]">Class</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)]">NMFC #</th>
                          <th className="px-3 py-2 w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {bolManualData.lineItems.map((item, index) => (
                          <tr key={index} className="hover:bg-[var(--muted)]/10">
                            <td className="px-2 py-1">
                              <input
                                type="number"
                                min="0"
                                value={item.quantity || ''}
                                onChange={(e) => {
                                  const newItems = [...bolManualData.lineItems];
                                  newItems[index].quantity = parseInt(e.target.value) || 0;
                                  setBolManualData(prev => ({ ...prev, lineItems: newItems }));
                                }}
                                className="w-16 px-2 py-1.5 border border-[var(--border)] rounded bg-[var(--background)] text-sm"
                                placeholder="0"
                              />
                            </td>
                            <td className="px-2 py-1">
                              <select
                                value={item.units}
                                onChange={(e) => {
                                  const newItems = [...bolManualData.lineItems];
                                  newItems[index].units = e.target.value;
                                  setBolManualData(prev => ({ ...prev, lineItems: newItems }));
                                }}
                                className="w-24 px-2 py-1.5 border border-[var(--border)] rounded bg-[var(--background)] text-sm"
                              >
                                <option value="pieces">Pieces</option>
                                <option value="cases">Cases</option>
                                <option value="pallets">Pallets</option>
                                <option value="cartons">Cartons</option>
                                <option value="boxes">Boxes</option>
                                <option value="skids">Skids</option>
                                <option value="drums">Drums</option>
                                <option value="rolls">Rolls</option>
                              </select>
                            </td>
                            <td className="px-2 py-1">
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => {
                                  const newItems = [...bolManualData.lineItems];
                                  newItems[index].description = e.target.value;
                                  setBolManualData(prev => ({ ...prev, lineItems: newItems }));
                                }}
                                className="w-full px-2 py-1.5 border border-[var(--border)] rounded bg-[var(--background)] text-sm"
                                placeholder="Item description"
                              />
                            </td>
                            <td className="px-2 py-1">
                              <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={item.weight || ''}
                                onChange={(e) => {
                                  const newItems = [...bolManualData.lineItems];
                                  newItems[index].weight = parseFloat(e.target.value) || 0;
                                  setBolManualData(prev => ({ ...prev, lineItems: newItems }));
                                }}
                                className="w-20 px-2 py-1.5 border border-[var(--border)] rounded bg-[var(--background)] text-sm"
                                placeholder="0"
                              />
                            </td>
                            <td className="px-2 py-1">
                              <input
                                type="text"
                                value={item.class}
                                onChange={(e) => {
                                  const newItems = [...bolManualData.lineItems];
                                  newItems[index].class = e.target.value;
                                  setBolManualData(prev => ({ ...prev, lineItems: newItems }));
                                }}
                                className="w-16 px-2 py-1.5 border border-[var(--border)] rounded bg-[var(--background)] text-sm"
                                placeholder="e.g. 70"
                              />
                            </td>
                            <td className="px-2 py-1">
                              <input
                                type="text"
                                value={item.nmfc}
                                onChange={(e) => {
                                  const newItems = [...bolManualData.lineItems];
                                  newItems[index].nmfc = e.target.value;
                                  setBolManualData(prev => ({ ...prev, lineItems: newItems }));
                                }}
                                className="w-24 px-2 py-1.5 border border-[var(--border)] rounded bg-[var(--background)] text-sm"
                                placeholder="NMFC #"
                              />
                            </td>
                            <td className="px-2 py-1">
                              {bolManualData.lineItems.length > 1 && (
                                <button
                                  onClick={() => {
                                    const newItems = bolManualData.lineItems.filter((_, i) => i !== index);
                                    setBolManualData(prev => ({ ...prev, lineItems: newItems }));
                                  }}
                                  className="p-1 text-red-500 hover:text-red-700"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                  </svg>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals & Additional Info */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Total Pieces</label>
                    <input
                      type="number"
                      min="0"
                      value={bolManualData.totalPieces || ''}
                      onChange={(e) => setBolManualData(prev => ({ ...prev, totalPieces: parseInt(e.target.value) || 0 }))}
                      placeholder="Total qty"
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Total Weight (lbs)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={bolManualData.totalWeight || ''}
                      onChange={(e) => setBolManualData(prev => ({ ...prev, totalWeight: parseFloat(e.target.value) || 0 }))}
                      placeholder="Total weight"
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Total Pallets</label>
                    <input
                      type="number"
                      min="0"
                      value={bolManualData.totalPallets || ''}
                      onChange={(e) => setBolManualData(prev => ({ ...prev, totalPallets: parseInt(e.target.value) || 0 }))}
                      placeholder="# of pallets"
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Freight Terms</label>
                    <select
                      value={bolManualData.freightTerms}
                      onChange={(e) => setBolManualData(prev => ({ ...prev, freightTerms: e.target.value }))}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                      <option value="">Select...</option>
                      <option value="prepaid">Prepaid</option>
                      <option value="collect">Collect</option>
                      <option value="third_party">Third Party</option>
                    </select>
                  </div>
                </div>

                {/* Special Instructions & Seal Number */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Seal Number</label>
                    <input
                      type="text"
                      value={bolManualData.sealNumber}
                      onChange={(e) => setBolManualData(prev => ({ ...prev, sealNumber: e.target.value }))}
                      placeholder="Container seal #"
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Trailer/Container #</label>
                    <input
                      type="text"
                      value={bolManualData.trailerNumber}
                      onChange={(e) => setBolManualData(prev => ({ ...prev, trailerNumber: e.target.value }))}
                      placeholder="Trailer or container #"
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Special Instructions</label>
                  <textarea
                    value={bolManualData.specialInstructions}
                    onChange={(e) => setBolManualData(prev => ({ ...prev, specialInstructions: e.target.value }))}
                    placeholder="Delivery instructions, handling requirements, etc."
                    rows={2}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                  />
                </div>
              </div>
            )}

            {/* Discrepancy Display */}
            {bolDiscrepancies.length > 0 && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <h4 className="text-sm font-semibold text-red-800">Discrepancies Found</h4>
                </div>
                <p className="text-xs text-red-700 mb-3">
                  The following differences were detected between the BOL and the expected shipment:
                </p>
                <div className="space-y-2">
                  {bolDiscrepancies.map((disc, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        disc.resolved ? 'bg-green-50 border border-green-200' : 'bg-white border border-red-200'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[var(--foreground)]">{disc.field}</div>
                        <div className="flex items-center gap-4 mt-1 text-xs">
                          <span className="text-[var(--muted-foreground)]">
                            Expected: <span className="font-medium text-green-700">{disc.expected}</span>
                          </span>
                          <span className="text-[var(--muted-foreground)]">
                            Actual: <span className="font-medium text-red-700">{disc.actual}</span>
                          </span>
                        </div>
                      </div>
                      {disc.resolved ? (
                        <span className="flex items-center gap-1 text-xs text-green-700 font-medium">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 6L9 17l-5-5"/>
                          </svg>
                          Acknowledged
                        </span>
                      ) : (
                        <button
                          onClick={() => handleResolveDiscrepancy(index)}
                          className="px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded hover:bg-amber-600 transition-colors"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {bolDiscrepancies.every(d => d.resolved) && (
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <button
                      onClick={handleConfirmBolWithDiscrepancies}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                    >
                      Proceed with Acknowledged Discrepancies
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Notes</label>
              <input
                type="text"
                value={bolNotes}
                onChange={(e) => setBolNotes(e.target.value)}
                placeholder="Add any notes about the shipment condition..."
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
            </div>

            {/* Action Buttons */}
            {(bolInputMode || bolImage) && bolDiscrepancies.length === 0 && (
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setBolInputMode(null);
                    setBolImage(null);
                    setBolNumber('');
                  }}
                  className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCaptureBOL}
                  disabled={!bolNumber.trim() && !bolImage}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                  Verify & Capture BOL
                </button>
              </div>
            )}
          </div>
        )}

        {/* BOL Captured Badge */}
        {bolCaptured && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-purple-800">BOL Captured:</span>
                    <span className="text-sm text-purple-700 font-mono">{bolNumber || 'Image uploaded'}</span>
                  </div>
                  {bolDiscrepancies.length > 0 && (
                    <span className="text-xs text-amber-600">
                      {bolDiscrepancies.length} discrepanc{bolDiscrepancies.length === 1 ? 'y' : 'ies'} acknowledged
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {bolImage && (
                  <button
                    onClick={() => window.open(bolImage, '_blank')}
                    className="text-xs text-purple-600 hover:underline flex items-center gap-1"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    View Image
                  </button>
                )}
                <button
                  onClick={() => {
                    setBolCaptured(false);
                    setBolDiscrepancies([]);
                  }}
                  className="text-xs text-purple-600 hover:underline"
                >
                  Edit
                </button>
              </div>
            </div>
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
