'use client';

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type {
  DeliveryDiscrepancy,
  LineItemReceive,
  PackingSlipLineItem,
  ScannedPackingSlip,
} from '../types';

// Types
type WarehouseBin = {
  id: string;
  letterCode?: string;
  currentQuantity?: number;
  maxCapacity?: number;
};

type PalletSession = {
  id: string;
  palletNumber: number;
  timestamp: Date;
  items: Array<{ lineItemId: string; quantity: number }>;
};

type DiscrepancyTotals = {
  total: number;
  damage: number;
  shortage: number;
  overage: number;
  wrongItem: number;
  other: number;
};

// Context value interface
interface ReceivingContextValue {
  // State
  lineItems: LineItemReceive[];
  discrepancies: DeliveryDiscrepancy[];
  collapsedItems: Set<string>;
  itemSearchQuery: string;
  palletSessions: PalletSession[];
  currentPalletNumber: number;
  scannedPackingSlips: ScannedPackingSlip[];
  warehouseBins: WarehouseBin[];
  packingSlipLineItems: PackingSlipLineItem[];
  packingSlipCaptured: boolean;
  isProcessingPackingSlip: boolean;
  showSavePalletConfirm: boolean;
  isTransitioning: boolean;
  voiceSupported: boolean;
  isRecordingVoice: string | null;

  // Setters
  setLineItems: React.Dispatch<React.SetStateAction<LineItemReceive[]>>;
  setDiscrepancies: React.Dispatch<React.SetStateAction<DeliveryDiscrepancy[]>>;
  setCollapsedItems: React.Dispatch<React.SetStateAction<Set<string>>>;
  setItemSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  setShowSavePalletConfirm: React.Dispatch<React.SetStateAction<boolean>>;
  setPackingSlipInputMode: React.Dispatch<React.SetStateAction<'scan' | 'manual' | null>>;
  setViewingPackingSlip: React.Dispatch<React.SetStateAction<ScannedPackingSlip | null>>;

  // Actions
  actions: {
    verifyItem: (itemId: string) => void;
    unverifyItem: (itemId: string) => void;
    updateLineItem: (itemId: string, updates: Partial<LineItemReceive>) => void;
    receiveAll: (itemId: string, expectedQty: number) => void;
    oneClickPutAway: (itemId: string) => void;
    savePallet: () => void;
    handleVoiceInput: (lineItemId: string) => void;
    completeReceiving: () => Promise<void>;
    cameraCapture: () => void;
    packingSlipImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    clearPackingSlip: () => void;
  };

  // Computed values
  computed: {
    totalReceived: number;
    totalExpected: number;
    totalIssues: number;
    allItemsVerified: boolean;
    getItemDiscrepancyTotals: (itemId: string) => DiscrepancyTotals;
    getItemAdjustedReceived: (item: LineItemReceive) => number;
    getItemAccountedTotal: (item: LineItemReceive) => number;
    isNonPrimaryBin: (item: LineItemReceive) => boolean;
    getEmptyBins: () => WarehouseBin[];
  };
}

// Create context
const ReceivingContext = createContext<ReceivingContextValue | undefined>(undefined);

// Provider props
interface ReceivingProviderProps {
  children: React.ReactNode;
  lineItems: LineItemReceive[];
  warehouseBins: WarehouseBin[];
  onCompleteReceiving: () => Promise<void>;
  onCameraCapture: () => void;
  onPackingSlipImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearPackingSlip: () => void;
  setLineItems: React.Dispatch<React.SetStateAction<LineItemReceive[]>>;
  setDiscrepancies: React.Dispatch<React.SetStateAction<DeliveryDiscrepancy[]>>;
  setPackingSlipInputMode: React.Dispatch<React.SetStateAction<'scan' | 'manual' | null>>;
  setViewingPackingSlip: React.Dispatch<React.SetStateAction<ScannedPackingSlip | null>>;
  isTransitioning: boolean;
  packingSlipCaptured: boolean;
  packingSlipLineItems: PackingSlipLineItem[];
  isProcessingPackingSlip: boolean;
  scannedPackingSlips: ScannedPackingSlip[];
  palletSessions: PalletSession[];
  currentPalletNumber: number;
  discrepancies: DeliveryDiscrepancy[];
}

export const ReceivingProvider: React.FC<ReceivingProviderProps> = ({
  children,
  lineItems,
  warehouseBins,
  onCompleteReceiving,
  onCameraCapture,
  onPackingSlipImageUpload,
  onClearPackingSlip,
  setLineItems,
  setDiscrepancies: setDiscrepanciesProp,
  setPackingSlipInputMode,
  setViewingPackingSlip,
  isTransitioning,
  packingSlipCaptured,
  packingSlipLineItems,
  isProcessingPackingSlip,
  scannedPackingSlips,
  palletSessions,
  currentPalletNumber,
  discrepancies,
}) => {
  // Local state
  const [collapsedItems, setCollapsedItems] = useState<Set<string>>(new Set());
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [showSavePalletConfirm, setShowSavePalletConfirm] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState<string | null>(null);

  // Check for voice support on mount
  React.useEffect(() => {
    setVoiceSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }, []);

  // Helper function
  const toNumber = useCallback((value: number | string | null | undefined) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }, []);

  // Actions
  const verifyItem = useCallback((itemId: string) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, verified: true } : item))
    );
  }, [setLineItems]);

  const unverifyItem = useCallback((itemId: string) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, verified: false } : item))
    );
  }, [setLineItems]);

  const updateLineItem = useCallback(
    (itemId: string, updates: Partial<LineItemReceive>) => {
      setLineItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item))
      );
    },
    [setLineItems]
  );

  const receiveAll = useCallback(
    (itemId: string, expectedQty: number) => {
      setLineItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, receivedQty: expectedQty, verified: true }
            : item
        )
      );
    },
    [setLineItems]
  );

  const oneClickPutAway = useCallback(
    (itemId: string) => {
      setLineItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, verified: true, putAway: true } : item
        )
      );
    },
    [setLineItems]
  );

  const savePallet = useCallback(() => {
    // Pallet save logic would go here
    setShowSavePalletConfirm(false);
  }, []);

  const handleVoiceInput = useCallback((lineItemId: string) => {
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
      setLineItems((prev) =>
        prev.map((item) =>
          item.id === lineItemId
            ? { ...item, notes: item.notes ? `${item.notes} ${transcript}` : transcript }
            : item
        )
      );
    };

    recognition.onerror = () => {
      setIsRecordingVoice(null);
    };

    recognition.onend = () => {
      setIsRecordingVoice(null);
    };

    recognition.start();
  }, [voiceSupported, setLineItems]);

  // Memoized actions object
  const actions = useMemo(
    () => ({
      verifyItem,
      unverifyItem,
      updateLineItem,
      receiveAll,
      oneClickPutAway,
      savePallet,
      handleVoiceInput,
      completeReceiving: onCompleteReceiving,
      cameraCapture: onCameraCapture,
      packingSlipImageUpload: onPackingSlipImageUpload,
      clearPackingSlip: onClearPackingSlip,
    }),
    [
      verifyItem,
      unverifyItem,
      updateLineItem,
      receiveAll,
      oneClickPutAway,
      savePallet,
      handleVoiceInput,
      onCompleteReceiving,
      onCameraCapture,
      onPackingSlipImageUpload,
      onClearPackingSlip,
    ]
  );

  // Computed values
  const getItemDiscrepancyTotals = useCallback(
    (itemId: string): DiscrepancyTotals => {
      const totals = { total: 0, damage: 0, shortage: 0, overage: 0, wrongItem: 0, other: 0 };
      discrepancies.forEach((disc) => {
        if (disc.lineItemId === itemId) {
          totals.total += disc.quantity;
          if (disc.type === 'damage') totals.damage += disc.quantity;
          else if (disc.type === 'shortage') totals.shortage += disc.quantity;
          else if (disc.type === 'overage') totals.overage += disc.quantity;
          else if (disc.type === 'wrong_item') totals.wrongItem += disc.quantity;
          else totals.other += disc.quantity;
        }
      });
      return totals;
    },
    [discrepancies]
  );

  const getItemAdjustedReceived = useCallback(
    (item: LineItemReceive) => {
      return Math.max(0, toNumber(item.receivedQty));
    },
    [toNumber]
  );

  const getItemAccountedTotal = useCallback(
    (item: LineItemReceive) => {
      const disc = getItemDiscrepancyTotals(item.id);
      const adjustedReceived = getItemAdjustedReceived(item);
      const damagedTotal = toNumber(item.damagedQty) + toNumber(disc.damage);
      return (
        adjustedReceived +
        damagedTotal +
        toNumber(disc.wrongItem) +
        toNumber(disc.other) +
        toNumber(disc.overage)
      );
    },
    [getItemDiscrepancyTotals, getItemAdjustedReceived, toNumber]
  );

  const isNonPrimaryBin = useCallback((item: LineItemReceive) => {
    return item.binId !== item.primaryBinId;
  }, []);

  const getEmptyBins = useCallback(() => {
    return warehouseBins.filter((bin) => (bin.currentQuantity ?? 0) === 0);
  }, [warehouseBins]);

  const totalReceived = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + toNumber(item.receivedQty), 0);
  }, [lineItems, toNumber]);

  const totalExpected = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + toNumber(item.expectedQty), 0);
  }, [lineItems, toNumber]);

  const totalIssues = useMemo(() => {
    return discrepancies.reduce((sum, disc) => sum + disc.quantity, 0);
  }, [discrepancies]);

  const allItemsVerified = useMemo(() => {
    return lineItems.every((item) => item.verified || getItemAccountedTotal(item) >= item.expectedQty);
  }, [lineItems, getItemAccountedTotal]);

  const computed = useMemo(
    () => ({
      totalReceived,
      totalExpected,
      totalIssues,
      allItemsVerified,
      getItemDiscrepancyTotals,
      getItemAdjustedReceived,
      getItemAccountedTotal,
      isNonPrimaryBin,
      getEmptyBins,
    }),
    [
      totalReceived,
      totalExpected,
      totalIssues,
      allItemsVerified,
      getItemDiscrepancyTotals,
      getItemAdjustedReceived,
      getItemAccountedTotal,
      isNonPrimaryBin,
      getEmptyBins,
    ]
  );

  const value: ReceivingContextValue = {
    // State
    lineItems,
    discrepancies,
    collapsedItems,
    itemSearchQuery,
    palletSessions,
    currentPalletNumber,
    scannedPackingSlips,
    warehouseBins,
    packingSlipLineItems,
    packingSlipCaptured,
    isProcessingPackingSlip,
    showSavePalletConfirm,
    isTransitioning,
    voiceSupported,
    isRecordingVoice,

    // Setters
    setLineItems,
    setDiscrepancies: setDiscrepanciesProp,
    setCollapsedItems,
    setItemSearchQuery,
    setShowSavePalletConfirm,
    setPackingSlipInputMode,
    setViewingPackingSlip,

    // Actions
    actions,

    // Computed
    computed,
  };

  return <ReceivingContext.Provider value={value}>{children}</ReceivingContext.Provider>;
};

// Custom hook to use the context
export const useReceivingContext = () => {
  const context = useContext(ReceivingContext);
  if (context === undefined) {
    throw new Error('useReceivingContext must be used within a ReceivingProvider');
  }
  return context;
};
