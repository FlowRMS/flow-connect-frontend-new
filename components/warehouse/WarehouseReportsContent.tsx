'use client';

import React, { useState, useMemo } from 'react';
import {
  mockInventory,
  mockInventoryItems,
  mockFulfillments,
  mockAdjustments,
  mockIncomingShipments,
  mockRmas,
  getInventoryStats,
  getFulfillmentStats,
  getWarehouseStats,
} from '@/lib/data/warehouse-mock';
import { inventoryStatusLabels, fulfillmentStatusLabels, adjustmentTypeLabels } from '@/lib/types/warehouse';
import WarehouseSelector from './WarehouseSelector';
import { useWarehouse } from './WarehouseContext';

type ReportType = 'inventory' | 'fulfillment' | 'adjustments' | 'cycle-count';
type DateRange = '7d' | '30d' | '90d' | 'custom';

export default function WarehouseReportsContent() {
  const { selectedWarehouse } = useWarehouse();
  const [activeReport, setActiveReport] = useState<ReportType>('inventory');
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  const inventoryStats = useMemo(() => getInventoryStats(), []);
  const fulfillmentStats = useMemo(() => getFulfillmentStats(), []);
  const warehouseStats = useMemo(() => getWarehouseStats(), []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const reports = [
    { id: 'inventory' as ReportType, name: 'Inventory Summary', icon: '📦' },
    { id: 'fulfillment' as ReportType, name: 'Fulfillment Report', icon: '🚚' },
    { id: 'adjustments' as ReportType, name: 'Adjustment History', icon: '📝' },
    { id: 'cycle-count' as ReportType, name: 'Cycle Count', icon: '🔄' },
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Warehouse Reports</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Analytics and reporting for warehouse operations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <WarehouseSelector />
          <button className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export Report
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
          <div className="text-sm text-[var(--muted-foreground)]">Total SKUs</div>
          <div className="text-2xl font-semibold text-[var(--foreground)] mt-1">{inventoryStats.totalProducts}</div>
        </div>
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
          <div className="text-sm text-[var(--muted-foreground)]">Total Units</div>
          <div className="text-2xl font-semibold text-[var(--foreground)] mt-1">{inventoryStats.totalQuantity.toLocaleString()}</div>
        </div>
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
          <div className="text-sm text-[var(--muted-foreground)]">Available</div>
          <div className="text-2xl font-semibold text-green-600 mt-1">{inventoryStats.availableQuantity.toLocaleString()}</div>
        </div>
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
          <div className="text-sm text-[var(--muted-foreground)]">Reserved</div>
          <div className="text-2xl font-semibold text-blue-600 mt-1">{inventoryStats.reservedQuantity}</div>
        </div>
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
          <div className="text-sm text-[var(--muted-foreground)]">Low Stock</div>
          <div className="text-2xl font-semibold text-yellow-600 mt-1">{inventoryStats.lowStockCount}</div>
        </div>
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
          <div className="text-sm text-[var(--muted-foreground)]">Out of Stock</div>
          <div className="text-2xl font-semibold text-red-600 mt-1">{inventoryStats.outOfStockCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Report Navigation */}
        <div className="col-span-1">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <h2 className="font-semibold text-[var(--foreground)]">Reports</h2>
            </div>
            <div className="p-2">
              {reports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => setActiveReport(report.id)}
                  className={`w-full px-3 py-2 rounded-lg text-left transition-colors flex items-center gap-2 ${
                    activeReport === report.id
                      ? 'bg-[var(--primary)] text-white'
                      : 'hover:bg-[var(--muted)] text-[var(--foreground)]'
                  }`}
                >
                  <span>{report.icon}</span>
                  <span className="text-sm font-medium">{report.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] mt-4">
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <h2 className="font-semibold text-[var(--foreground)]">Date Range</h2>
            </div>
            <div className="p-2">
              {[
                { id: '7d' as DateRange, label: 'Last 7 days' },
                { id: '30d' as DateRange, label: 'Last 30 days' },
                { id: '90d' as DateRange, label: 'Last 90 days' },
                { id: 'custom' as DateRange, label: 'Custom range' },
              ].map((range) => (
                <button
                  key={range.id}
                  onClick={() => setDateRange(range.id)}
                  className={`w-full px-3 py-2 rounded-lg text-left transition-colors text-sm ${
                    dateRange === range.id
                      ? 'bg-[var(--muted)] text-[var(--foreground)] font-medium'
                      : 'hover:bg-[var(--muted)]/50 text-[var(--muted-foreground)]'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="col-span-3">
          {activeReport === 'inventory' && (
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
              <div className="px-6 py-4 border-b border-[var(--border)]">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Inventory Summary</h2>
                <p className="text-sm text-[var(--muted-foreground)]">Current inventory levels by product</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">SKU</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Factory</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">On Hand</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">Available</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">Reserved</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">Reorder Point</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {mockInventory.map((inv) => (
                      <tr key={inv.id} className="hover:bg-[var(--muted)]/20">
                        <td className="px-6 py-4 text-sm font-medium text-[var(--foreground)]">{inv.partNumber}</td>
                        <td className="px-6 py-4 text-sm text-[var(--foreground)]">{inv.productName}</td>
                        <td className="px-6 py-4 text-sm text-[var(--muted-foreground)]">{inv.factoryName}</td>
                        <td className="px-6 py-4 text-sm text-right text-[var(--foreground)]">{inv.totalQuantity}</td>
                        <td className="px-6 py-4 text-sm text-right text-green-600">{inv.availableQuantity}</td>
                        <td className="px-6 py-4 text-sm text-right text-blue-600">{inv.reservedQuantity}</td>
                        <td className="px-6 py-4 text-sm text-right">
                          <span className={inv.availableQuantity <= (inv.reorderPoint || 0) ? 'text-red-600 font-medium' : 'text-[var(--muted-foreground)]'}>
                            {inv.reorderPoint || '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeReport === 'fulfillment' && (
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
              <div className="px-6 py-4 border-b border-[var(--border)]">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Fulfillment Report</h2>
                <p className="text-sm text-[var(--muted-foreground)]">Order fulfillment activity and performance</p>
              </div>

              {/* Fulfillment Stats */}
              <div className="grid grid-cols-4 gap-4 p-6 border-b border-[var(--border)]">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[var(--foreground)]">{fulfillmentStats.totalFulfillments}</div>
                  <div className="text-sm text-[var(--muted-foreground)]">Total Orders</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">{fulfillmentStats.pendingFulfillments}</div>
                  <div className="text-sm text-[var(--muted-foreground)]">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{fulfillmentStats.inProgressFulfillments}</div>
                  <div className="text-sm text-[var(--muted-foreground)]">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{fulfillmentStats.shippedFulfillments}</div>
                  <div className="text-sm text-[var(--muted-foreground)]">Shipped</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Order #</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Items</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Shipped</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {mockFulfillments.map((fulfillment) => (
                      <tr key={fulfillment.id} className="hover:bg-[var(--muted)]/20">
                        <td className="px-6 py-4 text-sm font-medium text-[var(--foreground)]">{fulfillment.orderNumber}</td>
                        <td className="px-6 py-4 text-sm text-[var(--foreground)]">{fulfillment.customerName}</td>
                        <td className="px-6 py-4 text-sm text-[var(--foreground)]">{fulfillment.quantity}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            fulfillment.status === 'SHIPPED' ? 'bg-green-100 text-green-700' :
                            fulfillment.status === 'PICKING' || fulfillment.status === 'PACKING' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {fulfillmentStatusLabels[fulfillment.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--muted-foreground)]">{formatDate(fulfillment.createdAt)}</td>
                        <td className="px-6 py-4 text-sm text-[var(--muted-foreground)]">
                          {fulfillment.shippedAt ? formatDate(fulfillment.shippedAt) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeReport === 'adjustments' && (
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
              <div className="px-6 py-4 border-b border-[var(--border)]">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Adjustment History</h2>
                <p className="text-sm text-[var(--muted-foreground)]">Inventory adjustments and audit trail</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Type</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">Qty Change</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Reason</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">User</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {mockAdjustments.map((adj) => {
                      const inventory = mockInventory.find(i => i.id === adj.inventoryId);
                      return (
                        <tr key={adj.id} className="hover:bg-[var(--muted)]/20">
                          <td className="px-6 py-4 text-sm text-[var(--muted-foreground)]">{formatDateTime(adj.adjustedAt)}</td>
                          <td className="px-6 py-4 text-sm text-[var(--foreground)]">{inventory?.productName || '-'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              adj.type === 'RECEIPT' ? 'bg-green-100 text-green-700' :
                              adj.type === 'SHIPMENT' || adj.type === 'DAMAGE' || adj.type === 'LOSS' ? 'bg-red-100 text-red-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {adjustmentTypeLabels[adj.type]}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-right">
                            <span className={adj.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}>
                              {adj.quantityChange > 0 ? '+' : ''}{adj.quantityChange}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-[var(--muted-foreground)]">{adj.reason}</td>
                          <td className="px-6 py-4 text-sm text-[var(--foreground)]">{adj.adjustedBy}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeReport === 'cycle-count' && (
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
              <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">Cycle Count</h2>
                  <p className="text-sm text-[var(--muted-foreground)]">Verify physical inventory against system records</p>
                </div>
                <button className="px-4 py-2 bg-[var(--primary)] text-white text-sm rounded-lg hover:bg-[var(--primary-hover)] transition-colors">
                  Start New Count
                </button>
              </div>

              {/* Cycle Count Summary */}
              <div className="p-6 border-b border-[var(--border)]">
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-[var(--muted)]/30 rounded-lg p-4">
                    <div className="text-sm text-[var(--muted-foreground)]">Last Full Count</div>
                    <div className="text-lg font-semibold text-[var(--foreground)] mt-1">Nov 15, 2024</div>
                    <div className="text-xs text-[var(--muted-foreground)] mt-1">28 days ago</div>
                  </div>
                  <div className="bg-[var(--muted)]/30 rounded-lg p-4">
                    <div className="text-sm text-[var(--muted-foreground)]">Accuracy Rate</div>
                    <div className="text-lg font-semibold text-green-600 mt-1">98.5%</div>
                    <div className="text-xs text-[var(--muted-foreground)] mt-1">Last 30 days</div>
                  </div>
                  <div className="bg-[var(--muted)]/30 rounded-lg p-4">
                    <div className="text-sm text-[var(--muted-foreground)]">Items Counted</div>
                    <div className="text-lg font-semibold text-[var(--foreground)] mt-1">{mockInventory.length}</div>
                    <div className="text-xs text-[var(--muted-foreground)] mt-1">This month</div>
                  </div>
                </div>
              </div>

              {/* Items to Count */}
              <div className="px-6 py-4 border-b border-[var(--border)]">
                <h3 className="font-medium text-[var(--foreground)]">Priority Items for Count</h3>
                <p className="text-sm text-[var(--muted-foreground)]">High-value or high-movement items due for verification</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">SKU</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Product</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">System Qty</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Last Counted</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase">Priority</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {mockInventory.slice(0, 5).map((inv, index) => (
                      <tr key={inv.id} className="hover:bg-[var(--muted)]/20">
                        <td className="px-6 py-4 text-sm font-medium text-[var(--foreground)]">{inv.partNumber}</td>
                        <td className="px-6 py-4 text-sm text-[var(--foreground)]">{inv.productName}</td>
                        <td className="px-6 py-4 text-sm text-right text-[var(--foreground)]">{inv.totalQuantity}</td>
                        <td className="px-6 py-4 text-sm text-[var(--muted-foreground)]">
                          {formatDate(new Date(Date.now() - (index + 1) * 7 * 24 * 60 * 60 * 1000).toISOString())}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            index < 2 ? 'bg-red-100 text-red-700' :
                            index < 4 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {index < 2 ? 'High' : index < 4 ? 'Medium' : 'Low'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="px-3 py-1.5 text-xs font-medium text-[var(--primary)] hover:bg-[var(--muted)] rounded transition-colors">
                            Count Now
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
