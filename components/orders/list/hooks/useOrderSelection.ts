/**
 * useOrderSelection Hook
 * Manages order selection for bulk actions
 */

import { useState, useCallback } from 'react';
import type { Order } from '@/lib/types/rms';
import { isOrderLinked, getOrderLinkedReason } from '../utils';

export function useOrderSelection() {
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(
    new Set()
  );

  // Toggle individual order selection
  const toggleOrderSelection = useCallback((orderId: string) => {
    setSelectedOrderIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  }, []);

  // Select all eligible orders (not linked)
  const selectAllOrders = useCallback((orders: Order[]) => {
    const eligibleOrderIds = orders
      .filter((o) => !isOrderLinked(o))
      .map((o) => o.id);
    setSelectedOrderIds(new Set(eligibleOrderIds));
  }, []);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedOrderIds(new Set());
  }, []);

  // Check if order is selected
  const isOrderSelected = useCallback(
    (orderId: string) => {
      return selectedOrderIds.has(orderId);
    },
    [selectedOrderIds]
  );

  // Check if all eligible orders are selected
  const areAllEligibleSelected = useCallback(
    (orders: Order[]) => {
      const eligibleOrders = orders.filter((o) => !isOrderLinked(o));
      if (eligibleOrders.length === 0) return false;
      return eligibleOrders.every((o) => selectedOrderIds.has(o.id));
    },
    [selectedOrderIds]
  );

  return {
    selectedOrderIds,
    toggleOrderSelection,
    selectAllOrders,
    clearSelection,
    isOrderSelected,
    areAllEligibleSelected,
    // Utility functions re-exported for convenience
    isOrderLinked,
    getOrderLinkedReason,
  };
}
