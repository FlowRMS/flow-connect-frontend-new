'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getCycleCountById,
  updateCycleCountStatus,
  updateCycleCountLineItemWithIssues,
  completeCycleCount,
  addCycleCountActivity,
} from '@/lib/data/warehouse-mock';
import {
  CycleCountDiscrepancyReason,
  CycleCountInventoryIssue,
  CycleCountActivity,
  cycleCountStatusColors,
  cycleCountStatusLabels,
  cycleCountTypeLabels,
  cycleCountPriorityColors,
  cycleCountPriorityLabels,
  cycleCountDiscrepancyReasonLabels,
  cycleCountDiscrepancyReasonColors,
} from '@/lib/types/warehouse';

interface CycleCountDetailContentProps {
  cycleCountId: string;
}

const statusSteps = ['DRAFT', 'SCHEDULED', 'IN_PROGRESS', 'PENDING_REVIEW', 'COMPLETED'] as const;

// Issue type configuration
const issueTypes: { type: CycleCountDiscrepancyReason; label: string; color: string }[] = [
  { type: 'DAMAGE', label: 'Damaged', color: 'bg-red-100 text-red-700 border-red-200' },
  { type: 'MISPLACED', label: 'Missing', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { type: 'OVERAGE', label: 'Overage', color: 'bg-green-100 text-green-700 border-green-200' },
  { type: 'WRONG_LOCATION', label: 'Wrong Item', color: 'bg-purple-100 text-purple-700 border-purple-200' },
];

// State for count values per bin location - issues and notes are now PER BIN
interface BinCountState {
  binLocation: string;
  expectedQty: number;
  countedQty: number;
  isFinalized: boolean;
  issues: CycleCountInventoryIssue[];
  notes: string;
}

interface LineItemCountState {
  lineItemId: string;
  productId: string;
  partNumber: string;
  productName: string;
  lotNumber?: string;
  bins: BinCountState[];
  totalExpected: number;
  totalCounted: number;
}

export default function CycleCountDetailContent({ cycleCountId }: CycleCountDetailContentProps) {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  // Search/filter state
  const [searchQuery, setSearchQuery] = useState('');

  // Scanned bin state
  const [scannedBin, setScannedBin] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  // Activity note state
  const [activityNote, setActivityNote] = useState('');
  const [showActivityInput, setShowActivityInput] = useState(false);

  // Expanded panels - now keyed by "productId:binLocation"
  const [expandedIssuePanel, setExpandedIssuePanel] = useState<string | null>(null);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  const cycleCount = useMemo(() => getCycleCountById(cycleCountId), [cycleCountId, refreshKey]);

  // Initialize count state from line items - issues/notes are per bin
  const [countState, setCountState] = useState<Record<string, LineItemCountState>>(() => {
    if (!cycleCount) return {};
    const state: Record<string, LineItemCountState> = {};

    // Group by product - each line item represents one bin location for a product
    cycleCount.lineItems.forEach(item => {
      const key = item.productId;
      if (!state[key]) {
        state[key] = {
          lineItemId: item.id,
          productId: item.productId,
          partNumber: item.partNumber,
          productName: item.productName,
          lotNumber: item.lotNumber,
          bins: [],
          totalExpected: 0,
          totalCounted: 0,
        };
      }
      state[key].bins.push({
        binLocation: item.binLocation,
        expectedQty: item.systemQuantity,
        countedQty: item.countedQuantity ?? 0,
        isFinalized: item.status === 'counted' || item.status === 'verified',
        issues: item.inventoryIssues || [],
        notes: item.notes || '',
      });
      state[key].totalExpected += item.systemQuantity;
      state[key].totalCounted += item.countedQuantity ?? 0;
    });

    return state;
  });

  // Get all unique bin locations
  const allBinLocations = useMemo(() => {
    const bins = new Set<string>();
    Object.values(countState).forEach(item => {
      item.bins.forEach(bin => bins.add(bin.binLocation));
    });
    return Array.from(bins);
  }, [countState]);

  // Items at scanned bin
  const itemsAtScannedBin = useMemo(() => {
    if (!scannedBin) return [];
    return Object.values(countState).filter(item =>
      item.bins.some(bin => bin.binLocation === scannedBin && !bin.isFinalized)
    );
  }, [scannedBin, countState]);

  // Progress calculations
  const totalItems = Object.values(countState).reduce((sum, item) => sum + item.bins.length, 0);
  const countedItems = Object.values(countState).reduce((sum, item) =>
    sum + item.bins.filter(bin => bin.isFinalized).length, 0
  );
  const itemsWithIssues = Object.values(countState).reduce((sum, item) =>
    sum + item.bins.filter(bin => bin.issues.length > 0).length, 0
  );
  const progress = totalItems > 0 ? Math.round((countedItems / totalItems) * 100) : 0;

  // Handle count value change
  const handleCountChange = useCallback((productId: string, binLocation: string, value: number) => {
    setCountState(prev => {
      const item = prev[productId];
      if (!item) return prev;

      const newBins = item.bins.map(bin =>
        bin.binLocation === binLocation
          ? { ...bin, countedQty: Math.max(0, value) }
          : bin
      );

      return {
        ...prev,
        [productId]: {
          ...item,
          bins: newBins,
          totalCounted: newBins.reduce((sum, b) => sum + (b.isFinalized ? b.countedQty : 0), 0),
        },
      };
    });
  }, []);

  // Finalize a bin count
  const handleFinalize = useCallback((productId: string, binLocation: string) => {
    setCountState(prev => {
      const item = prev[productId];
      if (!item) return prev;

      const newBins = item.bins.map(bin =>
        bin.binLocation === binLocation
          ? { ...bin, isFinalized: true }
          : bin
      );

      return {
        ...prev,
        [productId]: {
          ...item,
          bins: newBins,
          totalCounted: newBins.reduce((sum, b) => sum + (b.isFinalized ? b.countedQty : 0), 0),
        },
      };
    });
  }, []);

  // All present for a bin
  const handleAllPresent = useCallback((productId: string, binLocation: string) => {
    setCountState(prev => {
      const item = prev[productId];
      if (!item) return prev;

      const newBins = item.bins.map(bin =>
        bin.binLocation === binLocation
          ? { ...bin, countedQty: bin.expectedQty, isFinalized: true }
          : bin
      );

      return {
        ...prev,
        [productId]: {
          ...item,
          bins: newBins,
          totalCounted: newBins.reduce((sum, b) => sum + (b.isFinalized ? b.countedQty : 0), 0),
        },
      };
    });
  }, []);

  // Match - count equals system quantity for all bins
  const handleMatch = useCallback((productId: string) => {
    setCountState(prev => {
      const item = prev[productId];
      if (!item) return prev;

      const newBins = item.bins.map(bin => ({
        ...bin,
        countedQty: bin.expectedQty,
        isFinalized: true,
      }));

      return {
        ...prev,
        [productId]: {
          ...item,
          bins: newBins,
          totalCounted: newBins.reduce((sum, b) => sum + b.countedQty, 0),
        },
      };
    });
  }, []);

  // Add issue to a specific bin
  const handleAddIssue = useCallback((productId: string, binLocation: string, issueType: CycleCountDiscrepancyReason) => {
    setCountState(prev => {
      const item = prev[productId];
      if (!item) return prev;

      const newBins = item.bins.map(bin => {
        if (bin.binLocation !== binLocation) return bin;
        // Check if this issue type already exists
        if (bin.issues.some(i => i.type === issueType)) return bin;
        return {
          ...bin,
          issues: [...bin.issues, { type: issueType, quantity: 1, notes: '' }],
        };
      });

      return {
        ...prev,
        [productId]: { ...item, bins: newBins },
      };
    });
  }, []);

  // Update issue for a specific bin
  const handleUpdateIssue = useCallback((productId: string, binLocation: string, issueIndex: number, updates: Partial<CycleCountInventoryIssue>) => {
    setCountState(prev => {
      const item = prev[productId];
      if (!item) return prev;

      const newBins = item.bins.map(bin => {
        if (bin.binLocation !== binLocation) return bin;
        const newIssues = [...bin.issues];
        newIssues[issueIndex] = { ...newIssues[issueIndex], ...updates };
        return { ...bin, issues: newIssues };
      });

      return {
        ...prev,
        [productId]: { ...item, bins: newBins },
      };
    });
  }, []);

  // Remove issue from a specific bin
  const handleRemoveIssue = useCallback((productId: string, binLocation: string, issueIndex: number) => {
    setCountState(prev => {
      const item = prev[productId];
      if (!item) return prev;

      const newBins = item.bins.map(bin => {
        if (bin.binLocation !== binLocation) return bin;
        return {
          ...bin,
          issues: bin.issues.filter((_, i) => i !== issueIndex),
        };
      });

      return {
        ...prev,
        [productId]: { ...item, bins: newBins },
      };
    });
  }, []);

  // Update notes for a specific bin
  const handleUpdateNotes = useCallback((productId: string, binLocation: string, notes: string) => {
    setCountState(prev => {
      const item = prev[productId];
      if (!item) return prev;

      const newBins = item.bins.map(bin =>
        bin.binLocation === binLocation ? { ...bin, notes } : bin
      );

      return {
        ...prev,
        [productId]: { ...item, bins: newBins },
      };
    });
  }, []);

  // Save count to backend
  const handleSaveCount = useCallback((productId: string) => {
    const item = countState[productId];
    if (!item) return;

    // Find the original line item(s) for this product and update each bin
    cycleCount?.lineItems.forEach(lineItem => {
      if (lineItem.productId === productId) {
        const bin = item.bins.find(b => b.binLocation === lineItem.binLocation);
        if (bin && bin.isFinalized) {
          updateCycleCountLineItemWithIssues(
            cycleCountId,
            lineItem.id,
            bin.countedQty,
            bin.issues,
            bin.notes || undefined,
            'current-user',
            'Current User'
          );
        }
      }
    });

    setRefreshKey(prev => prev + 1);
  }, [cycleCountId, cycleCount, countState]);

  // Handle status transitions
  const handleReleaseToWarehouse = useCallback(() => {
    updateCycleCountStatus(cycleCountId, 'IN_PROGRESS', {
      startedAt: new Date().toISOString(),
      startedBy: 'current-user',
    });
    addCycleCountActivity(cycleCountId, 'RELEASED', 'current-user', 'Current User', 'Released to warehouse for counting');
    setRefreshKey(prev => prev + 1);
  }, [cycleCountId]);

  const handleSubmitForReview = useCallback(() => {
    // Save all finalized counts first
    Object.keys(countState).forEach(productId => {
      handleSaveCount(productId);
    });

    updateCycleCountStatus(cycleCountId, 'PENDING_REVIEW');
    addCycleCountActivity(cycleCountId, 'SUBMITTED_FOR_REVIEW', 'current-user', 'Current User', 'Submitted for manager review');
    setRefreshKey(prev => prev + 1);
  }, [cycleCountId, countState, handleSaveCount]);

  const handleComplete = useCallback(() => {
    completeCycleCount(cycleCountId, 'current-user');
    addCycleCountActivity(cycleCountId, 'COMPLETED', 'current-user', 'Current User', 'Cycle count completed');
    setRefreshKey(prev => prev + 1);
  }, [cycleCountId]);

  const handleCancel = useCallback(() => {
    updateCycleCountStatus(cycleCountId, 'CANCELLED');
    addCycleCountActivity(cycleCountId, 'CANCELLED', 'current-user', 'Current User', 'Cycle count cancelled');
    setRefreshKey(prev => prev + 1);
    router.push('/warehouse/cycle-counts');
  }, [cycleCountId, router]);

  const handleAddActivityNote = useCallback(() => {
    if (!activityNote.trim()) return;
    addCycleCountActivity(cycleCountId, 'NOTE_ADDED', 'current-user', 'Current User', activityNote);
    setActivityNote('');
    setShowActivityInput(false);
    setRefreshKey(prev => prev + 1);
  }, [cycleCountId, activityNote]);

  // Clear scanned bin
  const handleClearScan = useCallback(() => {
    setScannedBin(null);
  }, []);

  // Simulate scan
  const handleSimulateScan = useCallback((binLocation: string) => {
    setScannedBin(binLocation);
    setShowScanner(false);
  }, []);

  // Helper to create bin key for expanded panels
  const getBinKey = (productId: string, binLocation: string) => `${productId}:${binLocation}`;

  if (!cycleCount) {
    return (
      <main className="flex-1 overflow-hidden bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-[var(--muted-foreground)]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Cycle Count Not Found</h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">The cycle count you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            href="/warehouse/cycle-counts"
            className="mt-4 inline-block px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium"
          >
            Back to Cycle Counts
          </Link>
        </div>
      </main>
    );
  }

  const isDraft = cycleCount.status === 'DRAFT';
  const isScheduled = cycleCount.status === 'SCHEDULED';
  const isEditable = cycleCount.status === 'IN_PROGRESS';
  const canSubmitForReview = isEditable && countedItems > 0;
  const canComplete = cycleCount.status === 'PENDING_REVIEW';
  const currentStepIndex = statusSteps.indexOf(cycleCount.status as typeof statusSteps[number]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Filter items by search query
  const filteredItems = Object.values(countState).filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.partNumber.toLowerCase().includes(query) ||
      item.productName.toLowerCase().includes(query)
    );
  });

  return (
    <main className="flex-1 overflow-auto bg-[var(--background)]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/warehouse/cycle-counts"
              className="p-2 -ml-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-semibold text-[var(--foreground)]">{cycleCount.cycleCountNumber}</h1>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${cycleCountStatusColors[cycleCount.status]}`}>
                  {cycleCountStatusLabels[cycleCount.status]}
                </span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">
                {cycleCount.warehouseName} | Scheduled: {formatDate(cycleCount.scheduledDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(isDraft || isScheduled) && (
              <button
                onClick={handleReleaseToWarehouse}
                className="px-4 py-2 text-sm bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors flex items-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Release to Warehouse
              </button>
            )}
            {isEditable && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
              >
                Cancel Count
              </button>
            )}
            {canSubmitForReview && (
              <button
                onClick={handleSubmitForReview}
                className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
              >
                Submit for Review
              </button>
            )}
            {canComplete && (
              <button
                onClick={handleComplete}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Complete Count
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Status Steps */}
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4 mb-6">
          <div className="flex items-center justify-between">
            {statusSteps.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const stepLabels: Record<string, string> = {
                'DRAFT': 'Draft',
                'SCHEDULED': 'Scheduled',
                'IN_PROGRESS': 'In Progress',
                'PENDING_REVIEW': 'Review',
                'COMPLETED': 'Completed',
              };
              return (
                <React.Fragment key={step}>
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                      isCompleted ? 'bg-green-500 text-white' :
                      isCurrent ? 'bg-blue-500 text-white' :
                      'bg-[var(--muted)] text-[var(--muted-foreground)]'
                    }`}>
                      {isCompleted ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span className={`text-sm ${isCurrent ? 'font-medium text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}`}>
                      {stepLabels[step]}
                    </span>
                  </div>
                  {index < statusSteps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-3 ${isCompleted ? 'bg-green-500' : 'bg-[var(--border)]'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Counting Mode Card - Only show when in progress */}
        {isEditable && (
          <div className="bg-[var(--card)] rounded-lg border-2 border-yellow-400 overflow-hidden mb-6">
            {/* Counting Mode Header */}
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
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">Counting Mode</h3>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {countedItems} of {totalItems} items counted {itemsWithIssues > 0 && `• ${itemsWithIssues} with issues`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowScanner(true)}
                  className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm font-medium hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                  </svg>
                  Scan Bin
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-200">
              <div className="bg-yellow-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-yellow-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Scanned Bin Panel */}
            {scannedBin && (
              <div className="px-4 py-3 bg-blue-50 border-b border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span className="font-medium text-blue-800">{scannedBin}</span>
                  </div>
                  <button
                    onClick={handleClearScan}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                    Clear
                  </button>
                </div>
                {itemsAtScannedBin.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-blue-600 mb-2">Count these items at this location:</p>
                    {itemsAtScannedBin.map((item) => {
                      const bin = item.bins.find(b => b.binLocation === scannedBin);
                      if (!bin) return null;
                      return (
                        <div key={item.productId} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-blue-200">
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-sm">{item.partNumber}</span>
                            <p className="text-xs text-[var(--muted-foreground)] truncate">{item.productName}</p>
                          </div>
                          <div className="text-sm text-[var(--muted-foreground)]">
                            Count <span className="font-semibold text-[var(--foreground)]">{bin.expectedQty}</span>
                          </div>
                          <button
                            onClick={() => handleAllPresent(item.productId, scannedBin)}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
                          >
                            All Present
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-blue-600">No items to count at this location (all finalized)</p>
                )}
              </div>
            )}

            {/* Search bar */}
            <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
              <div className="relative">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                >
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search by part number or product name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Items to Count */}
            <div className="divide-y divide-[var(--border)]">
              {filteredItems.map((item) => {
                const allFinalized = item.bins.every(bin => bin.isFinalized);
                const totalIssues = item.bins.reduce((sum, bin) => sum + bin.issues.length, 0);

                return (
                  <div
                    key={item.productId}
                    className={`transition-colors ${allFinalized ? 'bg-green-50' : ''}`}
                  >
                    {/* Product Header Row */}
                    <div className="p-4 flex items-start gap-4">
                      {/* Status indicator */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        allFinalized ? 'bg-green-500' : 'bg-[var(--muted)]'
                      }`}>
                        {allFinalized ? (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : (
                          <span className="text-lg font-bold text-white">{item.totalExpected}</span>
                        )}
                      </div>

                      {/* Product info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-[var(--foreground)]">{item.partNumber}</span>
                          {totalIssues > 0 && (
                            <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
                              {totalIssues} issue{totalIssues !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[var(--muted-foreground)] truncate">{item.productName}</p>
                        {item.lotNumber && (
                          <p className="text-xs text-[var(--muted-foreground)]">Lot: {item.lotNumber}</p>
                        )}
                      </div>

                      {/* Quantity display */}
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[var(--foreground)]">
                          {item.totalCounted} / {item.totalExpected}
                        </div>
                        <div className="text-xs text-[var(--muted-foreground)]">counted</div>
                      </div>

                      {/* Match All button */}
                      {!allFinalized && (
                        <button
                          onClick={() => handleMatch(item.productId)}
                          className="px-3 py-2 bg-green-500 text-white rounded-lg font-medium text-sm hover:bg-green-600 transition-colors flex items-center gap-1 flex-shrink-0"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M20 6L9 17l-5-5"/>
                          </svg>
                          Match All
                        </button>
                      )}
                    </div>

                    {/* Bin Location Rows */}
                    <div className="px-4 pb-4 ml-16 space-y-2">
                      {item.bins.map((bin, idx) => {
                        const binKey = getBinKey(item.productId, bin.binLocation);
                        const showingIssues = expandedIssuePanel === binKey;
                        const isNoteExpanded = expandedNoteId === binKey;
                        const hasNote = !!bin.notes;
                        const hasIssues = bin.issues.length > 0;

                        return (
                          <div key={bin.binLocation}>
                            {/* Bin Row */}
                            <div
                              className={`flex items-center gap-3 p-3 rounded-lg border ${
                                bin.isFinalized
                                  ? bin.countedQty >= bin.expectedQty ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
                                  : 'bg-[var(--muted)]/30 border-[var(--border)]'
                              }`}
                            >
                              {/* Priority indicator */}
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                                bin.isFinalized ? 'bg-green-500 text-white' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                              }`}>
                                {bin.isFinalized ? (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                ) : idx + 1}
                              </div>

                              {/* Location name */}
                              <div className="flex items-center gap-1.5 min-w-0">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)] flex-shrink-0">
                                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                                  <circle cx="12" cy="10" r="3"/>
                                </svg>
                                <span className="text-sm font-medium truncate">{bin.binLocation}</span>
                                {hasNote && !isNoteExpanded && (
                                  <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" title="Has note"/>
                                )}
                                {hasIssues && (
                                  <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded flex-shrink-0">
                                    {bin.issues.length}
                                  </span>
                                )}
                              </div>

                              {/* Expected qty */}
                              <div className="text-sm text-[var(--muted-foreground)] flex-shrink-0">
                                of <span className="font-semibold text-[var(--foreground)]">{bin.expectedQty}</span>
                              </div>

                              {/* Count input */}
                              {bin.isFinalized ? (
                                <div className={`w-16 h-8 flex items-center justify-center text-sm font-semibold rounded flex-shrink-0 ${
                                  bin.countedQty >= bin.expectedQty ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {bin.countedQty}
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  value={bin.countedQty}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                    handleCountChange(item.productId, bin.binLocation, val === '' ? 0 : parseInt(val));
                                  }}
                                  onFocus={(e) => e.target.select()}
                                  className="w-16 h-8 text-center text-sm font-semibold border rounded border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 flex-shrink-0"
                                />
                              )}

                              {/* Note button */}
                              <button
                                onClick={() => setExpandedNoteId(isNoteExpanded ? null : binKey)}
                                className={`p-1.5 border rounded transition-colors flex-shrink-0 ${
                                  hasNote
                                    ? 'border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100'
                                    : 'border-[var(--border)] hover:bg-[var(--muted)] text-[var(--muted-foreground)]'
                                }`}
                                title="Add note"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                                </svg>
                              </button>

                              {/* Issues button */}
                              <button
                                onClick={() => setExpandedIssuePanel(showingIssues ? null : binKey)}
                                className={`p-1.5 border rounded transition-colors flex-shrink-0 ${
                                  showingIssues || hasIssues
                                    ? 'border-orange-300 bg-orange-50 text-orange-600 hover:bg-orange-100'
                                    : 'border-[var(--border)] hover:bg-[var(--muted)] text-[var(--muted-foreground)]'
                                }`}
                                title="Add issue"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                                </svg>
                              </button>

                              {/* Actions */}
                              {!bin.isFinalized ? (
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button
                                    onClick={() => handleAllPresent(item.productId, bin.binLocation)}
                                    className="px-2 py-1.5 text-xs font-medium text-green-700 bg-green-100 border border-green-200 rounded hover:bg-green-200 transition-colors"
                                  >
                                    All Present
                                  </button>
                                  <button
                                    onClick={() => handleFinalize(item.productId, bin.binLocation)}
                                    className="px-3 py-1.5 text-xs font-medium text-white bg-yellow-500 rounded hover:bg-yellow-600 transition-colors"
                                  >
                                    Finalize
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setCountState(prev => {
                                      const current = prev[item.productId];
                                      if (!current) return prev;
                                      const newBins = current.bins.map(b =>
                                        b.binLocation === bin.binLocation ? { ...b, isFinalized: false } : b
                                      );
                                      return {
                                        ...prev,
                                        [item.productId]: { ...current, bins: newBins },
                                      };
                                    });
                                  }}
                                  className="px-2 py-1 text-xs font-medium text-[var(--muted-foreground)] border border-[var(--border)] rounded hover:bg-[var(--muted)] transition-colors flex-shrink-0"
                                >
                                  Undo
                                </button>
                              )}
                            </div>

                            {/* Note input for this bin */}
                            {isNoteExpanded && (
                              <div className="mt-2 ml-9 flex gap-2">
                                <input
                                  type="text"
                                  value={bin.notes}
                                  onChange={(e) => handleUpdateNotes(item.productId, bin.binLocation, e.target.value)}
                                  placeholder="Add a note for this bin location..."
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
                            )}

                            {/* Issue Panel for this bin */}
                            {showingIssues && (
                              <div className="mt-2 ml-9 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-xs font-semibold text-orange-800">Issues at {bin.binLocation}</h4>
                                  <button
                                    onClick={() => setExpandedIssuePanel(null)}
                                    className="text-orange-600 hover:text-orange-800"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M18 6L6 18M6 6l12 12"/>
                                    </svg>
                                  </button>
                                </div>

                                {/* Issue Type Buttons */}
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                  {issueTypes.map(({ type, label }) => {
                                    const hasIssue = bin.issues.some(i => i.type === type);
                                    return (
                                      <button
                                        key={type}
                                        onClick={() => handleAddIssue(item.productId, bin.binLocation, type)}
                                        disabled={hasIssue}
                                        className={`px-2 py-1 rounded text-xs font-medium transition-colors border ${
                                          hasIssue
                                            ? 'bg-orange-200 text-orange-800 cursor-not-allowed border-orange-300'
                                            : 'bg-white text-orange-700 border-orange-200 hover:bg-orange-100'
                                        }`}
                                      >
                                        + {label}
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Added Issues */}
                                {bin.issues.length > 0 && (
                                  <div className="space-y-2">
                                    {bin.issues.map((issue, issueIdx) => {
                                      const issueConfig = issueTypes.find(t => t.type === issue.type);
                                      return (
                                        <div key={issueIdx} className="bg-white rounded-lg border border-orange-200 p-2">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${issueConfig?.color || 'bg-gray-100 text-gray-700'}`}>
                                              {cycleCountDiscrepancyReasonLabels[issue.type]}
                                            </span>
                                            <button
                                              onClick={() => handleRemoveIssue(item.productId, bin.binLocation, issueIdx)}
                                              className="text-red-500 hover:text-red-700"
                                            >
                                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M18 6L6 18M6 6l12 12"/>
                                              </svg>
                                            </button>
                                          </div>

                                          <div className="grid grid-cols-2 gap-2">
                                            <div>
                                              <label className="block text-[10px] font-medium text-[var(--muted-foreground)] mb-0.5">
                                                Qty
                                              </label>
                                              <div className="flex items-center gap-1">
                                                <button
                                                  onClick={() => handleUpdateIssue(item.productId, bin.binLocation, issueIdx, { quantity: Math.max(0, issue.quantity - 1) })}
                                                  className="w-6 h-6 flex items-center justify-center border border-[var(--border)] rounded text-xs hover:bg-[var(--muted)]"
                                                >
                                                  -
                                                </button>
                                                <input
                                                  type="number"
                                                  value={issue.quantity}
                                                  onChange={(e) => handleUpdateIssue(item.productId, bin.binLocation, issueIdx, { quantity: parseInt(e.target.value) || 0 })}
                                                  onFocus={(e) => e.target.select()}
                                                  min={1}
                                                  className="w-12 px-1 py-1 text-xs text-center border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-orange-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <button
                                                  onClick={() => handleUpdateIssue(item.productId, bin.binLocation, issueIdx, { quantity: issue.quantity + 1 })}
                                                  className="w-6 h-6 flex items-center justify-center border border-[var(--border)] rounded text-xs hover:bg-[var(--muted)]"
                                                >
                                                  +
                                                </button>
                                              </div>
                                            </div>

                                            <div className="col-span-2">
                                              <label className="block text-[10px] font-medium text-[var(--muted-foreground)] mb-0.5">
                                                Note
                                              </label>
                                              <input
                                                type="text"
                                                value={issue.notes || ''}
                                                onChange={(e) => handleUpdateIssue(item.productId, bin.binLocation, issueIdx, { notes: e.target.value })}
                                                placeholder="Describe the issue..."
                                                className="w-full px-2 py-1 text-xs border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-orange-500"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {bin.issues.length === 0 && (
                                  <p className="text-xs text-orange-600 text-center py-2">
                                    Click an issue type above to report an issue
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Two Column Layout for Details */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - 2/3 width - Summary & Details */}
          <div className="col-span-2 space-y-6">
            {/* Count Summary */}
            {!isEditable && (
              <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
                <h3 className="font-medium text-[var(--foreground)] mb-4">Count Summary</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-[var(--muted)]/30 rounded-lg">
                    <div className="text-2xl font-bold text-[var(--foreground)]">{totalItems}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">Total Items</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{countedItems}</div>
                    <div className="text-xs text-green-700">Counted</div>
                  </div>
                  <div className="text-center p-3 bg-[var(--muted)]/30 rounded-lg">
                    <div className="text-2xl font-bold text-[var(--foreground)]">{totalItems - countedItems}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">Remaining</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{itemsWithIssues}</div>
                    <div className="text-xs text-orange-700">With Issues</div>
                  </div>
                </div>
              </div>
            )}

            {/* Details Card */}
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <h3 className="font-medium text-[var(--foreground)] mb-3">Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[var(--muted-foreground)]">Type</span>
                  <p className="font-medium">{cycleCountTypeLabels[cycleCount.type]}</p>
                </div>
                <div>
                  <span className="text-[var(--muted-foreground)]">Priority</span>
                  <p>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${cycleCountPriorityColors[cycleCount.priority]}`}>
                      {cycleCountPriorityLabels[cycleCount.priority]}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-[var(--muted-foreground)]">Assigned To</span>
                  <p className="font-medium">{cycleCount.assignedToName || 'Unassigned'}</p>
                </div>
                <div>
                  <span className="text-[var(--muted-foreground)]">Scheduled Date</span>
                  <p className="font-medium">{formatDate(cycleCount.scheduledDate)}</p>
                </div>
                {cycleCount.startedAt && (
                  <div>
                    <span className="text-[var(--muted-foreground)]">Started</span>
                    <p className="font-medium">{formatDateTime(cycleCount.startedAt)}</p>
                  </div>
                )}
                {cycleCount.completedAt && (
                  <div>
                    <span className="text-[var(--muted-foreground)]">Completed</span>
                    <p className="font-medium">{formatDateTime(cycleCount.completedAt)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - 1/3 width - Activity */}
          <div className="space-y-6">
            {/* Activity Feed */}
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
              <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                    <path d="M12 8v4l3 3"/>
                    <circle cx="12" cy="12" r="10"/>
                  </svg>
                  <h3 className="font-medium text-[var(--foreground)]">Activity</h3>
                </div>
                <button
                  onClick={() => setShowActivityInput(!showActivityInput)}
                  className="text-xs text-[var(--primary)] hover:underline"
                >
                  Add Note
                </button>
              </div>

              {/* Add Note Input */}
              {showActivityInput && (
                <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
                  <textarea
                    value={activityNote}
                    onChange={(e) => setActivityNote(e.target.value)}
                    placeholder="Add a note..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => { setShowActivityInput(false); setActivityNote(''); }}
                      className="px-3 py-1 text-xs text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddActivityNote}
                      disabled={!activityNote.trim()}
                      className="px-3 py-1 text-xs bg-[var(--primary)] text-white rounded hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}

              {/* Activity List */}
              <div className="max-h-[400px] overflow-y-auto">
                {cycleCount.activities && cycleCount.activities.length > 0 ? (
                  <div className="divide-y divide-[var(--border)]">
                    {[...cycleCount.activities].reverse().map((activity) => (
                      <ActivityItem key={activity.id} activity={activity} />
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                    No activity yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="text-lg font-semibold">Scan Bin QR Code</h3>
              <button
                onClick={() => setShowScanner(false)}
                className="p-1 hover:bg-[var(--muted)] rounded transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="relative bg-black aspect-square flex items-center justify-center">
              <div className="absolute inset-4 border-2 border-white/30 rounded-lg">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
              </div>
              <div className="absolute inset-x-8 h-0.5 bg-yellow-400 animate-pulse" style={{ top: '50%' }} />
              <div className="text-white/50">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                </svg>
              </div>
              <p className="absolute bottom-4 left-0 right-0 text-center text-white/70 text-sm">
                Point camera at bin QR code
              </p>
            </div>

            <div className="px-4 py-4 bg-[var(--muted)]/30 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--muted-foreground)] mb-3 text-center">
                Camera access required. For demo, select a bin:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {allBinLocations.map(bin => (
                  <button
                    key={bin}
                    onClick={() => handleSimulateScan(bin)}
                    className="px-3 py-1.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                  >
                    {bin}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// Activity Item Component
function ActivityItem({ activity }: { activity: CycleCountActivity }) {
  const getActivityIcon = (type: CycleCountActivity['type']) => {
    switch (type) {
      case 'CREATED':
        return <path d="M12 5v14M5 12h14"/>;
      case 'RELEASED':
        return <path d="M5 12h14M12 5l7 7-7 7"/>;
      case 'ITEM_COUNTED':
        return <path d="M20 6L9 17l-5-5"/>;
      case 'ITEM_VERIFIED':
        return <><path d="M20 6L9 17l-5-5"/><circle cx="12" cy="12" r="10"/></>;
      case 'ITEM_SKIPPED':
        return <path d="M5 5l14 14M19 5L5 19"/>;
      case 'DISCREPANCY_REPORTED':
        return <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></>;
      case 'NOTE_ADDED':
        return <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>;
      case 'SUBMITTED_FOR_REVIEW':
        return <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></>;
      case 'COMPLETED':
        return <><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></>;
      case 'CANCELLED':
        return <><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></>;
      default:
        return <circle cx="12" cy="12" r="10"/>;
    }
  };

  const getActivityColor = (type: CycleCountActivity['type']) => {
    switch (type) {
      case 'CREATED': return 'text-blue-500';
      case 'RELEASED': return 'text-cyan-500';
      case 'ITEM_COUNTED': return 'text-green-500';
      case 'ITEM_VERIFIED': return 'text-green-600';
      case 'ITEM_SKIPPED': return 'text-gray-500';
      case 'DISCREPANCY_REPORTED': return 'text-orange-500';
      case 'NOTE_ADDED': return 'text-purple-500';
      case 'SUBMITTED_FOR_REVIEW': return 'text-orange-500';
      case 'COMPLETED': return 'text-green-600';
      case 'CANCELLED': return 'text-red-500';
      default: return 'text-[var(--muted-foreground)]';
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="px-4 py-3 flex gap-3">
      <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center ${getActivityColor(activity.type)}`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {getActivityIcon(activity.type)}
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--foreground)]">
          {activity.content || activity.type.replace(/_/g, ' ').toLowerCase()}
        </p>
        {activity.metadata?.partNumber && (
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            {activity.metadata.partNumber}
            {activity.metadata.variance !== undefined && activity.metadata.variance !== 0 && (
              <span className={activity.metadata.variance > 0 ? 'text-green-600' : 'text-red-600'}>
                {' '}({activity.metadata.variance > 0 ? '+' : ''}{activity.metadata.variance})
              </span>
            )}
          </p>
        )}
        {activity.metadata?.issues && activity.metadata.issues.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {activity.metadata.issues.map((issue, idx) => (
              <span
                key={idx}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${cycleCountDiscrepancyReasonColors[issue.type]}`}
              >
                {issue.quantity} {cycleCountDiscrepancyReasonLabels[issue.type]}
              </span>
            ))}
          </div>
        )}
        <p className="text-xs text-[var(--muted-foreground)] mt-1">
          {activity.createdByName} • {formatTime(activity.timestamp)}
        </p>
      </div>
    </div>
  );
}
