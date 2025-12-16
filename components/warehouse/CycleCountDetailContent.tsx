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
  cycleCountStatusColors,
  cycleCountStatusLabels,
  cycleCountTypeLabels,
  cycleCountPriorityColors,
  cycleCountPriorityLabels,
} from '@/lib/types/warehouse';

interface CycleCountDetailContentProps {
  cycleCountId: string;
}

export default function CycleCountDetailContent({ cycleCountId }: CycleCountDetailContentProps) {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'items' | 'summary'>('items');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'counted' | 'verified' | 'adjusted' | 'skipped'>('all');
  const [showOnlyVariance, setShowOnlyVariance] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [countValue, setCountValue] = useState<string>('');

  const cycleCount = useMemo(() => getCycleCountById(cycleCountId), [cycleCountId, refreshKey]);

  const filteredItems = useMemo(() => {
    if (!cycleCount) return [];

    let items = cycleCount.lineItems;

    if (statusFilter !== 'all') {
      items = items.filter(item => item.status === statusFilter);
    }

    if (showOnlyVariance) {
      items = items.filter(item => item.variance && item.variance !== 0);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.productName.toLowerCase().includes(query) ||
        item.partNumber.toLowerCase().includes(query) ||
        item.binLocation.toLowerCase().includes(query)
      );
    }

    return items;
  }, [cycleCount, statusFilter, showOnlyVariance, searchQuery]);

  const handleCountItem = useCallback((lineItemId: string, quantity: number) => {
    updateCycleCountLineItem(cycleCountId, lineItemId, {
      countedQuantity: quantity,
      status: 'counted',
      countedBy: 'current-user',
      countedByName: 'Current User',
      countedAt: new Date().toISOString(),
    });
    setRefreshKey(prev => prev + 1);
    setEditingItemId(null);
    setCountValue('');
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

  return (
    <main className="flex-1 overflow-hidden bg-[var(--background)] flex flex-col">
      {/* Header */}
      <div className="p-6 pb-0 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-2">
          <Link href="/warehouse" className="hover:text-[var(--foreground)] transition-colors">
            Warehouse
          </Link>
          <span>/</span>
          <Link href="/warehouse/cycle-counts" className="hover:text-[var(--foreground)] transition-colors">
            Cycle Counts
          </Link>
          <span>/</span>
          <span className="text-[var(--foreground)]">{cycleCount.cycleCountNumber}</span>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">{cycleCount.name}</h1>
              <span className={`px-2 py-1 rounded text-xs font-medium ${cycleCountStatusColors[cycleCount.status]}`}>
                {cycleCountStatusLabels[cycleCount.status]}
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${cycleCountPriorityColors[cycleCount.priority]}`}>
                {cycleCountPriorityLabels[cycleCount.priority]}
              </span>
            </div>
            {cycleCount.description && (
              <p className="text-sm text-[var(--muted-foreground)] mt-1">{cycleCount.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isEditable && (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  Cancel Count
                </button>
                <button
                  onClick={handleSubmitForReview}
                  disabled={!canSubmitForReview}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    canSubmitForReview
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Submit for Review
                </button>
              </>
            )}
            {canComplete && (
              <button
                onClick={handleComplete}
                className="px-4 py-2 text-sm font-medium bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
              >
                Complete Count
              </button>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-5 gap-4 mt-6">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-3">
            <div className="text-xs text-[var(--muted-foreground)]">Type</div>
            <div className="text-sm font-medium text-[var(--foreground)] mt-1">{cycleCountTypeLabels[cycleCount.type]}</div>
          </div>
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-3">
            <div className="text-xs text-[var(--muted-foreground)]">Warehouse</div>
            <div className="text-sm font-medium text-[var(--foreground)] mt-1">{cycleCount.warehouseName}</div>
          </div>
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-3">
            <div className="text-xs text-[var(--muted-foreground)]">Assigned To</div>
            <div className="text-sm font-medium text-[var(--foreground)] mt-1">
              {cycleCount.assignedToName || 'Unassigned'}
            </div>
          </div>
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-3">
            <div className="text-xs text-[var(--muted-foreground)]">Progress</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-[var(--muted)] rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-[var(--foreground)]">{progress}%</span>
            </div>
          </div>
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-3">
            <div className="text-xs text-[var(--muted-foreground)]">Variances</div>
            <div className={`text-sm font-medium mt-1 ${cycleCount.itemsWithVariance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {cycleCount.itemsWithVariance} item{cycleCount.itemsWithVariance !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 mt-6">
          <button
            onClick={() => setActiveTab('items')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'items'
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            Items ({cycleCount.lineItems.length})
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'summary'
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            Summary
          </button>
        </div>
      </div>

      {/* Items Tab */}
      {activeTab === 'items' && (
        <div className="flex-1 overflow-hidden flex flex-col p-6">
          {/* Search and Filters */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Search by product, part number, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            >
              <option value="all">All Items</option>
              <option value="pending">Pending</option>
              <option value="counted">Counted</option>
              <option value="verified">Verified</option>
              <option value="adjusted">Adjusted</option>
              <option value="skipped">Skipped</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-[var(--foreground)]">
              <input
                type="checkbox"
                checked={showOnlyVariance}
                onChange={(e) => setShowOnlyVariance(e.target.checked)}
                className="rounded border-[var(--border)]"
              />
              Show only variances
            </label>
          </div>

          {/* Items Table */}
          <div className="flex-1 overflow-auto">
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Location</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">System Qty</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Counted Qty</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Variance</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-[var(--muted-foreground)]">
                        No items found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-[var(--muted)]/20">
                        <td className="px-4 py-3">
                          <div className="font-medium text-[var(--foreground)]">{item.productName}</div>
                          <div className="text-xs text-[var(--muted-foreground)]">{item.partNumber}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-[var(--foreground)]">{item.binLocation}</div>
                          <div className="text-xs text-[var(--muted-foreground)]">{item.fullLocationPath}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-medium text-[var(--foreground)]">{item.systemQuantity}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {editingItemId === item.id ? (
                            <input
                              type="number"
                              value={countValue}
                              onChange={(e) => setCountValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && countValue !== '') {
                                  handleCountItem(item.id, parseInt(countValue, 10));
                                } else if (e.key === 'Escape') {
                                  setEditingItemId(null);
                                  setCountValue('');
                                }
                              }}
                              className="w-20 px-2 py-1 text-center border border-[var(--primary)] rounded bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                              autoFocus
                            />
                          ) : (
                            <span className={`text-sm font-medium ${item.countedQuantity !== undefined ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}`}>
                              {item.countedQuantity !== undefined ? item.countedQuantity : ''}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.variance !== undefined && item.variance !== 0 ? (
                            <span className={`text-sm font-medium ${item.variance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.variance > 0 ? '+' : ''}{item.variance}
                            </span>
                          ) : (
                            <span className="text-sm text-[var(--muted-foreground)]"></span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <ItemStatusBadge status={item.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isEditable && (
                            <div className="flex items-center justify-end gap-2">
                              {item.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingItemId(item.id);
                                      setCountValue('');
                                    }}
                                    className="px-2 py-1 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors"
                                  >
                                    Count
                                  </button>
                                  <button
                                    onClick={() => handleSkipItem(item.id)}
                                    className="px-2 py-1 text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded transition-colors"
                                  >
                                    Skip
                                  </button>
                                </>
                              )}
                              {item.status === 'counted' && (
                                <>
                                  <button
                                    onClick={() => handleVerifyItem(item.id)}
                                    className="px-2 py-1 text-xs font-medium bg-green-600 text-white hover:bg-green-700 rounded transition-colors"
                                  >
                                    Verify
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingItemId(item.id);
                                      setCountValue(item.countedQuantity?.toString() || '');
                                    }}
                                    className="px-2 py-1 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors"
                                  >
                                    Recount
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Count Summary */}
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Count Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--muted-foreground)]">Total Items</span>
                  <span className="text-sm font-medium text-[var(--foreground)]">{cycleCount.totalItems}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--muted-foreground)]">Items Counted</span>
                  <span className="text-sm font-medium text-[var(--foreground)]">{cycleCount.countedItems}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--muted-foreground)]">Items with Variance</span>
                  <span className={`text-sm font-medium ${cycleCount.itemsWithVariance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {cycleCount.itemsWithVariance}
                  </span>
                </div>
                {cycleCount.accuracyPercentage !== undefined && (
                  <div className="flex justify-between items-center pt-3 border-t border-[var(--border)]">
                    <span className="text-sm text-[var(--muted-foreground)]">Accuracy</span>
                    <span className={`text-lg font-semibold ${
                      cycleCount.accuracyPercentage >= 99 ? 'text-green-600' :
                      cycleCount.accuracyPercentage >= 95 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {cycleCount.accuracyPercentage}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quantity Summary */}
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Quantity Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--muted-foreground)]">System Quantity</span>
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {cycleCount.totalSystemQuantity ?? cycleCount.lineItems.reduce((sum, item) => sum + item.systemQuantity, 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--muted-foreground)]">Counted Quantity</span>
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {cycleCount.totalCountedQuantity ?? cycleCount.lineItems.reduce((sum, item) => sum + (item.countedQuantity || 0), 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-[var(--border)]">
                  <span className="text-sm text-[var(--muted-foreground)]">Total Variance</span>
                  <span className={`text-sm font-medium ${
                    (cycleCount.totalVariance ?? 0) === 0 ? 'text-green-600' :
                    (cycleCount.totalVariance ?? 0) > 0 ? 'text-blue-600' :
                    'text-red-600'
                  }`}>
                    {(cycleCount.totalVariance ?? 0) > 0 ? '+' : ''}{cycleCount.totalVariance ?? 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6 col-span-2">
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Timeline</h3>
              <div className="space-y-4">
                <TimelineItem
                  label="Created"
                  date={cycleCount.createdAt}
                  user={cycleCount.createdBy}
                />
                <TimelineItem
                  label="Scheduled"
                  date={cycleCount.scheduledDate}
                />
                {cycleCount.startedAt && (
                  <TimelineItem
                    label="Started"
                    date={cycleCount.startedAt}
                    user={cycleCount.startedBy}
                  />
                )}
                {cycleCount.completedAt && (
                  <TimelineItem
                    label="Completed"
                    date={cycleCount.completedAt}
                    user={cycleCount.completedBy}
                  />
                )}
                {cycleCount.reviewedAt && (
                  <TimelineItem
                    label="Reviewed"
                    date={cycleCount.reviewedAt}
                    user={cycleCount.reviewedByName}
                  />
                )}
              </div>
            </div>

            {/* Notes */}
            {cycleCount.notes && (
              <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6 col-span-2">
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Notes</h3>
                <p className="text-sm text-[var(--muted-foreground)] whitespace-pre-wrap">{cycleCount.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
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
    <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function TimelineItem({ label, date, user }: { label: string; date: string; user?: string }) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex items-start gap-3">
      <div className="w-2 h-2 rounded-full bg-[var(--primary)] mt-2"></div>
      <div>
        <div className="text-sm font-medium text-[var(--foreground)]">{label}</div>
        <div className="text-xs text-[var(--muted-foreground)]">
          {formatDate(date)}
          {user && ` by ${user}`}
        </div>
      </div>
    </div>
  );
}
