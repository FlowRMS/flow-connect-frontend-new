'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  useFulfillmentOrders,
  useFulfillmentStats,
  useBulkAssignFulfillmentOrders,
} from './api/useFulfillmentApi';
import type {
  FulfillmentOrder,
  FulfillmentOrderStatus,
} from './api/fulfillmentApi';
import { useWarehouse } from './WarehouseContext';

// Statuses that workers can see (released and beyond, not pending)
const WORKER_VISIBLE_STATUSES: FulfillmentOrderStatus[] = [
  'RELEASED',
  'PICKING',
  'PACKING',
  'SHIPPING',
  'SHIPPED',
  'PARTIAL_SHIPPED',
  'DELIVERED',
];
import FulfillmentHeader from './fulfillment/FulfillmentHeader';
import FulfillmentStatsCards from './fulfillment/FulfillmentStatsCards';
import FulfillmentTabs from './fulfillment/FulfillmentTabs';
import FulfillmentOrdersTable from './fulfillment/FulfillmentOrdersTable';
import BulkAssignModal from './fulfillment/BulkAssignModal';

// Filter types for stat card clicks
type StatFilter = 'all' | 'pending' | 'in_progress' | 'completed';

// Sort types for fulfillment orders table
export type FulfillmentSortField = 'orderNumber' | 'customerName' | 'productName' | 'qty' | 'status' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

// Column filter types
export interface FulfillmentColumnFilters {
  orderNumber: string;
  customerName: string[];
  productName: string;
  status: string[];
  dateRange: { start: string; end: string };
}

export default function WarehouseFulfillmentContent() {
  const { selectedWarehouse, isWorkerView } = useWarehouse();
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlFilter = searchParams.get('filter') as StatFilter | null;

  // Fetch fulfillment orders from API
  const { data: fulfillmentOrders = [], isLoading, error } = useFulfillmentOrders({
    warehouseId: selectedWarehouse?.id,
  });

  // Fetch stats from API
  const { data: stats } = useFulfillmentStats(selectedWarehouse?.id);

  // Bulk assign mutation
  const bulkAssignMutation = useBulkAssignFulfillmentOrders();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatFilter, setActiveStatFilter] = useState<StatFilter>(urlFilter || 'all');

  // Selection state
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState<FulfillmentSortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Column filters state
  const [columnFilters, setColumnFilters] = useState<FulfillmentColumnFilters>({
    orderNumber: '',
    customerName: [],
    productName: '',
    status: [],
    dateRange: { start: '', end: '' },
  });
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  // Update filter when URL changes
  useEffect(() => {
    if (urlFilter && ['all', 'pending', 'in_progress', 'completed'].includes(urlFilter)) {
      setActiveStatFilter(urlFilter);
    }
  }, [urlFilter]);


  const handleStatCardClick = (filter: StatFilter) => {
    setActiveStatFilter(prev => prev === filter ? 'all' : filter);
  };

  // Handle sorting
  const handleSort = (field: FulfillmentSortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get unique values for filter dropdowns
  const uniqueCustomers = useMemo(() => {
    return [...new Set(fulfillmentOrders.map(fo => fo.customerName))].sort();
  }, [fulfillmentOrders]);

  const uniqueStatuses = useMemo(() => {
    return [...new Set(fulfillmentOrders.map(fo => fo.status))];
  }, [fulfillmentOrders]);

  // Helper to get total quantity
  const getTotalQty = (fo: FulfillmentOrder) => {
    return fo.lineItems.reduce((sum, li) => sum + li.orderedQty, 0);
  };

  const filteredFulfillmentOrders = useMemo(() => {
    let result = fulfillmentOrders;

    // For workers, only show released and beyond orders (not pending)
    if (isWorkerView) {
      result = result.filter(fo => WORKER_VISIBLE_STATUSES.includes(fo.status));
    }

    // Apply stat card filter - must match backend get_stats grouping
    if (activeStatFilter === 'pending') {
      result = result.filter(fo => fo.status === 'PENDING');
    } else if (activeStatFilter === 'in_progress') {
      result = result.filter(fo => fo.status === 'RELEASED' || fo.status === 'PICKING' || fo.status === 'PACKING' || fo.status === 'SHIPPING');
    } else if (activeStatFilter === 'completed') {
      result = result.filter(fo => fo.status === 'SHIPPED' || fo.status === 'PARTIAL_SHIPPED' || fo.status === 'DELIVERED' || fo.status === 'COMMUNICATED');
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(fo =>
        fo.orderNumber.toLowerCase().includes(query) ||
        fo.fulfillmentOrderNumber.toLowerCase().includes(query) ||
        fo.customerName.toLowerCase().includes(query) ||
        fo.lineItems.some(li => li.productName.toLowerCase().includes(query) || li.partNumber.toLowerCase().includes(query))
      );
    }

    // Apply column filters
    if (columnFilters.orderNumber) {
      const query = columnFilters.orderNumber.toLowerCase();
      result = result.filter(fo => fo.orderNumber.toLowerCase().includes(query));
    }

    if (columnFilters.customerName.length > 0) {
      result = result.filter(fo => columnFilters.customerName.includes(fo.customerName));
    }

    if (columnFilters.productName) {
      const query = columnFilters.productName.toLowerCase();
      result = result.filter(fo =>
        fo.lineItems.some(li =>
          li.productName.toLowerCase().includes(query) ||
          li.partNumber.toLowerCase().includes(query)
        )
      );
    }

    if (columnFilters.status.length > 0) {
      result = result.filter(fo => columnFilters.status.includes(fo.status));
    }

    if (columnFilters.dateRange.start || columnFilters.dateRange.end) {
      result = result.filter(fo => {
        const date = new Date(fo.createdAt);
        if (columnFilters.dateRange.start && date < new Date(columnFilters.dateRange.start)) {
          return false;
        }
        if (columnFilters.dateRange.end && date > new Date(columnFilters.dateRange.end)) {
          return false;
        }
        return true;
      });
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
        case 'productName':
          const aProductName = a.lineItems.length > 0 ? a.lineItems[0].productName : '';
          const bProductName = b.lineItems.length > 0 ? b.lineItems[0].productName : '';
          comparison = aProductName.localeCompare(bProductName);
          break;
        case 'qty':
          comparison = getTotalQty(a) - getTotalQty(b);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [fulfillmentOrders, searchQuery, activeStatFilter, columnFilters, sortField, sortDirection, isWorkerView]);

  const handleRowClick = (fo: FulfillmentOrder) => {
    router.push(`/warehouse/fulfillment/${fo.id}`);
  };

  // Bulk assignment handlers
  const handleAssignClick = () => {
    if (selectedOrderIds.length > 0) {
      setShowBulkAssignModal(true);
    }
  };

  const handleBulkAssignSubmit = async (workerId: string, workerName: string, managerId?: string, managerName?: string, dueDate?: string) => {
    try {
      await bulkAssignMutation.mutateAsync({
        fulfillmentOrderIds: selectedOrderIds,
        workerIds: workerId ? [workerId] : undefined,
        managerIds: managerId ? [managerId] : undefined,
      });
      setShowBulkAssignModal(false);
      setSelectedOrderIds([]);
    } catch (error) {
      console.error('Failed to assign orders:', error);
    }
  };

  const handleClearSelection = () => {
    setSelectedOrderIds([]);
  };

  // Get selected orders for the modal
  const selectedOrders = useMemo(() => {
    return fulfillmentOrders.filter(fo => selectedOrderIds.includes(fo.id));
  }, [fulfillmentOrders, selectedOrderIds]);

  // Calculate stats - prefer API stats if available, otherwise calculate from data
  // Must match backend get_stats grouping: pending=PENDING, in_progress=RELEASED+PICKING+PACKING+SHIPPING, completed=SHIPPED+DELIVERED+COMMUNICATED
  const baseOrders = isWorkerView
    ? fulfillmentOrders.filter(fo => WORKER_VISIBLE_STATUSES.includes(fo.status))
    : fulfillmentOrders;
  const pendingCount = stats?.pendingCount ?? baseOrders.filter(fo => fo.status === 'PENDING').length;
  const inProgressCount = stats?.inProgressCount ?? baseOrders.filter(fo => fo.status === 'RELEASED' || fo.status === 'PICKING' || fo.status === 'PACKING' || fo.status === 'SHIPPING').length;
  const completedCount = stats?.completedCount ?? baseOrders.filter(fo => fo.status === 'SHIPPED' || fo.status === 'PARTIAL_SHIPPED' || fo.status === 'DELIVERED' || fo.status === 'COMMUNICATED').length;

  // Loading state
  if (isLoading) {
    return (
      <main className="flex-1 bg-[var(--background)] overflow-auto">
        <div className="p-6 flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading fulfillment orders...</div>
        </div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="flex-1 bg-[var(--background)] overflow-auto">
        <div className="p-6 flex items-center justify-center h-64">
          <div className="text-destructive">Error loading fulfillment orders: {error.message}</div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-[var(--background)] overflow-auto">
      <div className="p-6 pb-0">
        <FulfillmentHeader onCreateWave={handleAssignClick} />

        <FulfillmentStatsCards
          totalCount={baseOrders.length}
          pendingCount={pendingCount}
          inProgressCount={inProgressCount}
          completedCount={completedCount}
          activeStatFilter={activeStatFilter}
          onStatCardClick={handleStatCardClick}
        />

        <FulfillmentTabs
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCount={selectedOrderIds.length}
          onAssignClick={handleAssignClick}
          onClearSelection={handleClearSelection}
        />
      </div>

      <div className="p-6 pt-0">
        <FulfillmentOrdersTable
          orders={filteredFulfillmentOrders}
          onRowClick={handleRowClick}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          columnFilters={columnFilters}
          setColumnFilters={setColumnFilters}
          openFilter={openFilter}
          setOpenFilter={setOpenFilter}
          uniqueCustomers={uniqueCustomers}
          uniqueStatuses={uniqueStatuses}
          selectedOrderIds={selectedOrderIds}
          onSelectionChange={setSelectedOrderIds}
        />
      </div>

      {/* Bulk Assign Modal */}
      {showBulkAssignModal && selectedOrders.length > 0 && (
        <BulkAssignModal
          selectedOrders={selectedOrders}
          onClose={() => setShowBulkAssignModal(false)}
          onSubmit={handleBulkAssignSubmit}
        />
      )}
    </main>
  );
}
