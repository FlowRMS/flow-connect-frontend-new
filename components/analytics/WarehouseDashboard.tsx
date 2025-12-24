'use client';

import React, { useState } from 'react';
import BarChart from '../charts/BarChart';
import AdvancedFilters from './AdvancedFilters';

// Metric Card
function MetricCard({
  title,
  value,
  comparison,
  trend,
  insight
}: {
  title: string;
  value: string;
  comparison?: string;
  trend?: 'up' | 'down' | 'flat';
  insight?: string;
}) {
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-5">
      <div className="text-sm text-[var(--muted-foreground)] mb-2">{title}</div>
      <div className="text-3xl font-bold text-[var(--foreground)]">{value}</div>
      {comparison && (
        <div className={`text-sm mt-2 flex items-center gap-1 ${
          trend === 'up' ? 'text-[var(--success)]' :
          trend === 'down' ? 'text-[var(--destructive)]' :
          'text-[var(--muted-foreground)]'
        }`}>
          {trend === 'up' && '↑'}
          {trend === 'down' && '↓'}
          {comparison}
        </div>
      )}
      {insight && (
        <div className="text-xs text-[var(--muted-foreground)] mt-2 pt-2 border-t border-[var(--border)]">
          {insight}
        </div>
      )}
    </div>
  );
}

// Status Badge
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    'In Stock': 'bg-green-100 text-green-800 border-green-200',
    'Low Stock': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Out of Stock': 'bg-red-100 text-red-800 border-red-200',
    'On Order': 'bg-blue-100 text-blue-800 border-blue-200',
    'Backordered': 'bg-orange-100 text-orange-800 border-orange-200',
    'Received': 'bg-green-100 text-green-800 border-green-200',
    'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Shipped': 'bg-blue-100 text-blue-800 border-blue-200',
    'Processing': 'bg-purple-100 text-purple-800 border-purple-200',
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium border ${colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
      {status}
    </span>
  );
}

export default function WarehouseDashboard() {
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter'>('month');

  // Inventory summary
  const inventorySummary = {
    totalSKUs: 1247,
    totalValue: '$2.4M',
    lowStockItems: 34,
    outOfStockItems: 8,
    onOrderValue: '$186K',
    receivedThisMonth: 156,
  };

  // Inventory by category
  const inventoryByCategory = [
    { category: 'Switchgear', skus: 234, value: '$680K', lowStock: 8, turnover: '4.2x' },
    { category: 'Motor Controls', skus: 189, value: '$420K', lowStock: 5, turnover: '5.1x' },
    { category: 'Lighting', skus: 312, value: '$380K', lowStock: 12, turnover: '6.8x' },
    { category: 'Wire & Cable', skus: 156, value: '$290K', lowStock: 3, turnover: '8.2x' },
    { category: 'Transformers', skus: 87, value: '$340K', lowStock: 2, turnover: '2.4x' },
    { category: 'Panel Boards', skus: 145, value: '$210K', lowStock: 4, turnover: '3.9x' },
    { category: 'Safety Equipment', skus: 124, value: '$80K', lowStock: 0, turnover: '7.5x' },
  ];

  // Low stock alerts
  const lowStockAlerts = [
    { sku: 'SE-MCC-4200', name: 'Motor Control Center 400A', category: 'Motor Controls', onHand: 2, reorderPoint: 5, lastSold: '2 days ago', onOrder: 8 },
    { sku: 'ABB-SW-600', name: 'Low Voltage Switchgear', category: 'Switchgear', onHand: 1, reorderPoint: 3, lastSold: '1 day ago', onOrder: 4 },
    { sku: 'EA-PNL-200', name: 'Panelboard 200A', category: 'Panel Boards', onHand: 3, reorderPoint: 8, lastSold: '3 days ago', onOrder: 0 },
    { sku: 'GE-XFMR-75', name: 'Dry Type Transformer 75kVA', category: 'Transformers', onHand: 0, reorderPoint: 2, lastSold: '5 days ago', onOrder: 2 },
    { sku: 'SI-VFD-50', name: 'Variable Frequency Drive 50HP', category: 'Motor Controls', onHand: 1, reorderPoint: 4, lastSold: 'Today', onOrder: 6 },
    { sku: 'LED-HB-200', name: 'LED High Bay 200W', category: 'Lighting', onHand: 12, reorderPoint: 25, lastSold: 'Today', onOrder: 50 },
  ];

  // Recent orders (incoming shipments)
  const incomingOrders = [
    { poNumber: 'PO-2024-1847', vendor: 'Schneider Electric', items: 24, value: '$48,500', status: 'Shipped', eta: 'Dec 10' },
    { poNumber: 'PO-2024-1842', vendor: 'ABB', items: 12, value: '$32,200', status: 'Processing', eta: 'Dec 12' },
    { poNumber: 'PO-2024-1838', vendor: 'Eaton', items: 38, value: '$28,900', status: 'Shipped', eta: 'Dec 9' },
    { poNumber: 'PO-2024-1835', vendor: 'Siemens', items: 8, value: '$42,100', status: 'Pending', eta: 'Dec 15' },
    { poNumber: 'PO-2024-1830', vendor: 'GE', items: 15, value: '$18,700', status: 'Received', eta: 'Dec 6' },
  ];

  // Outgoing shipments (to customers/jobs)
  const outgoingShipments = [
    { shipmentId: 'SH-8847', customer: 'Turner Construction', job: 'Warehouse Expansion', items: 18, value: '$34,200', status: 'Shipped', shipDate: 'Dec 6' },
    { shipmentId: 'SH-8845', customer: 'Miller Electric', job: 'Solar Installation', items: 45, value: '$28,900', status: 'Processing', shipDate: 'Dec 8' },
    { shipmentId: 'SH-8842', customer: 'Coastal Builders', job: 'Office Complex', items: 12, value: '$18,500', status: 'Pending', shipDate: 'Dec 9' },
    { shipmentId: 'SH-8840', customer: 'Johnson Controls', job: 'HVAC Upgrade', items: 8, value: '$12,300', status: 'Shipped', shipDate: 'Dec 5' },
    { shipmentId: 'SH-8838', customer: 'TechCorp', job: 'Data Center', items: 32, value: '$67,800', status: 'Processing', shipDate: 'Dec 10' },
  ];

  // Inventory movement this month
  const inventoryMovement = [
    { label: 'W1', received: 42, shipped: 38 },
    { label: 'W2', received: 58, shipped: 52 },
    { label: 'W3', received: 34, shipped: 48 },
    { label: 'W4', received: 22, shipped: 35 },
  ];

  // Top moving items
  const topMovingItems = [
    { sku: 'LED-HB-200', name: 'LED High Bay 200W', moved: 156, value: '$23,400', trend: 'up' },
    { sku: 'WC-THHN-12', name: 'THHN Wire 12 AWG', moved: 12500, value: '$18,750', trend: 'up' },
    { sku: 'SE-CB-100', name: 'Circuit Breaker 100A', moved: 89, value: '$15,600', trend: 'flat' },
    { sku: 'SI-VFD-25', name: 'VFD 25HP', moved: 24, value: '$14,400', trend: 'up' },
    { sku: 'EA-DIS-200', name: 'Disconnect 200A', moved: 67, value: '$12,100', trend: 'down' },
  ];

  // Slow moving items
  const slowMovingItems = [
    { sku: 'ABB-XFMR-500', name: 'Transformer 500kVA', onHand: 2, daysInStock: 180, value: '$48,000', lastSold: '6 months ago' },
    { sku: 'GE-SW-1200', name: 'Switchgear 1200A', onHand: 1, daysInStock: 145, value: '$32,000', lastSold: '5 months ago' },
    { sku: 'SE-MCC-800', name: 'MCC 800A', onHand: 1, daysInStock: 120, value: '$28,500', lastSold: '4 months ago' },
    { sku: 'EA-ATS-600', name: 'Auto Transfer Switch 600A', onHand: 2, daysInStock: 95, value: '$18,400', lastSold: '3 months ago' },
  ];

  // Chart data
  const receivedByWeek = inventoryMovement.map(w => ({ label: w.label, value: w.received }));
  const shippedByWeek = inventoryMovement.map(w => ({ label: w.label, value: w.shipped }));

  const categoryChartData = inventoryByCategory.slice(0, 6).map(c => ({
    label: c.category.split(' ')[0],
    value: parseFloat(c.value.replace(/[$K]/g, ''))
  }));

  // Insights
  const insights = [
    { type: 'warning', title: '8 Items Out of Stock', message: 'Critical items including GE-XFMR-75 (Dry Type Transformer) are out of stock. 2 are on order, 6 need immediate reorder.' },
    { type: 'info', title: 'Inventory Turnover Healthy', message: 'Overall inventory turnover is 4.8x annually. Wire & Cable (8.2x) and Lighting (6.8x) are your fastest moving categories.' },
    { type: 'success', title: '$186K On Order', message: '5 purchase orders in transit. $81,400 expected to arrive this week (Eaton and Schneider shipments).' },
    { type: 'warning', title: 'Slow Moving Inventory', message: '$127K in inventory has not moved in 90+ days. Consider promotions or returns to free up capital.' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Warehouse Dashboard</h1>
          <p className="text-sm text-[var(--muted-foreground)]">For warehouse managers · What's in stock? What needs to be ordered?</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex bg-[var(--muted)] rounded-lg p-1">
            <button
              onClick={() => setDateRange('week')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                dateRange === 'week'
                  ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setDateRange('month')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                dateRange === 'month'
                  ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setDateRange('quarter')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                dateRange === 'quarter'
                  ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              Quarter
            </button>
          </div>

          <AdvancedFilters
            filterOptions={[
              {
                id: 'category',
                label: 'Category',
                type: 'multiselect',
                options: [
                  { value: 'switchgear', label: 'Switchgear' },
                  { value: 'motor-controls', label: 'Motor Controls' },
                  { value: 'lighting', label: 'Lighting' },
                  { value: 'wire-cable', label: 'Wire & Cable' },
                  { value: 'transformers', label: 'Transformers' },
                  { value: 'panel-boards', label: 'Panel Boards' },
                ]
              },
              {
                id: 'manufacturer',
                label: 'Manufacturer',
                type: 'multiselect',
                options: [
                  { value: 'schneider', label: 'Schneider Electric' },
                  { value: 'abb', label: 'ABB' },
                  { value: 'eaton', label: 'Eaton' },
                  { value: 'siemens', label: 'Siemens' },
                  { value: 'ge', label: 'GE' },
                ]
              },
              {
                id: 'status',
                label: 'Stock Status',
                type: 'multiselect',
                options: [
                  { value: 'in-stock', label: 'In Stock' },
                  { value: 'low-stock', label: 'Low Stock' },
                  { value: 'out-of-stock', label: 'Out of Stock' },
                  { value: 'on-order', label: 'On Order' },
                ]
              },
            ]}
            onApply={(filters) => console.log('Applied filters:', filters)}
            onSave={(name, filters) => console.log('Saved filter:', name, filters)}
          />

          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        <MetricCard
          title="Total SKUs"
          value={inventorySummary.totalSKUs.toLocaleString()}
          comparison="+12 this month"
          trend="up"
          insight="Active inventory items"
        />
        <MetricCard
          title="Inventory Value"
          value={inventorySummary.totalValue}
          comparison="+$45K vs last month"
          trend="up"
          insight="Total on-hand value"
        />
        <MetricCard
          title="Low Stock Items"
          value={inventorySummary.lowStockItems.toString()}
          comparison="6 need reorder"
          trend="down"
          insight="Below reorder point"
        />
        <MetricCard
          title="Out of Stock"
          value={inventorySummary.outOfStockItems.toString()}
          comparison="2 on order"
          trend="down"
          insight="0 qty on hand"
        />
        <MetricCard
          title="On Order Value"
          value={inventorySummary.onOrderValue}
          comparison="5 POs pending"
          trend="flat"
          insight="Incoming shipments"
        />
        <MetricCard
          title="Received This Month"
          value={inventorySummary.receivedThisMonth.toString()}
          comparison="+18% vs last month"
          trend="up"
          insight="Items received"
        />
      </div>

      {/* Insights */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg mb-6">
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--foreground)]">Insights & Alerts</h3>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          {insights.map((insight, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border ${
                insight.type === 'success' ? 'bg-green-50/50 border-green-200' :
                insight.type === 'warning' ? 'bg-yellow-50/50 border-yellow-200' :
                'bg-blue-50/50 border-blue-200'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  insight.type === 'success' ? 'bg-green-100 text-green-600' :
                  insight.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  {insight.type === 'success' && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20,6 9,17 4,12"/>
                    </svg>
                  )}
                  {insight.type === 'warning' && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  )}
                  {insight.type === 'info' && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                  )}
                </div>
                <div>
                  <div className={`text-sm font-medium ${
                    insight.type === 'success' ? 'text-green-800' :
                    insight.type === 'warning' ? 'text-yellow-800' :
                    'text-blue-800'
                  }`}>{insight.title}</div>
                  <div className={`text-xs mt-0.5 ${
                    insight.type === 'success' ? 'text-green-700' :
                    insight.type === 'warning' ? 'text-yellow-700' :
                    'text-blue-700'
                  }`}>{insight.message}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Items Received by Week</h3>
          <div className="h-[180px]">
            <BarChart data={receivedByWeek} height={160} />
          </div>
          <div className="text-xs text-[var(--muted-foreground)] mt-2">{inventorySummary.receivedThisMonth} items received this month</div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Items Shipped by Week</h3>
          <div className="h-[180px]">
            <BarChart data={shippedByWeek} height={160} />
          </div>
          <div className="text-xs text-[var(--muted-foreground)] mt-2">173 items shipped this month</div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Inventory Value by Category ($K)</h3>
          <div className="h-[180px]">
            <BarChart data={categoryChartData} height={160} />
          </div>
          <div className="text-xs text-[var(--muted-foreground)] mt-2">Top 6 categories shown</div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg mb-6">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-yellow-50/50">
          <h3 className="font-semibold text-yellow-800">Low Stock Alerts ({lowStockAlerts.length})</h3>
          <button className="text-sm text-yellow-700 hover:text-yellow-900 font-medium">Create Reorder List</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Item Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Category</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">On Hand</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Reorder Pt</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">On Order</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Last Sold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {lowStockAlerts.map((item, idx) => (
                <tr key={idx} className={`hover:bg-[var(--muted)] transition-colors ${item.onHand === 0 ? 'bg-red-50/50' : ''}`}>
                  <td className="px-4 py-3 text-sm font-mono text-[var(--foreground)]">{item.sku}</td>
                  <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">{item.name}</td>
                  <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{item.category}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    <span className={`font-medium ${item.onHand === 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                      {item.onHand}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-[var(--muted-foreground)]">{item.reorderPoint}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    {item.onOrder > 0 ? (
                      <span className="text-blue-600 font-medium">{item.onOrder}</span>
                    ) : (
                      <span className="text-red-600">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{item.lastSold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incoming and Outgoing */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Incoming Orders */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg">
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
            <h3 className="font-semibold text-[var(--foreground)]">Incoming Orders</h3>
            <span className="text-sm text-[var(--muted-foreground)]">{inventorySummary.onOrderValue} on order</span>
          </div>
          <div className="overflow-x-auto max-h-[300px]">
            <table className="w-full">
              <thead className="bg-[var(--muted)] sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">PO #</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Vendor</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Items</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Value</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Status</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">ETA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {incomingOrders.map((order, idx) => (
                  <tr key={idx} className="hover:bg-[var(--muted)] transition-colors">
                    <td className="px-4 py-2 text-sm font-mono text-[var(--foreground)]">{order.poNumber}</td>
                    <td className="px-4 py-2 text-sm text-[var(--foreground)]">{order.vendor}</td>
                    <td className="px-4 py-2 text-sm text-right text-[var(--muted-foreground)]">{order.items}</td>
                    <td className="px-4 py-2 text-sm text-right font-medium text-[var(--foreground)]">{order.value}</td>
                    <td className="px-4 py-2"><StatusBadge status={order.status} /></td>
                    <td className="px-4 py-2 text-sm text-right text-[var(--muted-foreground)]">{order.eta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Outgoing Shipments */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg">
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
            <h3 className="font-semibold text-[var(--foreground)]">Outgoing Shipments</h3>
            <span className="text-sm text-[var(--muted-foreground)]">To customers/jobs</span>
          </div>
          <div className="overflow-x-auto max-h-[300px]">
            <table className="w-full">
              <thead className="bg-[var(--muted)] sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Shipment</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Customer</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Items</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Value</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {outgoingShipments.map((shipment, idx) => (
                  <tr key={idx} className="hover:bg-[var(--muted)] transition-colors">
                    <td className="px-4 py-2 text-sm font-mono text-[var(--foreground)]">{shipment.shipmentId}</td>
                    <td className="px-4 py-2 text-sm">
                      <div className="font-medium text-[var(--foreground)]">{shipment.customer}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{shipment.job}</div>
                    </td>
                    <td className="px-4 py-2 text-sm text-right text-[var(--muted-foreground)]">{shipment.items}</td>
                    <td className="px-4 py-2 text-sm text-right font-medium text-[var(--foreground)]">{shipment.value}</td>
                    <td className="px-4 py-2"><StatusBadge status={shipment.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Inventory by Category */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg mb-6">
        <div className="p-4 border-b border-[var(--border)]">
          <h3 className="font-semibold text-[var(--foreground)]">Inventory by Category</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Category</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">SKUs</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Value</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Low Stock</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Turnover</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {inventoryByCategory.map((cat, idx) => {
                const turnoverNum = parseFloat(cat.turnover);
                const health = turnoverNum >= 6 ? 'Excellent' : turnoverNum >= 4 ? 'Good' : turnoverNum >= 2 ? 'Fair' : 'Slow';
                const healthColor = turnoverNum >= 6 ? 'text-green-600' : turnoverNum >= 4 ? 'text-blue-600' : turnoverNum >= 2 ? 'text-yellow-600' : 'text-red-600';
                return (
                  <tr key={idx} className="hover:bg-[var(--muted)] transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">{cat.category}</td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">{cat.skus}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-[var(--foreground)]">{cat.value}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      {cat.lowStock > 0 ? (
                        <span className="text-yellow-600 font-medium">{cat.lowStock}</span>
                      ) : (
                        <span className="text-green-600">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--muted-foreground)]">{cat.turnover}</td>
                    <td className={`px-4 py-3 text-sm font-medium ${healthColor}`}>{health}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Moving and Slow Moving */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Top Moving */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg">
          <div className="p-4 border-b border-[var(--border)] bg-green-50/50">
            <h3 className="font-semibold text-green-800">Top Moving Items</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--muted)]">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">SKU</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Item</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Moved</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {topMovingItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[var(--muted)] transition-colors">
                    <td className="px-4 py-2 text-sm font-mono text-[var(--foreground)]">{item.sku}</td>
                    <td className="px-4 py-2 text-sm text-[var(--foreground)]">{item.name}</td>
                    <td className="px-4 py-2 text-sm text-right font-medium text-green-600">{item.moved.toLocaleString()}</td>
                    <td className="px-4 py-2 text-sm text-right text-[var(--muted-foreground)]">{item.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Slow Moving */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg">
          <div className="p-4 border-b border-[var(--border)] bg-red-50/50">
            <h3 className="font-semibold text-red-800">Slow Moving Items (90+ Days)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--muted)]">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">SKU</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase">Item</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">On Hand</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Days</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[var(--muted-foreground)] uppercase">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {slowMovingItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[var(--muted)] transition-colors">
                    <td className="px-4 py-2 text-sm font-mono text-[var(--foreground)]">{item.sku}</td>
                    <td className="px-4 py-2 text-sm text-[var(--foreground)]">{item.name}</td>
                    <td className="px-4 py-2 text-sm text-right text-[var(--muted-foreground)]">{item.onHand}</td>
                    <td className="px-4 py-2 text-sm text-right text-red-600 font-medium">{item.daysInStock}</td>
                    <td className="px-4 py-2 text-sm text-right text-[var(--muted-foreground)]">{item.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
