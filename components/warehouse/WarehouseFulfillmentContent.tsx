'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  mockFulfillments,
  mockWaves,
  getFulfillmentStats,
  getWarehouseCustomers,
} from '@/lib/data/warehouse-mock';
import {
  Fulfillment,
  Wave,
  fulfillmentStatusColors,
  fulfillmentStatusLabels,
  waveStatusColors,
  waveStatusLabels,
  FulfillmentStatus,
} from '@/lib/types/warehouse';

const statusSteps: FulfillmentStatus[] = ['RELEASED_TO_WAREHOUSE', 'PICKING', 'PICKED', 'PACKING', 'PACKED', 'SHIPPED'];

// Filter types for stat card clicks
type StatFilter = 'all' | 'pending' | 'in_progress' | 'completed';

export default function WarehouseFulfillmentContent() {
  const searchParams = useSearchParams();
  const urlFilter = searchParams.get('filter') as StatFilter | null;

  const [fulfillments] = useState<Fulfillment[]>(mockFulfillments);
  const [waves] = useState<Wave[]>(mockWaves);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'orders' | 'waves'>('orders');
  const [selectedFulfillment, setSelectedFulfillment] = useState<Fulfillment | null>(null);
  const [activeStatFilter, setActiveStatFilter] = useState<StatFilter>(urlFilter || 'all');

  // Update filter when URL changes
  useEffect(() => {
    if (urlFilter && ['all', 'pending', 'in_progress', 'completed'].includes(urlFilter)) {
      setActiveStatFilter(urlFilter);
    }
  }, [urlFilter]);

  const stats = useMemo(() => getFulfillmentStats(), []);
  const customers = useMemo(() => getWarehouseCustomers(), []);

  const handleStatCardClick = (filter: StatFilter) => {
    setActiveStatFilter(prev => prev === filter ? 'all' : filter);
  };

  const getStatCardClass = (filter: StatFilter) => {
    const baseClass = "bg-[var(--card)] rounded-lg border p-4 transition-all cursor-pointer hover:shadow-md";
    if (activeStatFilter === filter) {
      return `${baseClass} border-[var(--primary)] ring-2 ring-[var(--primary)]/20`;
    }
    return `${baseClass} border-[var(--border)] hover:border-[var(--primary)]/50`;
  };

  const filteredFulfillments = useMemo(() => {
    let result = fulfillments;

    // Apply stat card filter
    if (activeStatFilter === 'pending') {
      result = result.filter(f => f.status === 'RELEASED_TO_WAREHOUSE' || f.status === 'NOT_STARTED');
    } else if (activeStatFilter === 'in_progress') {
      result = result.filter(f => f.status === 'PICKING' || f.status === 'PACKING');
    } else if (activeStatFilter === 'completed') {
      result = result.filter(f => f.status === 'SHIPPED' || f.status === 'DELIVERED');
    }

    if (selectedStatus !== 'All') {
      result = result.filter(f => f.status === selectedStatus);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(f =>
        f.orderNumber.toLowerCase().includes(query) ||
        f.customerName.toLowerCase().includes(query) ||
        f.productName.toLowerCase().includes(query)
      );
    }

    return result;
  }, [fulfillments, selectedStatus, searchQuery, activeStatFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusStepIndex = (status: FulfillmentStatus) => {
    const index = statusSteps.indexOf(status);
    return index >= 0 ? index : 0;
  };

  return (
    <main className="flex-1 overflow-hidden bg-[var(--background)] flex flex-col">
      {/* Header */}
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Fulfillment</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Manage order fulfillment and picking waves
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v8M8 12h8"/>
            </svg>
            Create Wave
          </button>
        </div>

        {/* Stats Cards - Clickable to filter */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div
            className={getStatCardClass('all')}
            onClick={() => handleStatCardClick('all')}
          >
            <div className="text-sm text-[var(--muted-foreground)]">Total Fulfillments</div>
            <div className="text-2xl font-semibold text-[var(--foreground)] mt-1">{stats.totalFulfillments}</div>
            {activeStatFilter === 'all' && (
              <div className="text-xs text-[var(--primary)] mt-1">Showing all</div>
            )}
          </div>
          <div
            className={getStatCardClass('pending')}
            onClick={() => handleStatCardClick('pending')}
          >
            <div className="text-sm text-[var(--muted-foreground)]">Pending</div>
            <div className="text-2xl font-semibold text-yellow-600 mt-1">{stats.pendingFulfillments}</div>
            {activeStatFilter === 'pending' && (
              <div className="text-xs text-[var(--primary)] mt-1">Filter active</div>
            )}
          </div>
          <div
            className={getStatCardClass('in_progress')}
            onClick={() => handleStatCardClick('in_progress')}
          >
            <div className="text-sm text-[var(--muted-foreground)]">In Progress</div>
            <div className="text-2xl font-semibold text-blue-600 mt-1">{stats.inProgressFulfillments}</div>
            {activeStatFilter === 'in_progress' && (
              <div className="text-xs text-[var(--primary)] mt-1">Filter active</div>
            )}
          </div>
          <div
            className={getStatCardClass('completed')}
            onClick={() => handleStatCardClick('completed')}
          >
            <div className="text-sm text-[var(--muted-foreground)]">Completed</div>
            <div className="text-2xl font-semibold text-green-600 mt-1">{stats.completedFulfillments}</div>
            {activeStatFilter === 'completed' && (
              <div className="text-xs text-[var(--primary)] mt-1">Filter active</div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1 p-1 bg-[var(--muted)] rounded-lg">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'orders'
                  ? 'bg-white text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              Orders Awaiting Fulfillment
            </button>
            <button
              onClick={() => setActiveTab('waves')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'waves'
                  ? 'bg-white text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              Picking Waves
            </button>
          </div>

          <div className="flex-1" />

          <div className="relative max-w-xs">
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
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 pt-0">
        {activeTab === 'orders' ? (
          /* Orders Table */
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--muted)]/30">
              <h3 className="font-semibold text-[var(--foreground)]">Orders Awaiting Fulfillment</h3>
              <p className="text-sm text-[var(--muted-foreground)]">A list of orders with items marked as &quot;Released to Warehouse&quot;.</p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/20">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Order #</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-center">Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredFulfillments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-[var(--muted-foreground)]">
                      No fulfillments found
                    </td>
                  </tr>
                ) : (
                  filteredFulfillments.map((fulfillment) => (
                    <tr key={fulfillment.id} className="hover:bg-[var(--muted)]/20 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-[var(--foreground)]">{fulfillment.orderNumber}</td>
                      <td className="px-6 py-4 text-sm text-[var(--foreground)]">{fulfillment.customerName}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-[var(--foreground)]">{fulfillment.productName}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">{fulfillment.partNumber}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--foreground)] text-center">{fulfillment.quantity}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${fulfillmentStatusColors[fulfillment.status]}`}>
                          {fulfillmentStatusLabels[fulfillment.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--muted-foreground)]">{formatDate(fulfillment.createdAt)}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedFulfillment(fulfillment)}
                          className="px-3 py-1.5 text-sm text-[var(--primary)] hover:bg-[var(--muted)] rounded-lg transition-colors"
                        >
                          Start Picking
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Waves Table */
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--muted)]/30">
              <h3 className="font-semibold text-[var(--foreground)]">Picking Waves</h3>
              <p className="text-sm text-[var(--muted-foreground)]">Batch picking waves for efficient order fulfillment.</p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/20">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Wave #</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-center">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-center">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Picker</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {waves.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-[var(--muted-foreground)]">
                      No waves found
                    </td>
                  </tr>
                ) : (
                  waves.map((wave) => {
                    const progress = wave.totalItems > 0 ? Math.round((wave.pickedItems / wave.totalItems) * 100) : 0;
                    return (
                      <tr key={wave.id} className="hover:bg-[var(--muted)]/20 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-[var(--foreground)]">{wave.waveNumber}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${waveStatusColors[wave.status]}`}>
                            {waveStatusLabels[wave.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--foreground)] text-center">{wave.fulfillmentCount}</td>
                        <td className="px-6 py-4 text-sm text-[var(--foreground)] text-center">{wave.totalItems}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${progress === 100 ? 'bg-green-500' : 'bg-[var(--primary)]'}`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-[var(--muted-foreground)] w-10">{progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--foreground)]">{wave.pickerName || '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <button className="px-3 py-1.5 text-sm text-[var(--primary)] hover:bg-[var(--muted)] rounded-lg transition-colors">
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fulfillment Detail Modal */}
      {selectedFulfillment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--border)]">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">
                  Fulfillment for Order {selectedFulfillment.orderNumber}
                </h2>
                <button
                  onClick={() => setSelectedFulfillment(null)}
                  className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              {/* Status Steps */}
              <div className="flex items-center justify-between mt-6">
                {statusSteps.slice(0, 4).map((step, index) => {
                  const currentIndex = getStatusStepIndex(selectedFulfillment.status);
                  const isCompleted = index < currentIndex;
                  const isCurrent = index === currentIndex;

                  return (
                    <React.Fragment key={step}>
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            isCompleted
                              ? 'bg-green-500 text-white'
                              : isCurrent
                                ? 'bg-[var(--primary)] text-white'
                                : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                          }`}
                        >
                          {isCompleted ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <path d="M20 6L9 17l-5-5"/>
                            </svg>
                          ) : (
                            index + 1
                          )}
                        </div>
                        <span className="text-xs mt-1 text-[var(--muted-foreground)]">
                          {fulfillmentStatusLabels[step]}
                        </span>
                      </div>
                      {index < 3 && (
                        <div className={`flex-1 h-1 mx-2 rounded ${isCompleted ? 'bg-green-500' : 'bg-[var(--muted)]'}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Pick Item Card */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                Pick Item: {selectedFulfillment.productName}
              </h3>

              <div className="bg-[var(--muted)]/20 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span className="text-sm text-[var(--muted-foreground)]">Location</span>
                  </div>
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    Find item at: {selectedFulfillment.binLocation || 'Shelf 3, Bin A-12'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 bg-[var(--muted)]/30 rounded-lg p-6 flex items-center justify-center">
                  <div className="w-32 h-32 bg-[var(--muted)] rounded-lg flex items-center justify-center">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--muted-foreground)]">
                      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                    </svg>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-[var(--muted-foreground)]">Bin:</div>
                  <div className="text-lg font-semibold text-[var(--foreground)]">
                    {selectedFulfillment.binLocation?.split(',').pop()?.trim() || 'A-12'}, Shelf: 3
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--muted)] text-[var(--foreground)] rounded-lg font-medium hover:bg-[var(--muted)]/80 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  Scan to Pick
                </button>
                <button
                  onClick={() => setSelectedFulfillment(null)}
                  className="flex-1 px-4 py-3 bg-[var(--primary)] text-white rounded-lg font-medium hover:bg-[var(--primary-hover)] transition-colors"
                >
                  Confirm Pick ({selectedFulfillment.quantity} items)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
