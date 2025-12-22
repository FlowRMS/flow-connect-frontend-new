/**
 * useOrderFilters Hook
 * Manages all filtering logic for the orders list
 */

import { useState, useMemo } from 'react';
import type { Order } from '@/lib/types/rms';
import type {
  ColumnFilters,
  QuickDatePreset,
  QuickDateField,
  SortField,
  SortDirection,
} from '../types';
import { getQuickDateRange } from '../utils';

export function useOrderFilters(orders: Order[]) {
  // Column filters state
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    orderNumber: '',
    customerName: [],
    manufacturerName: [],
    orderDate: { start: '', end: '' },
    total: [],
    totalCommission: [],
    status: [],
  });

  // Quick date filter state
  const [quickDatePreset, setQuickDatePreset] =
    useState<QuickDatePreset>('all');
  const [quickDateField, setQuickDateField] =
    useState<QuickDateField>('createdAt');
  const [showQuickDateFieldDropdown, setShowQuickDateFieldDropdown] =
    useState(false);

  // Open filter dropdown tracking
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  // Sort state
  const [sortField, setSortField] = useState<SortField>('orderDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Get unique values for filter dropdowns
  const uniqueCustomers = useMemo(
    () => [...new Set(orders.map((o) => o.customerName))].sort(),
    [orders]
  );
  const uniqueManufacturers = useMemo(
    () => [...new Set(orders.map((o) => o.manufacturerName))].sort(),
    [orders]
  );
  const uniqueStatuses = useMemo(
    () => [...new Set(orders.map((o) => o.status))].sort(),
    [orders]
  );
  const uniqueOrderDates = useMemo(
    () => [...new Set(orders.map((o) => o.orderDate))].sort().reverse(),
    [orders]
  );
  const uniqueTotals = useMemo(
    () => [...new Set(orders.map((o) => o.total))].sort((a, b) => b - a),
    [orders]
  );
  const uniqueCommissions = useMemo(
    () =>
      [...new Set(orders.map((o) => o.totalCommission))].sort((a, b) => b - a),
    [orders]
  );

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      columnFilters.orderNumber !== '' ||
      columnFilters.customerName.length > 0 ||
      columnFilters.manufacturerName.length > 0 ||
      columnFilters.orderDate.start !== '' ||
      columnFilters.orderDate.end !== '' ||
      columnFilters.total.length > 0 ||
      columnFilters.totalCommission.length > 0 ||
      columnFilters.status.length > 0
    );
  }, [columnFilters]);

  // Clear all filters
  const clearAllFilters = () => {
    setColumnFilters({
      orderNumber: '',
      customerName: [],
      manufacturerName: [],
      orderDate: { start: '', end: '' },
      total: [],
      totalCommission: [],
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

  // Apply filters and sorting to orders
  const filteredOrders = useMemo(() => {
    let result = orders;

    // Apply quick date filter
    if (quickDatePreset !== 'all') {
      const { start, end } = getQuickDateRange(quickDatePreset);
      if (start && end) {
        result = result.filter((o) => {
          const dateStr =
            quickDateField === 'createdAt' ? o.createdAt : o.orderDate;
          if (!dateStr) return false;
          const date = new Date(dateStr);
          return date >= start && date <= end;
        });
      }
    }

    // Apply column filters
    if (columnFilters.orderNumber) {
      result = result.filter((o) =>
        o.orderNumber
          .toLowerCase()
          .includes(columnFilters.orderNumber.toLowerCase())
      );
    }
    if (columnFilters.customerName.length > 0) {
      result = result.filter((o) =>
        columnFilters.customerName.includes(o.customerName)
      );
    }
    if (columnFilters.manufacturerName.length > 0) {
      result = result.filter((o) =>
        columnFilters.manufacturerName.includes(o.manufacturerName)
      );
    }
    if (columnFilters.status.length > 0) {
      result = result.filter((o) => columnFilters.status.includes(o.status));
    }
    if (columnFilters.orderDate.start || columnFilters.orderDate.end) {
      result = result.filter((o) => {
        const date = new Date(o.orderDate);
        if (
          columnFilters.orderDate.start &&
          date < new Date(columnFilters.orderDate.start)
        )
          return false;
        if (
          columnFilters.orderDate.end &&
          date > new Date(columnFilters.orderDate.end)
        )
          return false;
        return true;
      });
    }
    if (columnFilters.total.length > 0) {
      result = result.filter((o) =>
        columnFilters.total.includes(o.total.toString())
      );
    }
    if (columnFilters.totalCommission.length > 0) {
      result = result.filter((o) =>
        columnFilters.totalCommission.includes(o.totalCommission.toString())
      );
    }

    // Apply sorting
    result = [...result].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'orderNumber':
          comparison = a.orderNumber.localeCompare(b.orderNumber);
          break;
        case 'customerName':
          comparison = a.customerName.localeCompare(b.customerName);
          break;
        case 'manufacturerName':
          comparison = a.manufacturerName.localeCompare(b.manufacturerName);
          break;
        case 'orderDate':
          comparison =
            new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
          break;
        case 'total':
          comparison = a.total - b.total;
          break;
        case 'totalCommission':
          comparison = a.totalCommission - b.totalCommission;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [
    orders,
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
    uniqueOrderDates,
    uniqueTotals,
    uniqueCommissions,
    // Computed
    hasActiveFilters,
    filteredOrders,
    // Actions
    clearAllFilters,
  };
}
