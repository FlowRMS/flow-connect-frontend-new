'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AdvancedFilters from '../AdvancedFilters';
import {
  mockChecks,
  mockSalesReps,
} from '../../lib/data/rms-mock';
import {
  CommissionCheck,
  CheckStatus,
  checkStatusLabels,
  checkStatusColors,
} from '../../lib/types/rms';

type SortField = 'checkNumber' | 'status' | 'netAmount' | 'commissionMonth' | 'manufacturerName' | 'postDate' | 'checkDate' | 'entryDate' | 'checkBalance';
type SortDirection = 'asc' | 'desc';

interface DateRange {
  start: string;
  end: string;
}

interface ColumnFilters {
  checkNumber: string;
  status: string[];
  manufacturerName: string[];
  commissionMonth: DateRange;
  postDate: DateRange;
  checkDate: DateRange;
  entryDate: DateRange;
}

export default function CommissionsContent() {
  const router = useRouter();
  const [checks, setChecks] = useState<CommissionCheck[]>(mockChecks);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedCheck, setSelectedCheck] = useState<CommissionCheck | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('entryDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    checkNumber: '',
    status: [],
    manufacturerName: [],
    commissionMonth: { start: '', end: '' },
    postDate: { start: '', end: '' },
    checkDate: { start: '', end: '' },
    entryDate: { start: '', end: '' },
  });
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  // Bulk actions state
  const [selectedChecksForBulk, setSelectedChecksForBulk] = useState<Set<string>>(new Set());
  const [showChecksBulkActionsMenu, setShowChecksBulkActionsMenu] = useState(false);

  // Quick date filter state
  type QuickDatePreset = 'all' | 'today' | 'this_week' | 'last_week';
  type QuickDateField = 'entryDate' | 'commissionMonth';
  const [quickDatePreset, setQuickDatePreset] = useState<QuickDatePreset>('all');
  const [quickDateField, setQuickDateField] = useState<QuickDateField>('entryDate');
  const [showQuickDateFieldDropdown, setShowQuickDateFieldDropdown] = useState(false);

  const statusTabs = [
    { label: 'All', value: 'All', count: checks.length },
    { label: 'Draft', value: 'draft', count: checks.filter(c => c.status === 'draft').length },
    { label: 'Posted', value: 'posted', count: checks.filter(c => c.status === 'posted').length },
    { label: 'Void', value: 'void', count: checks.filter(c => c.status === 'void').length },
  ];

  // Get unique values for filter dropdowns
  const uniqueStatuses = useMemo(() =>
    [...new Set(checks.map(c => c.status))].sort(), [checks]);
  const uniqueManufacturers = useMemo(() =>
    [...new Set(checks.filter(c => c.manufacturerName).map(c => c.manufacturerName!))].sort(), [checks]);

  const hasActiveFilters = useMemo(() => {
    return columnFilters.checkNumber !== '' ||
      columnFilters.status.length > 0 ||
      columnFilters.manufacturerName.length > 0 ||
      columnFilters.commissionMonth.start !== '' || columnFilters.commissionMonth.end !== '' ||
      columnFilters.postDate.start !== '' || columnFilters.postDate.end !== '' ||
      columnFilters.checkDate.start !== '' || columnFilters.checkDate.end !== '' ||
      columnFilters.entryDate.start !== '' || columnFilters.entryDate.end !== '';
  }, [columnFilters]);

  const clearAllFilters = () => {
    setColumnFilters({
      checkNumber: '',
      status: [],
      manufacturerName: [],
      commissionMonth: { start: '', end: '' },
      postDate: { start: '', end: '' },
      checkDate: { start: '', end: '' },
      entryDate: { start: '', end: '' },
    });
  };

  // Helper function to get date range for quick date filter
  const getQuickDateRange = (preset: QuickDatePreset): { start: Date | null; end: Date | null } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (preset) {
      case 'today':
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) };
      case 'this_week': {
        const dayOfWeek = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - dayOfWeek);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return { start: startOfWeek, end: endOfWeek };
      }
      case 'last_week': {
        const dayOfWeek = today.getDay();
        const startOfThisWeek = new Date(today);
        startOfThisWeek.setDate(today.getDate() - dayOfWeek);
        const startOfLastWeek = new Date(startOfThisWeek);
        startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
        endOfLastWeek.setHours(23, 59, 59, 999);
        return { start: startOfLastWeek, end: endOfLastWeek };
      }
      default:
        return { start: null, end: null };
    }
  };

  const filteredChecks = useMemo(() => {
    let result = checks;

    // Apply quick date filter
    if (quickDatePreset !== 'all') {
      const { start, end } = getQuickDateRange(quickDatePreset);
      if (start && end) {
        result = result.filter(c => {
          let dateStr: string | undefined;
          if (quickDateField === 'entryDate') {
            dateStr = c.entryDate;
          } else {
            // For commissionMonth, we need to parse it as a date (format: "2025-01")
            dateStr = c.commissionMonth + '-01';
          }
          if (!dateStr) return false;
          const date = new Date(dateStr);
          return date >= start && date <= end;
        });
      }
    }

    if (selectedStatus !== 'All') {
      result = result.filter(c => c.status === selectedStatus);
    }

    // Apply column filters
    if (columnFilters.checkNumber) {
      result = result.filter(c =>
        c.checkNumber.toLowerCase().includes(columnFilters.checkNumber.toLowerCase())
      );
    }
    if (columnFilters.status.length > 0) {
      result = result.filter(c => columnFilters.status.includes(c.status));
    }
    if (columnFilters.manufacturerName.length > 0) {
      result = result.filter(c => c.manufacturerName && columnFilters.manufacturerName.includes(c.manufacturerName));
    }
    if (columnFilters.commissionMonth.start || columnFilters.commissionMonth.end) {
      result = result.filter(c => {
        const month = c.commissionMonth; // Format: "2025-01"
        if (columnFilters.commissionMonth.start && month < columnFilters.commissionMonth.start.substring(0, 7)) return false;
        if (columnFilters.commissionMonth.end && month > columnFilters.commissionMonth.end.substring(0, 7)) return false;
        return true;
      });
    }
    if (columnFilters.postDate.start || columnFilters.postDate.end) {
      result = result.filter(c => {
        if (!c.postDate) return false;
        const date = new Date(c.postDate);
        if (columnFilters.postDate.start && date < new Date(columnFilters.postDate.start)) return false;
        if (columnFilters.postDate.end && date > new Date(columnFilters.postDate.end)) return false;
        return true;
      });
    }
    if (columnFilters.checkDate.start || columnFilters.checkDate.end) {
      result = result.filter(c => {
        if (!c.checkDate) return false;
        const date = new Date(c.checkDate);
        if (columnFilters.checkDate.start && date < new Date(columnFilters.checkDate.start)) return false;
        if (columnFilters.checkDate.end && date > new Date(columnFilters.checkDate.end)) return false;
        return true;
      });
    }
    if (columnFilters.entryDate.start || columnFilters.entryDate.end) {
      result = result.filter(c => {
        const date = new Date(c.entryDate);
        if (columnFilters.entryDate.start && date < new Date(columnFilters.entryDate.start)) return false;
        if (columnFilters.entryDate.end && date > new Date(columnFilters.entryDate.end)) return false;
        return true;
      });
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.checkNumber.toLowerCase().includes(query) ||
        c.salesRepName.toLowerCase().includes(query) ||
        c.commissionMonth.includes(query) ||
        (c.manufacturerName && c.manufacturerName.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    result = [...result].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'checkNumber':
          comparison = a.checkNumber.localeCompare(b.checkNumber);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'netAmount':
          comparison = a.netAmount - b.netAmount;
          break;
        case 'commissionMonth':
          comparison = a.commissionMonth.localeCompare(b.commissionMonth);
          break;
        case 'manufacturerName':
          comparison = (a.manufacturerName || '').localeCompare(b.manufacturerName || '');
          break;
        case 'postDate':
          comparison = (a.postDate || '').localeCompare(b.postDate || '');
          break;
        case 'checkDate':
          comparison = (a.checkDate || '').localeCompare(b.checkDate || '');
          break;
        case 'entryDate':
          comparison = a.entryDate.localeCompare(b.entryDate);
          break;
        case 'checkBalance':
          comparison = a.checkBalance - b.checkBalance;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [checks, selectedStatus, searchQuery, sortField, sortDirection, columnFilters, quickDatePreset, quickDateField]);

  const filterOptions = [
    { id: 'check-number', label: 'Check Number', type: 'text' as const },
    { id: 'sales-rep', label: 'Sales Rep', type: 'dropdown' as const },
    { id: 'month', label: 'Commission Month', type: 'date' as const },
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
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatMonth = (monthString: string) => {
    const date = new Date(monthString + '-01');
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${month} - ${year}`;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Check if a commission check is linked to other entities
  const isCheckLinked = (check: CommissionCheck) => {
    // Check is linked if it's posted (has been finalized)
    return check.status === 'posted';
  };

  const getCheckLinkedReason = (check: CommissionCheck) => {
    if (check.status === 'posted') {
      return 'Cannot select: Check has been posted';
    }
    return 'Cannot select: Check is linked to other entities';
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

  return (
    <main className="flex-1 overflow-hidden bg-[var(--background)] flex">
      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden ${selectedCheck ? 'mr-[480px]' : ''}`}>
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--muted)] rounded-lg flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="5" width="20" height="14" rx="2"/>
                    <path d="M6 9h4M6 13h12"/>
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-[var(--foreground)]">Commission Check</h1>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {checks.length} checks
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Upload
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="10" cy="10" r="7"/>
                  <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
                </svg>
                Add new Check
              </button>
            </div>
          </div>

          {/* Quick Date Filter */}
          <div className="flex items-center gap-2 mt-4">
            <span className="text-sm text-[var(--muted-foreground)]">Quick filter:</span>
            <div className="flex items-center bg-[var(--muted)]/30 rounded-lg p-1">
              {[
                { value: 'all', label: 'All' },
                { value: 'today', label: 'Today' },
                { value: 'this_week', label: 'This Week' },
                { value: 'last_week', label: 'Last Week' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setQuickDatePreset(option.value as QuickDatePreset)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    quickDatePreset === option.value
                      ? 'bg-white shadow-sm text-[var(--foreground)] font-medium'
                      : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {/* Date Field Selector */}
            <div className="relative">
              <button
                onClick={() => setShowQuickDateFieldDropdown(!showQuickDateFieldDropdown)}
                className="flex items-center gap-1 px-2 py-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] rounded-lg transition-colors"
              >
                <span>{quickDateField === 'entryDate' ? 'Entry Date' : 'Commission Month'}</span>
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showQuickDateFieldDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowQuickDateFieldDropdown(false)} />
                  <div className="absolute top-full left-0 mt-1 bg-white border border-[var(--border)] rounded-lg shadow-lg z-20 py-1 min-w-[150px]">
                    <button
                      onClick={() => {
                        setQuickDateField('entryDate');
                        setShowQuickDateFieldDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 transition-colors ${quickDateField === 'entryDate' ? 'text-[var(--primary)] font-medium' : ''}`}
                    >
                      Entry Date
                    </button>
                    <button
                      onClick={() => {
                        setQuickDateField('commissionMonth');
                        setShowQuickDateFieldDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 transition-colors ${quickDateField === 'commissionMonth' ? 'text-[var(--primary)] font-medium' : ''}`}
                    >
                      Commission Month
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>

        {/* Checks Table */}
        <div className="flex-1 overflow-auto p-6 pt-4">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
            {/* Bulk Actions Bar */}
            {selectedChecksForBulk.size > 0 && (
              <div className="px-4 py-2 bg-[var(--primary)]/5 border-b border-[var(--border)] flex items-center justify-between">
                <span className="text-sm text-[var(--foreground)]">
                  <strong>{selectedChecksForBulk.size}</strong> check{selectedChecksForBulk.size !== 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button
                      onClick={() => setShowChecksBulkActionsMenu(!showChecksBulkActionsMenu)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                    >
                      Bulk Actions
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    {showChecksBulkActionsMenu && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowChecksBulkActionsMenu(false)} />
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
                              {(['draft', 'posted', 'void'] as CheckStatus[]).map((status) => (
                                <button
                                  key={status}
                                  onClick={() => {
                                    setChecks(prev => prev.map(c =>
                                      selectedChecksForBulk.has(c.id) ? { ...c, status } : c
                                    ));
                                    setSelectedChecksForBulk(new Set());
                                    setShowChecksBulkActionsMenu(false);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                                >
                                  <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${checkStatusColors[status]}`}>
                                    {checkStatusLabels[status]}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="border-t border-[var(--border)] my-1"></div>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${selectedChecksForBulk.size} check(s)? This action cannot be undone.`)) {
                                setChecks(prev => prev.filter(c => !selectedChecksForBulk.has(c.id)));
                                setSelectedChecksForBulk(new Set());
                                setShowChecksBulkActionsMenu(false);
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
                    onClick={() => setSelectedChecksForBulk(new Set())}
                    className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}
            {/* Table Header */}
            <div className="grid grid-cols-[40px_auto_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30 min-w-[1200px]">
              <div className="flex items-center justify-center">
                {/* Preview column header - empty */}
              </div>
              <div className="w-8">
                <input
                  type="checkbox"
                  className="rounded border-[var(--border)]"
                  checked={filteredChecks.filter(c => !isCheckLinked(c)).length > 0 && filteredChecks.filter(c => !isCheckLinked(c)).every(c => selectedChecksForBulk.has(c.id))}
                  onChange={(e) => {
                    if (e.target.checked) {
                      // Only select checks that are not linked to other entities
                      setSelectedChecksForBulk(new Set(filteredChecks.filter(c => !isCheckLinked(c)).map(c => c.id)));
                    } else {
                      setSelectedChecksForBulk(new Set());
                    }
                  }}
                />
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => handleSort('checkNumber')}
                  className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                >
                  Check Number
                  <SortIcon field="checkNumber" />
                </button>
                <TextFilterDropdown
                  filterId="checkNumber"
                  value={columnFilters.checkNumber}
                  onChange={(value) => setColumnFilters(prev => ({ ...prev, checkNumber: value }))}
                  placeholder="Search checks..."
                />
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => handleSort('status')}
                  className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                >
                  Posted Status
                  <SortIcon field="status" />
                </button>
                <MultiSelectFilterDropdown
                  filterId="status"
                  options={uniqueStatuses.map(s => ({ value: s, label: checkStatusLabels[s as keyof typeof checkStatusLabels] }))}
                  value={columnFilters.status}
                  onChange={(value) => setColumnFilters(prev => ({ ...prev, status: value }))}
                  placeholder="All Statuses"
                />
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => handleSort('netAmount')}
                  className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                >
                  Commission
                  <SortIcon field="netAmount" />
                </button>
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => handleSort('commissionMonth')}
                  className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                >
                  Commission Month
                  <SortIcon field="commissionMonth" />
                </button>
                <DateRangeFilterDropdown
                  filterId="commissionMonth"
                  value={columnFilters.commissionMonth}
                  onChange={(value) => setColumnFilters(prev => ({ ...prev, commissionMonth: value }))}
                />
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
                <button
                  onClick={() => handleSort('postDate')}
                  className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                >
                  Post Date
                  <SortIcon field="postDate" />
                </button>
                <DateRangeFilterDropdown
                  filterId="postDate"
                  value={columnFilters.postDate}
                  onChange={(value) => setColumnFilters(prev => ({ ...prev, postDate: value }))}
                />
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => handleSort('checkDate')}
                  className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                >
                  Check Date
                  <SortIcon field="checkDate" />
                </button>
                <DateRangeFilterDropdown
                  filterId="checkDate"
                  value={columnFilters.checkDate}
                  onChange={(value) => setColumnFilters(prev => ({ ...prev, checkDate: value }))}
                />
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => handleSort('entryDate')}
                  className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                >
                  Entry Date
                  <SortIcon field="entryDate" />
                </button>
                <DateRangeFilterDropdown
                  filterId="entryDate"
                  value={columnFilters.entryDate}
                  onChange={(value) => setColumnFilters(prev => ({ ...prev, entryDate: value }))}
                />
              </div>
              <div className="flex items-center justify-end">
                <button
                  onClick={() => handleSort('checkBalance')}
                  className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                >
                  Check Balance
                  <SortIcon field="checkBalance" />
                </button>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-[var(--border)]">
              {filteredChecks.length === 0 ? (
                <div className="px-6 py-12 text-center text-[var(--muted-foreground)]">
                  No checks found
                </div>
              ) : (
                filteredChecks.map((check) => (
                  <div
                    key={check.id}
                    onClick={() => router.push(`/commissions/${check.id}`)}
                    className={`grid grid-cols-[40px_auto_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-4 hover:bg-[var(--muted)]/20 transition-colors cursor-pointer min-w-[1200px] ${
                      selectedCheck?.id === check.id ? 'bg-[var(--muted)]/30' : ''
                    } ${selectedChecksForBulk.has(check.id) ? 'bg-[var(--primary)]/5' : ''}`}
                  >
                    <div className="flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCheck(check);
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
                    <div className="w-8 flex items-center relative group" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className={`rounded border-[var(--border)] ${isCheckLinked(check) ? 'opacity-40 cursor-not-allowed' : ''}`}
                        checked={selectedChecksForBulk.has(check.id)}
                        disabled={isCheckLinked(check)}
                        onChange={(e) => {
                          setSelectedChecksForBulk(prev => {
                            const newSet = new Set(prev);
                            if (e.target.checked) {
                              newSet.add(check.id);
                            } else {
                              newSet.delete(check.id);
                            }
                            return newSet;
                          });
                        }}
                      />
                      {isCheckLinked(check) && (
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                          {getCheckLinkedReason(check)}
                          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium text-[var(--foreground)]">{check.checkNumber}</span>
                    </div>
                    <div className="flex items-center">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full inline-flex items-center gap-1 ${
                        check.status === 'posted' ? 'bg-blue-100 text-blue-700' :
                        check.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          check.status === 'posted' ? 'bg-blue-500' :
                          check.status === 'draft' ? 'bg-gray-500' :
                          'bg-red-500'
                        }`}></span>
                        {check.status === 'posted' ? 'OPEN' : checkStatusLabels[check.status].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-[var(--foreground)]">{formatCurrency(check.netAmount)}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-[var(--muted-foreground)]">{formatMonth(check.commissionMonth)}</span>
                    </div>
                    <div className="flex items-center">
                      {check.manufacturerName && (
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[var(--muted)] flex items-center justify-center text-xs font-medium text-[var(--muted-foreground)]">
                            {check.manufacturerName.charAt(0)}
                          </span>
                          <span className="text-sm text-[var(--foreground)]">{check.manufacturerName}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-[var(--muted-foreground)]">
                        {check.postDate ? formatDate(check.postDate) : ''}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-[var(--muted-foreground)]">
                        {check.checkDate ? formatDate(check.checkDate) : ''}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-[var(--muted-foreground)]">
                        {formatDate(check.entryDate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-end">
                      <span className="text-sm text-[var(--foreground)]">{formatCurrency(check.checkBalance)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedCheck && (
        <div className="fixed right-0 top-0 bottom-0 w-[480px] bg-[var(--card)] border-l border-[var(--border)] overflow-y-auto shadow-xl">
          <div className="sticky top-0 bg-[var(--card)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">{selectedCheck.checkNumber}</h2>
              <p className="text-sm text-[var(--muted-foreground)]">{selectedCheck.salesRepName}</p>
            </div>
            <button
              onClick={() => setSelectedCheck(null)}
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
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${checkStatusColors[selectedCheck.status]}`}>
                  {checkStatusLabels[selectedCheck.status]}
                </span>
              </div>
            </div>

            {/* Check Details */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Check Details</h3>
              <div className="bg-[var(--muted)]/30 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Commission Period</span>
                  <span className="text-sm text-[var(--foreground)]">{formatMonth(selectedCheck.commissionMonth)}</span>
                </div>
                {selectedCheck.manufacturerName && (
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--muted-foreground)]">Factory</span>
                    <span className="text-sm text-[var(--foreground)]">{selectedCheck.manufacturerName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Entry Date</span>
                  <span className="text-sm text-[var(--foreground)]">{formatDate(selectedCheck.entryDate)}</span>
                </div>
                {selectedCheck.checkDate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--muted-foreground)]">Check Date</span>
                    <span className="text-sm text-[var(--foreground)]">{formatDate(selectedCheck.checkDate)}</span>
                  </div>
                )}
                {selectedCheck.postDate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--muted-foreground)]">Post Date</span>
                    <span className="text-sm text-[var(--foreground)]">{formatDate(selectedCheck.postDate)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Created Date</span>
                  <span className="text-sm text-[var(--foreground)]">{formatDate(selectedCheck.createdDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Created By</span>
                  <span className="text-sm text-[var(--foreground)]">{selectedCheck.createdBy}</span>
                </div>
              </div>
            </div>

            {/* Check Details (Line Items) */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                Details ({selectedCheck.details.length})
              </h3>
              <div className="space-y-2">
                {selectedCheck.details.map((detail) => (
                  <div
                    key={detail.id}
                    className="bg-[var(--muted)]/30 rounded-lg p-3"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 text-xs rounded ${
                          detail.type === 'invoice' ? 'bg-green-100 text-green-700' :
                          detail.type === 'credit' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {detail.type}
                        </span>
                        <span className="text-sm font-medium text-[var(--foreground)]">{detail.referenceNumber}</span>
                      </div>
                      <span className={`text-sm font-medium ${detail.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {detail.amount >= 0 ? '+' : ''}{formatCurrency(detail.amount)}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)]">{detail.description}</p>
                    {detail.customerName && (
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">Customer: {detail.customerName}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Check Totals</h3>
              <div className="bg-[var(--muted)]/30 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Invoice Payments</span>
                  <span className="text-sm text-green-600">+{formatCurrency(selectedCheck.invoicePayments)}</span>
                </div>
                {selectedCheck.expenseAdjustments !== 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--muted-foreground)]">Expense Adjustments</span>
                    <span className="text-sm text-blue-600">
                      {selectedCheck.expenseAdjustments >= 0 ? '+' : ''}{formatCurrency(selectedCheck.expenseAdjustments)}
                    </span>
                  </div>
                )}
                {selectedCheck.creditDeductions !== 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--muted-foreground)]">Credit Deductions</span>
                    <span className="text-sm text-red-600">-{formatCurrency(selectedCheck.creditDeductions)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-[var(--border)] pt-2 mt-2">
                  <span className="text-sm font-semibold text-[var(--foreground)]">Net Amount</span>
                  <span className="text-sm font-bold text-[var(--foreground)]">{formatCurrency(selectedCheck.netAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-[var(--foreground)]">Check Balance</span>
                  <span className="text-sm font-bold text-[var(--foreground)]">{formatCurrency(selectedCheck.checkBalance)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
              {selectedCheck.status === 'draft' && (
                <>
                  <button className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
                    Edit Check
                  </button>
                  <button className="flex-1 px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors">
                    Post Check
                  </button>
                </>
              )}
              {selectedCheck.status === 'posted' && (
                <button className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors">
                  Print Check
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
