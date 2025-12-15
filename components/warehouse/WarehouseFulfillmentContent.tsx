'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  mockFulfillmentOrders,
  mockWaves,
  getFulfillmentOrderStats,
  getWarehouseCustomers,
} from '@/lib/data/warehouse-mock';
import {
  FulfillmentOrder,
  Wave,
  fulfillmentOrderStatusColors,
  fulfillmentOrderStatusLabels,
  waveStatusColors,
  waveStatusLabels,
  FulfillmentOrderStatus,
  shipStatusColors,
  shipStatusLabels,
} from '@/lib/types/warehouse';
import WarehouseSelector from './WarehouseSelector';
import { useWarehouse } from './WarehouseContext';

// Filter types for stat card clicks
type StatFilter = 'all' | 'pending' | 'in_progress' | 'completed';

export default function WarehouseFulfillmentContent() {
  const { selectedWarehouse } = useWarehouse();
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlFilter = searchParams.get('filter') as StatFilter | null;

  const [fulfillmentOrders] = useState<FulfillmentOrder[]>(mockFulfillmentOrders);
  const [waves] = useState<Wave[]>(mockWaves);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'orders' | 'waves'>('orders');
  const [activeStatFilter, setActiveStatFilter] = useState<StatFilter>(urlFilter || 'all');

  // Update filter when URL changes
  useEffect(() => {
    if (urlFilter && ['all', 'pending', 'in_progress', 'completed'].includes(urlFilter)) {
      setActiveStatFilter(urlFilter);
    }
  }, [urlFilter]);

  const stats = useMemo(() => getFulfillmentOrderStats(), []);
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

  const filteredFulfillmentOrders = useMemo(() => {
    let result = fulfillmentOrders;

    // Apply stat card filter
    if (activeStatFilter === 'pending') {
      result = result.filter(fo => fo.status === 'PENDING' || fo.status === 'RELEASED');
    } else if (activeStatFilter === 'in_progress') {
      result = result.filter(fo => fo.status === 'PICKING' || fo.status === 'PICKED' || fo.status === 'PACKING' || fo.status === 'PACKED');
    } else if (activeStatFilter === 'completed') {
      result = result.filter(fo => fo.status === 'SHIPPED' || fo.status === 'PARTIAL_SHIPPED' || fo.status === 'DELIVERED');
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(fo =>
        fo.orderNumber.toLowerCase().includes(query) ||
        fo.fulfillmentOrderNumber.toLowerCase().includes(query) ||
        fo.customerName.toLowerCase().includes(query) ||
        fo.lineItems.some(li => li.productName.toLowerCase().includes(query) || li.partNumber.toLowerCase().includes(query))
      );
    }

    return result;
  }, [fulfillmentOrders, searchQuery, activeStatFilter]);

  // Calculate total quantity for a fulfillment order
  const getTotalQty = (fo: FulfillmentOrder) => {
    return fo.lineItems.reduce((sum, li) => sum + li.orderedQty, 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleRowClick = (fo: FulfillmentOrder) => {
    router.push(`/warehouse/fulfillment/${fo.id}`);
  };

  // Calculate pending/in progress stats from our filtered data
  const pendingCount = fulfillmentOrders.filter(fo => fo.status === 'PENDING' || fo.status === 'RELEASED').length;
  const inProgressCount = fulfillmentOrders.filter(fo => fo.status === 'PICKING' || fo.status === 'PICKED' || fo.status === 'PACKING' || fo.status === 'PACKED').length;
  const completedCount = fulfillmentOrders.filter(fo => fo.status === 'SHIPPED' || fo.status === 'PARTIAL_SHIPPED' || fo.status === 'DELIVERED').length;

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
          <div className="flex items-center gap-3">
            <WarehouseSelector />
            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v8M8 12h8"/>
              </svg>
              Create Wave
            </button>
          </div>
        </div>

        {/* Stats Cards - Clickable to filter */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div
            className={getStatCardClass('all')}
            onClick={() => handleStatCardClick('all')}
          >
            <div className="text-sm text-[var(--muted-foreground)]">Total Fulfillments</div>
            <div className="text-2xl font-semibold text-[var(--foreground)] mt-1">{fulfillmentOrders.length}</div>
            {activeStatFilter === 'all' && (
              <div className="text-xs text-[var(--primary)] mt-1">Showing all</div>
            )}
          </div>
          <div
            className={getStatCardClass('pending')}
            onClick={() => handleStatCardClick('pending')}
          >
            <div className="text-sm text-[var(--muted-foreground)]">Pending</div>
            <div className="text-2xl font-semibold text-yellow-600 mt-1">{pendingCount}</div>
            {activeStatFilter === 'pending' && (
              <div className="text-xs text-[var(--primary)] mt-1">Filter active</div>
            )}
          </div>
          <div
            className={getStatCardClass('in_progress')}
            onClick={() => handleStatCardClick('in_progress')}
          >
            <div className="text-sm text-[var(--muted-foreground)]">In Progress</div>
            <div className="text-2xl font-semibold text-blue-600 mt-1">{inProgressCount}</div>
            {activeStatFilter === 'in_progress' && (
              <div className="text-xs text-[var(--primary)] mt-1">Filter active</div>
            )}
          </div>
          <div
            className={getStatCardClass('completed')}
            onClick={() => handleStatCardClick('completed')}
          >
            <div className="text-sm text-[var(--muted-foreground)]">Completed</div>
            <div className="text-2xl font-semibold text-green-600 mt-1">{completedCount}</div>
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
          /* Fulfillment Orders Table */
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
                {filteredFulfillmentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-[var(--muted-foreground)]">
                      No fulfillment orders found
                    </td>
                  </tr>
                ) : (
                  filteredFulfillmentOrders.map((fo) => (
                    <tr
                      key={fo.id}
                      className="hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
                      onClick={() => handleRowClick(fo)}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-[var(--foreground)]">{fo.orderNumber}</td>
                      <td className="px-6 py-4 text-sm text-[var(--foreground)]">{fo.customerName}</td>
                      <td className="px-6 py-4">
                        {fo.lineItems.length === 1 ? (
                          <>
                            <div className="text-sm text-[var(--foreground)]">{fo.lineItems[0].productName}</div>
                            <div className="text-xs text-[var(--muted-foreground)]">{fo.lineItems[0].partNumber}</div>
                          </>
                        ) : (
                          <>
                            <div className="text-sm text-[var(--foreground)]">{fo.lineItems.length} products</div>
                            <div className="text-xs text-[var(--muted-foreground)]">{fo.lineItems[0].partNumber} + {fo.lineItems.length - 1} more</div>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--foreground)] text-center">{getTotalQty(fo)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${fulfillmentOrderStatusColors[fo.status]}`}>
                          {fulfillmentOrderStatusLabels[fo.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--muted-foreground)]">{formatDate(fo.createdAt)}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(fo);
                          }}
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

    </main>
  );
}
