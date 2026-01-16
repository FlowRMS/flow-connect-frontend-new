import { useState, useMemo } from 'react';
import {
  useWarehouseDeliveries,
  useInfiniteWarehouseDeliveries,
  useWarehouseLookups,
  useWarehouseRecurringShipments,
} from '../../../api/useWarehouseDeliveriesApi';
import { useDeliveryFilters } from './useDeliveryFilters';
import { useDeliveryModals } from './useDeliveryModals';
import { useRecurringShipmentModal } from './useRecurringShipmentModal';
import { useDerivedDeliveryData } from './useDerivedDeliveryData';
import type { ShipmentStatus } from '@/lib/types/warehouse';

type ViewMode = 'table' | 'cards';
type ActiveTab = 'deliveries' | 'recurring' | 'issues' | 'calendar';

const WORKER_VISIBLE_STATUSES: ShipmentStatus[] = [
  'PENDING',
  'CONFIRMED',
  'ARRIVED',
  'RECEIVING',
  'RECEIVED',
];

interface UseDeliveriesListStateProps {
  warehouseId?: string | null;
  isWorkerView?: boolean;
  useInfiniteScroll?: boolean;
  pageSize?: number;
}

export function useDeliveriesListState({
  warehouseId,
  isWorkerView = false,
  useInfiniteScroll = false,
  pageSize = 50,
}: UseDeliveriesListStateProps) {
  // Tab & View Mode
  const [activeTab, setActiveTab] = useState<ActiveTab>('deliveries');
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Creation state
  const [isCreatingDelivery, setIsCreatingDelivery] = useState(false);

  // Sub-hooks
  const filters = useDeliveryFilters();
  const modals = useDeliveryModals();
  const recurringModal = useRecurringShipmentModal();

  // Data queries
  const { warehousesQuery, carriersQuery, vendorsQuery } = useWarehouseLookups();

  // Use infinite query or regular query based on preference
  const deliveriesInfiniteQuery = useInfiniteWarehouseDeliveries(warehouseId, {
    includeIssues: false,
    enabled: !!warehouseId && useInfiniteScroll,
    pageSize,
  });

  const deliveriesQuery = useWarehouseDeliveries(warehouseId, {
    includeIssues: false,
    enabled: !!warehouseId && !useInfiniteScroll,
  });

  const recurringQuery = useWarehouseRecurringShipments(
    warehouseId,
    !!warehouseId
  );
  const issuesDeliveriesQuery = useWarehouseDeliveries(warehouseId, {
    includeIssues: true,
    enabled: activeTab === 'issues' && !!warehouseId,
  });

  // Flatten infinite query pages into single array
  const deliveriesData = useMemo(() => {
    if (useInfiniteScroll && deliveriesInfiniteQuery.data) {
      return deliveriesInfiniteQuery.data.pages.flat();
    }
    return deliveriesQuery.data;
  }, [useInfiniteScroll, deliveriesInfiniteQuery.data, deliveriesQuery.data]);

  // Derived data (eliminates 7 useState hooks!)
  const derivedData = useDerivedDeliveryData({
    deliveriesData,
    recurringData: recurringQuery.data,
    issuesDeliveriesData: issuesDeliveriesQuery.data,
    warehousesData: warehousesQuery.data,
    carriersData: carriersQuery.data,
    vendorsData: vendorsQuery.data,
  });

  // Apply filters and sorting to shipments
  const filteredAndSortedShipments = useMemo(() => {
    let filtered = [...derivedData.shipments];

    // Worker view filter - hide DRAFT
    if (isWorkerView) {
      filtered = filtered.filter((s) =>
        WORKER_VISIBLE_STATUSES.includes(s.status)
      );
    }

    // Text search
    if (filters.searchTerm) {
      const search = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.poNumber.toLowerCase().includes(search) ||
          s.vendorName.toLowerCase().includes(search) ||
          s.trackingNumber?.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (filters.statusFilter !== 'all') {
      filtered = filtered.filter((s) => s.status === filters.statusFilter);
    }

    // Vendor filter
    if (filters.vendorFilter !== 'all') {
      filtered = filtered.filter((s) => s.vendorId === filters.vendorFilter);
    }

    // Column filters
    if (filters.columnFilters.poNumber) {
      const poSearch = filters.columnFilters.poNumber.toLowerCase();
      filtered = filtered.filter((s) =>
        s.poNumber.toLowerCase().includes(poSearch)
      );
    }

    if (filters.columnFilters.vendorName.length > 0) {
      filtered = filtered.filter((s) =>
        filters.columnFilters.vendorName.includes(s.vendorId)
      );
    }

    if (filters.columnFilters.status.length > 0) {
      filtered = filtered.filter((s) =>
        filters.columnFilters.status.includes(s.status)
      );
    }

    if (
      filters.columnFilters.dateRange.start ||
      filters.columnFilters.dateRange.end
    ) {
      const start = filters.columnFilters.dateRange.start
        ? new Date(filters.columnFilters.dateRange.start)
        : null;
      const end = filters.columnFilters.dateRange.end
        ? new Date(filters.columnFilters.dateRange.end)
        : null;

      filtered = filtered.filter((s) => {
        const shipmentDate = new Date(s.eta);
        if (start && shipmentDate < start) return false;
        if (end && shipmentDate > end) return false;
        return true;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (filters.sortField) {
        case 'poNumber':
          aVal = a.poNumber;
          bVal = b.poNumber;
          break;
        case 'vendorName':
          aVal = a.vendorName;
          bVal = b.vendorName;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'expectedDate':
        default:
          aVal = new Date(a.eta).getTime();
          bVal = new Date(b.eta).getTime();
      }

      if (aVal < bVal) return filters.sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return filters.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [
    derivedData.shipments,
    isWorkerView,
    filters.searchTerm,
    filters.statusFilter,
    filters.vendorFilter,
    filters.columnFilters,
    filters.sortField,
    filters.sortDirection,
  ]);

  // Loading states
  const isLoading = useInfiniteScroll
    ? deliveriesInfiniteQuery.isLoading || warehousesQuery.isLoading
    : deliveriesQuery.isLoading || warehousesQuery.isLoading;
  const isLoadingRecurring = recurringQuery.isLoading;
  const isLoadingIssues = issuesDeliveriesQuery.isLoading;

  return {
    // Tab & View
    activeTab,
    setActiveTab,
    viewMode,
    setViewMode,

    // Data
    shipments: filteredAndSortedShipments,
    allShipments: derivedData.shipments,
    recurringShipments: derivedData.recurringShipments,
    deliveryIssues: derivedData.deliveryIssues,

    // Lookups
    warehouseLookups: derivedData.warehouseLookups,
    carrierLookups: derivedData.carrierLookups,
    factoryLookups: derivedData.factoryLookups,

    // Loading
    isLoading,
    isLoadingRecurring,
    isLoadingIssues,
    isCreatingDelivery,
    setIsCreatingDelivery,

    // Infinite scroll specific
    hasNextPage: useInfiniteScroll ? deliveriesInfiniteQuery.hasNextPage : false,
    isFetchingNextPage: useInfiniteScroll ? deliveriesInfiniteQuery.isFetchingNextPage : false,
    fetchNextPage: useInfiniteScroll ? deliveriesInfiniteQuery.fetchNextPage : () => {},

    // Sub-hooks
    filters,
    modals,
    recurringModal,

    // Query objects (for refetch, etc.)
    deliveriesQuery: useInfiniteScroll ? deliveriesInfiniteQuery : deliveriesQuery,
    recurringQuery,
    issuesDeliveriesQuery,
  };
}
