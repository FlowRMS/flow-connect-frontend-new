'use client';

import React, { useState, useMemo } from 'react';
import AdvancedFilters from '../AdvancedFilters';
import {
  mockInvoices,
  mockManufacturers,
  mockCustomers,
  getInvoiceSummaryStats,
} from '../../lib/data/rms-mock';
import {
  Invoice,
  invoiceStatusLabels,
  invoiceStatusColors,
} from '../../lib/types/rms';
import CreateInvoiceModal from './CreateInvoiceModal';
import RecordPaymentModal from './RecordPaymentModal';

type SortField = 'invoiceNumber' | 'customerName' | 'manufacturerName' | 'invoiceDate' | 'dueDate' | 'total' | 'balance' | 'status';
type SortDirection = 'asc' | 'desc';
type StatFilter = 'all' | 'open' | 'paid' | 'overdue';

interface DateRange {
  start: string;
  end: string;
}

interface ColumnFilters {
  invoiceNumber: string;
  customerName: string[];
  manufacturerName: string[];
  invoiceDate: DateRange;
  dueDate: DateRange;
  total: string[];
  balance: string[];
  status: string[];
}

export default function InvoicesContent() {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [sortField, setSortField] = useState<SortField>('invoiceDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [statFilter, setStatFilter] = useState<StatFilter>('all');
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    invoiceNumber: '',
    customerName: [],
    manufacturerName: [],
    invoiceDate: { start: '', end: '' },
    dueDate: { start: '', end: '' },
    total: [],
    balance: [],
    status: [],
  });
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const stats = useMemo(() => getInvoiceSummaryStats(), []);

  // Get unique values for filter dropdowns
  const uniqueCustomers = useMemo(() =>
    [...new Set(invoices.map(i => i.customerName))].sort(), [invoices]);
  const uniqueManufacturers = useMemo(() =>
    [...new Set(invoices.map(i => i.manufacturerName))].sort(), [invoices]);
  const uniqueStatuses = useMemo(() =>
    [...new Set(invoices.map(i => i.status))].sort(), [invoices]);
  const uniqueInvoiceDates = useMemo(() =>
    [...new Set(invoices.map(i => i.invoiceDate))].sort().reverse(), [invoices]);
  const uniqueDueDates = useMemo(() =>
    [...new Set(invoices.map(i => i.dueDate))].sort().reverse(), [invoices]);
  const uniqueTotals = useMemo(() =>
    [...new Set(invoices.map(i => i.total))].sort((a, b) => b - a), [invoices]);
  const uniqueBalances = useMemo(() =>
    [...new Set(invoices.map(i => i.balance))].sort((a, b) => b - a), [invoices]);

  const hasActiveFilters = useMemo(() => {
    return columnFilters.invoiceNumber !== '' ||
      columnFilters.customerName.length > 0 ||
      columnFilters.manufacturerName.length > 0 ||
      columnFilters.invoiceDate.start !== '' || columnFilters.invoiceDate.end !== '' ||
      columnFilters.dueDate.start !== '' || columnFilters.dueDate.end !== '' ||
      columnFilters.total.length > 0 ||
      columnFilters.balance.length > 0 ||
      columnFilters.status.length > 0;
  }, [columnFilters]);

  const clearAllFilters = () => {
    setColumnFilters({
      invoiceNumber: '',
      customerName: [],
      manufacturerName: [],
      invoiceDate: { start: '', end: '' },
      dueDate: { start: '', end: '' },
      total: [],
      balance: [],
      status: [],
    });
  };

  const isOverdue = (invoice: Invoice) => {
    if (invoice.status !== 'open' && invoice.status !== 'partial_paid') return false;
    return new Date(invoice.dueDate) < new Date();
  };

  const statusTabs = [
    { label: 'All', value: 'All', count: invoices.length },
    { label: 'Open', value: 'open', count: invoices.filter(i => i.status === 'open').length },
    { label: 'Paid', value: 'paid', count: invoices.filter(i => i.status === 'paid').length },
    { label: 'Partial', value: 'partial_paid', count: invoices.filter(i => i.status === 'partial_paid').length },
    { label: 'Void', value: 'void', count: invoices.filter(i => i.status === 'void').length },
  ];

  const filteredInvoices = useMemo(() => {
    let result = invoices;

    // Apply stat card filter
    if (statFilter === 'open') {
      result = result.filter(i => i.status === 'open' || i.status === 'partial_paid');
    } else if (statFilter === 'paid') {
      result = result.filter(i => i.status === 'paid');
    } else if (statFilter === 'overdue') {
      result = result.filter(i => isOverdue(i));
    }

    // Apply status tab filter (only if no stat filter is active)
    if (statFilter === 'all' && selectedStatus !== 'All') {
      result = result.filter(i => i.status === selectedStatus);
    }

    // Apply column filters
    if (columnFilters.invoiceNumber) {
      result = result.filter(i =>
        i.invoiceNumber.toLowerCase().includes(columnFilters.invoiceNumber.toLowerCase())
      );
    }
    if (columnFilters.customerName.length > 0) {
      result = result.filter(i => columnFilters.customerName.includes(i.customerName));
    }
    if (columnFilters.manufacturerName.length > 0) {
      result = result.filter(i => columnFilters.manufacturerName.includes(i.manufacturerName));
    }
    if (columnFilters.status.length > 0) {
      result = result.filter(i => columnFilters.status.includes(i.status));
    }
    if (columnFilters.invoiceDate.start || columnFilters.invoiceDate.end) {
      result = result.filter(i => {
        const date = new Date(i.invoiceDate);
        if (columnFilters.invoiceDate.start && date < new Date(columnFilters.invoiceDate.start)) return false;
        if (columnFilters.invoiceDate.end && date > new Date(columnFilters.invoiceDate.end)) return false;
        return true;
      });
    }
    if (columnFilters.dueDate.start || columnFilters.dueDate.end) {
      result = result.filter(i => {
        const date = new Date(i.dueDate);
        if (columnFilters.dueDate.start && date < new Date(columnFilters.dueDate.start)) return false;
        if (columnFilters.dueDate.end && date > new Date(columnFilters.dueDate.end)) return false;
        return true;
      });
    }
    if (columnFilters.total.length > 0) {
      result = result.filter(i => columnFilters.total.includes(i.total.toString()));
    }
    if (columnFilters.balance.length > 0) {
      result = result.filter(i => columnFilters.balance.includes(i.balance.toString()));
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(i =>
        i.invoiceNumber.toLowerCase().includes(query) ||
        i.orderNumber.toLowerCase().includes(query) ||
        i.customerName.toLowerCase().includes(query) ||
        i.manufacturerName.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    result = [...result].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'invoiceNumber':
          comparison = a.invoiceNumber.localeCompare(b.invoiceNumber);
          break;
        case 'customerName':
          comparison = a.customerName.localeCompare(b.customerName);
          break;
        case 'manufacturerName':
          comparison = a.manufacturerName.localeCompare(b.manufacturerName);
          break;
        case 'invoiceDate':
          comparison = new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime();
          break;
        case 'dueDate':
          comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'total':
          comparison = a.total - b.total;
          break;
        case 'balance':
          comparison = a.balance - b.balance;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [invoices, selectedStatus, searchQuery, sortField, sortDirection, statFilter, columnFilters]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleStatCardClick = (filter: StatFilter) => {
    if (statFilter === filter) {
      setStatFilter('all');
      setSelectedStatus('All');
    } else {
      setStatFilter(filter);
      setSelectedStatus('All');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="ml-1 inline-flex flex-col">
      <svg
        className={`w-2 h-2 ${sortField === field && sortDirection === 'asc' ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'}`}
        viewBox="0 0 8 4"
        fill="currentColor"
      >
        <path d="M4 0L8 4H0L4 0Z" />
      </svg>
      <svg
        className={`w-2 h-2 -mt-0.5 ${sortField === field && sortDirection === 'desc' ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'}`}
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

  const DateRangeFilterDropdown = ({
    filterId,
    value,
    onChange,
  }: {
    filterId: string;
    value: DateRange;
    onChange: (value: DateRange) => void;
  }) => {
    const isOpen = openFilter === filterId;
    const hasValue = value.start !== '' || value.end !== '';

    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpenFilter(isOpen ? null : filterId);
          }}
          className={`ml-1.5 p-1 rounded hover:bg-[var(--muted)] transition-colors ${hasValue ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'}`}
          title="Filter by date range"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
        </button>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpenFilter(null)}
            />
            <div className="absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 p-3 min-w-[200px]">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">From</label>
                  <input
                    type="date"
                    value={value.start}
                    onChange={(e) => onChange({ ...value, start: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">To</label>
                  <input
                    type="date"
                    value={value.end}
                    onChange={(e) => onChange({ ...value, end: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                {hasValue && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange({ start: '', end: '' });
                    }}
                    className="w-full px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const TextFilterDropdown = ({
    filterId,
    value,
    onChange,
    placeholder = 'Filter...'
  }: {
    filterId: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  }) => {
    const isOpen = openFilter === filterId;
    const hasValue = value !== '';

    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpenFilter(isOpen ? null : filterId);
          }}
          className={`ml-1.5 p-1 rounded hover:bg-[var(--muted)] transition-colors ${hasValue ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'}`}
          title="Filter"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
        </button>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpenFilter(null)}
            />
            <div className="absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 min-w-[180px] p-2">
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
              {hasValue && (
                <button
                  onClick={() => {
                    onChange('');
                    setOpenFilter(null);
                  }}
                  className="w-full mt-1 px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  const filterOptions = [
    { id: 'invoice-number', label: 'Invoice Number', type: 'text' as const },
    { id: 'customer', label: 'Customer', type: 'dropdown' as const },
    { id: 'manufacturer', label: 'Manufacturer', type: 'dropdown' as const },
    { id: 'invoice-date', label: 'Invoice Date', type: 'date' as const },
    { id: 'due-date', label: 'Due Date', type: 'date' as const },
    { id: 'status', label: 'Status', type: 'dropdown' as const },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <main className="flex-1 overflow-hidden bg-[var(--background)] flex">
      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden ${selectedInvoice ? 'mr-[480px]' : ''}`}>
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">Invoices</h1>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Track invoices and payment status
              </p>
            </div>
            <div className="flex items-center gap-3">
              <AdvancedFilters filterOptions={filterOptions} />
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="10" cy="10" r="7"/>
                  <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
                </svg>
                New Invoice
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <button
              onClick={() => handleStatCardClick('all')}
              className={`bg-[var(--card)] rounded-lg border p-4 text-left transition-all hover:shadow-md ${
                statFilter === 'all' ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20' : 'border-[var(--border)]'
              }`}
            >
              <div className="text-sm text-[var(--muted-foreground)]">Total Invoices</div>
              <div className="text-2xl font-semibold text-[var(--foreground)] mt-1">{stats.totalInvoices}</div>
              <div className="text-xs text-[var(--muted-foreground)] mt-1">
                {formatCurrency(stats.totalValue)} total value
              </div>
            </button>
            <button
              onClick={() => handleStatCardClick('open')}
              className={`bg-[var(--card)] rounded-lg border p-4 text-left transition-all hover:shadow-md ${
                statFilter === 'open' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-[var(--border)]'
              }`}
            >
              <div className="text-sm text-[var(--muted-foreground)]">Open Invoices</div>
              <div className="text-2xl font-semibold text-blue-600 mt-1">{stats.openInvoices}</div>
              <div className="text-xs text-[var(--muted-foreground)] mt-1">
                {formatCurrency(stats.totalOutstanding)} outstanding
              </div>
            </button>
            <button
              onClick={() => handleStatCardClick('paid')}
              className={`bg-[var(--card)] rounded-lg border p-4 text-left transition-all hover:shadow-md ${
                statFilter === 'paid' ? 'border-green-500 ring-2 ring-green-500/20' : 'border-[var(--border)]'
              }`}
            >
              <div className="text-sm text-[var(--muted-foreground)]">Paid Invoices</div>
              <div className="text-2xl font-semibold text-green-600 mt-1">{stats.paidInvoices}</div>
              <div className="text-xs text-[var(--muted-foreground)] mt-1">
                Commission available
              </div>
            </button>
            <button
              onClick={() => handleStatCardClick('overdue')}
              className={`bg-[var(--card)] rounded-lg border p-4 text-left transition-all hover:shadow-md ${
                statFilter === 'overdue' ? 'border-red-500 ring-2 ring-red-500/20' : 'border-[var(--border)]'
              }`}
            >
              <div className="text-sm text-[var(--muted-foreground)]">Overdue</div>
              <div className="text-2xl font-semibold text-red-600 mt-1">{stats.overdueCount}</div>
              <div className="text-xs text-red-600 mt-1">
                {formatCurrency(stats.overdueValue)} overdue
              </div>
            </button>
          </div>

          {/* Search */}
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
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
              />
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

          {/* Status Tabs */}
          <div className="flex gap-2 border-b border-[var(--border)]">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSelectedStatus(tab.value)}
                className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                  selectedStatus === tab.value
                    ? 'text-[var(--primary)]'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                {tab.label}
                <span className="ml-2 text-xs opacity-70">({tab.count})</span>
                {selectedStatus === tab.value && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Invoices Table */}
        <div className="flex-1 overflow-auto p-6 pt-4">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
              <div className="col-span-2 flex items-center">
                <button
                  onClick={() => handleSort('invoiceNumber')}
                  className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                >
                  Invoice
                  <SortIcon field="invoiceNumber" />
                </button>
                <TextFilterDropdown
                  filterId="invoiceNumber"
                  value={columnFilters.invoiceNumber}
                  onChange={(value) => setColumnFilters(prev => ({ ...prev, invoiceNumber: value }))}
                  placeholder="Search invoices..."
                />
              </div>
              <div className="col-span-2 flex items-center">
                <button
                  onClick={() => handleSort('customerName')}
                  className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                >
                  Customer
                  <SortIcon field="customerName" />
                </button>
                <MultiSelectFilterDropdown
                  filterId="customerName"
                  options={uniqueCustomers.map(c => ({ value: c, label: c }))}
                  value={columnFilters.customerName}
                  onChange={(value) => setColumnFilters(prev => ({ ...prev, customerName: value }))}
                  placeholder="All Customers"
                />
              </div>
              <div className="col-span-2 flex items-center">
                <button
                  onClick={() => handleSort('manufacturerName')}
                  className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                >
                  Manufacturer
                  <SortIcon field="manufacturerName" />
                </button>
                <MultiSelectFilterDropdown
                  filterId="manufacturerName"
                  options={uniqueManufacturers.map(m => ({ value: m, label: m }))}
                  value={columnFilters.manufacturerName}
                  onChange={(value) => setColumnFilters(prev => ({ ...prev, manufacturerName: value }))}
                  placeholder="All Manufacturers"
                />
              </div>
              <div className="col-span-1 flex items-center">
                <button
                  onClick={() => handleSort('invoiceDate')}
                  className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                >
                  Date
                  <SortIcon field="invoiceDate" />
                </button>
                <DateRangeFilterDropdown
                  filterId="invoiceDate"
                  value={columnFilters.invoiceDate}
                  onChange={(value) => setColumnFilters(prev => ({ ...prev, invoiceDate: value }))}
                />
              </div>
              <div className="col-span-1 flex items-center">
                <button
                  onClick={() => handleSort('dueDate')}
                  className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                >
                  Due
                  <SortIcon field="dueDate" />
                </button>
                <DateRangeFilterDropdown
                  filterId="dueDate"
                  value={columnFilters.dueDate}
                  onChange={(value) => setColumnFilters(prev => ({ ...prev, dueDate: value }))}
                />
              </div>
              <div className="col-span-1 flex items-center justify-end">
                <button
                  onClick={() => handleSort('total')}
                  className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                >
                  Total
                  <SortIcon field="total" />
                </button>
                <MultiSelectFilterDropdown
                  filterId="total"
                  options={uniqueTotals.map(t => ({ value: t.toString(), label: formatCurrency(t) }))}
                  value={columnFilters.total}
                  onChange={(value) => setColumnFilters(prev => ({ ...prev, total: value }))}
                  placeholder="All Totals"
                />
              </div>
              <div className="col-span-1 flex items-center justify-end">
                <button
                  onClick={() => handleSort('balance')}
                  className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                >
                  Balance
                  <SortIcon field="balance" />
                </button>
                <MultiSelectFilterDropdown
                  filterId="balance"
                  options={uniqueBalances.map(b => ({ value: b.toString(), label: formatCurrency(b) }))}
                  value={columnFilters.balance}
                  onChange={(value) => setColumnFilters(prev => ({ ...prev, balance: value }))}
                  placeholder="All Balances"
                />
              </div>
              <div className="col-span-2 flex items-center">
                <button
                  onClick={() => handleSort('status')}
                  className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                >
                  Status
                  <SortIcon field="status" />
                </button>
                <MultiSelectFilterDropdown
                  filterId="status"
                  options={uniqueStatuses.map(s => ({ value: s, label: invoiceStatusLabels[s as keyof typeof invoiceStatusLabels] }))}
                  value={columnFilters.status}
                  onChange={(value) => setColumnFilters(prev => ({ ...prev, status: value }))}
                  placeholder="All Statuses"
                />
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-[var(--border)]">
              {filteredInvoices.length === 0 ? (
                <div className="px-6 py-12 text-center text-[var(--muted-foreground)]">
                  No invoices found
                </div>
              ) : (
                filteredInvoices.map((invoice) => {
                  const overdue = isOverdue(invoice);
                  const daysUntilDue = getDaysUntilDue(invoice.dueDate);

                  return (
                    <div
                      key={invoice.id}
                      onClick={() => setSelectedInvoice(invoice)}
                      className={`grid grid-cols-12 gap-4 px-6 py-4 hover:bg-[var(--muted)]/20 transition-colors cursor-pointer ${
                        selectedInvoice?.id === invoice.id ? 'bg-[var(--muted)]/30' : ''
                      }`}
                    >
                      <div className="col-span-2">
                        <div className="font-medium text-[var(--foreground)]">{invoice.invoiceNumber}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">Order: {invoice.orderNumber}</div>
                      </div>
                      <div className="col-span-2 flex items-center">
                        <span className="text-sm text-[var(--foreground)] truncate">{invoice.customerName}</span>
                      </div>
                      <div className="col-span-2 flex items-center">
                        <span className="text-sm text-[var(--foreground)] truncate">{invoice.manufacturerName}</span>
                      </div>
                      <div className="col-span-1 flex items-center">
                        <span className="text-sm text-[var(--muted-foreground)]">{formatDate(invoice.invoiceDate)}</span>
                      </div>
                      <div className="col-span-1 flex items-center">
                        <div>
                          <span className={`text-sm ${overdue ? 'text-red-600 font-medium' : 'text-[var(--muted-foreground)]'}`}>
                            {formatDate(invoice.dueDate)}
                          </span>
                          {invoice.status === 'open' && (
                            <div className={`text-xs ${overdue ? 'text-red-500' : daysUntilDue <= 7 ? 'text-yellow-600' : 'text-[var(--muted-foreground)]'}`}>
                              {overdue ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days left`}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-span-1 flex items-center justify-end">
                        <span className="text-sm font-medium text-[var(--foreground)]">{formatCurrency(invoice.total)}</span>
                      </div>
                      <div className="col-span-1 flex items-center justify-end">
                        <span className={`text-sm font-medium ${invoice.balance > 0 ? 'text-[var(--foreground)]' : 'text-green-600'}`}>
                          {formatCurrency(invoice.balance)}
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${invoiceStatusColors[invoice.status]}`}>
                          {invoiceStatusLabels[invoice.status]}
                        </span>
                        {overdue && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded bg-red-100 text-red-700">
                            Overdue
                          </span>
                        )}
                        {invoice.isLocked && (
                          <svg className="w-4 h-4 text-[var(--muted-foreground)]" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedInvoice && (
        <div className="fixed right-0 top-0 bottom-0 w-[480px] bg-[var(--card)] border-l border-[var(--border)] overflow-y-auto shadow-xl">
          <div className="sticky top-0 bg-[var(--card)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">{selectedInvoice.invoiceNumber}</h2>
              <p className="text-sm text-[var(--muted-foreground)]">{selectedInvoice.customerName}</p>
            </div>
            <button
              onClick={() => setSelectedInvoice(null)}
              className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Status Section */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Status</h3>
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${invoiceStatusColors[selectedInvoice.status]}`}>
                  {invoiceStatusLabels[selectedInvoice.status]}
                </span>
                {isOverdue(selectedInvoice) && (
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-700">
                    Overdue
                  </span>
                )}
                {selectedInvoice.isLocked && (
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-700 flex items-center gap-1">
                    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Locked
                  </span>
                )}
              </div>
            </div>

            {/* Invoice Details */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Invoice Details</h3>
              <div className="bg-[var(--muted)]/30 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Invoice Date</span>
                  <span className="text-sm text-[var(--foreground)]">{formatDate(selectedInvoice.invoiceDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Due Date</span>
                  <span className={`text-sm ${isOverdue(selectedInvoice) ? 'text-red-600 font-medium' : 'text-[var(--foreground)]'}`}>
                    {formatDate(selectedInvoice.dueDate)}
                  </span>
                </div>
                {selectedInvoice.paidDate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--muted-foreground)]">Paid Date</span>
                    <span className="text-sm text-green-600">{formatDate(selectedInvoice.paidDate)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Order</span>
                  <span className="text-sm text-[var(--primary)] cursor-pointer hover:underline">
                    {selectedInvoice.orderNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Manufacturer</span>
                  <span className="text-sm text-[var(--foreground)]">{selectedInvoice.manufacturerName}</span>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                Line Items ({selectedInvoice.lineItems.length})
              </h3>
              <div className="space-y-2">
                {selectedInvoice.lineItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[var(--muted)]/30 rounded-lg p-3"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium text-[var(--foreground)]">{item.partNumber}</span>
                      <span className="text-sm font-medium text-[var(--foreground)]">{formatCurrency(item.amount)}</span>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] mb-2 line-clamp-1">{item.description}</p>
                    <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                      <span>Qty: {item.quantity} @ {formatCurrency(item.unitPrice)}</span>
                      <span className="text-green-600">Comm: {formatCurrency(item.commissionAmount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Commission Splits */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Commission Splits</h3>
              <div className="space-y-2">
                {selectedInvoice.splitRates.map((split, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-[var(--muted)]/30 rounded-lg p-3">
                    <div>
                      <span className="text-sm font-medium text-[var(--foreground)]">{split.salesRepName}</span>
                      <span className="ml-2 text-xs text-[var(--muted-foreground)]">{split.splitPercentage}%</span>
                    </div>
                    <span className="text-sm font-medium text-green-600">{formatCurrency(split.commissionAmount)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Invoice Totals</h3>
              <div className="bg-[var(--muted)]/30 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Subtotal</span>
                  <span className="text-sm text-[var(--foreground)]">{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Freight</span>
                  <span className="text-sm text-[var(--foreground)]">{formatCurrency(selectedInvoice.freight)}</span>
                </div>
                <div className="flex justify-between border-t border-[var(--border)] pt-2 mt-2">
                  <span className="text-sm font-semibold text-[var(--foreground)]">Total</span>
                  <span className="text-sm font-semibold text-[var(--foreground)]">{formatCurrency(selectedInvoice.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Amount Paid</span>
                  <span className="text-sm text-green-600">{formatCurrency(selectedInvoice.amountPaid)}</span>
                </div>
                {selectedInvoice.amountCredited > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--muted-foreground)]">Credits Applied</span>
                    <span className="text-sm text-red-600">-{formatCurrency(selectedInvoice.amountCredited)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-[var(--border)] pt-2 mt-2">
                  <span className="text-sm font-semibold text-[var(--foreground)]">Balance Due</span>
                  <span className={`text-sm font-semibold ${selectedInvoice.balance > 0 ? 'text-[var(--foreground)]' : 'text-green-600'}`}>
                    {formatCurrency(selectedInvoice.balance)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-green-600">Total Commission</span>
                  <span className="text-sm font-semibold text-green-600">{formatCurrency(selectedInvoice.totalCommission)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
              {(selectedInvoice.status === 'open' || selectedInvoice.status === 'partial_paid') && selectedInvoice.balance > 0 && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Record Payment
                </button>
              )}
              {selectedInvoice.status !== 'void' && selectedInvoice.status !== 'paid' && (
                <button className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
                  Create Credit
                </button>
              )}
              <button className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
                Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <CreateInvoiceModal
          onClose={() => setShowCreateModal(false)}
          onSave={(newInvoice) => {
            setInvoices([newInvoice, ...invoices]);
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <RecordPaymentModal
          invoice={selectedInvoice}
          onClose={() => setShowPaymentModal(false)}
          onSave={(updatedInvoice) => {
            setInvoices(invoices.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv));
            setSelectedInvoice(updatedInvoice);
            setShowPaymentModal(false);
          }}
        />
      )}
    </main>
  );
}
