/**
 * useCommissionSelection Hook
 * Manages check selection for bulk actions
 */

import { useState, useCallback } from 'react';
import type { CommissionCheck } from '@/lib/types/rms';
import { isCheckLinked, getCheckLinkedReason } from '../utils';

export function useCommissionSelection() {
  const [selectedCheckIds, setSelectedCheckIds] = useState<Set<string>>(
    new Set()
  );

  // Toggle individual check selection
  const toggleCheckSelection = useCallback((checkId: string) => {
    setSelectedCheckIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(checkId)) {
        newSet.delete(checkId);
      } else {
        newSet.add(checkId);
      }
      return newSet;
    });
  }, []);

  // Select all eligible checks (not linked)
  const selectAllChecks = useCallback((checks: CommissionCheck[]) => {
    const eligibleCheckIds = checks
      .filter((c) => !isCheckLinked(c))
      .map((c) => c.id);
    setSelectedCheckIds(new Set(eligibleCheckIds));
  }, []);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedCheckIds(new Set());
  }, []);

  // Check if check is selected
  const isCheckSelected = useCallback(
    (checkId: string) => {
      return selectedCheckIds.has(checkId);
    },
    [selectedCheckIds]
  );

  // Check if all eligible checks are selected
  const areAllEligibleSelected = useCallback(
    (checks: CommissionCheck[]) => {
      const eligibleChecks = checks.filter((c) => !isCheckLinked(c));
      if (eligibleChecks.length === 0) return false;
      return eligibleChecks.every((c) => selectedCheckIds.has(c.id));
    },
    [selectedCheckIds]
  );

  return {
    selectedCheckIds,
    toggleCheckSelection,
    selectAllChecks,
    clearSelection,
    isCheckSelected,
    areAllEligibleSelected,
    // Utility functions re-exported for convenience
    isCheckLinked,
    getCheckLinkedReason,
  };
}

