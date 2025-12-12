'use client';

import React, { useState, useMemo } from 'react';
import {
  mockSalesReps,
  mockManufacturers,
  mockOrders,
  mockInvoices,
  getCommissionSummaryByRep,
  getCommissionSummaryByManufacturer,
} from '../../lib/data/rms-mock';
import {
  CommissionSummary,
  ManufacturerCommissionSummary,
  commissionStatusLabels,
  commissionStatusColors,
} from '../../lib/types/rms';

type ViewMode = 'by-rep' | 'by-manufacturer';
type RepSortField = 'salesRepName' | 'pending' | 'accruing' | 'paid' | 'total';
type MfgSortField = 'manufacturerName' | 'orderCount' | 'totalSales' | 'totalCommission' | 'paidCommission' | 'pendingCommission';
type SortDirection = 'asc' | 'desc';
type StatFilter = 'all' | 'paid' | 'accruing' | 'pending';

interface RepColumnFilters {
  salesRepName: string[];
  pending: string[];
  accruing: string[];
  paid: string[];
  total: string[];
}

interface MfgColumnFilters {
  manufacturerName: string[];
  orderCount: string[];
  totalSales: string[];
  totalCommission: string[];
  paidCommission: string[];
  pendingCommission: string[];
}

export default function CommissionsContent() {
  const [viewMode, setViewMode] = useState<ViewMode>('by-rep');
  const [selectedRepId, setSelectedRepId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [repSortField, setRepSortField] = useState<RepSortField>('total');
  const [repSortDirection, setRepSortDirection] = useState<SortDirection>('desc');
  const [mfgSortField, setMfgSortField] = useState<MfgSortField>('totalCommission');
  const [mfgSortDirection, setMfgSortDirection] = useState<SortDirection>('desc');
  const [statFilter, setStatFilter] = useState<StatFilter>('all');
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [repColumnFilters, setRepColumnFilters] = useState<RepColumnFilters>({
    salesRepName: [],
    pending: [],
    accruing: [],
    paid: [],
    total: [],
  });
  const [mfgColumnFilters, setMfgColumnFilters] = useState<MfgColumnFilters>({
    manufacturerName: [],
    orderCount: [],
    totalSales: [],
    totalCommission: [],
    paidCommission: [],
    pendingCommission: [],
  });

  const repSummaries = useMemo(() => getCommissionSummaryByRep(), []);
  const mfgSummaries = useMemo(() => getCommissionSummaryByManufacturer(), []);

  // Get unique values for filter dropdowns
  const uniqueReps = useMemo(() =>
    [...new Set(repSummaries.map(r => r.salesRepName))].sort(), [repSummaries]);
  const uniqueMfgs = useMemo(() =>
    [...new Set(mfgSummaries.map(m => m.manufacturerName))].sort(), [mfgSummaries]);

  // Rep filter values
  const uniqueRepPending = useMemo(() =>
    [...new Set(repSummaries.map(r => r.pending))].sort((a, b) => b - a), [repSummaries]);
  const uniqueRepAccruing = useMemo(() =>
    [...new Set(repSummaries.map(r => r.accruing))].sort((a, b) => b - a), [repSummaries]);
  const uniqueRepPaid = useMemo(() =>
    [...new Set(repSummaries.map(r => r.paid))].sort((a, b) => b - a), [repSummaries]);
  const uniqueRepTotal = useMemo(() =>
    [...new Set(repSummaries.map(r => r.total))].sort((a, b) => b - a), [repSummaries]);

  // Mfg filter values
  const uniqueMfgOrderCount = useMemo(() =>
    [...new Set(mfgSummaries.map(m => m.orderCount))].sort((a, b) => b - a), [mfgSummaries]);
  const uniqueMfgTotalSales = useMemo(() =>
    [...new Set(mfgSummaries.map(m => m.totalSales))].sort((a, b) => b - a), [mfgSummaries]);
  const uniqueMfgTotalCommission = useMemo(() =>
    [...new Set(mfgSummaries.map(m => m.totalCommission))].sort((a, b) => b - a), [mfgSummaries]);
  const uniqueMfgPaidCommission = useMemo(() =>
    [...new Set(mfgSummaries.map(m => m.paidCommission))].sort((a, b) => b - a), [mfgSummaries]);
  const uniqueMfgPendingCommission = useMemo(() =>
    [...new Set(mfgSummaries.map(m => m.pendingCommission))].sort((a, b) => b - a), [mfgSummaries]);

  const hasActiveFilters = useMemo(() =>
    (viewMode === 'by-rep' && Object.values(repColumnFilters).some(v => v.length > 0)) ||
    (viewMode === 'by-manufacturer' && Object.values(mfgColumnFilters).some(v => v.length > 0)),
    [viewMode, repColumnFilters, mfgColumnFilters]);

  const clearAllFilters = () => {
    setRepColumnFilters({
      salesRepName: [],
      pending: [],
      accruing: [],
      paid: [],
      total: [],
    });
    setMfgColumnFilters({
      manufacturerName: [],
      orderCount: [],
      totalSales: [],
      totalCommission: [],
      paidCommission: [],
      pendingCommission: [],
    });
  };

  const totalCommissions = useMemo(() => {
    return repSummaries.reduce((sum, rep) => sum + rep.total, 0);
  }, [repSummaries]);

  const totalPaid = useMemo(() => {
    return repSummaries.reduce((sum, rep) => sum + rep.paid, 0);
  }, [repSummaries]);

  const totalPending = useMemo(() => {
    return repSummaries.reduce((sum, rep) => sum + rep.pending, 0);
  }, [repSummaries]);

  const totalAccruing = useMemo(() => {
    return repSummaries.reduce((sum, rep) => sum + rep.accruing, 0);
  }, [repSummaries]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number, total: number) => {
    if (total === 0) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  // Get available months from orders/invoices
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    mockOrders.forEach(o => {
      const month = o.orderDate.substring(0, 7);
      months.add(month);
    });
    mockInvoices.forEach(i => {
      const month = i.invoiceDate.substring(0, 7);
      months.add(month);
    });
    return Array.from(months).sort().reverse();
  }, []);

  // Sorted rep summaries
  const sortedRepSummaries = useMemo(() => {
    let result = [...repSummaries];

    // Apply column filters
    if (repColumnFilters.salesRepName.length > 0) {
      result = result.filter(r => repColumnFilters.salesRepName.includes(r.salesRepName));
    }
    if (repColumnFilters.pending.length > 0) {
      result = result.filter(r => repColumnFilters.pending.includes(r.pending.toString()));
    }
    if (repColumnFilters.accruing.length > 0) {
      result = result.filter(r => repColumnFilters.accruing.includes(r.accruing.toString()));
    }
    if (repColumnFilters.paid.length > 0) {
      result = result.filter(r => repColumnFilters.paid.includes(r.paid.toString()));
    }
    if (repColumnFilters.total.length > 0) {
      result = result.filter(r => repColumnFilters.total.includes(r.total.toString()));
    }

    // Apply sorting
    return result.sort((a, b) => {
      let comparison = 0;
      switch (repSortField) {
        case 'salesRepName':
          comparison = a.salesRepName.localeCompare(b.salesRepName);
          break;
        case 'pending':
          comparison = a.pending - b.pending;
          break;
        case 'accruing':
          comparison = a.accruing - b.accruing;
          break;
        case 'paid':
          comparison = a.paid - b.paid;
          break;
        case 'total':
          comparison = a.total - b.total;
          break;
      }
      return repSortDirection === 'asc' ? comparison : -comparison;
    });
  }, [repSummaries, repSortField, repSortDirection, repColumnFilters]);

  // Sorted manufacturer summaries
  const sortedMfgSummaries = useMemo(() => {
    let result = [...mfgSummaries];

    // Apply column filters
    if (mfgColumnFilters.manufacturerName.length > 0) {
      result = result.filter(m => mfgColumnFilters.manufacturerName.includes(m.manufacturerName));
    }
    if (mfgColumnFilters.orderCount.length > 0) {
      result = result.filter(m => mfgColumnFilters.orderCount.includes(m.orderCount.toString()));
    }
    if (mfgColumnFilters.totalSales.length > 0) {
      result = result.filter(m => mfgColumnFilters.totalSales.includes(m.totalSales.toString()));
    }
    if (mfgColumnFilters.totalCommission.length > 0) {
      result = result.filter(m => mfgColumnFilters.totalCommission.includes(m.totalCommission.toString()));
    }
    if (mfgColumnFilters.paidCommission.length > 0) {
      result = result.filter(m => mfgColumnFilters.paidCommission.includes(m.paidCommission.toString()));
    }
    if (mfgColumnFilters.pendingCommission.length > 0) {
      result = result.filter(m => mfgColumnFilters.pendingCommission.includes(m.pendingCommission.toString()));
    }

    // Apply sorting
    return result.sort((a, b) => {
      let comparison = 0;
      switch (mfgSortField) {
        case 'manufacturerName':
          comparison = a.manufacturerName.localeCompare(b.manufacturerName);
          break;
        case 'orderCount':
          comparison = a.orderCount - b.orderCount;
          break;
        case 'totalSales':
          comparison = a.totalSales - b.totalSales;
          break;
        case 'totalCommission':
          comparison = a.totalCommission - b.totalCommission;
          break;
        case 'paidCommission':
          comparison = a.paidCommission - b.paidCommission;
          break;
        case 'pendingCommission':
          comparison = a.pendingCommission - b.pendingCommission;
          break;
      }
      return mfgSortDirection === 'asc' ? comparison : -comparison;
    });
  }, [mfgSummaries, mfgSortField, mfgSortDirection, mfgColumnFilters]);

  const handleRepSort = (field: RepSortField) => {
    if (repSortField === field) {
      setRepSortDirection(repSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setRepSortField(field);
      setRepSortDirection('desc');
    }
  };

  const handleMfgSort = (field: MfgSortField) => {
    if (mfgSortField === field) {
      setMfgSortDirection(mfgSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setMfgSortField(field);
      setMfgSortDirection('desc');
    }
  };

  const handleStatCardClick = (filter: StatFilter) => {
    if (statFilter === filter) {
      setStatFilter('all');
    } else {
      setStatFilter(filter);
    }
  };

  const RepSortIcon = ({ field }: { field: RepSortField }) => (
    <span className="ml-1 inline-flex flex-col">
      <svg
        className={`w-2 h-2 ${repSortField === field && repSortDirection === 'asc' ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'}`}
        viewBox="0 0 8 4"
        fill="currentColor"
      >
        <path d="M4 0L8 4H0L4 0Z" />
      </svg>
      <svg
        className={`w-2 h-2 -mt-0.5 ${repSortField === field && repSortDirection === 'desc' ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'}`}
        viewBox="0 0 8 4"
        fill="currentColor"
      >
        <path d="M4 4L0 0H8L4 4Z" />
      </svg>
    </span>
  );

  const MfgSortIcon = ({ field }: { field: MfgSortField }) => (
    <span className="ml-1 inline-flex flex-col">
      <svg
        className={`w-2 h-2 ${mfgSortField === field && mfgSortDirection === 'asc' ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'}`}
        viewBox="0 0 8 4"
        fill="currentColor"
      >
        <path d="M4 0L8 4H0L4 0Z" />
      </svg>
      <svg
        className={`w-2 h-2 -mt-0.5 ${mfgSortField === field && mfgSortDirection === 'desc' ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'}`}
        viewBox="0 0 8 4"
        fill="currentColor"
      >
        <path d="M4 4L0 0H8L4 4Z" />
      </svg>
    </span>
  );

  const MultiSelectFilterDropdown = ({
    filterId,
    options,
    value,
    onChange,
    placeholder = 'All'
  }: {
    filterId: string;
    options: { value: string; label: string }[];
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
  }) => {
    const isOpen = openFilter === filterId;
    const hasValue = value.length > 0;
    const [searchTerm, setSearchTerm] = useState('');

    const filteredOptions = options.filter(opt =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleOption = (optValue: string) => {
      if (value.includes(optValue)) {
        onChange(value.filter(v => v !== optValue));
      } else {
        onChange([...value, optValue]);
      }
    };

    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpenFilter(isOpen ? null : filterId);
            setSearchTerm('');
          }}
          className={`ml-1.5 p-1 rounded hover:bg-[var(--muted)] transition-colors ${hasValue ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'}`}
          title="Filter"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          {hasValue && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--primary)] text-white text-[10px] rounded-full flex items-center justify-center">
              {value.length}
            </span>
          )}
        </button>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpenFilter(null)}
            />
            <div className="absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 min-w-[200px] max-h-[300px] flex flex-col">
              <div className="p-2 border-b border-[var(--border)]">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="overflow-y-auto flex-1 py-1">
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-[var(--muted-foreground)]">No results</div>
                ) : (
                  filteredOptions.map(opt => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-[var(--muted)] transition-colors cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={value.includes(opt.value)}
                        onChange={() => toggleOption(opt.value)}
                        className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]/50"
                      />
                      <span className={value.includes(opt.value) ? 'text-[var(--primary)] font-medium' : 'text-[var(--foreground)]'}>
                        {opt.label}
                      </span>
                    </label>
                  ))
                )}
              </div>
              {hasValue && (
                <div className="p-2 border-t border-[var(--border)]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange([]);
                    }}
                    className="w-full px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <main className="flex-1 overflow-auto bg-[var(--background)]">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Commissions</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Track and manage sales commissions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            >
              <option value="">All Time</option>
              {availableMonths.map(month => (
                <option key={month} value={month}>
                  {new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </option>
              ))}
            </select>
            <a
              href="/checks"
              className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="5" width="20" height="14" rx="2"/>
                <path d="M6 9h4M6 13h12"/>
              </svg>
              View Checks
            </a>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => handleStatCardClick('all')}
            className={`bg-[var(--card)] rounded-lg border p-4 text-left transition-all hover:shadow-md ${
              statFilter === 'all' ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20' : 'border-[var(--border)]'
            }`}
          >
            <div className="text-sm text-[var(--muted-foreground)]">Total Commissions</div>
            <div className="text-2xl font-semibold text-[var(--foreground)] mt-1">
              {formatCurrency(totalCommissions)}
            </div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">
              All orders & invoices
            </div>
          </button>
          <button
            onClick={() => handleStatCardClick('paid')}
            className={`bg-[var(--card)] rounded-lg border p-4 text-left transition-all hover:shadow-md ${
              statFilter === 'paid' ? 'border-green-500 ring-2 ring-green-500/20' : 'border-[var(--border)]'
            }`}
          >
            <div className="text-sm text-[var(--muted-foreground)]">Paid</div>
            <div className="text-2xl font-semibold text-green-600 mt-1">
              {formatCurrency(totalPaid)}
            </div>
            <div className="text-xs text-green-600 mt-1">
              {formatPercentage(totalPaid, totalCommissions)} of total
            </div>
          </button>
          <button
            onClick={() => handleStatCardClick('accruing')}
            className={`bg-[var(--card)] rounded-lg border p-4 text-left transition-all hover:shadow-md ${
              statFilter === 'accruing' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-[var(--border)]'
            }`}
          >
            <div className="text-sm text-[var(--muted-foreground)]">Accruing</div>
            <div className="text-2xl font-semibold text-blue-600 mt-1">
              {formatCurrency(totalAccruing)}
            </div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">
              Awaiting payment
            </div>
          </button>
          <button
            onClick={() => handleStatCardClick('pending')}
            className={`bg-[var(--card)] rounded-lg border p-4 text-left transition-all hover:shadow-md ${
              statFilter === 'pending' ? 'border-gray-500 ring-2 ring-gray-500/20' : 'border-[var(--border)]'
            }`}
          >
            <div className="text-sm text-[var(--muted-foreground)]">Pending</div>
            <div className="text-2xl font-semibold text-gray-600 mt-1">
              {formatCurrency(totalPending)}
            </div>
            <div className="text-xs text-[var(--muted-foreground)] mt-1">
              Not yet invoiced
            </div>
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('by-rep')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                viewMode === 'by-rep'
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              By Sales Rep
            </button>
            <button
              onClick={() => setViewMode('by-manufacturer')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                viewMode === 'by-manufacturer'
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              By Manufacturer
            </button>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Commission Tables */}
        {viewMode === 'by-rep' ? (
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-7 gap-4 px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
              <div className="col-span-2 flex items-center">
                <button
                  onClick={() => handleRepSort('salesRepName')}
                  className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                >
                  Sales Rep
                  <RepSortIcon field="salesRepName" />
                </button>
                <MultiSelectFilterDropdown
                  filterId="salesRepName"
                  options={uniqueReps.map(r => ({ value: r, label: r }))}
                  value={repColumnFilters.salesRepName}
                  onChange={(value) => setRepColumnFilters(prev => ({ ...prev, salesRepName: value }))}
                  placeholder="All Sales Reps"
                />
              </div>
              <div className="col-span-1 flex items-center justify-end">
                <button
                  onClick={() => handleRepSort('pending')}
                  className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                >
                  Pending
                  <RepSortIcon field="pending" />
                </button>
                <MultiSelectFilterDropdown
                  filterId="repPending"
                  options={uniqueRepPending.map(p => ({ value: p.toString(), label: formatCurrency(p) }))}
                  value={repColumnFilters.pending}
                  onChange={(value) => setRepColumnFilters(prev => ({ ...prev, pending: value }))}
                  placeholder="All"
                />
              </div>
              <div className="col-span-1 flex items-center justify-end">
                <button
                  onClick={() => handleRepSort('accruing')}
                  className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                >
                  Accruing
                  <RepSortIcon field="accruing" />
                </button>
                <MultiSelectFilterDropdown
                  filterId="repAccruing"
                  options={uniqueRepAccruing.map(a => ({ value: a.toString(), label: formatCurrency(a) }))}
                  value={repColumnFilters.accruing}
                  onChange={(value) => setRepColumnFilters(prev => ({ ...prev, accruing: value }))}
                  placeholder="All"
                />
              </div>
              <div className="col-span-1 flex items-center justify-end">
                <button
                  onClick={() => handleRepSort('paid')}
                  className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                >
                  Paid
                  <RepSortIcon field="paid" />
                </button>
                <MultiSelectFilterDropdown
                  filterId="repPaid"
                  options={uniqueRepPaid.map(p => ({ value: p.toString(), label: formatCurrency(p) }))}
                  value={repColumnFilters.paid}
                  onChange={(value) => setRepColumnFilters(prev => ({ ...prev, paid: value }))}
                  placeholder="All"
                />
              </div>
              <div className="col-span-1 flex items-center justify-end">
                <button
                  onClick={() => handleRepSort('total')}
                  className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                >
                  Total
                  <RepSortIcon field="total" />
                </button>
                <MultiSelectFilterDropdown
                  filterId="repTotal"
                  options={uniqueRepTotal.map(t => ({ value: t.toString(), label: formatCurrency(t) }))}
                  value={repColumnFilters.total}
                  onChange={(value) => setRepColumnFilters(prev => ({ ...prev, total: value }))}
                  placeholder="All"
                />
              </div>
              <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-center">
                Actions
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-[var(--border)]">
              {sortedRepSummaries.map((summary) => {
                const rep = mockSalesReps.find(r => r.id === summary.salesRepId);
                return (
                  <div
                    key={summary.salesRepId}
                    className="grid grid-cols-7 gap-4 px-6 py-4 hover:bg-[var(--muted)]/20 transition-colors"
                  >
                    <div className="col-span-2">
                      <div className="font-medium text-[var(--foreground)]">{summary.salesRepName}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{rep?.repType} rep</div>
                    </div>
                    <div className="col-span-1 flex items-center justify-end">
                      <span className="text-sm text-gray-600">{formatCurrency(summary.pending)}</span>
                    </div>
                    <div className="col-span-1 flex items-center justify-end">
                      <span className="text-sm text-blue-600">{formatCurrency(summary.accruing)}</span>
                    </div>
                    <div className="col-span-1 flex items-center justify-end">
                      <span className="text-sm text-green-600">{formatCurrency(summary.paid)}</span>
                    </div>
                    <div className="col-span-1 flex items-center justify-end">
                      <span className="text-sm font-semibold text-[var(--foreground)]">{formatCurrency(summary.total)}</span>
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                      <a
                        href={`/checks?rep=${summary.salesRepId}`}
                        className="text-xs text-[var(--primary)] hover:underline"
                      >
                        View Checks
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals Row */}
            <div className="grid grid-cols-7 gap-4 px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/30">
              <div className="col-span-2">
                <span className="font-semibold text-[var(--foreground)]">Total</span>
              </div>
              <div className="col-span-1 flex items-center justify-end">
                <span className="text-sm font-semibold text-gray-600">{formatCurrency(totalPending)}</span>
              </div>
              <div className="col-span-1 flex items-center justify-end">
                <span className="text-sm font-semibold text-blue-600">{formatCurrency(totalAccruing)}</span>
              </div>
              <div className="col-span-1 flex items-center justify-end">
                <span className="text-sm font-semibold text-green-600">{formatCurrency(totalPaid)}</span>
              </div>
              <div className="col-span-1 flex items-center justify-end">
                <span className="text-sm font-bold text-[var(--foreground)]">{formatCurrency(totalCommissions)}</span>
              </div>
              <div className="col-span-1"></div>
            </div>
          </div>
        ) : (
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-7 gap-4 px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
              <div className="col-span-2 flex items-center">
                <button
                  onClick={() => handleMfgSort('manufacturerName')}
                  className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                >
                  Manufacturer
                  <MfgSortIcon field="manufacturerName" />
                </button>
                <MultiSelectFilterDropdown
                  filterId="manufacturerName"
                  options={uniqueMfgs.map(m => ({ value: m, label: m }))}
                  value={mfgColumnFilters.manufacturerName}
                  onChange={(value) => setMfgColumnFilters(prev => ({ ...prev, manufacturerName: value }))}
                  placeholder="All Manufacturers"
                />
              </div>
              <div className="col-span-1 flex items-center justify-end">
                <button
                  onClick={() => handleMfgSort('orderCount')}
                  className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                >
                  Orders
                  <MfgSortIcon field="orderCount" />
                </button>
                <MultiSelectFilterDropdown
                  filterId="mfgOrderCount"
                  options={uniqueMfgOrderCount.map(c => ({ value: c.toString(), label: c.toString() }))}
                  value={mfgColumnFilters.orderCount}
                  onChange={(value) => setMfgColumnFilters(prev => ({ ...prev, orderCount: value }))}
                  placeholder="All"
                />
              </div>
              <div className="col-span-1 flex items-center justify-end">
                <button
                  onClick={() => handleMfgSort('totalSales')}
                  className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                >
                  Total Sales
                  <MfgSortIcon field="totalSales" />
                </button>
                <MultiSelectFilterDropdown
                  filterId="mfgTotalSales"
                  options={uniqueMfgTotalSales.map(s => ({ value: s.toString(), label: formatCurrency(s) }))}
                  value={mfgColumnFilters.totalSales}
                  onChange={(value) => setMfgColumnFilters(prev => ({ ...prev, totalSales: value }))}
                  placeholder="All"
                />
              </div>
              <div className="col-span-1 flex items-center justify-end">
                <button
                  onClick={() => handleMfgSort('totalCommission')}
                  className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                >
                  Total Comm
                  <MfgSortIcon field="totalCommission" />
                </button>
                <MultiSelectFilterDropdown
                  filterId="mfgTotalCommission"
                  options={uniqueMfgTotalCommission.map(c => ({ value: c.toString(), label: formatCurrency(c) }))}
                  value={mfgColumnFilters.totalCommission}
                  onChange={(value) => setMfgColumnFilters(prev => ({ ...prev, totalCommission: value }))}
                  placeholder="All"
                />
              </div>
              <div className="col-span-1 flex items-center justify-end">
                <button
                  onClick={() => handleMfgSort('paidCommission')}
                  className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                >
                  Paid
                  <MfgSortIcon field="paidCommission" />
                </button>
                <MultiSelectFilterDropdown
                  filterId="mfgPaidCommission"
                  options={uniqueMfgPaidCommission.map(p => ({ value: p.toString(), label: formatCurrency(p) }))}
                  value={mfgColumnFilters.paidCommission}
                  onChange={(value) => setMfgColumnFilters(prev => ({ ...prev, paidCommission: value }))}
                  placeholder="All"
                />
              </div>
              <div className="col-span-1 flex items-center justify-end">
                <button
                  onClick={() => handleMfgSort('pendingCommission')}
                  className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                >
                  Pending
                  <MfgSortIcon field="pendingCommission" />
                </button>
                <MultiSelectFilterDropdown
                  filterId="mfgPendingCommission"
                  options={uniqueMfgPendingCommission.map(p => ({ value: p.toString(), label: formatCurrency(p) }))}
                  value={mfgColumnFilters.pendingCommission}
                  onChange={(value) => setMfgColumnFilters(prev => ({ ...prev, pendingCommission: value }))}
                  placeholder="All"
                />
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-[var(--border)]">
              {sortedMfgSummaries.map((summary) => {
                const mfg = mockManufacturers.find(m => m.id === summary.manufacturerId);
                return (
                  <div
                    key={summary.manufacturerId}
                    className="grid grid-cols-7 gap-4 px-6 py-4 hover:bg-[var(--muted)]/20 transition-colors"
                  >
                    <div className="col-span-2">
                      <div className="font-medium text-[var(--foreground)]">{summary.manufacturerName}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        {((mfg?.baseCommissionRate || 0) * 100).toFixed(0)}% base rate
                      </div>
                    </div>
                    <div className="col-span-1 flex items-center justify-end">
                      <span className="text-sm text-[var(--foreground)]">{summary.orderCount}</span>
                    </div>
                    <div className="col-span-1 flex items-center justify-end">
                      <span className="text-sm text-[var(--foreground)]">{formatCurrency(summary.totalSales)}</span>
                    </div>
                    <div className="col-span-1 flex items-center justify-end">
                      <span className="text-sm font-medium text-[var(--foreground)]">{formatCurrency(summary.totalCommission)}</span>
                    </div>
                    <div className="col-span-1 flex items-center justify-end">
                      <span className="text-sm text-green-600">{formatCurrency(summary.paidCommission)}</span>
                    </div>
                    <div className="col-span-1 flex items-center justify-end">
                      <span className="text-sm text-blue-600">{formatCurrency(summary.pendingCommission)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals Row */}
            <div className="grid grid-cols-7 gap-4 px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/30">
              <div className="col-span-2">
                <span className="font-semibold text-[var(--foreground)]">Total</span>
              </div>
              <div className="col-span-1 flex items-center justify-end">
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  {mfgSummaries.reduce((sum, s) => sum + s.orderCount, 0)}
                </span>
              </div>
              <div className="col-span-1 flex items-center justify-end">
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  {formatCurrency(mfgSummaries.reduce((sum, s) => sum + s.totalSales, 0))}
                </span>
              </div>
              <div className="col-span-1 flex items-center justify-end">
                <span className="text-sm font-bold text-[var(--foreground)]">
                  {formatCurrency(mfgSummaries.reduce((sum, s) => sum + s.totalCommission, 0))}
                </span>
              </div>
              <div className="col-span-1 flex items-center justify-end">
                <span className="text-sm font-semibold text-green-600">
                  {formatCurrency(mfgSummaries.reduce((sum, s) => sum + s.paidCommission, 0))}
                </span>
              </div>
              <div className="col-span-1 flex items-center justify-end">
                <span className="text-sm font-semibold text-blue-600">
                  {formatCurrency(mfgSummaries.reduce((sum, s) => sum + s.pendingCommission, 0))}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Commission Status Legend */}
        <div className="mt-6 bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Commission Status Legend</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span className="text-sm text-[var(--muted-foreground)]">Pending - Order not yet invoiced</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-[var(--muted-foreground)]">Accruing - Invoiced, awaiting payment</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-[var(--muted-foreground)]">Paid - Payment received, commission paid</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
