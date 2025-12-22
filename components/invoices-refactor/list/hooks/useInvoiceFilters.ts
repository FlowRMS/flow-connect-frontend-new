/**
 * useInvoiceFilters Hook
 * Manages all filtering logic for the invoices list
 */

import { useState, useMemo } from 'react';
import type { Invoice } from '@/lib/types/rms';
import type {
  ColumnFilters,
  QuickDatePreset,
  QuickDateField,
  SortField,
  SortDirection,
} from '../types';
import { getQuickDateRange } from '../utils';

export function useInvoiceFilters(invoices: Invoice[]) {
  // Column filters state
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
  const [sortField, setSortField] = useState<SortField>('invoiceDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Get unique values for filter dropdowns
  const uniqueCustomers = useMemo(
    () => [...new Set(invoices.map((i) => i.customerName))].sort(),
    [invoices]
  );
  const uniqueManufacturers = useMemo(
    () => [...new Set(invoices.map((i) => i.manufacturerName))].sort(),
    [invoices]
  );
  const uniqueStatuses = useMemo(
    () => [...new Set(invoices.map((i) => i.status))].sort(),
    [invoices]
  );
  const uniqueInvoiceDates = useMemo(
    () => [...new Set(invoices.map((i) => i.invoiceDate))].sort().reverse(),
    [invoices]
  );
  const uniqueDueDates = useMemo(
    () => [...new Set(invoices.map((i) => i.dueDate))].sort().reverse(),
    [invoices]
  );
  const uniqueTotals = useMemo(
    () => [...new Set(invoices.map((i) => i.total))].sort((a, b) => b - a),
    [invoices]
  );
  const uniqueBalances = useMemo(
    () => [...new Set(invoices.map((i) => i.balance))].sort((a, b) => b - a),
    [invoices]
  );

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      columnFilters.invoiceNumber !== '' ||
      columnFilters.customerName.length > 0 ||
      columnFilters.manufacturerName.length > 0 ||
      columnFilters.invoiceDate.start !== '' ||
      columnFilters.invoiceDate.end !== '' ||
      columnFilters.dueDate.start !== '' ||
      columnFilters.dueDate.end !== '' ||
      columnFilters.total.length > 0 ||
      columnFilters.balance.length > 0 ||
      columnFilters.status.length > 0
    );
  }, [columnFilters]);

  // Clear all filters
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

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Apply filters and sorting to invoices
  const filteredInvoices = useMemo(() => {
    let result = invoices;

    // Apply quick date filter
    if (quickDatePreset !== 'all') {
      const { start, end } = getQuickDateRange(quickDatePreset);
      if (start && end) {
        result = result.filter((i) => {
          const dateStr =
            quickDateField === 'entryDate' ? i.entryDate : i.invoiceDate;
          if (!dateStr) return false;
          const date = new Date(dateStr);
          return date >= start && date <= end;
        });
      }
    }

    // Apply column filters
    if (columnFilters.invoiceNumber) {
      result = result.filter((i) =>
        i.invoiceNumber
          .toLowerCase()
          .includes(columnFilters.invoiceNumber.toLowerCase())
      );
    }
    if (columnFilters.customerName.length > 0) {
      result = result.filter((i) =>
        columnFilters.customerName.includes(i.customerName)
      );
    }
    if (columnFilters.manufacturerName.length > 0) {
      result = result.filter((i) =>
        columnFilters.manufacturerName.includes(i.manufacturerName)
      );
    }
    if (columnFilters.status.length > 0) {
      result = result.filter((i) => columnFilters.status.includes(i.status));
    }
    if (columnFilters.invoiceDate.start || columnFilters.invoiceDate.end) {
      result = result.filter((i) => {
        const date = new Date(i.invoiceDate);
        if (
          columnFilters.invoiceDate.start &&
          date < new Date(columnFilters.invoiceDate.start)
        )
          return false;
        if (
          columnFilters.invoiceDate.end &&
          date > new Date(columnFilters.invoiceDate.end)
        )
          return false;
        return true;
      });
    }
    if (columnFilters.dueDate.start || columnFilters.dueDate.end) {
      result = result.filter((i) => {
        const date = new Date(i.dueDate);
        if (
          columnFilters.dueDate.start &&
          date < new Date(columnFilters.dueDate.start)
        )
          return false;
        if (
          columnFilters.dueDate.end &&
          date > new Date(columnFilters.dueDate.end)
        )
          return false;
        return true;
      });
    }
    if (columnFilters.total.length > 0) {
      result = result.filter((i) =>
        columnFilters.total.includes(i.total.toString())
      );
    }
    if (columnFilters.balance.length > 0) {
      result = result.filter((i) =>
        columnFilters.balance.includes(i.balance.toString())
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
          comparison =
            new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime();
          break;
        case 'dueDate':
          comparison =
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
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
  }, [
    invoices,
    sortField,
    sortDirection,
    columnFilters,
    quickDatePreset,
    quickDateField,
  ]);

  return {
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
    uniqueCustomers,
    uniqueManufacturers,
    uniqueStatuses,
    uniqueInvoiceDates,
    uniqueDueDates,
    uniqueTotals,
    uniqueBalances,
    // Computed
    hasActiveFilters,
    filteredInvoices,
    // Actions
    clearAllFilters,
  };
}

