'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  updateCycleCountLineItem,
  updateCycleCountStatus,
  completeCycleCount,
} from '@/lib/data/warehouse-mock';
import {
  CycleCount,
  CycleCountLineItem,
  cycleCountStatusColors,
  cycleCountStatusLabels,
  cycleCountTypeLabels,
  cycleCountPriorityColors,
  cycleCountPriorityLabels,
} from '@/lib/types/warehouse';

interface CycleCountDetailModalProps {
  cycleCount: CycleCount;
  onClose: () => void;
  onUpdate: () => void;
}

type LineItemFilter = 'all' | 'pending' | 'counted' | 'variance';

export default function CycleCountDetailModal({ cycleCount: initialCycleCount, onClose, onUpdate }: CycleCountDetailModalProps) {
  const [cycleCount, setCycleCount] = useState(initialCycleCount);
  const [selectedItem, setSelectedItem] = useState<CycleCountLineItem | null>(null);
  const [countValue, setCountValue] = useState('');
  const [countNotes, setCountNotes] = useState('');
  const [lineItemFilter, setLineItemFilter] = useState<LineItemFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const isBlindCount = cycleCount.type === 'BLIND';
  const canEdit = cycleCount.status === 'IN_PROGRESS' || cycleCount.status === 'PENDING_REVIEW';
  const canComplete = cycleCount.status === 'IN_PROGRESS' &&
    cycleCount.lineItems.every(li => li.status !== 'pending');

  // Filter line items
  const filteredLineItems = useMemo(() => {
    let items = cycleCount.lineItems;

    if (lineItemFilter === 'pending') {
      items = items.filter(li => li.status === 'pending');
    } else if (lineItemFilter === 'counted') {
      items = items.filter(li => li.status === 'counted' || li.status === 'verified');
    } else if (lineItemFilter === 'variance') {
      items = items.filter(li => li.variance !== undefined && li.variance !== 0);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(li =>
        li.productName.toLowerCase().includes(query) ||
        li.partNumber.toLowerCase().includes(query) ||
        li.binLocation.toLowerCase().includes(query)
      );
    }

    return items;
  }, [cycleCount.lineItems, lineItemFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const total = cycleCount.lineItems.length;
    const pending = cycleCount.lineItems.filter(li => li.status === 'pending').length;
    const counted = cycleCount.lineItems.filter(li => li.status === 'counted' || li.status === 'verified').length;
    const withVariance = cycleCount.lineItems.filter(li => li.variance !== undefined && li.variance !== 0).length;
    const progress = total > 0 ? Math.round((counted / total) * 100) : 0;

    return { total, pending, counted, withVariance, progress };
  }, [cycleCount.lineItems]);

  const handleSelectItem = (item: CycleCountLineItem) => {
    setSelectedItem(item);
    setCountValue(item.countedQuantity?.toString() || '');
    setCountNotes(item.notes || '');
  };

  const handleSubmitCount = useCallback(() => {
    if (!selectedItem || countValue === '') return;

    const quantity = parseInt(countValue, 10);
    if (isNaN(quantity) || quantity < 0) return;

    const updated = updateCycleCountLineItem(cycleCount.id, selectedItem.id, {
      countedQuantity: quantity,
      countedBy: 'current-user',
      countedByName: 'Current User',
      notes: countNotes || undefined,
      recountRequired: Math.abs((quantity - selectedItem.systemQuantity) / selectedItem.systemQuantity) > 0.05,
    });

    if (updated) {
      setCycleCount(updated);
      setSelectedItem(null);
      setCountValue('');
      setCountNotes('');
    }
  }, [cycleCount.id, selectedItem, countValue, countNotes]);

  const handleSkipItem = useCallback(() => {
    if (!selectedItem) return;

    const updated = updateCycleCountLineItem(cycleCount.id, selectedItem.id, {
      status: 'skipped',
      notes: countNotes || 'Skipped during count',
    });

    if (updated) {
      setCycleCount(updated);
      setSelectedItem(null);
      setCountValue('');
      setCountNotes('');
    }
  }, [cycleCount.id, selectedItem, countNotes]);

  const handleCompleteCount = useCallback(() => {
    const updated = completeCycleCount(cycleCount.id, 'current-user');
    if (updated) {
      setCycleCount(updated);
      onUpdate();
    }
  }, [cycleCount.id, onUpdate]);

  const handleApproveCount = useCallback(() => {
    const updated = updateCycleCountStatus(cycleCount.id, 'COMPLETED', {
      reviewedAt: new Date().toISOString(),
      reviewedBy: 'current-user',
      reviewedByName: 'Current User',
    });
    if (updated) {
      setCycleCount(updated);
      onUpdate();
    }
  }, [cycleCount.id, onUpdate]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getVarianceClass = (variance?: number) => {
    if (variance === undefined || variance === 0) return 'text-green-600';
    if (Math.abs(variance) <= 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">
                  {cycleCount.cycleCountNumber}
                </h2>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${cycleCountStatusColors[cycleCount.status]}`}>
                  {cycleCountStatusLabels[cycleCount.status]}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${cycleCountPriorityColors[cycleCount.priority]}`}>
                  {cycleCountPriorityLabels[cycleCount.priority]}
                </span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">{cycleCount.name}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-[var(--muted-foreground)]">
                <span className="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Scheduled: {formatDate(cycleCount.scheduledDate)}
                </span>
                {cycleCount.assignedToName && (
                  <span className="flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    {cycleCount.assignedToName}
                  </span>
                )}
                <span className="px-2 py-0.5 bg-[var(--muted)] rounded">
                  {cycleCountTypeLabels[cycleCount.type]}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] mb-1">
              <span>Progress: {stats.counted} of {stats.total} items counted</span>
              <span>{stats.progress}%</span>
            </div>
            <div className="w-full bg-[var(--muted)] rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  stats.progress === 100 ? 'bg-green-500' :
                  stats.progress > 0 ? 'bg-blue-500' :
                  'bg-gray-300'
                }`}
                style={{ width: `${stats.progress}%` }}
              ></div>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs">
              <span className="text-yellow-600">{stats.pending} pending</span>
              <span className="text-green-600">{stats.counted} counted</span>
              {stats.withVariance > 0 && (
                <span className="text-red-600">{stats.withVariance} with variance</span>
              )}
              {cycleCount.accuracyPercentage !== undefined && (
                <span className={cycleCount.accuracyPercentage >= 99 ? 'text-green-600' : 'text-orange-600'}>
                  Accuracy: {cycleCount.accuracyPercentage}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Line Items List */}
          <div className="flex-1 flex flex-col border-r border-[var(--border)]">
            {/* Filters */}
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-3">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                />
              </div>
              <select
                value={lineItemFilter}
                onChange={(e) => setLineItemFilter(e.target.value as LineItemFilter)}
                className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              >
                <option value="all">All Items ({stats.total})</option>
                <option value="pending">Pending ({stats.pending})</option>
                <option value="counted">Counted ({stats.counted})</option>
                <option value="variance">With Variance ({stats.withVariance})</option>
              </select>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-auto">
              {filteredLineItems.length === 0 ? (
                <div className="p-8 text-center text-[var(--muted-foreground)]">
                  <p>No items match your filter</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="sticky top-0 bg-[var(--card)]">
                    <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                      <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Location</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Product</th>
                      {!isBlindCount && (
                        <th className="px-4 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">System</th>
                      )}
                      <th className="px-4 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">Counted</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">Variance</th>
                      <th className="px-4 py-2 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filteredLineItems.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => canEdit && handleSelectItem(item)}
                        className={`transition-colors ${
                          canEdit ? 'cursor-pointer hover:bg-[var(--muted)]/20' : ''
                        } ${selectedItem?.id === item.id ? 'bg-[var(--primary)]/10' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-[var(--foreground)]">{item.binLocation}</div>
                          <div className="text-xs text-[var(--muted-foreground)] truncate max-w-[150px]">{item.fullLocationPath}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-[var(--foreground)]">{item.partNumber}</div>
                          <div className="text-xs text-[var(--muted-foreground)] truncate max-w-[150px]">{item.productName}</div>
                        </td>
                        {!isBlindCount && (
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-medium text-[var(--foreground)]">{item.systemQuantity}</span>
                          </td>
                        )}
                        <td className="px-4 py-3 text-right">
                          {item.countedQuantity !== undefined ? (
                            <span className="text-sm font-medium text-[var(--foreground)]">{item.countedQuantity}</span>
                          ) : (
                            <span className="text-sm text-[var(--muted-foreground)]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {item.variance !== undefined ? (
                            <span className={`text-sm font-medium ${getVarianceClass(item.variance)}`}>
                              {item.variance > 0 ? '+' : ''}{item.variance}
                              {item.variancePercent !== undefined && (
                                <span className="text-xs ml-1">({item.variancePercent > 0 ? '+' : ''}{item.variancePercent}%)</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-sm text-[var(--muted-foreground)]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.status === 'pending' && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">Pending</span>
                          )}
                          {item.status === 'counted' && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">Counted</span>
                          )}
                          {item.status === 'verified' && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">Verified</span>
                          )}
                          {item.status === 'adjusted' && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">Adjusted</span>
                          )}
                          {item.status === 'skipped' && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">Skipped</span>
                          )}
                          {item.recountRequired && (
                            <span className="ml-1 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">Recount</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Count Entry Panel */}
          <div className="w-80 flex flex-col bg-[var(--muted)]/10">
            {selectedItem ? (
              <>
                <div className="p-4 border-b border-[var(--border)]">
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">Count Item</h3>
                </div>
                <div className="flex-1 p-4 space-y-4">
                  {/* Location Info */}
                  <div className="bg-[var(--card)] rounded-lg p-3 border border-[var(--border)]">
                    <div className="text-xs text-[var(--muted-foreground)] uppercase font-medium">Location</div>
                    <div className="text-sm font-medium text-[var(--foreground)] mt-1">{selectedItem.binLocation}</div>
                    <div className="text-xs text-[var(--muted-foreground)] mt-0.5">{selectedItem.fullLocationPath}</div>
                  </div>

                  {/* Product Info */}
                  <div className="bg-[var(--card)] rounded-lg p-3 border border-[var(--border)]">
                    <div className="text-xs text-[var(--muted-foreground)] uppercase font-medium">Product</div>
                    <div className="text-sm font-medium text-[var(--foreground)] mt-1">{selectedItem.partNumber}</div>
                    <div className="text-xs text-[var(--muted-foreground)] mt-0.5">{selectedItem.productName}</div>
                    {selectedItem.lotNumber && (
                      <div className="text-xs text-[var(--muted-foreground)] mt-1">Lot: {selectedItem.lotNumber}</div>
                    )}
                  </div>

                  {/* System Quantity (if not blind count) */}
                  {!isBlindCount && (
                    <div className="bg-[var(--card)] rounded-lg p-3 border border-[var(--border)]">
                      <div className="text-xs text-[var(--muted-foreground)] uppercase font-medium">System Quantity</div>
                      <div className="text-2xl font-bold text-[var(--foreground)] mt-1">{selectedItem.systemQuantity}</div>
                    </div>
                  )}

                  {/* Count Input */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                      Counted Quantity
                    </label>
                    <input
                      type="number"
                      value={countValue}
                      onChange={(e) => setCountValue(e.target.value)}
                      min="0"
                      placeholder="Enter count..."
                      className="w-full px-4 py-3 text-lg font-bold border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 text-center"
                      autoFocus
                    />
                    {countValue && !isBlindCount && (
                      <div className={`mt-2 text-center text-sm font-medium ${getVarianceClass(parseInt(countValue) - selectedItem.systemQuantity)}`}>
                        Variance: {parseInt(countValue) - selectedItem.systemQuantity}
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                      Notes (optional)
                    </label>
                    <textarea
                      value={countNotes}
                      onChange={(e) => setCountNotes(e.target.value)}
                      placeholder="Add notes..."
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-4 border-t border-[var(--border)] space-y-2">
                  <button
                    onClick={handleSubmitCount}
                    disabled={countValue === ''}
                    className="w-full px-4 py-2.5 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Count
                  </button>
                  <button
                    onClick={handleSkipItem}
                    className="w-full px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
                  >
                    Skip Item
                  </button>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="w-full px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-[var(--muted-foreground)]">
                <svg className="w-12 h-12 mb-4 text-[var(--muted-foreground)]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {canEdit ? (
                  <>
                    <p className="font-medium text-[var(--foreground)]">Select an item to count</p>
                    <p className="text-sm mt-1">Click on a row to enter the count</p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-[var(--foreground)]">Cycle count {cycleCount.status.toLowerCase().replace('_', ' ')}</p>
                    <p className="text-sm mt-1">This count is not currently editable</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between">
          <div className="text-sm text-[var(--muted-foreground)]">
            {cycleCount.notes && (
              <span className="italic">Note: {cycleCount.notes}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              Close
            </button>
            {canComplete && (
              <button
                onClick={handleCompleteCount}
                className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Complete Count
              </button>
            )}
            {cycleCount.status === 'PENDING_REVIEW' && (
              <button
                onClick={handleApproveCount}
                className="px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
              >
                Approve & Finalize
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
