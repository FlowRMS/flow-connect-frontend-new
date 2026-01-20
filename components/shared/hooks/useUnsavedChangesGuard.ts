/**
 * useUnsavedChangesGuard Hook
 * Used by detail pages to register their unsaved changes state with the global context
 * and set up navigation blocking
 *
 * Usage:
 * const { setHasChanges } = useUnsavedChangesGuard({
 *   entityType: 'Order',
 *   entityId: orderId,
 *   entityName: order?.orderNumber,
 *   hasChanges: state.hasChanges,
 *   onSave: handleSave,
 * });
 */

import { useEffect, useCallback } from 'react';
import { useUnsavedChangesContext } from '@/contexts/UnsavedChangesContext';

interface UseUnsavedChangesGuardOptions {
  /**
   * Type of entity being edited (e.g., 'Order', 'Invoice', 'Job')
   */
  entityType: string;

  /**
   * ID of the entity (null for new/create mode)
   */
  entityId: string | null;

  /**
   * Display name of the entity (e.g., order number, job name)
   */
  entityName: string | null;

  /**
   * Whether there are currently unsaved changes
   */
  hasChanges: boolean;

  /**
   * Save handler that returns a promise resolving to true on success
   */
  onSave?: () => Promise<boolean>;
}

interface UseUnsavedChangesGuardReturn {
  /**
   * Manually set the hasChanges state
   */
  setHasChanges: (hasChanges: boolean) => void;

  /**
   * Clear all unsaved changes state
   */
  clearChanges: () => void;

  /**
   * Whether the navigation blocker modal is showing
   */
  isModalShowing: boolean;
}

export function useUnsavedChangesGuard({
  entityType,
  entityId,
  entityName,
  hasChanges,
  onSave,
}: UseUnsavedChangesGuardOptions): UseUnsavedChangesGuardReturn {
  const {
    registerUnsavedChanges,
    clearUnsavedChanges,
    setHasChanges: contextSetHasChanges,
    setSaveHandler,
    showModal,
  } = useUnsavedChangesContext();

  // Register the entity and its changes state with the context
  useEffect(() => {
    registerUnsavedChanges(entityType, entityId, entityName, hasChanges);
  }, [entityType, entityId, entityName, hasChanges, registerUnsavedChanges]);

  // Register the save handler
  useEffect(() => {
    if (onSave) {
      setSaveHandler(onSave);
    }
    return () => {
      setSaveHandler(null);
    };
  }, [onSave, setSaveHandler]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearUnsavedChanges();
    };
  }, [clearUnsavedChanges]);

  const setHasChanges = useCallback(
    (changes: boolean) => {
      contextSetHasChanges(changes);
    },
    [contextSetHasChanges]
  );

  return {
    setHasChanges,
    clearChanges: clearUnsavedChanges,
    isModalShowing: showModal,
  };
}

export default useUnsavedChangesGuard;
