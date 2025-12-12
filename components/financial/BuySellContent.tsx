'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  mockBuySellTransactions,
  mockInventory,
  getBuySellStats,
  getWarehouseFactories,
  getWarehouseCustomers,
} from '@/lib/data/warehouse-mock';
import {
  BuySellTransaction,
  BuySellSummary,
  buySellStatusLabels,
  buySellStatusColors,
  BuySellStatus,
} from '@/lib/types/warehouse';

// Filter types for stat card clicks
type StatFilter = 'all' | 'purchases' | 'sales' | 'returns' | 'unpaid_vendor' | 'unpaid_customer';

export default function BuySellContent() {
  const searchParams = useSearchParams();
  const urlFilter = searchParams.get('filter') as StatFilter | null;

  const [transactions] = useState<BuySellTransaction[]>(mockBuySellTransactions);
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedFactory, setSelectedFactory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatFilter, setActiveStatFilter] = useState<StatFilter>(urlFilter || 'all');

  // Update filter when URL changes
  useEffect(() => {
    if (urlFilter && ['all', 'purchases', 'sales', 'returns', 'unpaid_vendor', 'unpaid_customer'].includes(urlFilter)) {
      setActiveStatFilter(urlFilter);
    }
  }, [urlFilter]);

  const stats = useMemo(() => getBuySellStats(), []);
  const factories = useMemo(() => getWarehouseFactories(), []);
  const customers = useMemo(() => getWarehouseCustomers(), []);

  const filteredTransactions = useMemo(() => {
    let result = transactions;

    // Apply stat card filter
    if (activeStatFilter === 'purchases') {
      result = result.filter(t => t.transactionType === 'PURCHASE');
    } else if (activeStatFilter === 'sales') {
      result = result.filter(t => t.transactionType === 'SALE');
    } else if (activeStatFilter === 'returns') {
      result = result.filter(t => t.transactionType === 'RETURN');
    } else if (activeStatFilter === 'unpaid_vendor') {
      result = result.filter(t => t.transactionType === 'PURCHASE' && t.paymentStatus === 'UNPAID');
    } else if (activeStatFilter === 'unpaid_customer') {
      result = result.filter(t => t.transactionType === 'SALE' && t.customerPaymentStatus === 'UNPAID');
    }

    if (selectedType !== 'All') {
      result = result.filter(t => t.transactionType === selectedType);
    }

    if (selectedFactory !== 'All') {
      result = result.filter(t => t.factoryId === selectedFactory);
    }

    if (selectedStatus !== 'All') {
      result = result.filter(t => t.status === selectedStatus);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.productName.toLowerCase().includes(query) ||
        t.partNumber.toLowerCase().includes(query) ||
        t.factoryName.toLowerCase().includes(query) ||
        t.purchaseOrderNumber?.toLowerCase().includes(query) ||
        t.salesOrderNumber?.toLowerCase().includes(query) ||
        t.customerName?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [transactions, selectedType, selectedFactory, selectedStatus, searchQuery, activeStatFilter]);

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

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case 'PURCHASE':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">Purchase</span>;
      case 'SALE':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">Sale</span>;
      case 'RETURN':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700">Return</span>;
      case 'WRITE_OFF':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">Write Off</span>;
      default:
        return <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">{type}</span>;
    }
  };

  const getPaymentStatusBadge = (status: string | undefined) => {
    if (!status) return null;
    switch (status) {
      case 'PAID':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">Paid</span>;
      case 'PARTIAL':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700">Partial</span>;
      case 'UNPAID':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">Unpaid</span>;
      default:
        return null;
    }
  };

  return (
    <main className="flex-1 overflow-hidden bg-[var(--background)] flex flex-col">
      {/* Header */}
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Buy/Sell</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Track purchases, sales, and profit margins for owned inventory (non-consignment).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export
            </button>
          </div>
        </div>

        {/* Stats Cards - Clickable to filter */}
        <div className="grid grid-cols-6 gap-4 mb-6">
          <div
            className={getStatCardClass('purchases')}
            onClick={() => handleStatCardClick('purchases')}
          >
            <div className="text-sm text-[var(--muted-foreground)]">Total Purchases</div>
            <div className="text-2xl font-semibold text-blue-600 mt-1">{stats.totalPurchases}</div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">{formatCurrency(stats.totalPurchaseCost)}</div>
            {activeStatFilter === 'purchases' && (
              <div className="text-xs text-[var(--primary)] mt-1">Filter active</div>
            )}
          </div>
          <div
            className={getStatCardClass('sales')}
            onClick={() => handleStatCardClick('sales')}
          >
            <div className="text-sm text-[var(--muted-foreground)]">Total Sales</div>
            <div className="text-2xl font-semibold text-green-600 mt-1">{stats.totalSales}</div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">{formatCurrency(stats.totalRevenue)}</div>
            {activeStatFilter === 'sales' && (
              <div className="text-xs text-[var(--primary)] mt-1">Filter active</div>
            )}
          </div>
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
            <div className="text-sm text-[var(--muted-foreground)]">Total Profit</div>
            <div className={`text-2xl font-semibold mt-1 ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(stats.totalProfit)}
            </div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">{stats.averageMargin.toFixed(1)}% margin</div>
          </div>
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
            <div className="text-sm text-[var(--muted-foreground)]">Inventory Value</div>
            <div className="text-2xl font-semibold text-[var(--foreground)] mt-1">{formatCurrency(stats.inventoryValue)}</div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">Cost basis</div>
          </div>
          <div
            className={getStatCardClass('unpaid_vendor')}
            onClick={() => handleStatCardClick('unpaid_vendor')}
          >
            <div className="text-sm text-[var(--muted-foreground)]">Unpaid to Vendors</div>
            <div className="text-2xl font-semibold text-red-600 mt-1">{stats.unpaidVendorInvoices}</div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">{formatCurrency(stats.unpaidVendorAmount)}</div>
            {activeStatFilter === 'unpaid_vendor' && (
              <div className="text-xs text-[var(--primary)] mt-1">Filter active</div>
            )}
          </div>
          <div
            className={getStatCardClass('unpaid_customer')}
            onClick={() => handleStatCardClick('unpaid_customer')}
          >
            <div className="text-sm text-[var(--muted-foreground)]">Unpaid by Customers</div>
            <div className="text-2xl font-semibold text-orange-600 mt-1">{stats.unpaidCustomerInvoices}</div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">{formatCurrency(stats.unpaidCustomerAmount)}</div>
            {activeStatFilter === 'unpaid_customer' && (
              <div className="text-xs text-[var(--primary)] mt-1">Filter active</div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
          >
            <option value="All">All Types</option>
            <option value="PURCHASE">Purchases</option>
            <option value="SALE">Sales</option>
            <option value="RETURN">Returns</option>
          </select>

          <select
            value={selectedFactory}
            onChange={(e) => setSelectedFactory(e.target.value)}
            className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
          >
            <option value="All">All Factories</option>
            {factories.map(factory => (
              <option key={factory.id} value={factory.id}>{factory.name}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
          >
            <option value="All">All Statuses</option>
            {Object.entries(buySellStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          {activeStatFilter !== 'all' && (
            <button
              onClick={() => setActiveStatFilter('all')}
              className="px-3 py-2 text-sm text-[var(--primary)] hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--muted)]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Reference</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Product</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Factory</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Customer</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Qty</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Unit Cost</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Unit Price</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Total</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Profit</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Status</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-8 text-center text-[var(--muted-foreground)]">
                    No transactions found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-[var(--muted)]/50 transition-colors">
                    <td className="px-4 py-3">
                      {getTransactionTypeBadge(transaction.transactionType)}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--foreground)]">
                      {formatDate(transaction.transactionType === 'PURCHASE' ? transaction.purchaseDate : transaction.saleDate)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="text-[var(--foreground)] font-medium">
                        {transaction.purchaseOrderNumber || transaction.salesOrderNumber || '-'}
                      </div>
                      {transaction.vendorInvoiceNumber && (
                        <div className="text-xs text-[var(--muted-foreground)]">Inv: {transaction.vendorInvoiceNumber}</div>
                      )}
                      {transaction.customerInvoiceNumber && (
                        <div className="text-xs text-[var(--muted-foreground)]">Inv: {transaction.customerInvoiceNumber}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-[var(--foreground)] font-medium">{transaction.productName}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{transaction.partNumber}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--foreground)]">
                      {transaction.factoryName}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--foreground)]">
                      {transaction.customerName || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">
                      {transaction.quantity}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">
                      {formatCurrency(transaction.unitCost)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-[var(--foreground)]">
                      {transaction.unitPrice ? formatCurrency(transaction.unitPrice) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {transaction.transactionType === 'PURCHASE' ? (
                        <span className="text-blue-600">{formatCurrency(transaction.totalCost)}</span>
                      ) : (
                        <span className={transaction.totalRevenue && transaction.totalRevenue >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(transaction.totalRevenue)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {transaction.totalProfit !== undefined ? (
                        <div>
                          <span className={transaction.totalProfit >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                            {formatCurrency(transaction.totalProfit)}
                          </span>
                          {transaction.marginPercentage !== undefined && (
                            <div className="text-xs text-[var(--muted-foreground)]">{transaction.marginPercentage.toFixed(1)}%</div>
                          )}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${buySellStatusColors[transaction.status] || 'bg-gray-100 text-gray-700'}`}
                      >
                        {buySellStatusLabels[transaction.status] || transaction.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {transaction.transactionType === 'PURCHASE'
                        ? getPaymentStatusBadge(transaction.paymentStatus)
                        : getPaymentStatusBadge(transaction.customerPaymentStatus)
                      }
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
