/**
 * useCommissionBulkActions Hook
 * Manages bulk actions for selected checks
 */

import { useState, useCallback } from 'react';
import type { CommissionCheck, CheckStatus } from '@/lib/types/rms';

interface UseCommissionBulkActionsProps {
  selectedCheckIds: Set<string>;
  clearSelection: () => void;
  setChecks: (
    checks: CommissionCheck[] | ((prev: CommissionCheck[]) => CommissionCheck[])
  ) => void;
}

export function useCommissionBulkActions({
  selectedCheckIds,
  clearSelection,
  setChecks,
}: UseCommissionBulkActionsProps) {
  // Bulk actions menu state
  const [showBulkActionsMenu, setShowBulkActionsMenu] = useState(false);

  // Bulk set status
  const bulkSetStatus = useCallback(
    (status: CheckStatus) => {
      setChecks((prev) =>
        prev.map((c) => (selectedCheckIds.has(c.id) ? { ...c, status } : c))
      );
      clearSelection();
      setShowBulkActionsMenu(false);
    },
    [selectedCheckIds, clearSelection, setChecks]
  );

  // Bulk delete
  const bulkDelete = useCallback(() => {
    if (
      confirm(
        `Are you sure you want to delete ${selectedCheckIds.size} check(s)? This action cannot be undone.`
      )
    ) {
      setChecks((prev) =>
        prev.filter((c) => !selectedCheckIds.has(c.id))
      );
      clearSelection();
      setShowBulkActionsMenu(false);
    }
  }, [selectedCheckIds, clearSelection, setChecks]);

  return {
    // Bulk actions menu
    showBulkActionsMenu,
    setShowBulkActionsMenu,
    // Actions
    bulkSetStatus,
    bulkDelete,
  };
}

