/**
 * useUnsavedChanges Hook
 * Shared mechanism for tracking unsaved changes across detail pages
 * (Quotes, Orders, Invoices, Commissions)
 *
 * Features:
 * - Tracks any changes to entity data
 * - Tracks line item additions, edits, and deletions
 * - Provides state for disabling save button when no changes
 * - Provides state for showing "unsaved changes" indicator
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseUnsavedChangesOptions {
  /**
   * If true, the entity is in create mode (new entity)
   * In create mode, hasChanges is always true since there's always something to save
   */
  isCreateMode?: boolean;

  /**
   * Initial snapshot of the entity data for comparison
   * Used to detect if entity fields have changed
   */
  initialData?: Record<string, any> | null;

  /**
   * Initial snapshot of line items for comparison
   * Used to detect if line items have been added, edited, or deleted
   */
  initialLineItems?: any[] | null;
}

export interface UseUnsavedChangesReturn {
  /**
   * Whether there are any unsaved changes
   */
  hasChanges: boolean;

  /**
   * Manually mark that changes have been made
   * Use when a field or line item is modified
   */
  markAsChanged: () => void;

  /**
   * Reset the change tracking (usually after a successful save)
   * Optionally provide new baseline data for comparison
   */
  resetChanges: (newData?: Record<string, any>, newLineItems?: any[]) => void;

  /**
   * Mark that line items have been modified
   * (added, edited, or deleted)
   */
  markLineItemsChanged: () => void;

  /**
   * Check if save button should be disabled
   * Returns true if there are no changes AND it's not create mode
   */
  isSaveDisabled: boolean;
}

/**
 * Deep comparison for simple objects and arrays
 * Returns true if values are equal
 */
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!keysB.includes(key) || !deepEqual(a[key], b[key])) return false;
    }
    return true;
  }

  return false;
}

export function useUnsavedChanges({
  isCreateMode = false,
  initialData = null,
  initialLineItems = null,
}: UseUnsavedChangesOptions = {}): UseUnsavedChangesReturn {
  // Track if any changes have been made
  const [hasManualChanges, setHasManualChanges] = useState(false);
  const [hasLineItemChanges, setHasLineItemChanges] = useState(false);

  // Store initial snapshots for comparison
  const initialDataRef = useRef<Record<string, any> | null>(initialData);
  const initialLineItemsRef = useRef<any[] | null>(initialLineItems);

  // Update refs when initial data changes (e.g., after loading from API)
  useEffect(() => {
    if (initialData !== null) {
      initialDataRef.current = initialData;
    }
  }, [initialData]);

  useEffect(() => {
    if (initialLineItems !== null) {
      initialLineItemsRef.current = initialLineItems;
    }
  }, [initialLineItems]);

  // Mark that changes have been made
  const markAsChanged = useCallback(() => {
    setHasManualChanges(true);
  }, []);

  // Mark that line items have been modified
  const markLineItemsChanged = useCallback(() => {
    setHasLineItemChanges(true);
  }, []);

  // Reset change tracking (usually after save)
  const resetChanges = useCallback((newData?: Record<string, any>, newLineItems?: any[]) => {
    setHasManualChanges(false);
    setHasLineItemChanges(false);

    if (newData !== undefined) {
      initialDataRef.current = newData;
    }
    if (newLineItems !== undefined) {
      initialLineItemsRef.current = newLineItems;
    }
  }, []);

  // Calculate if there are any changes
  const hasChanges = isCreateMode || hasManualChanges || hasLineItemChanges;

  // Save should be disabled only if NOT in create mode AND no changes
  const isSaveDisabled = !isCreateMode && !hasChanges;

  return {
    hasChanges,
    markAsChanged,
    resetChanges,
    markLineItemsChanged,
    isSaveDisabled,
  };
}

export default useUnsavedChanges;
