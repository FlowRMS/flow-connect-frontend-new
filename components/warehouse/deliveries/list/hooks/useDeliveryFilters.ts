import { useState, useCallback, useMemo } from 'react';
import type { ShipmentStatus } from '@/lib/types/warehouse';
import type { DeliverySortField, SortDirection } from '../DeliveryFilters';

interface DeliveryColumnFilters {
  poNumber: string;
  vendorName: string[];
  status: string[];
  dateRange: { start: string; end: string };
}

export function useDeliveryFilters() {
  // Text search
  const [searchTerm, setSearchTerm] = useState('');

  // Simple filters
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | 'all'>('all');
  const [vendorFilter, setVendorFilter] = useState<string>('all');

  // Column filters
  const [columnFilters, setColumnFilters] = useState<DeliveryColumnFilters>({
    poNumber: '',
    vendorName: [],
    status: [],
    dateRange: { start: '', end: '' },
  });

  // Filter dropdown state
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  // Sorting
  const [sortField, setSortField] = useState<DeliverySortField>('expectedDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Callbacks for updating filters
  const updateColumnFilter = useCallback(
    <K extends keyof DeliveryColumnFilters>(
      key: K,
      value: DeliveryColumnFilters[K]
    ) => {
      setColumnFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const clearColumnFilter = useCallback((key: keyof DeliveryColumnFilters) => {
    setColumnFilters((prev) => ({
      ...prev,
      [key]: key === 'dateRange' ? { start: '', end: '' } : key === 'vendorName' || key === 'status' ? [] : '',
    }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
    setVendorFilter('all');
    setColumnFilters({
      poNumber: '',
      vendorName: [],
      status: [],
      dateRange: { start: '', end: '' },
    });
  }, []);

  const toggleSort = useCallback((field: DeliverySortField) => {
    setSortField((prevField) => {
      if (prevField === field) {
        setSortDirection((prevDir) => (prevDir === 'asc' ? 'desc' : 'asc'));
        return field;
      }
      setSortDirection('desc');
      return field;
    });
  }, []);

  // Computed: Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      searchTerm !== '' ||
      statusFilter !== 'all' ||
      vendorFilter !== 'all' ||
      columnFilters.poNumber !== '' ||
      columnFilters.vendorName.length > 0 ||
      columnFilters.status.length > 0 ||
      columnFilters.dateRange.start !== '' ||
      columnFilters.dateRange.end !== ''
    );
  }, [searchTerm, statusFilter, vendorFilter, columnFilters]);

  return {
    // State
    searchTerm,
    statusFilter,
    vendorFilter,
    columnFilters,
    openFilter,
    sortField,
    sortDirection,
    hasActiveFilters,

    // Setters
    setSearchTerm,
    setStatusFilter,
    setVendorFilter,
    setColumnFilters,
    setOpenFilter,
    setSortField,
    setSortDirection,

    // Actions
    updateColumnFilter,
    clearColumnFilter,
    clearAllFilters,
    toggleSort,
  };
}
