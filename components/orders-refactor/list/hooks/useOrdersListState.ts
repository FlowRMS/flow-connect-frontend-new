/**
 * useOrdersListState Hook
 * Main state management hook for the orders list
 * Integrates all sub-hooks and manages overall state
 */

import { useState } from 'react';
import type { Order, OrderSplitRate } from '@/lib/types/rms';
import { mockOrders, mockSalesReps } from '@/lib/data/rms-mock';
import { useOrderFilters } from './useOrderFilters';
import { useOrderSelection } from './useOrderSelection';
import { useOrderBulkActions } from './useOrderBulkActions';

export function useOrdersListState() {
  // Orders data
  const [orders, setOrders] = useState<Order[]>(mockOrders);

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
  };

  return {
    // Orders data
    orders,
    setOrders,
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
