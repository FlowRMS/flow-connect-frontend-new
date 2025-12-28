/**
 * useOrdersListState Hook
 * Main state management hook for the orders list
 * Integrates all sub-hooks and manages overall state
 */

import { useState, useMemo } from 'react';
import type { Order, OrderSplitRate } from '@/lib/types/rms';
import { mockSalesReps } from '@/lib/data/rms-mock';
import { useOrders, type OrderLandingPage } from '../../api';
import { useOrderFilters } from './useOrderFilters';
import { useOrderSelection } from './useOrderSelection';
import { useOrderBulkActions } from './useOrderBulkActions';

/**
 * Transform OrderLandingPage from API to UI Order type
 * Maps API fields to the existing UI structure
 */
function transformLandingPageToOrder(landing: OrderLandingPage): Order {
  return {
    id: landing.id,
    orderNumber: landing.orderNumber,
    // API doesn't have these fields - use defaults or empty
    manufacturerId: '',
    manufacturerName: 'Coming Soon', // API doesn't provide this in landing page
    customerId: '',
    customerName: 'Coming Soon', // API doesn't provide this in landing page
    status: mapApiStatusToUiStatus(landing.headerStatus, landing.status),
    fulfillmentStatus: 'not_started',
    billingStatus: 'not_invoiced',
    commissionStatus: 'pending',
    orderDate: landing.entityDate || '',
    createdAt: landing.createdAt || '',
    createdBy: typeof landing.createdBy === 'string' ? landing.createdBy : '',
    updatedAt: landing.createdAt || '',
    lineItems: [],
    subtotal: landing.total || 0,
    freight: 0,
    total: landing.total || 0,
    totalCommission: 0, // API landing page doesn't provide this
    splitRates: [],
    dueDate: landing.dueDate,
  };
}

/**
 * Map API status/headerStatus to UI status
 */
function mapApiStatusToUiStatus(headerStatus?: string, status?: string): 'draft' | 'open' | 'partial_shipped' | 'shipped' | 'cancelled' | 'dormant' {
  const hs = headerStatus?.toUpperCase();
  switch (hs) {
    case 'DRAFT':
      return 'draft';
    case 'OPEN':
      return 'open';
    case 'PARTIAL_SHIPPED':
      return 'partial_shipped';
    case 'SHIPPED':
      return 'shipped';
    case 'CANCELLED':
      return 'cancelled';
    case 'DORMANT':
      return 'dormant';
    default:
      return 'open';
  }
}

export function useOrdersListState() {
  // Fetch orders from API
  const { data: apiOrders, isLoading, error, refetch } = useOrders();

  // Transform API data to UI format
  const orders = useMemo(() => {
    if (!apiOrders) return [];
    return apiOrders.map(transformLandingPageToOrder);
  }, [apiOrders]);

  // Local orders state for optimistic updates (bulk actions, etc.)
  const [localOrders, setLocalOrders] = useState<Order[]>([]);

  // Use local orders if we have them (after mutations), otherwise use API orders
  const effectiveOrders = localOrders.length > 0 ? localOrders : orders;

  // Sync local orders when API data changes
  useMemo(() => {
    if (orders.length > 0 && localOrders.length === 0) {
      // Don't set local orders initially - let API be the source of truth
    }
  }, [orders, localOrders.length]);

  // Setter that updates local orders
  const setOrders = (updater: Order[] | ((prev: Order[]) => Order[])) => {
    if (typeof updater === 'function') {
      setLocalOrders(prev => updater(prev.length > 0 ? prev : orders));
    } else {
      setLocalOrders(updater);
    }
  };

  // Selected order for detail panel
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Create order modal
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Commission splits editing state
  const [editingSplits, setEditingSplits] = useState(false);
  const [editedSplits, setEditedSplits] = useState<OrderSplitRate[]>([]);

  // Integrate filter hook
  const filterState = useOrderFilters(orders);

  // Integrate selection hook
  const selectionState = useOrderSelection();

  // Integrate bulk actions hook
  const bulkActionsState = useOrderBulkActions({
    selectedOrderIds: selectionState.selectedOrderIds,
    clearSelection: selectionState.clearSelection,
    setOrders,
  });

  // Commission split editing functions
  const startEditingSplits = () => {
    if (selectedOrder) {
      setEditedSplits([...selectedOrder.splitRates]);
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
    if (selectedOrder) {
      updated[index].commissionAmount =
        (selectedOrder.totalCommission * newPercentage) / 100;
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
    const rep = mockSalesReps.find((r) => r.id === repId);
    if (rep) {
      const updated = [...editedSplits];
      updated[index] = {
        ...updated[index],
        salesRepId: repId,
        salesRepName: rep.name,
      };
      setEditedSplits(updated);
    }
  };

  const saveSplits = () => {
    if (selectedOrder) {
      const totalPercentage = editedSplits.reduce(
        (sum, s) => sum + s.splitPercentage,
        0
      );
      if (Math.abs(totalPercentage - 100) > 0.01) {
        alert('Split percentages must total 100%');
        return;
      }

      const updatedOrder = {
        ...selectedOrder,
        splitRates: editedSplits,
      };
      setOrders(orders.map((o) => (o.id === selectedOrder.id ? updatedOrder : o)));
      setSelectedOrder(updatedOrder);
      setEditingSplits(false);
      setEditedSplits([]);
    }
  };

  const splitPercentageTotal = editedSplits.reduce(
    (sum, s) => sum + s.splitPercentage,
    0
  );

  // Handle create order
  const handleCreateOrder = (newOrder: Order) => {
    setOrders([newOrder, ...orders]);
    setShowCreateModal(false);
    // Refetch to get fresh data from API
    refetch();
  };

  return {
    // Orders data
    orders,
    setOrders,
    // Loading and error state
    isLoading,
    error,
    refetch,
    // Selected order
    selectedOrder,
    setSelectedOrder,
    // Create modal
    showCreateModal,
    setShowCreateModal,
    handleCreateOrder,
    // Commission splits editing
    editingSplits,
    setEditingSplits,
    editedSplits,
    setEditedSplits,
    startEditingSplits,
    cancelEditingSplits,
    updateSplitPercentage,
    addNewSplit,
    removeSplit,
    updateSplitRep,
    saveSplits,
    splitPercentageTotal,
    // Filter state and actions
    ...filterState,
    // Selection state and actions
    ...selectionState,
    // Bulk actions state and actions
    ...bulkActionsState,
  };
}
