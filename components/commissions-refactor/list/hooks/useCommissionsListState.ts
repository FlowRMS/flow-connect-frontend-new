/**
 * useCommissionsListState Hook
 * Main state management hook for the commissions list
 * Integrates all sub-hooks and manages overall state
 */

import { useState } from 'react';
import type { CommissionCheck } from '@/lib/types/rms';
import { mockChecks } from '@/lib/data/rms-mock';
import { useCommissionFilters } from './useCommissionFilters';
import { useCommissionSelection } from './useCommissionSelection';
import { useCommissionBulkActions } from './useCommissionBulkActions';

export function useCommissionsListState() {
  // Checks data
  const [checks, setChecks] = useState<CommissionCheck[]>(mockChecks);

  // Selected check for detail panel
  const [selectedCheck, setSelectedCheck] = useState<CommissionCheck | null>(null);

  // UI state - filter dropdowns
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  // UI state - quick date field dropdown
  const [showQuickDateFieldDropdown, setShowQuickDateFieldDropdown] = useState(false);

  // Integrate filter hook
  const filterState = useCommissionFilters(checks);

  // Integrate selection hook
  const selectionState = useCommissionSelection();

  // Integrate bulk actions hook
  const bulkActionsState = useCommissionBulkActions({
    selectedCheckIds: selectionState.selectedCheckIds,
    clearSelection: selectionState.clearSelection,
    setChecks,
  });

  return {
    // Checks data
    checks,
    setChecks,

    // Selected check for sidebar
    selectedCheck,
    setSelectedCheck,

    // UI state
    openFilter,
    setOpenFilter,
    showQuickDateFieldDropdown,
    setShowQuickDateFieldDropdown,

    // Filter state and actions
    ...filterState,

    // Selection state and actions
    ...selectionState,

    // Bulk actions state and actions
    ...bulkActionsState,
  };
}

