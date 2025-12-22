/**
 * useInvoiceLineItemsTable Hook
 * Manages line items table UI state: columns toggle, tooltips, bulk actions
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Order } from '@/lib/types/rms';
import type { ColumnKey, OrderTooltipState } from '../types';

interface UseInvoiceLineItemsTableProps {
  visibleColumns: Set<ColumnKey>;
  setVisibleColumns: Dispatch<SetStateAction<Set<ColumnKey>>>;
  selectedLineItems: Set<string>;
  lineItemsCount: number;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
}

export function useInvoiceLineItemsTable({
  visibleColumns,
  setVisibleColumns,
  selectedLineItems,
  lineItemsCount,
  onSelectAll,
  onClearSelection,
}: UseInvoiceLineItemsTableProps) {
  // Column menu state
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);

  // Order tooltip state (for linked orders in line items)
  const [orderTooltip, setOrderTooltip] = useState<OrderTooltipState>({
    visible: false,
    x: 0,
    y: 0,
    orders: [],
  });
  const [portalMounted, setPortalMounted] = useState(false);

  // Ensure portal is only rendered on client side
  useEffect(() => {
    setPortalMounted(true);
  }, []);

  // Toggle column visibility
  const toggleColumn = useCallback(
    (column: ColumnKey) => {
      setVisibleColumns((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(column)) {
          newSet.delete(column);
        } else {
          newSet.add(column);
        }
        return newSet;
      });
    },
    [setVisibleColumns]
  );

  // Toggle all line items selection
  const toggleAllLineItems = useCallback(() => {
    if (selectedLineItems.size === lineItemsCount && lineItemsCount > 0) {
      onClearSelection?.();
    } else {
      onSelectAll?.();
    }
  }, [selectedLineItems.size, lineItemsCount, onSelectAll, onClearSelection]);

  // Check if all items are selected
  const areAllItemsSelected = useMemo(
    () => lineItemsCount > 0 && selectedLineItems.size === lineItemsCount,
    [selectedLineItems.size, lineItemsCount]
  );

  // Show order tooltip
  const showOrderTooltip = useCallback(
    (x: number, y: number, orders: Order[]) => {
      setOrderTooltip({
        visible: true,
        x,
        y,
        orders,
      });
    },
    []
  );

  // Hide order tooltip
  const hideOrderTooltip = useCallback(() => {
    setOrderTooltip({
      visible: false,
      x: 0,
      y: 0,
      orders: [],
    });
  }, []);

  return {
    // Column menu
    showColumnsMenu,
    setShowColumnsMenu,
    toggleColumn,

    // Order tooltip
    orderTooltip,
    setOrderTooltip,
    showOrderTooltip,
    hideOrderTooltip,
    portalMounted,

    // Selection helpers
    toggleAllLineItems,
    areAllItemsSelected,
  };
}

