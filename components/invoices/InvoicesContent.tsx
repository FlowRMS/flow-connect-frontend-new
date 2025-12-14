'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AdvancedFilters from '../AdvancedFilters';
import {
  mockInvoices,
  mockManufacturers,
  mockCustomers,
  mockSalesReps,
} from '../../lib/data/rms-mock';
import type { OrderSplitRate } from '../../lib/types/rms';
import {
  Invoice,
  InvoiceStatus,
  invoiceStatusLabels,
  invoiceStatusColors,
} from '../../lib/types/rms';
import CreateInvoiceModal from './CreateInvoiceModal';
import RecordPaymentModal from './RecordPaymentModal';

type SortField = 'invoiceNumber' | 'customerName' | 'manufacturerName' | 'invoiceDate' | 'dueDate' | 'total' | 'balance' | 'status';
type SortDirection = 'asc' | 'desc';

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
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [sortField, setSortField] = useState<SortField>('invoiceDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
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
  const [editingSplits, setEditingSplits] = useState(false);
  const [editedSplits, setEditedSplits] = useState<OrderSplitRate[]>([]);

  // Bulk actions state
  const [selectedInvoicesForBulk, setSelectedInvoicesForBulk] = useState<Set<string>>(new Set());
  const [showInvoicesBulkActionsMenu, setShowInvoicesBulkActionsMenu] = useState(false);

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

  // Commission split editing functions
  const startEditingSplits = () => {
    if (selectedInvoice) {
      setEditedSplits([...selectedInvoice.splitRates]);
      setEditingSplits(true);
    }
  };

  const cancelEditingSplits = () => {
    setEditingSplits(false);
    setEditedSplits([]);
  };

  const updateSplitPercentage = (index: number, newPercentage: number) => {
    const updated = [...editedSplits];
    updated[index] = { ...updated[index], splitPercentage: newPercentage };
    // Recalculate commission amount based on new percentage
    if (selectedInvoice) {
      updated[index].commissionAmount = (selectedInvoice.totalCommission * newPercentage) / 100;
    }
    setEditedSplits(updated);
  };

  const addNewSplit = () => {
    const newSplit: OrderSplitRate = {
      salesRepId: '',
      salesRepName: '',
      splitPercentage: 0,
      commissionAmount: 0,
    };
    setEditedSplits([...editedSplits, newSplit]);
  };

  const removeSplit = (index: number) => {
    setEditedSplits(editedSplits.filter((_, i) => i !== index));
  };

  const updateSplitRep = (index: number, repId: string) => {
    const rep = mockSalesReps.find(r => r.id === repId);
    if (rep) {
      const updated = [...editedSplits];
      updated[index] = { ...updated[index], salesRepId: repId, salesRepName: rep.name };
      setEditedSplits(updated);
    }
  };

  const saveSplits = () => {
    if (selectedInvoice) {
      const totalPercentage = editedSplits.reduce((sum, s) => sum + s.splitPercentage, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        alert('Split percentages must total 100%');
        return;
      }

      const updatedInvoice = {
        ...selectedInvoice,
        splitRates: editedSplits,
      };
      setInvoices(invoices.map(i => i.id === selectedInvoice.id ? updatedInvoice : i));
      setSelectedInvoice(updatedInvoice);
      setEditingSplits(false);
      setEditedSplits([]);
    }
  };

  const splitPercentageTotal = editedSplits.reduce((sum, s) => sum + s.splitPercentage, 0);

  const filteredInvoices = useMemo(() => {
    let result = invoices;

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
  }, [invoices, sortField, sortDirection, columnFilters]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
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

  // Check if an invoice is linked to other entities (commission checks, etc.)
  const isInvoiceLinked = (invoice: Invoice) => {
    // Invoice is linked if it's on a commission check or is locked
    return invoice.isLocked || invoice.status === 'paid';
  };

  const getInvoiceLinkedReason = (invoice: Invoice) => {
    const reasons: string[] = [];
    if (invoice.isLocked) {
      reasons.push('is locked');
    }
    if (invoice.status === 'paid') {
      reasons.push('has been paid');
    }
    return `Cannot select: Invoice ${reasons.join(' and ')}`;
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

        </div>

        {/* Invoices Table */}
        <div className="flex-1 overflow-auto p-6 pt-4">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
            {/* Bulk Actions Bar */}
            {selectedInvoicesForBulk.size > 0 && (
              <div className="px-4 py-2 bg-[var(--primary)]/5 border-b border-[var(--border)] flex items-center justify-between">
                <span className="text-sm text-[var(--foreground)]">
                  <strong>{selectedInvoicesForBulk.size}</strong> invoice{selectedInvoicesForBulk.size !== 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button
                      onClick={() => setShowInvoicesBulkActionsMenu(!showInvoicesBulkActionsMenu)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                    >
                      Bulk Actions
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    {showInvoicesBulkActionsMenu && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowInvoicesBulkActionsMenu(false)} />
                        <div className="absolute top-full right-0 mt-1 w-56 bg-white border border-[var(--border)] rounded-lg shadow-xl z-50 py-1">
                          {/* Set Status submenu */}
                          <div className="relative group">
                            <button
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center justify-between"
                            >
                              <span className="flex items-center gap-2">
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="10" cy="10" r="8"/>
                                  <path d="M10 6v4l2 2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Set Status
                              </span>
                              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M8 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                            <div className="absolute left-full top-0 ml-1 w-48 bg-white border border-[var(--border)] rounded-lg shadow-xl py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                              {(['open', 'paid', 'partial_paid', 'void', 'dormant'] as InvoiceStatus[]).map((status) => (
                                <button
                                  key={status}
                                  onClick={() => {
                                    setInvoices(prev => prev.map(i =>
                                      selectedInvoicesForBulk.has(i.id) ? { ...i, status } : i
                                    ));
                                    setSelectedInvoicesForBulk(new Set());
                                    setShowInvoicesBulkActionsMenu(false);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                                >
                                  <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${invoiceStatusColors[status]}`}>
                                    {invoiceStatusLabels[status]}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="border-t border-[var(--border)] my-1"></div>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${selectedInvoicesForBulk.size} invoice(s)? This action cannot be undone.`)) {
                                setInvoices(prev => prev.filter(i => !selectedInvoicesForBulk.has(i.id)));
                                setSelectedInvoicesForBulk(new Set());
                                setShowInvoicesBulkActionsMenu(false);
                              }
                            }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 text-red-600"
                          >
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h14M8 6V4a1 1 0 011-1h2a1 1 0 011 1v2M5 6v11a2 2 0 002 2h6a2 2 0 002-2V6" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedInvoicesForBulk(new Set())}
                    className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
            <div className="min-w-[1640px]">
              {/* Table Header */}
              <div className="grid grid-cols-[40px_40px_120px_80px_100px_90px_100px_100px_120px_100px_120px_90px_90px_60px] gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
                {/* Checkbox column */}
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={filteredInvoices.filter(i => !isInvoiceLinked(i)).length > 0 && filteredInvoices.filter(i => !isInvoiceLinked(i)).every(i => selectedInvoicesForBulk.has(i.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        // Only select invoices that are not linked to other entities
                        setSelectedInvoicesForBulk(new Set(filteredInvoices.filter(i => !isInvoiceLinked(i)).map(i => i.id)));
                      } else {
                        setSelectedInvoicesForBulk(new Set());
                      }
                    }}
                    className="w-4 h-4 accent-[var(--primary)]"
                  />
                </div>
                <div className="flex items-center justify-center">
                  {/* Preview column header - empty */}
                </div>
                <div className="flex items-center">
                  <button
                    onClick={() => handleSort('invoiceNumber')}
                    className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                  >
                    Invoice #
                    <SortIcon field="invoiceNumber" />
                  </button>
                  <TextFilterDropdown
                    filterId="invoiceNumber"
                    value={columnFilters.invoiceNumber}
                    onChange={(value) => setColumnFilters(prev => ({ ...prev, invoiceNumber: value }))}
                    placeholder="Search invoices..."
                  />
                </div>
                <div className="flex items-center">
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
                <div className="flex items-center">
                  <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                    Order #
                  </span>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={() => handleSort('invoiceDate')}
                    className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                  >
                    Invoice Date
                    <SortIcon field="invoiceDate" />
                  </button>
                  <DateRangeFilterDropdown
                    filterId="invoiceDate"
                    value={columnFilters.invoiceDate}
                    onChange={(value) => setColumnFilters(prev => ({ ...prev, invoiceDate: value }))}
                  />
                </div>
                <div className="flex items-center justify-end">
                  <button
                    onClick={() => handleSort('total')}
                    className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                  >
                    Inv Amount
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
                <div className="flex items-center justify-end">
                  <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                    Comm Amount
                  </span>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={() => handleSort('manufacturerName')}
                    className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                  >
                    Factory
                    <SortIcon field="manufacturerName" />
                  </button>
                  <MultiSelectFilterDropdown
                    filterId="manufacturerName"
                    options={uniqueManufacturers.map(m => ({ value: m, label: m }))}
                    value={columnFilters.manufacturerName}
                    onChange={(value) => setColumnFilters(prev => ({ ...prev, manufacturerName: value }))}
                    placeholder="All Factories"
                  />
                </div>
                <div className="flex items-center">
                  <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                    Inside Rep
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                    Outside Reps
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                    Entry Date
                  </span>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={() => handleSort('dueDate')}
                    className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                  >
                    Due Date
                    <SortIcon field="dueDate" />
                  </button>
                  <DateRangeFilterDropdown
                    filterId="dueDate"
                    value={columnFilters.dueDate}
                    onChange={(value) => setColumnFilters(prev => ({ ...prev, dueDate: value }))}
                  />
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                    Paid
                  </span>
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
                  const outsideReps = invoice.splitRates
                    .filter(sr => sr.salesRepId !== invoice.insideRepId)
                    .map(sr => `${sr.salesRepName} (${sr.splitPercentage}%)`)
                    .join(', ');

                  return (
                    <div
                      key={invoice.id}
                      onClick={() => router.push(`/invoices/${invoice.id}`)}
                      className={`grid grid-cols-[40px_40px_120px_80px_100px_90px_100px_100px_120px_100px_120px_90px_90px_60px] gap-2 px-4 py-3 hover:bg-[var(--muted)]/20 transition-colors cursor-pointer ${
                        selectedInvoice?.id === invoice.id ? 'bg-[var(--muted)]/30' : ''
                      } ${selectedInvoicesForBulk.has(invoice.id) ? 'bg-[var(--primary)]/5' : ''}`}
                    >
                      {/* Checkbox */}
                      <div className="flex items-center justify-center relative group" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedInvoicesForBulk.has(invoice.id)}
                          disabled={isInvoiceLinked(invoice)}
                          onChange={(e) => {
                            setSelectedInvoicesForBulk(prev => {
                              const newSet = new Set(prev);
                              if (e.target.checked) {
                                newSet.add(invoice.id);
                              } else {
                                newSet.delete(invoice.id);
                              }
                              return newSet;
                            });
                          }}
                          className={`w-4 h-4 accent-[var(--primary)] ${isInvoiceLinked(invoice) ? 'opacity-40 cursor-not-allowed' : ''}`}
                        />
                        {isInvoiceLinked(invoice) && (
                          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                            {getInvoiceLinkedReason(invoice)}
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInvoice(invoice);
                          }}
                          className="p-1.5 hover:bg-[var(--muted)] rounded transition-colors"
                          title="Quick preview"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="M21 21l-4.35-4.35"/>
                          </svg>
                        </button>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-[var(--foreground)] truncate">{invoice.invoiceNumber}</span>
                      </div>
                      <div className="flex items-center">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${invoiceStatusColors[invoice.status]}`}>
                          {invoiceStatusLabels[invoice.status]}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-[var(--muted-foreground)] truncate">{invoice.orderNumber}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-[var(--muted-foreground)]">{formatDate(invoice.invoiceDate)}</span>
                      </div>
                      <div className="flex items-center justify-end">
                        <span className="text-sm font-medium text-[var(--foreground)]">{formatCurrency(invoice.total)}</span>
                      </div>
                      <div className="flex items-center justify-end">
                        <span className="text-sm text-green-600">{formatCurrency(invoice.totalCommission)}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-[var(--foreground)] truncate">{invoice.manufacturerName}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-[var(--muted-foreground)] truncate">{invoice.insideRepName || '-'}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-[var(--muted-foreground)] truncate" title={outsideReps}>
                          {outsideReps || '-'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-[var(--muted-foreground)]">{invoice.entryDate ? formatDate(invoice.entryDate) : '-'}</span>
                      </div>
                      <div className="flex items-center">
                        <span className={`text-xs ${overdue ? 'text-red-600 font-medium' : 'text-[var(--muted-foreground)]'}`}>
                          {formatDate(invoice.dueDate)}
                        </span>
                      </div>
                      <div className="flex items-center justify-center">
                        {invoice.status === 'paid' || invoice.isPaid ? (
                          <svg className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round"/>
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
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">Commission Splits</h3>
                {!editingSplits ? (
                  <button
                    onClick={startEditingSplits}
                    className="text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium"
                  >
                    Edit
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${Math.abs(splitPercentageTotal - 100) > 0.01 ? 'text-red-500' : 'text-green-600'}`}>
                      Total: {splitPercentageTotal.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>

              {!editingSplits ? (
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
              ) : (
                <div className="space-y-2">
                  {editedSplits.map((split, idx) => (
                    <div key={idx} className="bg-[var(--muted)]/30 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <select
                          value={split.salesRepId}
                          onChange={(e) => updateSplitRep(idx, e.target.value)}
                          className="flex-1 px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                        >
                          <option value="">Select Rep...</option>
                          {mockSalesReps.map(rep => (
                            <option key={rep.id} value={rep.id}>{rep.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => removeSplit(idx)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Remove split"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={split.splitPercentage}
                          onChange={(e) => updateSplitPercentage(idx, parseFloat(e.target.value) || 0)}
                          min="0"
                          max="100"
                          step="0.5"
                          className="w-20 px-2 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                        />
                        <span className="text-sm text-[var(--muted-foreground)]">%</span>
                        <span className="ml-auto text-sm font-medium text-green-600">
                          {formatCurrency(split.commissionAmount)}
                        </span>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={addNewSplit}
                    className="w-full py-2 border border-dashed border-[var(--border)] rounded-lg text-sm text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
                  >
                    + Add Split
                  </button>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={cancelEditingSplits}
                      className="flex-1 px-3 py-1.5 text-sm border border-[var(--border)] rounded hover:bg-[var(--muted)] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveSplits}
                      disabled={Math.abs(splitPercentageTotal - 100) > 0.01}
                      className="flex-1 px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
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
