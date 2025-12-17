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

// Receiving flow steps - simplified to: Expected -> Arrived -> Receiving -> Received
const receivingSteps: ShipmentStatus[] = ['PENDING', 'ARRIVED', 'RECEIVING', 'RECEIVED'];

// Step metadata for display
const stepInfo: Record<ShipmentStatus, { label: string; icon: string; description: string }> = {
  PENDING: { label: 'Expected', icon: 'clock', description: 'Shipment expected' },
  CONFIRMED: { label: 'Expected', icon: 'clock', description: 'Shipment expected' },
  IN_TRANSIT: { label: 'Expected', icon: 'clock', description: 'Shipment expected' },
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

// Bin assignment for multi-bin storage
interface BinAssignment {
  binId: string;
  quantity: number;
  isPrimary: boolean;
}

interface LineItemReceive {
  id: string;
  productId: string;
  productName: string;
  partNumber: string;
  expectedQty: number;
  receivedQty: number;
  damagedQty: number;
  binId: string; // Primary bin
  primaryBinId: string; // Default/suggested bin for this SKU
  binAssignments: BinAssignment[]; // Multiple bin support
  condition: ConditionType;
  notes: string;
  lotNumber: string;
  expirationDate: string;
  verified: boolean;
  putAway: boolean;
}

// Packing slip line item from scan/digitization
interface PackingSlipLineItem {
  id: string;
  partNumber: string;
  description: string;
  quantity: number;
  matched: boolean;
  matchedLineItemId?: string;
}

export default function ReceivingDetailContent({ shipmentId }: ReceivingDetailContentProps) {
  const router = useRouter();
  const [_, setForceUpdate] = useState(0);

  // Get shipment from mock data
  const shipment = getShipmentById(shipmentId);

  // View state for step navigation
  const [viewingStatus, setViewingStatus] = useState<ShipmentStatus | null>(null);

  // Packing Slip capture (replaces BOL focus)
  const [packingSlipImage, setPackingSlipImage] = useState<string | null>(null);
  const [packingSlipCaptured, setPackingSlipCaptured] = useState(false);
  const [packingSlipInputMode, setPackingSlipInputMode] = useState<'scan' | 'manual' | null>(null);
  const [isProcessingPackingSlip, setIsProcessingPackingSlip] = useState(false);
  const [packingSlipLineItems, setPackingSlipLineItems] = useState<PackingSlipLineItem[]>([]);
  const [packingSlipDiscrepancies, setPackingSlipDiscrepancies] = useState<Array<{
    field: string;
    expected: string;
    actual: string;
    resolved: boolean;
  }>>([]);

  // Incremental receiving / pallet tracking
  const [currentPalletNumber, setCurrentPalletNumber] = useState(1);
  const [palletSessions, setPalletSessions] = useState<Array<{
    id: string;
    palletNumber: number;
    timestamp: Date;
    items: Array<{ lineItemId: string; quantity: number }>;
  }>>([]);
  const [showSavePalletConfirm, setShowSavePalletConfirm] = useState(false);

  // Voice input state
  const [isRecordingVoice, setIsRecordingVoice] = useState<string | null>(null); // lineItemId currently recording
  const [voiceSupported, setVoiceSupported] = useState(false);

  // Check for voice support on mount
  React.useEffect(() => {
    setVoiceSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }, []);

  // Receiving state - track quantities per line item
  const [lineItems, setLineItems] = useState<LineItemReceive[]>(() => {
    if (!shipment) return [];
    return shipment.items.map((item, index) => {
      // Assign a default primary bin based on product (mock - in real app this would come from inventory system)
      const defaultBinId = mockBins[index % mockBins.length]?.id || '';
      return {
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        partNumber: item.partNumber,
        expectedQty: item.expectedQuantity,
        receivedQty: 0,
        damagedQty: 0,
        binId: defaultBinId, // Auto-populate with default
        primaryBinId: defaultBinId, // Store the default for comparison
        binAssignments: [], // Multiple bin support
        condition: 'good' as ConditionType,
        notes: '',
        lotNumber: '',
        expirationDate: '',
        verified: false,
        putAway: false,
      };
    });
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
  const handleMarkArrived = () => {
    // From Expected (PENDING/CONFIRMED/IN_TRANSIT) -> ARRIVED
    if (!['PENDING', 'CONFIRMED', 'IN_TRANSIT'].includes(shipment.status)) return;
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

  // Packing Slip handlers
  const handlePackingSlipImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPackingSlipImage(reader.result as string);
        setPackingSlipInputMode('scan');
        // Simulate OCR processing
        processPackingSlipImage();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPackingSlipImage(reader.result as string);
          setPackingSlipInputMode('scan');
          processPackingSlipImage();
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const processPackingSlipImage = () => {
    setIsProcessingPackingSlip(true);
    // Simulate OCR processing - in real app this would call an OCR service
    setTimeout(() => {
      // Mock: Generate digitized line items from "scanned" packing slip
      // Simulates messy/nonstandard slips by potentially having repeated or combined lines
      const mockDigitizedItems: PackingSlipLineItem[] = shipment.items.map((item, index) => ({
        id: `PS-${Date.now()}-${index}`,
        partNumber: item.partNumber,
        description: item.productName,
        quantity: item.expectedQuantity,
        matched: true,
        matchedLineItemId: item.id,
      }));

      setPackingSlipLineItems(mockDigitizedItems);
      setIsProcessingPackingSlip(false);
      setPackingSlipCaptured(true);
    }, 2000);
  };

  const handleAddPackingSlipLine = () => {
    setPackingSlipLineItems(prev => [...prev, {
      id: `PS-${Date.now()}`,
      partNumber: '',
      description: '',
      quantity: 0,
      matched: false,
    }]);
  };

  const handleUpdatePackingSlipLine = (id: string, updates: Partial<PackingSlipLineItem>) => {
    setPackingSlipLineItems(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const handleRemovePackingSlipLine = (id: string) => {
    setPackingSlipLineItems(prev => prev.filter(item => item.id !== id));
  };

  const handleMatchPackingSlipLine = (packingSlipId: string, lineItemId: string) => {
    setPackingSlipLineItems(prev => prev.map(item =>
      item.id === packingSlipId ? { ...item, matched: true, matchedLineItemId: lineItemId } : item
    ));
  };

  const handleClearPackingSlip = () => {
    setPackingSlipImage(null);
    setPackingSlipInputMode(null);
    setPackingSlipLineItems([]);
    setPackingSlipCaptured(false);
    setPackingSlipDiscrepancies([]);
  };

  // Incremental receiving / pallet handlers
  const handleIncrementalReceive = (itemId: string, quantity: number) => {
    setLineItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, receivedQty: item.receivedQty + quantity } : item
    ));
  };

  const handleSavePallet = () => {
    const itemsOnPallet = lineItems
      .filter(li => li.receivedQty > 0 && !li.verified)
      .map(li => ({ lineItemId: li.id, quantity: li.receivedQty }));

    if (itemsOnPallet.length > 0) {
      setPalletSessions(prev => [...prev, {
        id: `PALLET-${Date.now()}`,
        palletNumber: currentPalletNumber,
        timestamp: new Date(),
        items: itemsOnPallet,
      }]);
      setCurrentPalletNumber(prev => prev + 1);
      setShowSavePalletConfirm(false);
    }
  };

  // Voice input handler
  const handleVoiceInput = (lineItemId: string) => {
    if (!voiceSupported) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecordingVoice(lineItemId);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setLineItems(prev => prev.map(item =>
        item.id === lineItemId ? { ...item, notes: item.notes ? `${item.notes} ${transcript}` : transcript } : item
      ));
    };

    recognition.onerror = () => {
      setIsRecordingVoice(null);
    };

    recognition.onend = () => {
      setIsRecordingVoice(null);
    };

    recognition.start();
  };

  // Put-away helpers
  const getEmptyBins = () => mockBins.filter(bin => bin.currentQuantity === 0);
  const getLowCapacityBins = () => mockBins.filter(bin => bin.currentQuantity < bin.maxCapacity * 0.5);
  const isNonPrimaryBin = (lineItem: LineItemReceive) => lineItem.binId !== lineItem.primaryBinId;

  const handleOneClickPutAway = (itemId: string) => {
    // One-click confirm for primary bin
    setLineItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, verified: true, putAway: true } : item
    ));
  };

  const handleAddBinAssignment = (lineItemId: string, binId: string, quantity: number) => {
    setLineItems(prev => prev.map(item => {
      if (item.id !== lineItemId) return item;
      const newAssignment: BinAssignment = {
        binId,
        quantity,
        isPrimary: item.binAssignments.length === 0,
      };
      return {
        ...item,
        binAssignments: [...item.binAssignments, newAssignment],
      };
    }));
  };

  const handleResolvePackingSlipDiscrepancy = (index: number) => {
    setPackingSlipDiscrepancies(prev => prev.map((d, i) =>
      i === index ? { ...d, resolved: true } : d
    ));
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
              {palletSessions.length > 0 && ` · ${palletSessions.length} pallet(s) saved`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Save Pallet Button for incremental receiving */}
          {totalReceived > 0 && !allItemsVerified && (
            <button
              onClick={() => setShowSavePalletConfirm(true)}
              className="px-3 py-2 border border-amber-400 text-amber-700 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-amber-50 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="3" width="22" height="5" rx="1"/>
                <path d="M1 8h22v11a2 2 0 01-2 2H3a2 2 0 01-2-2V8z"/>
              </svg>
              Save Pallet #{currentPalletNumber}
            </button>
          )}
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

      {/* Packing Slip Capture Section */}
      {!packingSlipCaptured && (
        <div className="px-4 py-3 border-b border-[var(--border)] bg-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              <span className="text-sm font-medium text-blue-800">Scan Packing Slip</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCameraCapture}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                Camera
              </button>
              <label className="px-3 py-1.5 border border-blue-300 text-blue-700 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-100 transition-colors cursor-pointer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Upload
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePackingSlipImageUpload}
                  className="hidden"
                />
              </label>
              <button
                onClick={() => setPackingSlipInputMode('manual')}
                className="px-3 py-1.5 text-blue-600 text-sm font-medium hover:underline"
              >
                Enter Manually
              </button>
            </div>
          </div>
          {isProcessingPackingSlip && (
            <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Processing packing slip...
            </div>
          )}
        </div>
      )}

      {/* Digital Packing Slip Display */}
      {packingSlipCaptured && packingSlipLineItems.length > 0 && (
        <div className="px-4 py-3 border-b border-[var(--border)] bg-green-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              <span className="text-sm font-medium text-green-800">Packing Slip Captured ({packingSlipLineItems.length} items)</span>
            </div>
            <button
              onClick={handleClearPackingSlip}
              className="text-xs text-green-600 hover:underline"
            >
              Clear & Rescan
            </button>
          </div>
        </div>
      )}

      {/* Progress Bar with incremental tracking */}
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
        {palletSessions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {palletSessions.map((session) => (
              <span key={session.id} className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">
                Pallet #{session.palletNumber}: {session.items.reduce((sum, i) => sum + i.quantity, 0)} units
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Save Pallet Confirmation Modal */}
      {showSavePalletConfirm && (
        <div className="px-4 py-3 border-b border-[var(--border)] bg-amber-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-800">Save current progress as Pallet #{currentPalletNumber}?</p>
              <p className="text-xs text-amber-600 mt-1">You can continue receiving more items after saving.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSavePalletConfirm(false)}
                className="px-3 py-1.5 text-sm text-amber-700 hover:underline"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePallet}
                className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700"
              >
                Save Pallet
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="divide-y divide-[var(--border)]">
        {lineItems.map((lineItem) => {
          const isVerified = lineItem.verified;
          const isPutAway = lineItem.putAway;
          const hasDiscrepancy = discrepancies.some(d => d.lineItemId === lineItem.id);
          const isExpanded = expandedItemId === lineItem.id;
          const hasNotes = lineItem.notes && lineItem.notes.trim().length > 0;
          const isNonPrimary = isNonPrimaryBin(lineItem);
          const remainingToReceive = lineItem.expectedQty - lineItem.receivedQty;

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
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[var(--foreground)]">{lineItem.partNumber}</span>
                    {hasDiscrepancy && (
                      <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="8" x2="12" y2="12"/>
                          <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        Issue
                      </span>
                    )}
                    {lineItem.lotNumber && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                        Lot: {lineItem.lotNumber}
                      </span>
                    )}
                    {/* Notes indicator */}
                    {hasNotes && (
                      <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded flex items-center gap-1" title={lineItem.notes}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                        </svg>
                        Note
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
                      <span className={`text-xs font-medium ${isNonPrimary ? 'text-orange-600' : 'text-amber-600'}`}>
                        Bin {mockBins.find(b => b.id === lineItem.binId)?.letterCode || lineItem.binId}
                        {isNonPrimary && (
                          <span className="ml-1 text-orange-500" title="Not the default bin for this item">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline">
                              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                              <line x1="12" y1="9" x2="12" y2="13"/>
                              <line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  {/* Show inline note preview */}
                  {hasNotes && (
                    <p className="text-xs text-purple-600 mt-1 truncate max-w-xs" title={lineItem.notes}>
                      "{lineItem.notes}"
                    </p>
                  )}
                </div>

                {/* Quantity display */}
                <div className="text-right mr-4">
                  <div className="text-2xl font-bold text-[var(--foreground)]">
                    {lineItem.receivedQty} / {lineItem.expectedQty}
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    {isVerified ? 'verified' : remainingToReceive > 0 ? `${remainingToReceive} remaining` : 'received'}
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
                      onClick={() => handleOneClickPutAway(lineItem.id)}
                      className={`px-4 py-3 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
                        isNonPrimary ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-500 hover:bg-blue-600'
                      }`}
                      title={isNonPrimary ? 'Put away to non-primary bin' : `Put away to Bin ${mockBins.find(b => b.id === lineItem.binId)?.letterCode}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                      </svg>
                      Put Away {mockBins.find(b => b.id === lineItem.binId)?.letterCode}
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

                    {/* Notes Row with Voice Input */}
                    <div>
                      <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                        Notes
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={lineItem.notes}
                          onChange={(e) => handleUpdateLineItem(lineItem.id, { notes: e.target.value })}
                          placeholder="Add notes for this item..."
                          className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                        />
                        {voiceSupported && (
                          <button
                            onClick={() => handleVoiceInput(lineItem.id)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors ${
                              isRecordingVoice === lineItem.id
                                ? 'bg-red-500 text-white animate-pulse'
                                : 'border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]'
                            }`}
                            title={isRecordingVoice === lineItem.id ? 'Recording...' : 'Voice input'}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                              <path d="M19 10v2a7 7 0 01-14 0v-2"/>
                              <line x1="12" y1="19" x2="12" y2="23"/>
                              <line x1="8" y1="23" x2="16" y2="23"/>
                            </svg>
                            {isRecordingVoice === lineItem.id && <span>Recording</span>}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Bin Location Section with improved UX */}
                    <div className="pt-2 border-t border-[var(--border)]">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-sm font-medium text-[var(--foreground)]">Put-Away Location</h5>
                        {lineItem.binId === lineItem.primaryBinId && lineItem.primaryBinId && (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 6L9 17l-5-5"/>
                            </svg>
                            Default bin
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 items-start">
                        <div className="flex-1">
                          <select
                            value={lineItem.binId}
                            onChange={(e) => handleUpdateLineItem(lineItem.id, { binId: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 ${
                              lineItem.binId && lineItem.binId !== lineItem.primaryBinId
                                ? 'border-orange-300 bg-orange-50'
                                : 'border-[var(--border)]'
                            }`}
                          >
                            <option value="">Select bin</option>
                            {/* Primary bin first if exists */}
                            {lineItem.primaryBinId && (
                              <option value={lineItem.primaryBinId} className="font-medium">
                                Bin {mockBins.find(b => b.id === lineItem.primaryBinId)?.letterCode} (Default)
                              </option>
                            )}
                            <optgroup label="Empty Bins">
                              {getEmptyBins().filter(b => b.id !== lineItem.primaryBinId).map((bin) => (
                                <option key={bin.id} value={bin.id}>
                                  Bin {bin.letterCode} - Empty
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="Available Bins">
                              {mockBins.filter(b => b.id !== lineItem.primaryBinId && b.currentQuantity > 0).map((bin) => (
                                <option key={bin.id} value={bin.id}>
                                  Bin {bin.letterCode} ({Math.round((bin.currentQuantity / bin.maxCapacity) * 100)}% full)
                                </option>
                              ))}
                            </optgroup>
                          </select>
                          {lineItem.binId && lineItem.binId !== lineItem.primaryBinId && (
                            <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                                <line x1="12" y1="9" x2="12" y2="13"/>
                                <line x1="12" y1="17" x2="12.01" y2="17"/>
                              </svg>
                              Non-default bin selected
                            </p>
                          )}
                        </div>
                        {/* Quick select for primary bin */}
                        {lineItem.primaryBinId && lineItem.binId !== lineItem.primaryBinId && (
                          <button
                            onClick={() => handleUpdateLineItem(lineItem.id, { binId: lineItem.primaryBinId })}
                            className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                          >
                            Use Default
                          </button>
                        )}
                      </div>

                      {/* Multi-bin support */}
                      {lineItem.binAssignments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-[var(--muted-foreground)]">Additional bins:</p>
                          {lineItem.binAssignments.map((assignment, idx) => (
                            <div key={idx} className="text-xs bg-[var(--muted)]/30 px-2 py-1 rounded flex items-center justify-between">
                              <span>Bin {mockBins.find(b => b.id === assignment.binId)?.letterCode}: {assignment.quantity} units</span>
                            </div>
                          ))}
                        </div>
                      )}
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
            {['PENDING', 'CONFIRMED', 'IN_TRANSIT'].includes(shipment.status) && (
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

        {/* Packing Slip Capture Section - Show when status is ARRIVED */}
        {displayStatus === 'ARRIVED' && !packingSlipCaptured && (
          <div className="bg-[var(--card)] rounded-lg border-2 border-blue-400 p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">Packing Slip Capture</h3>
                  <p className="text-sm text-[var(--muted-foreground)]">Scan or photograph the manufacturer packing slip</p>
                </div>
              </div>
              {isProcessingPackingSlip && (
                <div className="flex items-center gap-2 text-blue-600">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  <span className="text-sm font-medium">Processing packing slip...</span>
                </div>
              )}
            </div>

            {/* Capture Method Selection */}
            {!packingSlipInputMode && !packingSlipImage && (
              <div className="grid grid-cols-3 gap-4 mb-4">
                <button
                  onClick={handleCameraCapture}
                  className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  <span className="text-sm font-medium text-blue-700">Take Photo</span>
                  <span className="text-xs text-[var(--muted-foreground)]">Use camera</span>
                </button>

                <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span className="text-sm font-medium text-blue-700">Upload Image</span>
                  <span className="text-xs text-[var(--muted-foreground)]">From device</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePackingSlipImageUpload}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={() => setPackingSlipInputMode('manual')}
                  className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  <span className="text-sm font-medium text-blue-700">Enter Manually</span>
                  <span className="text-xs text-[var(--muted-foreground)]">Add line items</span>
                </button>
              </div>
            )}

            {/* Image Preview */}
            {packingSlipImage && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[var(--foreground)]">Uploaded Packing Slip</span>
                  <button
                    onClick={handleClearPackingSlip}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
                <div className="relative rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--muted)]/20">
                  <img
                    src={packingSlipImage}
                    alt="Packing Slip"
                    className="w-full max-h-64 object-contain"
                  />
                </div>
              </div>
            )}

            {/* Manual Entry Mode */}
            {packingSlipInputMode === 'manual' && !packingSlipImage && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-[var(--foreground)]">Manual Entry</span>
                  <button
                    onClick={() => setPackingSlipInputMode(null)}
                    className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    Back to options
                  </button>
                </div>

                {/* Packing Slip Line Items Table */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-[var(--foreground)] uppercase">Line Items from Packing Slip</h4>
                    <button
                      onClick={handleAddPackingSlipLine}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Add Line
                    </button>
                  </div>
                  <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[var(--muted)]/30">
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)]">Part #</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)]">Description</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)]">Qty</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)]">Status</th>
                          <th className="px-3 py-2 w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {packingSlipLineItems.map((item) => (
                          <tr key={item.id} className="hover:bg-[var(--muted)]/10">
                            <td className="px-2 py-1">
                              <input
                                type="text"
                                value={item.partNumber}
                                onChange={(e) => {
                                  setPackingSlipLineItems(prev => prev.map(li =>
                                    li.id === item.id ? { ...li, partNumber: e.target.value } : li
                                  ));
                                }}
                                className="w-full px-2 py-1.5 border border-[var(--border)] rounded bg-[var(--background)] text-sm"
                                placeholder="Part number"
                              />
                            </td>
                            <td className="px-2 py-1">
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => {
                                  setPackingSlipLineItems(prev => prev.map(li =>
                                    li.id === item.id ? { ...li, description: e.target.value } : li
                                  ));
                                }}
                                className="w-full px-2 py-1.5 border border-[var(--border)] rounded bg-[var(--background)] text-sm"
                                placeholder="Description"
                              />
                            </td>
                            <td className="px-2 py-1">
                              <input
                                type="number"
                                min="0"
                                value={item.quantity || ''}
                                onChange={(e) => {
                                  setPackingSlipLineItems(prev => prev.map(li =>
                                    li.id === item.id ? { ...li, quantity: parseInt(e.target.value) || 0 } : li
                                  ));
                                }}
                                className="w-20 px-2 py-1.5 border border-[var(--border)] rounded bg-[var(--background)] text-sm"
                                placeholder="0"
                              />
                            </td>
                            <td className="px-2 py-1">
                              {item.matched ? (
                                <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 6L9 17l-5-5"/>
                                  </svg>
                                  Matched
                                </span>
                              ) : (
                                <span className="text-xs text-amber-600">Pending</span>
                              )}
                            </td>
                            <td className="px-2 py-1">
                              {packingSlipLineItems.length > 1 && (
                                <button
                                  onClick={() => {
                                    setPackingSlipLineItems(prev => prev.filter(li => li.id !== item.id));
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

                {/* Action Buttons for Manual Entry */}
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      setPackingSlipInputMode(null);
                      setPackingSlipLineItems([]);
                    }}
                    className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (packingSlipLineItems.length > 0 && packingSlipLineItems.some(li => li.partNumber || li.description)) {
                        setPackingSlipCaptured(true);
                        setPackingSlipInputMode(null);
                      }
                    }}
                    disabled={packingSlipLineItems.length === 0 || !packingSlipLineItems.some(li => li.partNumber || li.description)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    Confirm Packing Slip
                  </button>
                </div>
              </div>
            )}

            {/* Packing Slip Discrepancy Display */}
            {packingSlipDiscrepancies.length > 0 && (
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
                  The following differences were detected between the packing slip and the expected shipment:
                </p>
                <div className="space-y-2">
                  {packingSlipDiscrepancies.map((disc, index) => (
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
                          onClick={() => {
                            setPackingSlipDiscrepancies(prev => prev.map((d, i) =>
                              i === index ? { ...d, resolved: true } : d
                            ));
                          }}
                          className="px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded hover:bg-amber-600 transition-colors"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {packingSlipDiscrepancies.every(d => d.resolved) && (
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <button
                      onClick={() => {
                        setPackingSlipDiscrepancies([]);
                        setPackingSlipCaptured(true);
                      }}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Proceed with Acknowledged Discrepancies
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Packing Slip Captured Badge */}
        {packingSlipCaptured && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-blue-800">Packing Slip Captured</span>
                    <span className="text-sm text-blue-700">
                      {packingSlipImage ? '(Image uploaded)' : `(${packingSlipLineItems.length} line items)`}
                    </span>
                  </div>
                  {packingSlipDiscrepancies.length > 0 && (
                    <span className="text-xs text-amber-600">
                      {packingSlipDiscrepancies.filter(d => d.resolved).length} discrepanc{packingSlipDiscrepancies.filter(d => d.resolved).length === 1 ? 'y' : 'ies'} acknowledged
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {packingSlipImage && (
                  <button
                    onClick={() => window.open(packingSlipImage, '_blank')}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
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
                    setPackingSlipCaptured(false);
                    setPackingSlipDiscrepancies([]);
                  }}
                  className="text-xs text-blue-600 hover:underline"
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
