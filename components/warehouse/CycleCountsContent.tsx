'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getAllCycleCounts,
  getCycleCountStats,
  updateCycleCountStatus,
  startCycleCount,
} from '@/lib/data/warehouse-mock';
import {
  CycleCount,
  CycleCountStatus,
  cycleCountStatusColors,
  cycleCountStatusLabels,
  cycleCountTypeLabels,
  cycleCountPriorityColors,
  cycleCountPriorityLabels,
} from '@/lib/types/warehouse';
import WarehouseSelector from './WarehouseSelector';
import { useWarehouse } from './WarehouseContext';

type StatFilter = 'all' | 'active' | 'scheduled' | 'completed' | 'variance';

export default function CycleCountsContent() {
  const router = useRouter();
  const { selectedWarehouse } = useWarehouse();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CycleCountStatus | 'all'>('all');
  const [activeStatFilter, setActiveStatFilter] = useState<StatFilter>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  const cycleCounts = useMemo(() => getAllCycleCounts(), [refreshKey]);
  const stats = useMemo(() => getCycleCountStats(), [refreshKey]);

  // Filtered cycle counts
  const filteredCycleCounts = useMemo(() => {
    let result = cycleCounts;

    // Apply stat card filter
    if (activeStatFilter === 'active') {
      result = result.filter(cc => cc.status === 'IN_PROGRESS' || cc.status === 'PENDING_REVIEW');
    } else if (activeStatFilter === 'scheduled') {
      result = result.filter(cc => cc.status === 'SCHEDULED' || cc.status === 'DRAFT');
    } else if (activeStatFilter === 'completed') {
      result = result.filter(cc => cc.status === 'COMPLETED');
    } else if (activeStatFilter === 'variance') {
      result = result.filter(cc => cc.itemsWithVariance > 0);
    }

    // Apply status dropdown filter
    if (statusFilter !== 'all') {
      result = result.filter(cc => cc.status === statusFilter);
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(cc =>
        cc.cycleCountNumber.toLowerCase().includes(query) ||
        cc.name.toLowerCase().includes(query) ||
        (cc.assignedToName && cc.assignedToName.toLowerCase().includes(query))
      );
    }

    return result;
  }, [cycleCounts, activeStatFilter, statusFilter, searchQuery]);

  const handleStatCardClick = (filter: StatFilter) => {
    setActiveStatFilter(prev => prev === filter ? 'all' : filter);
  };

  const getStatCardClass = (filter: StatFilter) => {
    const baseClass = "bg-[var(--card)] rounded-lg border p-4 cursor-pointer transition-all";
    if (activeStatFilter === filter) {
      return `${baseClass} border-[var(--primary)] ring-2 ring-[var(--primary)]/20`;
    }
    return `${baseClass} border-[var(--border)] hover:border-[var(--primary)]/50`;
  };

  const handleStartCycleCount = useCallback((countId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    startCycleCount(countId, 'current-user');
    setRefreshKey(prev => prev + 1);
    router.push(`/warehouse/cycle-counts/${countId}`);
  }, [router]);

  const handleCancelCycleCount = useCallback((countId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    updateCycleCountStatus(countId, 'CANCELLED');
    setRefreshKey(prev => prev + 1);
  }, []);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <main className="flex-1 overflow-hidden bg-[var(--background)] flex flex-col">
      {/* Header */}
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Cycle Counts</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Manage inventory accuracy through scheduled and ad-hoc cycle counts
            </p>
          </div>
          <div className="flex items-center gap-3">
            <WarehouseSelector />
            <Link
              href="/warehouse/cycle-counts/new"
              className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              New Cycle Count
            </Link>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div
            className={getStatCardClass('all')}
            onClick={() => handleStatCardClick('all')}
          >
            <div className="text-sm text-[var(--muted-foreground)]">Total Counts</div>
            <div className="text-2xl font-semibold text-[var(--foreground)] mt-1">{stats.total}</div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">All time</div>
          </div>
          <div
            className={getStatCardClass('active')}
            onClick={() => handleStatCardClick('active')}
          >
            <div className="text-sm text-[var(--muted-foreground)]">Active</div>
            <div className="text-2xl font-semibold text-yellow-600 mt-1">{stats.inProgress + stats.pendingReview}</div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">
              {stats.inProgress} in progress, {stats.pendingReview} reviewing
            </div>
          </div>
          <div
            className={getStatCardClass('scheduled')}
            onClick={() => handleStatCardClick('scheduled')}
          >
            <div className="text-sm text-[var(--muted-foreground)]">Scheduled</div>
            <div className="text-2xl font-semibold text-blue-600 mt-1">{stats.scheduled + stats.draft}</div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">Upcoming counts</div>
          </div>
          <div
            className={getStatCardClass('completed')}
            onClick={() => handleStatCardClick('completed')}
          >
            <div className="text-sm text-[var(--muted-foreground)]">Completed</div>
            <div className="text-2xl font-semibold text-green-600 mt-1">{stats.completed}</div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">{stats.completedThisMonth} this month</div>
          </div>
          <div
            className={getStatCardClass('variance')}
            onClick={() => handleStatCardClick('variance')}
          >
            <div className="text-sm text-[var(--muted-foreground)]">Avg Accuracy</div>
            <div className={`text-2xl font-semibold mt-1 ${stats.averageAccuracy >= 99 ? 'text-green-600' : stats.averageAccuracy >= 95 ? 'text-yellow-600' : 'text-red-600'}`}>
              {stats.averageAccuracy > 0 ? `${stats.averageAccuracy}%` : '—'}
            </div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">{stats.itemsWithVariance} items with variance</div>
          </div>
        </div>

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
              placeholder="Search by count number, name, or assignee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CycleCountStatus | 'all')}
            className="px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          >
            <option value="all">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Results count */}
        <div className="text-sm text-[var(--muted-foreground)] mb-4">
          Showing {filteredCycleCounts.length} cycle count{filteredCycleCounts.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Cycle Counts List */}
      <div className="flex-1 overflow-auto p-6 pt-0">
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Count #</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Assigned To</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Scheduled</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredCycleCounts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-[var(--muted-foreground)]">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 mb-4 text-[var(--muted-foreground)]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        <p className="font-medium text-[var(--foreground)]">No cycle counts found</p>
                        <p className="text-sm mt-1">Create a new cycle count to verify inventory accuracy</p>
                        <Link
                          href="/warehouse/cycle-counts/new"
                          className="mt-4 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium"
                        >
                          Create Cycle Count
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCycleCounts.map((count) => {
                    const progress = count.totalItems > 0 ? Math.round((count.countedItems / count.totalItems) * 100) : 0;
                    return (
                      <tr
                        key={count.id}
                        className="hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
                        onClick={() => router.push(`/warehouse/cycle-counts/${count.id}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-[var(--foreground)]">{count.cycleCountNumber}</div>
                          <div className="text-xs text-[var(--muted-foreground)]">
                            {formatDate(count.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-[var(--foreground)] max-w-[200px] truncate">{count.name}</div>
                          {count.description && (
                            <div className="text-xs text-[var(--muted-foreground)] max-w-[200px] truncate">{count.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-[var(--muted)] rounded text-xs font-medium text-[var(--foreground)]">
                            {cycleCountTypeLabels[count.type]}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {count.assignedToName ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-xs font-medium">
                                {count.assignedToName.split(' ').map(n => n[0]).join('')}
                              </div>
                              <span className="text-sm text-[var(--foreground)]">{count.assignedToName}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-[var(--muted-foreground)]">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-[var(--foreground)]">{formatDate(count.scheduledDate)}</div>
                          {count.dueDate && (
                            <div className="text-xs text-[var(--muted-foreground)]">Due: {formatDate(count.dueDate)}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-full max-w-[80px] bg-[var(--muted)] rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  progress === 100 ? 'bg-green-500' :
                                  progress > 0 ? 'bg-blue-500' :
                                  'bg-gray-300'
                                }`}
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-[var(--muted-foreground)]">
                              {count.countedItems}/{count.totalItems} items
                            </span>
                            {count.itemsWithVariance > 0 && (
                              <span className="text-xs text-orange-600">
                                {count.itemsWithVariance} variance{count.itemsWithVariance !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${cycleCountPriorityColors[count.priority]}`}>
                            {cycleCountPriorityLabels[count.priority]}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${cycleCountStatusColors[count.status]}`}>
                            {cycleCountStatusLabels[count.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            {(count.status === 'DRAFT' || count.status === 'SCHEDULED') && (
                              <>
                                <button
                                  onClick={(e) => handleStartCycleCount(count.id, e)}
                                  className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white hover:bg-green-700 rounded transition-colors"
                                  title="Start Count"
                                >
                                  Start
                                </button>
                                <button
                                  onClick={(e) => handleCancelCycleCount(count.id, e)}
                                  className="px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 rounded transition-colors"
                                  title="Cancel"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            {count.status === 'IN_PROGRESS' && (
                              <Link
                                href={`/warehouse/cycle-counts/${count.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors"
                              >
                                Continue
                              </Link>
                            )}
                            {count.status === 'PENDING_REVIEW' && (
                              <Link
                                href={`/warehouse/cycle-counts/${count.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="px-3 py-1.5 text-xs font-medium bg-orange-600 text-white hover:bg-orange-700 rounded transition-colors"
                              >
                                Review
                              </Link>
                            )}
                            {count.status === 'COMPLETED' && (
                              <Link
                                href={`/warehouse/cycle-counts/${count.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors"
                              >
                                View
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
