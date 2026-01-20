/**
 * useLineItemsTabNavigation Hook
 * Manages smooth tab navigation between editable fields in line items table
 */

import { useCallback, useRef, useEffect } from 'react';

interface UseLineItemsTabNavigationProps {
  totalItems: number;
  editableFieldsPerRow: number;
  tableContainerSelector?: string;
}

interface UseLineItemsTabNavigationReturn {
  registerInput: (rowIndex: number, fieldIndex: number, element: HTMLInputElement | null) => void;
  handleKeyDown: (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    fieldIndex: number
  ) => void;
  getTabIndex: (rowIndex: number, fieldIndex: number) => number;
}

/**
 * Hook for managing tab navigation in a line items table
 * Provides smooth tabbing between editable fields across multiple rows
 */
export function useLineItemsTabNavigation({
  totalItems,
  editableFieldsPerRow,
  tableContainerSelector = '.line-items-table',
}: UseLineItemsTabNavigationProps): UseLineItemsTabNavigationReturn {
  // Store refs to all editable inputs in a 2D array [rowIndex][fieldIndex]
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // Generate a unique key for storing input refs
  const getRefKey = (rowIndex: number, fieldIndex: number) => `${rowIndex}-${fieldIndex}`;

  // Register an input element for tab navigation
  const registerInput = useCallback((
    rowIndex: number,
    fieldIndex: number,
    element: HTMLInputElement | null
  ) => {
    const key = getRefKey(rowIndex, fieldIndex);
    if (element) {
      inputRefs.current.set(key, element);
    } else {
      inputRefs.current.delete(key);
    }
  }, []);

  // Get the next focusable input
  const getNextInput = useCallback((
    currentRow: number,
    currentField: number,
    reverse: boolean = false
  ): HTMLInputElement | null => {
    if (reverse) {
      // Going backwards (Shift+Tab)
      let nextField = currentField - 1;
      let nextRow = currentRow;

      if (nextField < 0) {
        nextRow = currentRow - 1;
        nextField = editableFieldsPerRow - 1;
      }

      // If we're at the very first field, return null to let natural tab flow continue
      if (nextRow < 0) {
        return null;
      }

      const key = getRefKey(nextRow, nextField);
      return inputRefs.current.get(key) || null;
    } else {
      // Going forwards (Tab)
      let nextField = currentField + 1;
      let nextRow = currentRow;

      if (nextField >= editableFieldsPerRow) {
        nextRow = currentRow + 1;
        nextField = 0;
      }

      // If we're past the last row, return null to let natural tab flow continue
      if (nextRow >= totalItems) {
        return null;
      }

      const key = getRefKey(nextRow, nextField);
      return inputRefs.current.get(key) || null;
    }
  }, [totalItems, editableFieldsPerRow]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    fieldIndex: number
  ) => {
    const target = e.target as HTMLInputElement;

    switch (e.key) {
      case 'Tab': {
        const isShiftTab = e.shiftKey;
        const nextInput = getNextInput(rowIndex, fieldIndex, isShiftTab);

        if (nextInput) {
          e.preventDefault();
          // Blur current to trigger save
          target.blur();
          // Focus next input after a short delay to ensure blur handler completes
          requestAnimationFrame(() => {
            nextInput.focus();
            nextInput.select();
          });
        }
        // If nextInput is null, let the natural tab flow continue outside the table
        break;
      }

      case 'Enter': {
        e.preventDefault();
        // Move to next row, same field (common spreadsheet behavior)
        const nextRowInput = getNextInput(rowIndex, fieldIndex - 1, false);
        if (nextRowInput) {
          target.blur();
          requestAnimationFrame(() => {
            nextRowInput.focus();
            nextRowInput.select();
          });
        } else {
          // Just blur if no next row
          target.blur();
        }
        break;
      }

      case 'ArrowDown': {
        // Move down to same field in next row
        if (rowIndex < totalItems - 1) {
          e.preventDefault();
          const key = getRefKey(rowIndex + 1, fieldIndex);
          const nextInput = inputRefs.current.get(key);
          if (nextInput) {
            target.blur();
            requestAnimationFrame(() => {
              nextInput.focus();
              nextInput.select();
            });
          }
        }
        break;
      }

      case 'ArrowUp': {
        // Move up to same field in previous row
        if (rowIndex > 0) {
          e.preventDefault();
          const key = getRefKey(rowIndex - 1, fieldIndex);
          const prevInput = inputRefs.current.get(key);
          if (prevInput) {
            target.blur();
            requestAnimationFrame(() => {
              prevInput.focus();
              prevInput.select();
            });
          }
        }
        break;
      }

      case 'Escape': {
        // Blur and reset value (optional - could be handled by parent)
        target.blur();
        break;
      }
    }
  }, [getNextInput, totalItems]);

  // Calculate tabIndex for an input
  // This ensures proper tab order across all editable fields
  const getTabIndex = useCallback((rowIndex: number, fieldIndex: number): number => {
    // Base tabIndex starts at 100 to avoid conflicts with header fields
    // Each row/field gets a sequential tabIndex
    return 100 + (rowIndex * editableFieldsPerRow) + fieldIndex;
  }, [editableFieldsPerRow]);

  // Clean up refs when totalItems changes
  useEffect(() => {
    // Remove refs for rows that no longer exist
    const keysToDelete: string[] = [];
    inputRefs.current.forEach((_, key) => {
      const [rowStr] = key.split('-');
      const rowIndex = parseInt(rowStr, 10);
      if (rowIndex >= totalItems) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => inputRefs.current.delete(key));
  }, [totalItems]);

  return {
    registerInput,
    handleKeyDown,
    getTabIndex,
  };
}
