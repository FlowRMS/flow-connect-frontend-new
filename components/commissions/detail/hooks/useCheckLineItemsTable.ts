/**
 * useCheckLineItemsTable Hook
 * Manages line items table UI state: columns toggle, selection helpers
 */

import { useState, useCallback, useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { ColumnKey } from '../types';

interface UseCheckLineItemsTableProps {
  visibleColumns: Set<ColumnKey>;
  setVisibleColumns: Dispatch<SetStateAction<Set<ColumnKey>>>;
  selectedLineItems: Set<string>;
  lineItemsCount: number;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
}

export function useCheckLineItemsTable({
  visibleColumns,
  setVisibleColumns,
  selectedLineItems,
  lineItemsCount,
  onSelectAll,
  onClearSelection,
}: UseCheckLineItemsTableProps) {
  // Column menu state
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);

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

  return {
    // Column menu
    showColumnsMenu,
    setShowColumnsMenu,
    toggleColumn,

    // Selection helpers
    toggleAllLineItems,
    areAllItemsSelected,
  };
}

