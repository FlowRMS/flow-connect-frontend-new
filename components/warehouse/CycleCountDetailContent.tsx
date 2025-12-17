'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getCycleCountById,
  updateCycleCountStatus,
  updateCycleCountLineItem,
  completeCycleCount,
} from '@/lib/data/warehouse-mock';
import {
  CycleCountLineItem,
  CycleCountDiscrepancyReason,
  cycleCountStatusColors,
  cycleCountStatusLabels,
  cycleCountTypeLabels,
  cycleCountPriorityColors,
  cycleCountPriorityLabels,
  cycleCountDiscrepancyReasonLabels,
} from '@/lib/types/warehouse';

interface CycleCountDetailContentProps {
  cycleCountId: string;
}

const statusSteps = ['DRAFT', 'SCHEDULED', 'IN_PROGRESS', 'PENDING_REVIEW', 'COMPLETED'] as const;

export default function CycleCountDetailContent({ cycleCountId }: CycleCountDetailContentProps) {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const [countValues, setCountValues] = useState<Record<string, string>>({});
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  // Discrepancy feedback state
  const [expandedDiscrepancyId, setExpandedDiscrepancyId] = useState<string | null>(null);
  const [discrepancyReasons, setDiscrepancyReasons] = useState<Record<string, CycleCountDiscrepancyReason>>({});
  const [damageNotes, setDamageNotes] = useState<Record<string, string>>({});
  const [misplacedNotes, setMisplacedNotes] = useState<Record<string, string>>({});
  const [correctLocations, setCorrectLocations] = useState<Record<string, string>>({});

  const cycleCount = useMemo(() => getCycleCountById(cycleCountId), [cycleCountId, refreshKey]);

  const handleCountItem = useCallback((lineItemId: string, quantity: number, note?: string) => {
    const reason = discrepancyReasons[lineItemId];
    const damageNote = damageNotes[lineItemId];
    const misplacedNote = misplacedNotes[lineItemId];
    const correctLocation = correctLocations[lineItemId];

    updateCycleCountLineItem(cycleCountId, lineItemId, {
      countedQuantity: quantity,
      status: 'counted',
      countedBy: 'current-user',
      countedByName: 'Current User',
      countedAt: new Date().toISOString(),
      notes: note,
      discrepancyReason: reason,
      damageNotes: damageNote,
      misplacedNotes: misplacedNote,
      correctLocation: correctLocation,
      isMatch: false,
    });
    setRefreshKey(prev => prev + 1);
    setExpandedNoteId(null);
    setExpandedDiscrepancyId(null);
    setCountValues(prev => ({ ...prev, [lineItemId]: '' }));
    setItemNotes(prev => ({ ...prev, [lineItemId]: '' }));
    setDiscrepancyReasons(prev => { const n = {...prev}; delete n[lineItemId]; return n; });
    setDamageNotes(prev => { const n = {...prev}; delete n[lineItemId]; return n; });
    setMisplacedNotes(prev => { const n = {...prev}; delete n[lineItemId]; return n; });
    setCorrectLocations(prev => { const n = {...prev}; delete n[lineItemId]; return n; });
  }, [cycleCountId, discrepancyReasons, damageNotes, misplacedNotes, correctLocations]);

  const handleCountSameAsSystem = useCallback((lineItemId: string, systemQty: number) => {
    // When matching, it's a simple match with no discrepancy
    updateCycleCountLineItem(cycleCountId, lineItemId, {
      countedQuantity: systemQty,
      status: 'counted',
      countedBy: 'current-user',
      countedByName: 'Current User',
      countedAt: new Date().toISOString(),
      isMatch: true,
    });
    setRefreshKey(prev => prev + 1);
  }, [cycleCountId]);

  const handleVerifyItem = useCallback((lineItemId: string) => {
    updateCycleCountLineItem(cycleCountId, lineItemId, {
      status: 'verified',
      verifiedBy: 'current-user',
      verifiedByName: 'Current User',
      verifiedAt: new Date().toISOString(),
    });
    setRefreshKey(prev => prev + 1);
  }, [cycleCountId]);

  const handleSkipItem = useCallback((lineItemId: string) => {
    updateCycleCountLineItem(cycleCountId, lineItemId, {
      status: 'skipped',
    });
    setRefreshKey(prev => prev + 1);
  }, [cycleCountId]);

  const handleSubmitForReview = useCallback(() => {
    updateCycleCountStatus(cycleCountId, 'PENDING_REVIEW');
    setRefreshKey(prev => prev + 1);
  }, [cycleCountId]);

  const handleComplete = useCallback(() => {
    completeCycleCount(cycleCountId, 'current-user');
    setRefreshKey(prev => prev + 1);
  }, [cycleCountId]);

  const handleCancel = useCallback(() => {
    updateCycleCountStatus(cycleCountId, 'CANCELLED');
    setRefreshKey(prev => prev + 1);
    router.push('/warehouse/cycle-counts');
  }, [cycleCountId, router]);

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

  const progress = cycleCount.totalItems > 0 ? Math.round((cycleCount.countedItems / cycleCount.totalItems) * 100) : 0;
  const isEditable = cycleCount.status === 'IN_PROGRESS';
  const canSubmitForReview = isEditable && cycleCount.countedItems > 0;
  const canComplete = cycleCount.status === 'PENDING_REVIEW';
  const currentStepIndex = statusSteps.indexOf(cycleCount.status as typeof statusSteps[number]);

  const pendingItems = cycleCount.lineItems.filter(item => item.status === 'pending');
  const countedItems = cycleCount.lineItems.filter(item => item.status === 'counted' || item.status === 'verified');

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

        {/* Counting Mode Card */}
        {isEditable && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-400 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                  <rect x="9" y="3" width="6" height="4" rx="1"/>
                  <path d="M9 14l2 2 4-4"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-yellow-900">Counting Mode</h3>
                <p className="text-sm text-yellow-700">
                  {cycleCount.countedItems} of {cycleCount.totalItems} items counted • {cycleCount.itemsWithVariance > 0 ? `${cycleCount.itemsWithVariance} variances found` : 'No variances'}
                </p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 bg-yellow-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-yellow-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-sm font-medium text-yellow-900">{progress}%</span>
            </div>
          </div>
        )}

        {/* Items to Count */}
        {pendingItems.length > 0 && (
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] mb-6">
            {pendingItems.map((item) => {
              const countValue = countValues[item.id] || '';
              const noteValue = itemNotes[item.id] || '';
              const showNote = expandedNoteId === item.id;
              const showDiscrepancy = expandedDiscrepancyId === item.id;
              const hasDiscrepancy = countValue !== '' && parseInt(countValue, 10) !== item.systemQuantity;
              const selectedReason = discrepancyReasons[item.id];
              return (
                <div key={item.id} className="border-b border-[var(--border)] last:border-b-0">
                  {/* Single Row Layout */}
                  <div className="p-4 flex items-center gap-4">
                    {/* Product Info */}
                    <div className="min-w-0 w-48">
                      <p className="font-medium text-[var(--foreground)]">{item.partNumber}</p>
                      <p className="text-sm text-[var(--muted-foreground)] truncate">{item.productName}</p>
                    </div>

                    {/* Location */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--foreground)]">{item.binLocation}</p>
                      <p className="text-xs text-[var(--muted-foreground)] truncate">{item.fullLocationPath}</p>
                    </div>

                    {/* System Qty */}
                    <div className="text-center w-20">
                      <p className="text-xs text-[var(--muted-foreground)] uppercase">System</p>
                      <p className="text-xl font-bold">{item.systemQuantity}</p>
                    </div>

                    {/* Count Input */}
                    <input
                      type="number"
                      value={countValue}
                      onChange={(e) => setCountValues(prev => ({ ...prev, [item.id]: e.target.value }))}
                      placeholder="Qty"
                      className={`w-20 px-3 py-2 text-lg font-semibold text-center border rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                        hasDiscrepancy ? 'border-red-400 bg-red-50' : 'border-[var(--border)]'
                      }`}
                    />

                    {/* Actions */}
                    <button
                      onClick={() => {
                        if (countValue !== '' && hasDiscrepancy && !selectedReason) {
                          setExpandedDiscrepancyId(item.id);
                        } else if (countValue !== '') {
                          handleCountItem(item.id, parseInt(countValue, 10), noteValue || undefined);
                        }
                      }}
                      disabled={countValue === ''}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        countValue !== ''
                          ? hasDiscrepancy ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {hasDiscrepancy ? 'Discrepancy' : 'Submit'}
                    </button>

                    <button
                      onClick={() => handleCountSameAsSystem(item.id, item.systemQuantity)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center gap-2"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                      Match
                    </button>

                    <button
                      onClick={() => handleSkipItem(item.id)}
                      className="px-3 py-2 text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
                    >
                      Skip
                    </button>

                    <button
                      onClick={() => setExpandedNoteId(showNote ? null : item.id)}
                      className={`p-2 rounded-lg transition-colors ${showNote ? 'bg-blue-100 text-blue-600' : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)]'}`}
                      title="Add note"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  </div>

                  {/* Discrepancy Feedback Panel (expandable) */}
                  {showDiscrepancy && hasDiscrepancy && (
                    <div className="px-4 pb-4 bg-red-50 border-t border-red-200">
                      <div className="py-3">
                        <p className="text-sm font-medium text-red-800 mb-3">
                          Variance: {parseInt(countValue, 10) - item.systemQuantity > 0 ? '+' : ''}{parseInt(countValue, 10) - item.systemQuantity} units
                        </p>

                        {/* Reason Selection */}
                        <div className="mb-4">
                          <label className="block text-xs font-medium text-red-700 mb-2">What caused this discrepancy?</label>
                          <div className="flex flex-wrap gap-2">
                            {(Object.keys(cycleCountDiscrepancyReasonLabels) as CycleCountDiscrepancyReason[]).map(reason => (
                              <button
                                key={reason}
                                type="button"
                                onClick={() => setDiscrepancyReasons(prev => ({ ...prev, [item.id]: reason }))}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                  selectedReason === reason
                                    ? 'bg-red-600 text-white'
                                    : 'bg-white text-red-700 border border-red-200 hover:bg-red-100'
                                }`}
                              >
                                {cycleCountDiscrepancyReasonLabels[reason]}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Damage Notes */}
                        {selectedReason === 'DAMAGE' && (
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-red-700 mb-1">Describe the damage</label>
                            <textarea
                              value={damageNotes[item.id] || ''}
                              onChange={(e) => setDamageNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                              placeholder="Describe the type and extent of damage..."
                              rows={2}
                              className="w-full px-3 py-2 text-sm border border-red-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
                            />
                          </div>
                        )}

                        {/* Misplaced Notes */}
                        {selectedReason === 'MISPLACED' && (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-red-700 mb-1">Where was the product found?</label>
                              <input
                                type="text"
                                value={correctLocations[item.id] || ''}
                                onChange={(e) => setCorrectLocations(prev => ({ ...prev, [item.id]: e.target.value }))}
                                placeholder="e.g., Shelf 2A, Bin C"
                                className="w-full px-3 py-2 text-sm border border-red-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-red-700 mb-1">Additional notes</label>
                              <textarea
                                value={misplacedNotes[item.id] || ''}
                                onChange={(e) => setMisplacedNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                                placeholder="Any other details about the misplacement..."
                                rows={2}
                                className="w-full px-3 py-2 text-sm border border-red-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
                              />
                            </div>
                          </div>
                        )}

                        {/* General Note */}
                        {selectedReason && selectedReason !== 'DAMAGE' && selectedReason !== 'MISPLACED' && (
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-red-700 mb-1">Additional notes (optional)</label>
                            <textarea
                              value={itemNotes[item.id] || ''}
                              onChange={(e) => setItemNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                              placeholder="Add any additional details..."
                              rows={2}
                              className="w-full px-3 py-2 text-sm border border-red-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
                            />
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end gap-2 mt-4">
                          <button
                            onClick={() => {
                              setExpandedDiscrepancyId(null);
                              setDiscrepancyReasons(prev => { const n = {...prev}; delete n[item.id]; return n; });
                            }}
                            className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:bg-white rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              if (selectedReason) {
                                handleCountItem(item.id, parseInt(countValue, 10), noteValue || undefined);
                              }
                            }}
                            disabled={!selectedReason}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                              selectedReason
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            Submit Discrepancy
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Note Input (expandable) */}
                  {showNote && !showDiscrepancy && (
                    <div className="px-4 pb-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={noteValue}
                          onChange={(e) => setItemNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                          placeholder="Add a note about this count..."
                          className="flex-1 px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                          autoFocus
                        />
                        <button
                          onClick={() => setExpandedNoteId(null)}
                          className="px-3 py-2 text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
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
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - 2/3 width */}
          <div className="col-span-2 space-y-6">
            {/* Count Details Card */}
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-[var(--muted-foreground)] uppercase">Type</p>
                  <p className="font-medium text-[var(--foreground)]">{cycleCountTypeLabels[cycleCount.type]}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--muted-foreground)] uppercase">Priority</p>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cycleCountPriorityColors[cycleCount.priority]}`}>
                    {cycleCountPriorityLabels[cycleCount.priority]}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-[var(--muted-foreground)] uppercase">Assigned To</p>
                  <p className="font-medium text-[var(--foreground)]">{cycleCount.assignedToName || 'Unassigned'}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--muted-foreground)] uppercase">Due Date</p>
                  <p className="font-medium text-[var(--foreground)]">{cycleCount.dueDate ? formatDate(cycleCount.dueDate) : '—'}</p>
                </div>
              </div>
            </div>

            {/* Counted Items Table */}
            {countedItems.length > 0 && (
              <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
                <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-[var(--foreground)]">Counted Items</h3>
                    <span className="text-xs text-[var(--muted-foreground)]">{countedItems.length} items</span>
                  </div>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                      <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Part #</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Product</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-[var(--muted-foreground)] uppercase">System</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-[var(--muted-foreground)] uppercase">Counted</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-[var(--muted-foreground)] uppercase">Variance</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {countedItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">{item.partNumber}</td>
                        <td className="px-4 py-3 text-sm text-[var(--muted-foreground)] truncate max-w-[200px]">{item.productName}</td>
                        <td className="px-4 py-3 text-sm text-center">{item.systemQuantity}</td>
                        <td className="px-4 py-3 text-sm text-center font-medium">{item.countedQuantity}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          {item.variance !== undefined && item.variance !== 0 ? (
                            <span className={`font-medium ${item.variance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.variance > 0 ? '+' : ''}{item.variance}
                            </span>
                          ) : (
                            <span className="text-[var(--muted-foreground)]">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <ItemStatusBadge status={item.status} />
                            {isEditable && item.status === 'counted' && (
                              <button
                                onClick={() => handleVerifyItem(item.id)}
                                className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                              >
                                Verify
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            {/* Count Summary */}
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <div className="flex items-center gap-2 mb-4">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
                <h3 className="font-medium text-[var(--foreground)]">Count Summary</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Total Items</span>
                  <span className="text-sm font-medium">{cycleCount.totalItems} items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Counted</span>
                  <span className="text-sm font-medium text-green-600">{cycleCount.countedItems} items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Remaining</span>
                  <span className="text-sm font-medium">{pendingItems.length} items</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-[var(--border)]">
                  <span className="text-sm text-[var(--muted-foreground)]">Variances</span>
                  <span className={`text-sm font-medium ${cycleCount.itemsWithVariance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {cycleCount.itemsWithVariance} items
                  </span>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <div className="flex items-center gap-2 mb-4">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
                <h3 className="font-medium text-[var(--foreground)]">Timestamps</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-[var(--muted-foreground)]">Created</p>
                  <p className="text-sm font-medium">{formatDateTime(cycleCount.createdAt)}</p>
                </div>
                {cycleCount.startedAt && (
                  <div>
                    <p className="text-xs text-[var(--muted-foreground)]">Started</p>
                    <p className="text-sm font-medium">{formatDateTime(cycleCount.startedAt)}</p>
                  </div>
                )}
                {cycleCount.completedAt && (
                  <div>
                    <p className="text-xs text-[var(--muted-foreground)]">Completed</p>
                    <p className="text-sm font-medium">{formatDateTime(cycleCount.completedAt)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {cycleCount.notes && (
              <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
                <h3 className="font-medium text-[var(--foreground)] mb-2">Notes</h3>
                <p className="text-sm text-[var(--muted-foreground)]">{cycleCount.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function ItemStatusBadge({ status }: { status: CycleCountLineItem['status'] }) {
  const styles = {
    pending: 'bg-gray-100 text-gray-700',
    counted: 'bg-blue-100 text-blue-700',
    verified: 'bg-green-100 text-green-700',
    adjusted: 'bg-purple-100 text-purple-700',
    skipped: 'bg-yellow-100 text-yellow-700',
  };

  const labels = {
    pending: 'Pending',
    counted: 'Counted',
    verified: 'Verified',
    adjusted: 'Adjusted',
    skipped: 'Skipped',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
