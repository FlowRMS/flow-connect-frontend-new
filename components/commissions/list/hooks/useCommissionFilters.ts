/**
 * useCommissionFilters Hook
 * Manages all filtering logic for the commissions list
 */

import { useState, useMemo } from 'react';
import type { CommissionCheck } from '@/lib/types/rms';
import type {
  ColumnFilters,
  QuickDatePreset,
  QuickDateField,
  SortField,
  SortDirection,
  StatusTab,
} from '../types';
import { getQuickDateRange } from '../utils';
import { checkStatusLabels } from '../constants';

export function useCommissionFilters(checks: CommissionCheck[]) {
  // Status tabs filter (All, Draft, Posted, Void)
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Search query (global search across multiple fields)
  const [searchQuery, setSearchQuery] = useState('');

  // Column filters state
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    checkNumber: '',
    status: [],
    manufacturerName: [],
    commissionMonth: { start: '', end: '' },
    postDate: { start: '', end: '' },
    checkDate: { start: '', end: '' },
    entryDate: { start: '', end: '' },
  });

  // Quick date filter state
  const [quickDatePreset, setQuickDatePreset] =
    useState<QuickDatePreset>('all');
  const [quickDateField, setQuickDateField] =
    useState<QuickDateField>('entryDate');
  const [showQuickDateFieldDropdown, setShowQuickDateFieldDropdown] =
    useState(false);

  // Open filter dropdown tracking
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  // Sort state
  const [sortField, setSortField] = useState<SortField>('entryDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Get unique values for filter dropdowns
  const uniqueStatuses = useMemo(
    () => [...new Set(checks.map((c) => c.status))].sort(),
    [checks]
  );
  const uniqueManufacturers = useMemo(
    () =>
      [
        ...new Set(
          checks
            .filter((c) => c.manufacturerName)
            .map((c) => c.manufacturerName!)
        ),
      ].sort(),
    [checks]
  );

  // Status tabs configuration
  const statusTabs = useMemo<StatusTab[]>(() => {
    return [
      { label: 'All', value: 'All', count: checks.length },
      {
        label: 'Open',
        value: 'OPEN',
        count: checks.filter((c) => c.status === 'OPEN').length,
      },
      {
        label: 'Posted',
        value: 'POSTED',
        count: checks.filter((c) => c.status === 'POSTED').length,
      },
      {
        label: 'Void',
        value: 'VOID',
        count: checks.filter((c) => c.status === 'VOID').length,
      },
    ];
  }, [checks]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      columnFilters.checkNumber !== '' ||
      columnFilters.status.length > 0 ||
      columnFilters.manufacturerName.length > 0 ||
      columnFilters.commissionMonth.start !== '' ||
      columnFilters.commissionMonth.end !== '' ||
      columnFilters.postDate.start !== '' ||
      columnFilters.postDate.end !== '' ||
      columnFilters.checkDate.start !== '' ||
      columnFilters.checkDate.end !== '' ||
      columnFilters.entryDate.start !== '' ||
      columnFilters.entryDate.end !== ''
    );
  }, [columnFilters]);

  // Clear all filters
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
    setSearchQuery('');
    setSelectedStatus('All');
  };

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Apply filters and sorting to checks
  const filteredChecks = useMemo(() => {
    let result = checks;

    // Apply quick date filter
    if (quickDatePreset !== 'all') {
      const { start, end } = getQuickDateRange(quickDatePreset);
      if (start && end) {
        result = result.filter((c) => {
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

    // Apply status tab filter
    if (selectedStatus !== 'All') {
      result = result.filter((c) => c.status === selectedStatus);
    }

    // Apply column filters
    if (columnFilters.checkNumber) {
      result = result.filter((c) =>
        c.checkNumber
          .toLowerCase()
          .includes(columnFilters.checkNumber.toLowerCase())
      );
    }
    if (columnFilters.status.length > 0) {
      result = result.filter((c) =>
        columnFilters.status.includes(c.status)
      );
    }
    if (columnFilters.manufacturerName.length > 0) {
      result = result.filter(
        (c) =>
          c.manufacturerName &&
          columnFilters.manufacturerName.includes(c.manufacturerName)
      );
    }
    if (
      columnFilters.commissionMonth.start ||
      columnFilters.commissionMonth.end
    ) {
      result = result.filter((c) => {
        const month = c.commissionMonth; // Format: "2025-01"
        if (
          columnFilters.commissionMonth.start &&
          month < columnFilters.commissionMonth.start.substring(0, 7)
        )
          return false;
        if (
          columnFilters.commissionMonth.end &&
          month > columnFilters.commissionMonth.end.substring(0, 7)
        )
          return false;
        return true;
      });
    }
    if (columnFilters.postDate.start || columnFilters.postDate.end) {
      result = result.filter((c) => {
        if (!c.postDate) return false;
        const date = new Date(c.postDate);
        if (
          columnFilters.postDate.start &&
          date < new Date(columnFilters.postDate.start)
        )
          return false;
        if (
          columnFilters.postDate.end &&
          date > new Date(columnFilters.postDate.end)
        )
          return false;
        return true;
      });
    }
    if (columnFilters.checkDate.start || columnFilters.checkDate.end) {
      result = result.filter((c) => {
        if (!c.checkDate) return false;
        const date = new Date(c.checkDate);
        if (
          columnFilters.checkDate.start &&
          date < new Date(columnFilters.checkDate.start)
        )
          return false;
        if (
          columnFilters.checkDate.end &&
          date > new Date(columnFilters.checkDate.end)
        )
          return false;
        return true;
      });
    }
    if (columnFilters.entryDate.start || columnFilters.entryDate.end) {
      result = result.filter((c) => {
        const date = new Date(c.entryDate);
        if (
          columnFilters.entryDate.start &&
          date < new Date(columnFilters.entryDate.start)
        )
          return false;
        if (
          columnFilters.entryDate.end &&
          date > new Date(columnFilters.entryDate.end)
        )
          return false;
        return true;
      });
    }

    // Apply search query (global search)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.checkNumber.toLowerCase().includes(query) ||
          c.salesRepName.toLowerCase().includes(query) ||
          c.commissionMonth.includes(query) ||
          (c.manufacturerName &&
            c.manufacturerName.toLowerCase().includes(query))
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
          comparison = (a.manufacturerName || '').localeCompare(
            b.manufacturerName || ''
          );
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
  }, [
    checks,
    selectedStatus,
    searchQuery,
    sortField,
    sortDirection,
    columnFilters,
    quickDatePreset,
    quickDateField,
  ]);

  return {
    // Status tabs filter
    selectedStatus,
    setSelectedStatus,
    statusTabs,
    // Search query
    searchQuery,
    setSearchQuery,
    // Filter state
    columnFilters,
    setColumnFilters,
    quickDatePreset,
    setQuickDatePreset,
    quickDateField,
    setQuickDateField,
    showQuickDateFieldDropdown,
    setShowQuickDateFieldDropdown,
    openFilter,
    setOpenFilter,
    // Sort state
    sortField,
    sortDirection,
    handleSort,
    // Unique values for dropdowns
    uniqueStatuses,
    uniqueManufacturers,
    // Computed
    hasActiveFilters,
    filteredChecks,
    // Actions
    clearAllFilters,
  };
}
