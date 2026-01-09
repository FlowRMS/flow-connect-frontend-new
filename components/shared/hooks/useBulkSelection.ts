/**
 * Shared Bulk Selection Hook
 * Handles selection logic for bulk operations with proper "select all" support
 * including items that haven't been loaded yet (infinite scroll pagination)
 */

import { useState, useCallback, useMemo } from 'react';

export interface UseBulkSelectionOptions<T extends { id: string }> {
  /** Currently loaded items */
  items: T[];
  /** Total count of all items (from API) */
  totalCount: number;
  /** Function to fetch all IDs when in selectAllMode */
  fetchAllIds: () => Promise<string[]>;
  /** Optional function to check if an item is eligible for selection (e.g., not locked/paid) */
  isItemEligible?: (item: T) => boolean;
}

export interface UseBulkSelectionReturn {
  /** Set of explicitly selected IDs (for non-selectAll mode) */
  selectedIds: Set<string>;
  /** Set of explicitly excluded IDs (for selectAll mode) */
  excludedIds: Set<string>;
  /** Whether "select all" mode is enabled (includes unloaded items) */
  selectAllMode: boolean;
  /** Number of items currently selected */
  selectedCount: number;
  /** Whether all items are selected */
  isAllSelected: boolean;
  /** Whether some but not all items are selected */
  isPartiallySelected: boolean;
  /** Check if a specific item is selected */
  isItemSelected: (id: string) => boolean;
  /** Handle select all checkbox change */
  handleSelectAll: (checked: boolean) => void;
  /** Handle individual item checkbox change */
  handleSelectOne: (id: string, checked: boolean) => void;
  /** Clear all selections */
  clearSelection: () => void;
  /** Get all selected IDs (fetches from server if in selectAllMode) */
  getAllSelectedIds: () => Promise<string[]>;
  /** Reset selection state completely */
  resetSelection: () => void;
}

export function useBulkSelection<T extends { id: string }>({
  items,
  totalCount,
  fetchAllIds,
  isItemEligible,
}: UseBulkSelectionOptions<T>): UseBulkSelectionReturn {
  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [selectAllMode, setSelectAllMode] = useState(false);

  // Get eligible items only
  const eligibleItems = useMemo(() => {
    if (!isItemEligible) return items;
    return items.filter(isItemEligible);
  }, [items, isItemEligible]);

  // Get ineligible item IDs (to exclude from selection)
  const ineligibleIds = useMemo(() => {
    if (!isItemEligible) return new Set<string>();
    return new Set(items.filter(item => !isItemEligible(item)).map(item => item.id));
  }, [items, isItemEligible]);

  // Calculate selected count
  // IMPORTANT: When isItemEligible is provided, we can only count loaded items accurately
  // because we don't know which server-side items are eligible without fetching them all
  const selectedCount = useMemo(() => {
    if (selectAllMode) {
      if (isItemEligible) {
        // With eligibility filtering, we can only accurately count loaded eligible items
        // minus any user-excluded items (excludedIds contains both ineligible + user-excluded)
        const userExcludedCount = excludedIds.size - ineligibleIds.size;
        return Math.max(0, eligibleItems.length - userExcludedCount);
      }
      // Without eligibility filtering, we can use server total
      return totalCount - excludedIds.size;
    }
    return selectedIds.size;
  }, [selectAllMode, isItemEligible, eligibleItems.length, totalCount, excludedIds.size, ineligibleIds.size, selectedIds.size]);

  // Check if all (eligible) items are selected
  const isAllSelected = useMemo(() => {
    // In selectAllMode, all eligible are selected when only ineligible items are excluded
    if (selectAllMode) {
      return excludedIds.size === ineligibleIds.size;
    }
    // In normal mode, check if all eligible loaded items are selected
    return eligibleItems.length > 0 && selectedIds.size === eligibleItems.length;
  }, [selectAllMode, excludedIds.size, ineligibleIds.size, eligibleItems.length, selectedIds.size]);

  // Check if some but not all items are selected
  const isPartiallySelected = useMemo(() => {
    if (selectAllMode) {
      // Partially selected if there are more exclusions than just ineligible items
      return excludedIds.size > ineligibleIds.size;
    }
    // In normal mode, partially selected if some but not all eligible items are selected
    return selectedIds.size > 0 && selectedIds.size < eligibleItems.length;
  }, [selectAllMode, excludedIds.size, ineligibleIds.size, selectedIds.size, eligibleItems.length]);

  // Check if a specific item is selected
  const isItemSelected = useCallback((id: string) => {
    // If item is ineligible, it cannot be selected
    if (ineligibleIds.has(id)) {
      return false;
    }
    if (selectAllMode) {
      return !excludedIds.has(id);
    }
    return selectedIds.has(id);
  }, [selectAllMode, excludedIds, selectedIds, ineligibleIds]);

  // Handle select all checkbox
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      if (isItemEligible) {
        // When eligibility filtering is active, only select loaded eligible items
        // We can't use selectAllMode because we don't know which unloaded items are eligible
        setSelectAllMode(false);
        setExcludedIds(new Set());
        setSelectedIds(new Set(eligibleItems.map(item => item.id)));
      } else {
        // No eligibility filtering - enable select all mode for ALL items including unloaded
        setSelectAllMode(true);
        setExcludedIds(new Set());
        setSelectedIds(new Set(items.map(item => item.id)));
      }
    } else {
      // Clear all selection
      setSelectAllMode(false);
      setExcludedIds(new Set());
      setSelectedIds(new Set());
    }
  }, [items, eligibleItems, isItemEligible]);

  // Handle individual item selection
  const handleSelectOne = useCallback((id: string, checked: boolean) => {
    // Don't allow selecting ineligible items
    if (ineligibleIds.has(id)) {
      return;
    }

    if (selectAllMode) {
      // In select all mode, track exclusions
      setExcludedIds(prev => {
        const newSet = new Set(prev);
        if (checked) {
          newSet.delete(id); // Remove from exclusions (re-select)
        } else {
          newSet.add(id); // Add to exclusions (deselect)
        }
        return newSet;
      });
      // Also update selectedIds for visual feedback on loaded items
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        if (checked) {
          newSet.add(id);
        } else {
          newSet.delete(id);
        }
        return newSet;
      });
    } else {
      // Normal selection mode
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        if (checked) {
          newSet.add(id);
        } else {
          newSet.delete(id);
        }
        return newSet;
      });
    }
  }, [selectAllMode, ineligibleIds]);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setExcludedIds(new Set());
    setSelectAllMode(false);
  }, []);

  // Get all selected IDs (fetches from server if needed)
  const getAllSelectedIds = useCallback(async (): Promise<string[]> => {
    if (selectAllMode) {
      // Fetch all IDs from server
      const allIds = await fetchAllIds();
      // Remove excluded IDs
      return allIds.filter(id => !excludedIds.has(id));
    }
    return Array.from(selectedIds);
  }, [selectAllMode, selectedIds, excludedIds, fetchAllIds]);

  // Reset selection completely
  const resetSelection = useCallback(() => {
    setSelectedIds(new Set());
    setExcludedIds(new Set());
    setSelectAllMode(false);
  }, []);

  return {
    selectedIds,
    excludedIds,
    selectAllMode,
    selectedCount,
    isAllSelected,
    isPartiallySelected,
    isItemSelected,
    handleSelectAll,
    handleSelectOne,
    clearSelection,
    getAllSelectedIds,
    resetSelection,
  };
}
